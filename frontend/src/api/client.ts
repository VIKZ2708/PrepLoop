const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Syllabus ─────────────────────────────────────────────────────────────────

export interface SyllabusItem {
  id: number;
  track: string;
  day_no: number;
  title: string;
  description: string;
}

export function getTodaySyllabus(track: string): Promise<SyllabusItem> {
  return apiFetch(`/syllabus/today?track=${track}`);
}

export function getHealth(): Promise<{ status: string }> {
  return apiFetch("/health");
}

// ── Study sessions ────────────────────────────────────────────────────────────

export interface StudySession {
  id: number;
  syllabus_item_id: number | null;
  date: string;
  notes: string | null;
  diagram_json: Record<string, unknown> | null;
  teach_back: string | null;
  ai_feedback: string | null;
}

export function getTodayStudySession(track: string): Promise<StudySession> {
  return apiFetch(`/study/today?track=${track}`);
}

export function patchStudySession(
  id: number,
  data: { notes?: string; diagram_json?: Record<string, unknown> | null; teach_back?: string }
): Promise<StudySession> {
  return apiFetch(`/study/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

// ── Project tasks ─────────────────────────────────────────────────────────────

export interface ProjectTask {
  id: number;
  title: string;
  status: "todo" | "in_progress" | "done";
  milestone: string | null;
}

export function listTasks(): Promise<ProjectTask[]> {
  return apiFetch("/project/tasks");
}

export function createTask(data: { title: string; status?: string; milestone?: string }): Promise<ProjectTask> {
  return apiFetch("/project/tasks", { method: "POST", body: JSON.stringify(data) });
}

export function updateTask(id: number, data: Partial<ProjectTask>): Promise<ProjectTask> {
  return apiFetch(`/project/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteTask(id: number): Promise<void> {
  return apiFetch(`/project/tasks/${id}`, { method: "DELETE" });
}

// ── Project log ───────────────────────────────────────────────────────────────

export interface ProjectLog {
  id: number;
  date: string;
  built: string | null;
  blockers: string | null;
  learnings: string | null;
}

export function getTodayLog(): Promise<ProjectLog | null> {
  return apiFetch("/project/log/today");
}

export function upsertTodayLog(data: {
  built?: string;
  blockers?: string;
  learnings?: string;
}): Promise<ProjectLog> {
  return apiFetch("/project/log/today", { method: "PUT", body: JSON.stringify(data) });
}
