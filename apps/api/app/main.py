from datetime import datetime, timezone

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .config import get_settings
from .database import Base, SessionLocal, engine, get_db
from .models import AgentEvent, AgentRun, AuthSession, Document, Project, Requirement, Task, TestResult, User
from .schemas import (
    AgentEventOut, AgentRunOut, DocumentOut, DocumentUpdate, GenerateOut, LoginIn, LoginOut,
    ProjectCreate, ProjectOut, ProjectUpdate, RequirementCreate, RequirementOut, RunCreate,
    RunCreated, TaskOut, TaskUpdate, TestCreate, TestResultOut, UserOut,
)
from .security import create_session, get_current_user, hash_password, verify_password
from .services import audit, execute_mock_run, execute_openhands_run, generate_assets, latest_active_run


settings = get_settings()
app = FastAPI(title="AI Full-stack Platform MVP API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def initialize_database() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as database:
        user = database.scalar(select(User).where(User.email == settings.admin_email))
        if not user:
            database.add(User(email=settings.admin_email, name=settings.admin_name, role="admin", password_hash=hash_password(settings.admin_password)))
            database.commit()


def require(model, database: Session, entity_id: int):
    entity = database.get(model, entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
    return entity


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/auth/login", response_model=LoginOut)
def login(payload: LoginIn, response: Response, database: Session = Depends(get_db)) -> LoginOut:
    user = database.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    auth_session = create_session(database, user)
    response.set_cookie(settings.cookie_name, auth_session.token, httponly=True, secure=settings.cookie_secure, samesite="lax", max_age=settings.session_days * 86400)
    audit(database, user.id, "auth.login", "user", user.id)
    database.commit()
    return LoginOut(user=UserOut.model_validate(user))


@app.post("/api/v1/auth/logout", status_code=204)
def logout(request: Request, response: Response, database: Session = Depends(get_db)) -> None:
    token = request.cookies.get(settings.cookie_name)
    if token:
        auth_session = database.scalar(select(AuthSession).where(AuthSession.token == token))
        if auth_session:
            database.delete(auth_session)
            database.commit()
    response.delete_cookie(settings.cookie_name)


@app.get("/api/v1/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@app.get("/api/v1/projects", response_model=list[ProjectOut])
def list_projects(database: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return database.scalars(select(Project).order_by(Project.updated_at.desc())).all()


@app.post("/api/v1/projects", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = Project(**payload.model_dump())
    database.add(project)
    database.flush()
    audit(database, user.id, "project.create", "project", project.id, {"name": project.name})
    database.commit()
    database.refresh(project)
    return project


@app.get("/api/v1/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, database: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return require(Project, database, project_id)


@app.patch("/api/v1/projects/{project_id}", response_model=ProjectOut)
def update_project(payload: ProjectUpdate, project_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = require(Project, database, project_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    audit(database, user.id, "project.update", "project", project.id, payload.model_dump(exclude_unset=True))
    database.commit()
    database.refresh(project)
    return project


@app.delete("/api/v1/projects/{project_id}", status_code=204)
def delete_project(project_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
    project = require(Project, database, project_id)
    audit(database, user.id, "project.delete", "project", project.id, {"name": project.name})
    database.delete(project)
    database.commit()


@app.post("/api/v1/projects/{project_id}/requirements", response_model=RequirementOut, status_code=201)
def create_requirement(payload: RequirementCreate, project_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require(Project, database, project_id)
    requirement = Requirement(project_id=project_id, **payload.model_dump())
    database.add(requirement)
    database.flush()
    audit(database, user.id, "requirement.create", "requirement", requirement.id, {"title": requirement.title})
    database.commit()
    return get_requirement(requirement.id, database, user)


@app.get("/api/v1/requirements/{requirement_id}", response_model=RequirementOut)
def get_requirement(requirement_id: int, database: Session = Depends(get_db), _: User = Depends(get_current_user)):
    requirement = database.scalar(select(Requirement).options(selectinload(Requirement.documents)).where(Requirement.id == requirement_id))
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return requirement


@app.post("/api/v1/requirements/{requirement_id}/generate", response_model=GenerateOut)
def generate(requirement_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    requirement = require(Requirement, database, requirement_id)
    prd, technical, task_specs = generate_assets(requirement)
    database.query(Document).filter(Document.requirement_id == requirement.id).delete()
    database.query(Task).filter(Task.requirement_id == requirement.id).delete()
    database.flush()
    database.add_all([
        Document(project_id=requirement.project_id, requirement_id=requirement.id, document_type="prd", title=f"{requirement.title} PRD", content=prd),
        Document(project_id=requirement.project_id, requirement_id=requirement.id, document_type="technical", title=f"{requirement.title} Technical Design", content=technical),
    ])
    tasks = [Task(project_id=requirement.project_id, requirement_id=requirement.id, sort_order=index, **spec) for index, spec in enumerate(task_specs, start=1)]
    database.add_all(tasks)
    requirement.status = "generated"
    audit(database, user.id, "requirement.generate", "requirement", requirement.id, {"task_count": 4})
    database.commit()
    for task in tasks:
        database.refresh(task)
    return GenerateOut(prd_markdown=prd, technical_markdown=technical, tasks=tasks)


@app.patch("/api/v1/documents/{document_id}", response_model=DocumentOut)
def update_document(payload: DocumentUpdate, document_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    document = require(Document, database, document_id)
    document.content = payload.content
    document.version += 1
    audit(database, user.id, "document.update", "document", document.id, {"version": document.version})
    database.commit()
    database.refresh(document)
    return document


@app.get("/api/v1/projects/{project_id}/tasks", response_model=list[TaskOut])
def list_tasks(project_id: int, database: Session = Depends(get_db), _: User = Depends(get_current_user)):
    require(Project, database, project_id)
    return database.scalars(select(Task).where(Task.project_id == project_id).order_by(Task.sort_order, Task.id)).all()


@app.get("/api/v1/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: int, database: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return require(Task, database, task_id)


@app.patch("/api/v1/tasks/{task_id}", response_model=TaskOut)
def update_task(payload: TaskUpdate, task_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = require(Task, database, task_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    audit(database, user.id, "task.update", "task", task.id, payload.model_dump(exclude_unset=True))
    database.commit()
    database.refresh(task)
    return task


@app.post("/api/v1/tasks/{task_id}/run", response_model=RunCreated, status_code=202)
def run_task(payload: RunCreate, task_id: int, background_tasks: BackgroundTasks, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = require(Task, database, task_id)
    if latest_active_run(database):
        raise HTTPException(status_code=409, detail="MVP only supports one active Agent run")
    mode = "mock" if settings.agent_mode == "mock" else payload.mode
    run = AgentRun(task_id=task.id, mode=mode, status="queued")
    database.add(run)
    database.flush()
    task.status = "running"
    audit(database, user.id, "agent_run.create", "agent_run", run.id, {"mode": mode})
    database.commit()
    background_tasks.add_task(execute_mock_run if mode == "mock" else execute_openhands_run, run.id)
    return RunCreated(run_id=run.id)


@app.post("/api/v1/tasks/{task_id}/confirm", response_model=TaskOut)
def confirm_task(task_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = require(Task, database, task_id)
    latest_run = database.scalar(select(AgentRun).where(AgentRun.task_id == task.id).order_by(AgentRun.id.desc()))
    if not latest_run or latest_run.status not in {"waiting_confirmation", "succeeded"}:
        raise HTTPException(status_code=409, detail="Task is not waiting for confirmation")
    task.status = "completed"
    latest_run.status = "succeeded"
    audit(database, user.id, "task.confirm", "task", task.id, {"run_id": latest_run.id})
    database.commit()
    database.refresh(task)
    return task


@app.get("/api/v1/agent-runs/{run_id}", response_model=AgentRunOut)
def get_run(run_id: int, database: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return require(AgentRun, database, run_id)


@app.get("/api/v1/agent-runs/{run_id}/events", response_model=list[AgentEventOut])
def get_events(run_id: int, after: int = Query(default=0, ge=0), database: Session = Depends(get_db), _: User = Depends(get_current_user)):
    require(AgentRun, database, run_id)
    return database.scalars(select(AgentEvent).where(AgentEvent.run_id == run_id, AgentEvent.id > after).order_by(AgentEvent.id)).all()


@app.post("/api/v1/agent-runs/{run_id}/cancel", response_model=AgentRunOut)
def cancel_run(run_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = require(AgentRun, database, run_id)
    if run.status in {"succeeded", "failed", "cancelled"}:
        raise HTTPException(status_code=409, detail="Run already finished")
    run.status = "cancelled"
    run.finished_at = datetime.now(timezone.utc)
    run.task.status = "pending"
    audit(database, user.id, "agent_run.cancel", "agent_run", run.id)
    database.commit()
    database.refresh(run)
    return run


@app.post("/api/v1/agent-runs/{run_id}/test", response_model=TestResultOut)
def run_test(payload: TestCreate, run_id: int, database: Session = Depends(get_db), user: User = Depends(get_current_user)):
    run = require(AgentRun, database, run_id)
    command = payload.command or "mock-test"
    if run.mode == "mock" or command == "mock-test":
        result = TestResult(run_id=run.id, command=command, exit_code=0, stdout="4 tests passed", stderr="", status="passed")
    else:
        result = TestResult(run_id=run.id, command=command, exit_code=1, stdout="", stderr="Real command execution is delegated to agent-adapter", status="failed")
    database.add(result)
    database.flush()
    audit(database, user.id, "test.run", "test_result", result.id, {"run_id": run.id, "status": result.status})
    database.commit()
    database.refresh(result)
    return result
