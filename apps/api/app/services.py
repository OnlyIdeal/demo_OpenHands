from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select

from .config import get_settings
from .database import SessionLocal
from .models import AgentEvent, AgentRun, AuditLog, Requirement


def audit(database, user_id: int | None, action: str, entity_type: str, entity_id: int | str, payload=None) -> None:
    database.add(AuditLog(user_id=user_id, action=action, entity_type=entity_type, entity_id=str(entity_id), payload=payload or {}))


def generate_assets(requirement: Requirement) -> tuple[str, str, list[dict[str, str]]]:
    prd = f"""# {requirement.title}

## 产品目标
{requirement.idea}

## 用户故事
作为目标用户，我希望使用该功能完成核心业务，从而提升处理效率。

## MVP 范围
- 提供核心录入与查看流程
- 保存必要业务数据
- 提供明确的成功与失败反馈

## 验收标准
- 用户可以完成主流程
- 页面刷新后数据仍然存在
- 异常输入会收到可理解的提示

## 补充说明
{requirement.notes or '暂无'}
"""
    technical = f"""# {requirement.title} 技术方案

## 架构
采用 React + FastAPI + SQLite 的轻量单体架构。

## 模块
- Web：页面与交互
- API：业务接口与数据持久化
- Agent Adapter：开发任务执行与日志

## 数据
项目、需求、文档、任务、Agent Run、事件和测试结果通过关系模型关联。

## 交付策略
优先打通最小闭环，复杂审批、多人协作与生产发布后续迭代。
"""
    tasks = [
        {"title": "搭建功能页面与基础交互", "description": "实现核心页面、表单和状态反馈。", "acceptance_criteria": "页面可访问，核心表单可提交并展示结果。"},
        {"title": "实现业务 API 与数据模型", "description": "完成主流程需要的接口与持久化。", "acceptance_criteria": "接口返回稳定，刷新后业务数据仍然存在。"},
        {"title": "接入 AI Agent 执行流程", "description": "支持启动开发任务并查看有序执行事件。", "acceptance_criteria": "Agent Run 最终进入待确认状态且至少产生 5 条事件。"},
        {"title": "完成测试与交付验收", "description": "运行简单测试并验证最小闭环。", "acceptance_criteria": "测试结果可查看，用户可确认任务完成。"},
    ]
    return prd, technical, tasks


def add_event(database, run_id: int, event_type: str, message: str, payload=None, level: str = "info") -> None:
    database.add(AgentEvent(run_id=run_id, level=level, event_type=event_type, message=message, payload=payload or {}))
    database.commit()


def execute_mock_run(run_id: int, reason: str | None = None) -> None:
    messages = [
        ("run_started", "Agent 已接收任务，开始分析上下文", {}),
        ("context_loaded", "已读取 PRD、技术方案和验收标准", {}),
        ("plan_created", "已生成最小实现计划", {}),
        ("files_changed", "已完成目标文件修改", {"files": ["src/feature.ts", "src/feature.test.ts"]}),
        ("validation_finished", "基础检查执行完成", {"exit_code": 0}),
        ("waiting_confirmation", "开发任务已完成，等待用户确认", {}),
    ]
    with SessionLocal() as database:
        run = database.get(AgentRun, run_id)
        if not run or run.status == "cancelled":
            return
        run.status = "running"
        run.started_at = datetime.now(timezone.utc)
        run.task.status = "running"
        database.commit()
        if reason:
            add_event(database, run_id, "fallback", f"Agent 服务不可用，已降级为 Mock：{reason}", level="warning")
        for event_type, message, payload in messages:
            add_event(database, run_id, event_type, message, payload)
        run = database.get(AgentRun, run_id)
        if run and run.status != "cancelled":
            run.status = "waiting_confirmation"
            run.result_summary = "Mock Agent 已完成代码开发和基础验证。"
            run.finished_at = datetime.now(timezone.utc)
            run.task.status = "waiting_confirmation"
            database.commit()


def _agent_payload(run: AgentRun) -> dict[str, Any]:
    task = run.task
    documents = task.requirement.documents if task.requirement else []
    return {
        "run_id": run.id,
        "task": {"id": task.id, "title": task.title, "description": task.description, "acceptance_criteria": task.acceptance_criteria},
        "project": {"id": task.project.id, "name": task.project.name, "workspace_path": task.project.workspace_path, "repository_url": task.project.repository_url},
        "documents": [{"type": item.document_type, "content": item.content} for item in documents],
    }


def execute_openhands_run(run_id: int) -> None:
    settings = get_settings()
    try:
        with SessionLocal() as database:
            run = database.get(AgentRun, run_id)
            if not run or run.status == "cancelled":
                return
            run.status = "running"
            run.started_at = datetime.now(timezone.utc)
            run.task.status = "running"
            database.commit()
            add_event(database, run_id, "run_started", "正在连接 OpenHands Agent")
            payload = _agent_payload(run)
        with httpx.Client(timeout=settings.agent_adapter_timeout) as client:
            response = client.post(f"{settings.agent_adapter_url.rstrip('/')}/runs", json=payload)
            response.raise_for_status()
            result = response.json()
        with SessionLocal() as database:
            run = database.get(AgentRun, run_id)
            if not run or run.status == "cancelled":
                return
            run.adapter_run_id = str(result.get("run_id") or result.get("id") or "") or None
            for item in result.get("events", []):
                add_event(database, run_id, item.get("event_type", "agent_event"), item.get("message", "Agent event"), item.get("payload", {}), item.get("level", "info"))
            final_status = result.get("status", "waiting_confirmation")
            run.status = final_status if final_status in {"waiting_confirmation", "failed", "cancelled"} else "waiting_confirmation"
            run.result_summary = result.get("result_summary", "OpenHands Agent 执行完成。")
            run.finished_at = datetime.now(timezone.utc)
            run.task.status = "waiting_confirmation" if run.status == "waiting_confirmation" else "failed"
            add_event(database, run_id, "waiting_confirmation", "Agent 执行完成，等待用户确认")
            database.commit()
    except Exception as error:
        if settings.agent_fallback_mock:
            execute_mock_run(run_id, str(error))
            return
        with SessionLocal() as database:
            run = database.get(AgentRun, run_id)
            if run:
                run.status = "failed"
                run.error_message = str(error)
                run.finished_at = datetime.now(timezone.utc)
                run.task.status = "failed"
                add_event(database, run_id, "run_failed", "Agent 执行失败", {"error": str(error)}, "error")
                database.commit()


def latest_active_run(database) -> AgentRun | None:
    return database.scalar(select(AgentRun).where(AgentRun.status.in_(["queued", "running"])).order_by(AgentRun.id.desc()))
