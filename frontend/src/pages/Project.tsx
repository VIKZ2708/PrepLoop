import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  getTodayLog,
  upsertTodayLog,
  type ProjectTask,
} from "../api/client";

const COLUMNS: { id: ProjectTask["status"]; label: string; color: string }[] = [
  { id: "todo",        label: "To Do",       color: "border-[#30363d]" },
  { id: "in_progress", label: "In Progress",  color: "border-[#0071e3]" },
  { id: "done",        label: "Done",         color: "border-green-600" },
];

function KanbanColumn({
  column,
  tasks,
  onMove,
  onDelete,
}: {
  column: (typeof COLUMNS)[number];
  tasks: ProjectTask[];
  onMove: (task: ProjectTask, direction: "back" | "forward") => void;
  onDelete: (id: number) => void;
}) {
  const colIdx = COLUMNS.findIndex((c) => c.id === column.id);

  return (
    <div className={`flex flex-1 flex-col rounded-xl border ${column.color} bg-[#161b22] min-h-[200px]`}>
      <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-3">
        <span className="text-sm font-semibold text-[#e6edf3]">{column.label}</span>
        <span className="rounded-full bg-[#21262d] px-2 py-0.5 text-xs text-[#8b949e]">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-start justify-between rounded-lg border border-[#21262d] bg-[#0d1117] px-3 py-2 card-glow"
          >
            <span className="text-sm text-[#e6edf3] leading-snug pr-2">{task.title}</span>
            <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {colIdx > 0 && (
                <button
                  onClick={() => onMove(task, "back")}
                  className="rounded p-1 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
                  title="Move back"
                >←</button>
              )}
              {colIdx < COLUMNS.length - 1 && (
                <button
                  onClick={() => onMove(task, "forward")}
                  className="rounded p-1 text-xs text-[#0071e3] hover:bg-[#21262d]"
                  title="Move forward"
                >→</button>
              )}
              <button
                onClick={() => onDelete(task.id)}
                className="rounded p-1 text-xs text-[#8b949e] hover:bg-[#21262d] hover:text-red-400"
                title="Delete"
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Project() {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [log, setLog] = useState({ built: "", blockers: "", learnings: "" });
  const [logSaved, setLogSaved] = useState(false);

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  const { data: todayLog } = useQuery({
    queryKey: ["log"],
    queryFn: getTodayLog,
    select: (d) => d ?? null,
  });

  // Pre-fill log form from server
  useState(() => {
    if (todayLog) setLog({ built: todayLog.built ?? "", blockers: todayLog.blockers ?? "", learnings: todayLog.learnings ?? "" });
  });

  const addTask = useMutation({
    mutationFn: () => createTask({ title: newTitle.trim() }),
    onSuccess: (t) => {
      qc.setQueryData<ProjectTask[]>(["tasks"], (prev) => [...(prev ?? []), t]);
      setNewTitle("");
    },
  });

  const moveTask = useMutation({
    mutationFn: ({ task, direction }: { task: ProjectTask; direction: "back" | "forward" }) => {
      const idx = COLUMNS.findIndex((c) => c.id === task.status);
      const next = COLUMNS[direction === "forward" ? idx + 1 : idx - 1];
      return updateTask(task.id, { status: next.id });
    },
    onSuccess: (updated) => {
      qc.setQueryData<ProjectTask[]>(["tasks"], (prev) =>
        prev?.map((t) => (t.id === updated.id ? updated : t)) ?? []
      );
    },
  });

  const removeTask = useMutation({
    mutationFn: deleteTask,
    onSuccess: (_, id) => {
      qc.setQueryData<ProjectTask[]>(["tasks"], (prev) => prev?.filter((t) => t.id !== id) ?? []);
    },
  });

  const saveLog = useMutation({
    mutationFn: () => upsertTodayLog(log),
    onSuccess: () => { setLogSaved(true); setTimeout(() => setLogSaved(false), 2000); },
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="border-b border-[#21262d] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-[#8b949e] hover:text-[#e6edf3] transition-colors text-sm">
            ← Dashboard
          </a>
          <span className="text-[#30363d]">/</span>
          <h1 className="text-lg font-semibold">
            <span className="gradient-text">Build</span>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-10">
        {/* Kanban */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#8b949e]">Tasks</h2>
          </div>

          {/* Add task */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) addTask.mutate(); }}
            className="mb-4 flex gap-2"
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New task…"
              className="flex-1 rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2 text-sm text-[#e6edf3] placeholder-[#3d444d] focus:border-[#0071e3] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || addTask.isPending}
              className="rounded-lg bg-[#0071e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0058b3] disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </form>

          <div className="flex gap-3">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasks.filter((t) => t.status === col.id)}
                onMove={(task, dir) => moveTask.mutate({ task, direction: dir })}
                onDelete={(id) => removeTask.mutate(id)}
              />
            ))}
          </div>
        </section>

        {/* Daily log */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#8b949e]">Daily Log</h2>
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6 space-y-5">
            {(["built", "blockers", "learnings"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1.5 block text-xs font-medium capitalize text-[#8b949e]">
                  {field === "built" ? "🔨 What I built" : field === "blockers" ? "🚧 Blockers" : "💡 Learnings"}
                </label>
                <textarea
                  rows={3}
                  value={log[field]}
                  onChange={(e) => setLog((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={`${field === "built" ? "What did you ship today?" : field === "blockers" ? "What slowed you down?" : "What did you learn?"}`}
                  className="w-full resize-none rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm text-[#e6edf3] placeholder-[#3d444d] focus:border-[#0071e3] focus:outline-none transition-colors"
                />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <button
                onClick={() => saveLog.mutate()}
                disabled={saveLog.isPending}
                className="rounded-lg bg-[#0071e3] px-5 py-2 text-sm font-medium text-white hover:bg-[#0058b3] disabled:opacity-40 transition-colors"
              >
                {saveLog.isPending ? "Saving…" : "Save Log"}
              </button>
              {logSaved && <span className="text-sm text-green-500">Saved ✓</span>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
