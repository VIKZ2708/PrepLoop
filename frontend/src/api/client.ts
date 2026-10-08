const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface SyllabusItem {
  id: number;
  track: string;
  day_no: number;
  title: string;
  description: string;
}

export async function getTodaySyllabus(track: string): Promise<SyllabusItem> {
  const res = await fetch(`${API_URL}/syllabus/today?track=${track}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for track ${track}`);
  return res.json() as Promise<SyllabusItem>;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error("API unreachable");
  return res.json() as Promise<{ status: string }>;
}
