# MVP Shared Contract

This contract is the integration boundary for the three parallel implementation sessions.

## Repository ownership

- Frontend session owns `apps/web/**` only.
- Backend session owns `apps/api/**` and `migrations/**` only.
- Agent/deployment session owns `apps/agent-adapter/**`, `deploy/**`, and `tests/e2e/**` only.
- The main session owns root files and integration changes.

## Runtime topology

- Web: `http://localhost:5173`
- API: `http://localhost:8000`
- API prefix: `/api/v1`
- Agent adapter internal URL: `http://agent-adapter:8010`
- SQLite default path: `/data/platform.db`

## MVP API

### Authentication

- `POST /api/v1/auth/login` body `{email,password}` → `{user}` and HttpOnly cookie.
- `POST /api/v1/auth/logout` → `204`.
- `GET /api/v1/auth/me` → `{id,email,name,role}`.

### Projects

- `GET /api/v1/projects`
- `POST /api/v1/projects` body `{name,description,workspace_path,repository_url}`
- `GET /api/v1/projects/{project_id}`
- `PATCH /api/v1/projects/{project_id}`
- `DELETE /api/v1/projects/{project_id}`

### Requirements and generated assets

- `POST /api/v1/projects/{project_id}/requirements` body `{title,idea,notes}`
- `GET /api/v1/requirements/{requirement_id}`
- `POST /api/v1/requirements/{requirement_id}/generate`
- Generation response contains `{prd_markdown,technical_markdown,tasks}`.
- `PATCH /api/v1/documents/{document_id}` body `{content}`.

### Tasks

- `GET /api/v1/projects/{project_id}/tasks`
- `PATCH /api/v1/tasks/{task_id}` body `{status?,title?,acceptance_criteria?}`
- `POST /api/v1/tasks/{task_id}/run` body `{mode:"mock"|"openhands"}` → `{run_id}`
- `POST /api/v1/tasks/{task_id}/confirm` → task status `completed`.

### Agent runs

- `GET /api/v1/agent-runs/{run_id}`
- `GET /api/v1/agent-runs/{run_id}/events?after={event_id}`
- `POST /api/v1/agent-runs/{run_id}/cancel`
- Run status: `queued|running|waiting_confirmation|succeeded|failed|cancelled`.
- Event shape: `{id,run_id,level,event_type,message,created_at,payload}`.

### Tests

- `POST /api/v1/agent-runs/{run_id}/test` body `{command?}`.
- Result: `{command,exit_code,stdout,stderr,status}`.

## Mock behavior

- `MOCK_LLM=1` returns deterministic PRD, technical design, and 4 tasks.
- `AGENT_MODE=mock` emits at least 5 ordered events and finishes in `waiting_confirmation`.
- Real OpenHands mode may be configured but must not be required for local startup.

## Frontend required routes

- `/login`
- `/`
- `/projects`
- `/projects/:projectId`
- `/projects/:projectId/requirements/new`
- `/requirements/:requirementId`
- `/tasks/:taskId`
- `/runs/:runId`
- Unsupported current prototype modules route to a shared `ComingSoon` view.

## MVP acceptance path

Login → create project → create requirement → generate assets → open task → run mock agent → observe events → run mock test → confirm task completed.
