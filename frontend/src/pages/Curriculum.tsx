import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAllSyllabus, type SyllabusItemWithStatus } from "../api/client";

const TRACKS = [
  { id: "sd1" as const, label: "System Design Vol 1", emoji: "🏗️", count: 15 },
  { id: "sd2" as const, label: "System Design Vol 2", emoji: "⚙️", count: 13 },
  { id: "ai"  as const, label: "AI Engineering",      emoji: "🤖", count: 10 },
];

function TopicRow({ item, track }: { item: SyllabusItemWithStatus; track: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${
        item.is_today
          ? "border-[#0071e3] bg-[#0071e3]/5"
          : item.completed
          ? "border-green-800/40 bg-green-900/5"
          : "border-[#21262d] bg-[#161b22]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Status dot */}
        <span
          className={`shrink-0 h-2.5 w-2.5 rounded-full ${
            item.is_today
              ? "bg-[#0071e3] ring-2 ring-[#0071e3]/30"
              : item.completed
              ? "bg-green-500"
              : "bg-[#30363d]"
          }`}
        />

        <span className="text-xs text-[#8b949e] shrink-0 w-8">D{item.day_no}</span>

        <span className={`flex-1 text-sm font-medium ${item.is_today ? "text-[#0071e3]" : item.completed ? "text-[#8b949e]" : "text-[#e6edf3]"}`}>
          {item.title}
          {item.is_today && (
            <span className="ml-2 rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-xs font-semibold text-[#0071e3]">Today</span>
          )}
        </span>

        {item.completed && !item.is_today && (
          <span className="shrink-0 text-xs text-green-500">✓</span>
        )}

        <span className="shrink-0 text-xs text-[#3d444d]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[#21262d] px-4 py-3 flex items-start justify-between gap-4">
          <p className="text-sm text-[#8b949e] leading-relaxed flex-1">{item.description}</p>
          <Link
            to={`/study?track=${track}&day=${item.day_no}`}
            className="shrink-0 rounded-lg bg-[#0071e3] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0058b3] transition-colors"
          >
            Study →
          </Link>
        </div>
      )}
    </div>
  );
}

function TrackPanel({ trackId, items }: { trackId: string; items: SyllabusItemWithStatus[] }) {
  const completed = items.filter((i) => i.completed).length;
  const pct = Math.round((completed / items.length) * 100);

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0071e3] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-[#8b949e] shrink-0">{completed}/{items.length} done</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <TopicRow key={item.id} item={item} track={trackId} />
        ))}
      </div>
    </div>
  );
}

export default function Curriculum() {
  const [activeTrack, setActiveTrack] = useState<"sd1" | "sd2" | "ai">("sd1");
  const { data, isLoading } = useQuery({
    queryKey: ["curriculum"],
    queryFn: getAllSyllabus,
    staleTime: 60_000,
  });

  const activeItems = data?.[activeTrack] ?? [];
  const totalDone = data
    ? [...(data.sd1 ?? []), ...(data.sd2 ?? []), ...(data.ai ?? [])].filter((i) => i.completed).length
    : 0;
  const totalTopics = 38;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="border-b border-[#21262d] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-[#8b949e] hover:text-[#e6edf3] transition-colors text-sm">
              ← Dashboard
            </Link>
            <span className="text-[#30363d]">/</span>
            <h1 className="text-lg font-semibold gradient-text">Curriculum</h1>
          </div>
          <span className="text-xs text-[#8b949e]">{totalDone}/{totalTopics} topics completed</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Track tabs */}
        <div className="mb-6 flex gap-2">
          {TRACKS.map((t) => {
            const items = data?.[t.id] ?? [];
            const done = items.filter((i) => i.completed).length;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTrack(t.id)}
                className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all ${
                  activeTrack === t.id
                    ? "border-[#0071e3] bg-[#0071e3]/10"
                    : "border-[#21262d] bg-[#161b22] hover:border-[#30363d]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-xs text-[#8b949e]">{done}/{t.count}</span>
                </div>
                <p className={`text-xs font-semibold leading-snug ${activeTrack === t.id ? "text-[#0071e3]" : "text-[#e6edf3]"}`}>
                  {t.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Topic list */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#161b22]" />
            ))}
          </div>
        ) : (
          <TrackPanel trackId={activeTrack} items={activeItems} />
        )}
      </div>
    </div>
  );
}
