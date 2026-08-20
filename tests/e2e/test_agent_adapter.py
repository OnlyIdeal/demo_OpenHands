import sys
import time
from pathlib import Path

from fastapi.testclient import TestClient

ADAPTER_ROOT = Path(__file__).resolve().parents[2] / "apps" / "agent-adapter"
sys.path.insert(0, str(ADAPTER_ROOT))

from app.main import app, settings  # noqa: E402


def test_mock_run_events_and_test_command(tmp_path: Path) -> None:
    settings.agent_workspace_root = tmp_path
    settings.mock_event_delay_ms = 5

    with TestClient(app) as client:
        response = client.post(
            "/internal/runs",
            json={
                "task_id": "task-e2e",
                "prompt": "实现 MVP 示例功能",
                "workspace_path": str(tmp_path),
                "mode": "mock",
            },
        )
        assert response.status_code == 201
        run_id = response.json()["id"]

        deadline = time.time() + 3
        while time.time() < deadline:
            run = client.get(f"/internal/runs/{run_id}").json()
            if run["status"] == "waiting_confirmation":
                break
            time.sleep(0.02)

        assert run["status"] == "waiting_confirmation"
        events = client.get(f"/internal/runs/{run_id}/events").json()
        assert len(events) >= 5
        assert [event["id"] for event in events] == list(range(1, len(events) + 1))

        result = client.post(
            f"/internal/runs/{run_id}/test",
            json={"command": f'"{sys.executable}" -c "print(123)"'},
        ).json()
        assert result["status"] == "passed"
        assert result["exit_code"] == 0
        assert "123" in result["stdout"]


def test_mock_run_can_be_cancelled(tmp_path: Path) -> None:
    settings.agent_workspace_root = tmp_path
    settings.mock_event_delay_ms = 100

    with TestClient(app) as client:
        run = client.post(
            "/internal/runs",
            json={"task_id": "task-cancel", "prompt": "取消任务", "mode": "mock"},
        ).json()
        cancelled = client.post(f"/internal/runs/{run['id']}/cancel").json()
        assert cancelled["status"] == "cancelled"
        event_types = [
            event["event_type"]
            for event in client.get(f"/internal/runs/{run['id']}/events").json()
        ]
        assert "run_cancelled" in event_types
