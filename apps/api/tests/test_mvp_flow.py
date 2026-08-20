import os
from pathlib import Path

TEST_DATABASE = Path(__file__).parent / "test-platform.db"
if TEST_DATABASE.exists():
    TEST_DATABASE.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE.as_posix()}"
os.environ["MOCK_LLM"] = "1"
os.environ["AGENT_MODE"] = "mock"

from fastapi.testclient import TestClient

from app.main import app


def login(client: TestClient) -> None:
    response = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"


def test_authentication_required() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/projects").status_code == 401


def test_complete_mvp_flow() -> None:
    with TestClient(app) as client:
        login(client)
        assert client.get("/api/v1/auth/me").status_code == 200

        project_response = client.post(
            "/api/v1/projects",
            json={"name": "MVP Demo", "description": "Minimal flow", "workspace_path": "workspace/demo", "repository_url": ""},
        )
        assert project_response.status_code == 201
        project_id = project_response.json()["id"]

        requirement_response = client.post(
            f"/api/v1/projects/{project_id}/requirements",
            json={"title": "Customer support", "idea": "Create an AI support page", "notes": "MVP only"},
        )
        assert requirement_response.status_code == 201
        requirement_id = requirement_response.json()["id"]

        generation_response = client.post(f"/api/v1/requirements/{requirement_id}/generate")
        assert generation_response.status_code == 200
        generated = generation_response.json()
        assert generated["prd_markdown"].startswith("# Customer support")
        assert len(generated["tasks"]) == 4

        requirement = client.get(f"/api/v1/requirements/{requirement_id}").json()
        assert len(requirement["documents"]) == 2
        document_id = requirement["documents"][0]["id"]
        document_response = client.patch(f"/api/v1/documents/{document_id}", json={"content": "# Updated PRD"})
        assert document_response.json()["version"] == 2

        task_id = generated["tasks"][0]["id"]
        task_before_run = client.get(f"/api/v1/tasks/{task_id}")
        assert task_before_run.status_code == 200
        assert task_before_run.json()["status"] == "pending"

        run_response = client.post(f"/api/v1/tasks/{task_id}/run", json={"mode": "mock"})
        assert run_response.status_code == 202
        run_id = run_response.json()["run_id"]

        run = client.get(f"/api/v1/agent-runs/{run_id}").json()
        assert run["status"] == "waiting_confirmation"
        events = client.get(f"/api/v1/agent-runs/{run_id}/events").json()
        assert len(events) >= 5
        assert [item["id"] for item in events] == sorted(item["id"] for item in events)
        filtered = client.get(f"/api/v1/agent-runs/{run_id}/events", params={"after": events[1]["id"]}).json()
        assert filtered[0]["id"] > events[1]["id"]

        test_response = client.post(f"/api/v1/agent-runs/{run_id}/test", json={})
        assert test_response.status_code == 200
        assert test_response.json()["status"] == "passed"

        confirmation = client.post(f"/api/v1/tasks/{task_id}/confirm")
        assert confirmation.status_code == 200
        assert confirmation.json()["status"] == "completed"
        task_after_confirmation = client.get(f"/api/v1/tasks/{task_id}")
        assert task_after_confirmation.status_code == 200
        assert task_after_confirmation.json()["status"] == "completed"
        assert client.get(f"/api/v1/agent-runs/{run_id}").json()["status"] == "succeeded"


def test_project_crud_and_logout() -> None:
    with TestClient(app) as client:
        login(client)
        created = client.post("/api/v1/projects", json={"name": "Temporary", "description": "", "workspace_path": "workspace/tmp", "repository_url": ""})
        project_id = created.json()["id"]
        updated = client.patch(f"/api/v1/projects/{project_id}", json={"name": "Updated"})
        assert updated.json()["name"] == "Updated"
        assert client.delete(f"/api/v1/projects/{project_id}").status_code == 204
        assert client.post("/api/v1/auth/logout").status_code == 204
        assert client.get("/api/v1/auth/me").status_code == 401
