from __future__ import annotations

import asyncio
import os
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

RunStatus = Literal["queued", "running", "waiting_confirmation", "succeeded", "failed", "cancelled"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    agent_mode: Literal["mock", "openhands"] = "mock"
    mock_event_delay_ms: int = 120
    agent_workspace_root: Path = Path("/workspaces")
    test_timeout_seconds: int = 120
    max_output_chars: int = 20_000
    openhands_base_url: str | None = None
    openhands_api_key: str | None = None
    openhands_timeout_seconds: int = 30


settings = Settings()
app = FastAPI(title="AI Full-stack Platform Agent Adapter", version="0.1.0")


class StartRunRequest(BaseModel):
    task_id: str
    project_id: str | None = None
    prompt: str = Field(min_length=1)
    workspace_path: str | None = None
    mode: Literal["mock", "openhands"] | None = None
    context: dict[str, Any] = Field(default_factory=dict)


class TestRunRequest(BaseModel):
    command: str | None = None


class RunEvent(BaseModel):
    id: int
    run_id: str
    level: Literal["info", "warning", "error"] = "info"
    event_type: str
    message: str
    created_at: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AgentRun(BaseModel):
    id: str
    task_id: str
    project_id: str | None = None
    mode: Literal["mock", "openhands"]
    status: RunStatus
    prompt: str
    workspace_path: str | None = None
    created_at: str
    updated_at: str
    external_run_id: str | None = None
    error: str | None = None


runs: dict[str, AgentRun] = {}
events: dict[str, list[RunEvent]] = {}
workers: dict[str, asyncio.Task[None]] = {}
state_lock = asyncio.Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def append_event(
    run_id: str,
    event_type: str,
    message: str,
    *,
    level: Literal["info", "warning", "error"] = "info",
    payload: dict[str, Any] | None = None,
) -> RunEvent:
    async with state_lock:
        run_events = events.setdefault(run_id, [])
        event = RunEvent(
            id=len(run_events) + 1,
            run_id=run_id,
            level=level,
            event_type=event_type,
            message=message,
            created_at=now_iso(),
            payload=payload or {},
        )
        run_events.append(event)
        return event


async def update_status(run_id: str, status: RunStatus, error: str | None = None) -> None:
    async with state_lock:
        run = runs[run_id]
        run.status = status
        run.updated_at = now_iso()
        run.error = error


async def run_mock(run_id: str) -> None:
    delay = settings.mock_event_delay_ms / 1000
    trajectory = [
        ("run_started", "Agent 已接收任务，开始分析上下文", {}),
        ("context_loaded", "已加载 PRD、技术方案和验收标准", {"documents": 2}),
        ("plan_created", "已生成最小实现计划", {"steps": 3}),
        ("file_changed", "已完成示例代码变更", {"files": ["src/example.ts"]}),
        ("command_completed", "静态检查命令执行完成", {"exit_code": 0}),
        ("run_completed", "开发任务执行完成，等待人工确认", {"changed_files": 1}),
    ]
    try:
        await update_status(run_id, "running")
        for event_type, message, payload in trajectory:
            await asyncio.sleep(delay)
            if runs[run_id].status == "cancelled":
                return
            await append_event(run_id, event_type, message, payload=payload)
        await update_status(run_id, "waiting_confirmation")
    except asyncio.CancelledError:
        if runs[run_id].status != "cancelled":
            await update_status(run_id, "cancelled")
        raise
    except Exception as exc:
        await update_status(run_id, "failed", str(exc))
        await append_event(run_id, "run_failed", "Agent 执行失败", level="error")


async def run_openhands(run_id: str, request: StartRunRequest) -> None:
    if not settings.openhands_base_url:
        message = "OPENHANDS_BASE_URL 未配置，无法使用 openhands 模式"
        await update_status(run_id, "failed", message)
        await append_event(run_id, "configuration_error", message, level="error")
        return

    await update_status(run_id, "running")
    await append_event(run_id, "run_started", "正在向 OpenHands 提交任务")
    headers = {}
    if settings.openhands_api_key:
        headers["Authorization"] = f"Bearer {settings.openhands_api_key}"
    try:
        async with httpx.AsyncClient(
            base_url=settings.openhands_base_url,
            headers=headers,
            timeout=settings.openhands_timeout_seconds,
        ) as client:
            response = await client.post(
                "/api/conversations",
                json={
                    "initial_user_msg": request.prompt,
                    "workspace_path": request.workspace_path,
                    "agent_context": request.context,
                },
            )
            response.raise_for_status()
            body = response.json()
        external_id = str(body.get("conversation_id") or body.get("id") or "")
        async with state_lock:
            runs[run_id].external_run_id = external_id or None
            runs[run_id].updated_at = now_iso()
        await append_event(run_id, "run_submitted", "任务已提交至 OpenHands", payload={"external_run_id": external_id})
        await update_status(run_id, "waiting_confirmation")
    except Exception as exc:
        message = f"OpenHands 请求失败: {exc}"
        await update_status(run_id, "failed", message)
        await append_event(run_id, "run_failed", message, level="error")


def resolve_workspace(path_value: str | None) -> Path:
    root = settings.agent_workspace_root.resolve()
    candidate = root if not path_value else Path(path_value)
    if not candidate.is_absolute():
        candidate = root / candidate
    candidate = candidate.resolve()
    if candidate != root and root not in candidate.parents:
        raise HTTPException(status_code=400, detail="workspace_path 超出允许目录")
    if not candidate.is_dir():
        raise HTTPException(status_code=400, detail="workspace_path 不存在")
    return candidate


def execute_command(command: str, workspace: Path) -> dict[str, Any]:
    shell_command = (
        ["/bin/sh", "-lc", command]
        if os.name != "nt"
        else ["powershell", "-NoProfile", "-Command", f"& {command}"]
    )
    try:
        completed = subprocess.run(
            shell_command,
            cwd=workspace,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=settings.test_timeout_seconds,
            check=False,
        )
        return {
            "command": command,
            "exit_code": completed.returncode,
            "stdout": (completed.stdout or "")[-settings.max_output_chars :],
            "stderr": (completed.stderr or "")[-settings.max_output_chars :],
            "status": "passed" if completed.returncode == 0 else "failed",
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "command": command,
            "exit_code": 124,
            "stdout": (exc.stdout or "")[-settings.max_output_chars :],
            "stderr": "测试命令执行超时",
            "status": "failed",
        }


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "mode": settings.agent_mode, "openhands_configured": bool(settings.openhands_base_url)}


@app.post("/internal/runs", response_model=AgentRun, status_code=201)
async def start_run(request: StartRunRequest) -> AgentRun:
    mode = request.mode or settings.agent_mode
    run_id = str(uuid.uuid4())
    timestamp = now_iso()
    run = AgentRun(
        id=run_id,
        task_id=request.task_id,
        project_id=request.project_id,
        mode=mode,
        status="queued",
        prompt=request.prompt,
        workspace_path=request.workspace_path,
        created_at=timestamp,
        updated_at=timestamp,
    )
    async with state_lock:
        runs[run_id] = run
        events[run_id] = []
    worker = run_mock(run_id) if mode == "mock" else run_openhands(run_id, request)
    workers[run_id] = asyncio.create_task(worker)
    return run


@app.get("/internal/runs/{run_id}", response_model=AgentRun)
async def get_run(run_id: str) -> AgentRun:
    if run_id not in runs:
        raise HTTPException(status_code=404, detail="run 不存在")
    return runs[run_id]


@app.get("/internal/runs/{run_id}/events", response_model=list[RunEvent])
async def get_events(run_id: str, after: int = Query(default=0, ge=0)) -> list[RunEvent]:
    if run_id not in runs:
        raise HTTPException(status_code=404, detail="run 不存在")
    return [event for event in events[run_id] if event.id > after]


@app.post("/internal/runs/{run_id}/cancel", response_model=AgentRun)
async def cancel_run(run_id: str) -> AgentRun:
    if run_id not in runs:
        raise HTTPException(status_code=404, detail="run 不存在")
    if runs[run_id].status in {"succeeded", "failed", "cancelled"}:
        return runs[run_id]
    await update_status(run_id, "cancelled")
    worker = workers.get(run_id)
    if worker and not worker.done():
        worker.cancel()
    await append_event(run_id, "run_cancelled", "任务已取消", level="warning")
    return runs[run_id]


@app.post("/internal/runs/{run_id}/test")
async def test_run(run_id: str, request: TestRunRequest) -> dict[str, Any]:
    if run_id not in runs:
        raise HTTPException(status_code=404, detail="run 不存在")
    run = runs[run_id]
    workspace = resolve_workspace(run.workspace_path)
    command = request.command or "printf 'mock tests passed\\n'"
    await append_event(run_id, "test_started", f"开始执行测试: {command}")
    result = await asyncio.to_thread(execute_command, command, workspace)
    await append_event(
        run_id,
        "test_completed",
        "测试通过" if result["status"] == "passed" else "测试失败",
        level="info" if result["status"] == "passed" else "error",
        payload={"command": command, "exit_code": result["exit_code"]},
    )
    return result
