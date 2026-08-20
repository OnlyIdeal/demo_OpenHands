# Agent Adapter

MVP 内部 Agent 服务，默认使用确定性 mock 轨迹，本地运行不依赖 OpenHands。

## API

- `GET /health`
- `POST /internal/runs`
- `GET /internal/runs/{run_id}`
- `GET /internal/runs/{run_id}/events?after=0`
- `POST /internal/runs/{run_id}/cancel`
- `POST /internal/runs/{run_id}/test`

启动 run 的最小请求：

```json
{
  "task_id": "task-1",
  "prompt": "实现登录页面",
  "workspace_path": "/workspaces/demo",
  "mode": "mock"
}
```

Mock 模式会依次产生 6 个事件，并结束在 `waiting_confirmation`。OpenHands 模式通过
`OPENHANDS_BASE_URL` 和可选的 `OPENHANDS_API_KEY` 启用；未配置时会返回明确的失败事件。
