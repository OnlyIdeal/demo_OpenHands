# MVP 端到端验证

## Adapter 契约测试

在已安装 `apps/agent-adapter/requirements.txt` 和 `pytest` 的环境中运行：

```bash
pytest tests/e2e/test_agent_adapter.py -q
```

## 浏览器最小闭环

先通过 `deploy/docker-compose.yml` 启动完整系统，再运行：

```bash
cd tests/e2e
npm install
npx playwright install chromium
npm test
```

默认访问 `http://127.0.0.1:5173`，可通过 `E2E_BASE_URL`、`E2E_EMAIL` 和
`E2E_PASSWORD` 覆盖。测试覆盖登录 → 项目 → 需求 → 文档生成 → 任务 → Mock Run →
测试 → 人工确认。前端事件行应提供 `data-testid="run-event"`，以保持事件数量断言稳定。
