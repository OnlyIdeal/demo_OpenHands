from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORMModel):
    id: int
    email: str
    name: str
    role: str


class LoginIn(BaseModel):
    email: str
    password: str


class LoginOut(BaseModel):
    user: UserOut


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    workspace_path: str = "workspace/project"
    repository_url: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    workspace_path: str | None = None
    repository_url: str | None = None


class ProjectOut(ORMModel):
    id: int
    name: str
    description: str
    workspace_path: str
    repository_url: str
    created_at: datetime
    updated_at: datetime


class RequirementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    idea: str = Field(min_length=1)
    notes: str = ""


class DocumentOut(ORMModel):
    id: int
    project_id: int
    requirement_id: int | None
    document_type: str
    title: str
    content: str
    version: int
    created_at: datetime
    updated_at: datetime


class RequirementOut(ORMModel):
    id: int
    project_id: int
    title: str
    idea: str
    notes: str
    status: str
    documents: list[DocumentOut] = []
    created_at: datetime
    updated_at: datetime


class DocumentUpdate(BaseModel):
    content: str


class TaskOut(ORMModel):
    id: int
    project_id: int
    requirement_id: int | None
    title: str
    description: str
    acceptance_criteria: str
    status: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


class TaskUpdate(BaseModel):
    status: Literal["pending", "running", "waiting_confirmation", "completed", "failed"] | None = None
    title: str | None = None
    acceptance_criteria: str | None = None


class GenerateOut(BaseModel):
    prd_markdown: str
    technical_markdown: str
    tasks: list[TaskOut]


class RunCreate(BaseModel):
    mode: Literal["mock", "openhands"] = "mock"


class RunCreated(BaseModel):
    run_id: int


class AgentRunOut(ORMModel):
    id: int
    task_id: int
    mode: str
    status: str
    adapter_run_id: str | None
    result_summary: str
    error_message: str
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AgentEventOut(ORMModel):
    id: int
    run_id: int
    level: str
    event_type: str
    message: str
    created_at: datetime
    payload: dict[str, Any]


class TestCreate(BaseModel):
    command: str | None = None


class TestResultOut(ORMModel):
    command: str
    exit_code: int
    stdout: str
    stderr: str
    status: str

