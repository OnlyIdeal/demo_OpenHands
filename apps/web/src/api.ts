const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

export type User = { id: string | number; email: string; name: string; role: string };
export type Project = { id: string | number; name: string; description?: string; workspace_path?: string; repository_url?: string; created_at?: string; requirements?: Requirement[]; tasks?: Task[]; agent_runs?: AgentRun[] };
export type Requirement = { id: string | number; project_id: string | number; title: string; idea: string; notes?: string; status?: string; prd_markdown?: string; technical_markdown?: string; documents?: DocumentAsset[]; tasks?: Task[]; created_at?: string };
export type DocumentAsset = { id: string | number; type?: string; document_type?: string; title?: string; content: string };
export type Task = { id: string | number; project_id?: string | number; requirement_id?: string | number; title: string; description?: string; acceptance_criteria?: string; status: string; latest_run_id?: string | number; agent_run_id?: string | number };
export type AgentRun = { id: string | number; task_id?: string | number; status: string; mode?: string; created_at?: string; updated_at?: string; test_result?: TestResult; events?: RunEvent[] };
export type RunEvent = { id: string | number; run_id: string | number; level: string; event_type: string; message: string; created_at: string; payload?: unknown };
export type TestResult = { command: string; exit_code: number; stdout: string; stderr: string; status: string };

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.detail || data?.message || `请求失败（${response.status}）`, response.status);
  return data as T;
}

const unwrapList = <T>(data: T[] | { items?: T[]; projects?: T[]; tasks?: T[] }): T[] => Array.isArray(data) ? data : data.items || data.projects || data.tasks || [];

export const api = {
  login: (email: string, password: string) => request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),
  projects: async () => unwrapList(await request<Project[] | { items?: Project[]; projects?: Project[] }>("/projects")),
  project: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (body: Omit<Project, "id">) => request<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),
  createRequirement: (projectId: string, body: Pick<Requirement, "title" | "idea" | "notes">) => request<Requirement>(`/projects/${projectId}/requirements`, { method: "POST", body: JSON.stringify(body) }),
  requirement: (id: string) => request<Requirement>(`/requirements/${id}`),
  generate: (id: string) => request<{ prd_markdown: string; technical_markdown: string; tasks: Task[] }>(`/requirements/${id}/generate`, { method: "POST" }),
  tasks: async (projectId: string) => unwrapList(await request<Task[] | { items?: Task[]; tasks?: Task[] }>(`/projects/${projectId}/tasks`)),
  task: async (id: string) => {
    try { return await request<Task>(`/tasks/${id}`); }
    catch (error) { if (error instanceof ApiError && error.status === 404) throw error; throw error; }
  },
  runTask: (id: string, mode: "mock" | "openhands") => request<{ run_id: string | number }>(`/tasks/${id}/run`, { method: "POST", body: JSON.stringify({ mode }) }),
  confirmTask: (id: string) => request<Task>(`/tasks/${id}/confirm`, { method: "POST" }),
  run: (id: string) => request<AgentRun>(`/agent-runs/${id}`),
  events: async (id: string, after = "") => unwrapList(await request<RunEvent[] | { items?: RunEvent[] }>(`/agent-runs/${id}/events${after ? `?after=${after}` : ""}`)),
  cancelRun: (id: string) => request<void>(`/agent-runs/${id}/cancel`, { method: "POST" }),
  testRun: (id: string, command?: string) => request<TestResult>(`/agent-runs/${id}/test`, { method: "POST", body: JSON.stringify(command ? { command } : {}) }),
};
