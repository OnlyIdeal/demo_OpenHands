# MVP 单机部署

## 启动

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up --build -d
```

启动后访问：

- Web：`http://localhost:5173`
- API 健康检查：`http://localhost:8000/health`
- Agent Adapter 健康检查：`http://localhost:8010/health`

## 健康检查

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
curl http://localhost:5173/healthz
curl http://localhost:8000/health
curl http://localhost:8010/health
```

## 数据与停止

SQLite 数据保存在 `platform-data` Volume，Agent 工作目录保存在 `workspaces` Volume。普通停止不会删除数据：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml down
```

仅在明确需要清空演示数据时执行 `down -v`。默认 `AGENT_MODE=mock`，不需要 OpenHands。设置
`OPENHANDS_BASE_URL` 后可由 API 在启动任务时传入 `mode=openhands`。
