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

// ── Quiz ──────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: number;
  type: string;
  prompt: string;
  options: string[] | null;
  difficulty: string;
}

export interface QuizStartResponse {
  attempt_id: number;
  questions: QuizQuestion[];
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  explanation: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
}

export interface TeachBackResponse {
  critique: string;
  follow_up_questions: string[];
}

export interface QuizFinishResponse {
  attempt_id: number;
  score: number;
  correct: number;
  total: number;
}

export function startQuiz(track: string): Promise<QuizStartResponse> {
  return apiFetch(`/quiz/start?track=${track}`, { method: "POST" });
}

export function submitAnswer(
  attemptId: number,
  questionId: number,
  userAnswer: string
): Promise<AnswerResponse> {
  return apiFetch(`/quiz/${attemptId}/answer`, {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, user_answer: userAnswer }),
  });
}

export function finishQuiz(attemptId: number): Promise<QuizFinishResponse> {
  return apiFetch(`/quiz/${attemptId}/finish`, { method: "POST" });
}

// ── Curriculum ───────────────────────────────────────────────────────────────

export interface SyllabusItemWithStatus {
  id: number;
  track: string;
  day_no: number;
  title: string;
  description: string;
  completed: boolean;
  is_today: boolean;
}

export interface CurriculumResponse {
  sd1: SyllabusItemWithStatus[];
  sd2: SyllabusItemWithStatus[];
  ai: SyllabusItemWithStatus[];
  today: Record<string, number>;
}

export function getAllSyllabus(): Promise<CurriculumResponse> {
  return apiFetch("/syllabus/all");
}

// ── Recap ─────────────────────────────────────────────────────────────────────

export interface RecapOut {
  id: number;
  date: string;
  summary: string;
  weak_topics: string[];
  recall_questions: string[];
}

export function getTodayRecap(): Promise<RecapOut> {
  return apiFetch("/recap/today");
}

export function triggerRecapBuild(): Promise<RecapOut> {
  return apiFetch("/recap/build", { method: "POST" });
}

// ── Teach-back ────────────────────────────────────────────────────────────────

export function submitTeachBack(
  sessionId: number,
  explanation: string,
  topic?: string
): Promise<TeachBackResponse> {
  return apiFetch(`/study/${sessionId}/teach-back`, {
    method: "POST",
    body: JSON.stringify({ explanation, topic }),
  });
}
