import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboardToday, type DashboardToday } from "../api/client";

const TRACKS = [
  { id: "sd1", label: "System Design Vol 1" },
  { id: "sd2", label: "System Design Vol 2" },
  { id: "ai",  label: "AI Engineering" },
];

// ── How it works guide ────────────────────────────────────────────────────────

function GuideBar({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-8 rounded-2xl border border-[#0071e3]/30 bg-[#0071e3]/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0071e3] mb-2">How PrepLoop works</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { phase: "Phase 1", label: "Study", desc: "Read today's topic, write notes" },
              { phase: "Phase 2", label: "Quiz",  desc: "5 AI-generated questions from your notes" },
              { phase: "Phase 3", label: "Build", desc: "Log what you built today" },
              { phase: "Phase 4", label: "Recap", desc: "Morning summary + weak spots + recall" },
            ].map(({ phase, label, desc }) => (
              <div key={phase} className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0071e3]">{phase}</span>
                <span className="text-xs text-[#e6edf3] font-medium">{label}</span>
                <span className="text-xs text-[#8b949e]">— {desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#8b949e]">Complete each phase to unlock the next. The loop resets daily.</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-[#3d444d] hover:text-[#8b949e] transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ── Phase card ────────────────────────────────────────────────────────────────

interface PhaseCardProps {
  phase: number;
  label: string;
  icon: string;
  to: string;
  locked: boolean;
  complete: boolean;
  topicTitle?: string;
  topicDescription?: string;
  dayNo?: number;
  preview?: string | null;
  detail?: string | null;
}

function PhaseCard({
  phase, label, icon, to, locked, complete,
  topicTitle, topicDescription, dayNo, preview, detail,
}: PhaseCardProps) {
  const navigate = useNavigate();

  const borderColor = locked
    ? "border-[#21262d]"
    : complete
    ? "border-green-800/50"
    : "border-[#0071e3]";

  const bgColor = locked
    ? "bg-[#0d1117]"
    : complete
    ? "bg-green-900/5"
    : "bg-[#0071e3]/5";

  const badge = locked
    ? { label: "Locked", cls: "bg-[#21262d] text-[#3d444d]" }
    : complete
    ? { label: "Done ✓", cls: "bg-green-900/30 text-green-400" }
    : { label: "Active", cls: "bg-[#0071e3]/20 text-[#0071e3]" };

  return (
    <div
      className={`rounded-2xl border ${borderColor} ${bgColor} p-5 transition-all duration-200 ${!locked ? "cursor-pointer hover:shadow-lg hover:shadow-[#0071e3]/5" : "opacity-60"}`}
      onClick={() => !locked && navigate(to)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${locked ? "bg-[#161b22]" : complete ? "bg-green-900/30" : "bg-[#0071e3]/15"}`}>
            {locked ? "🔒" : icon}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Phase {phase}</p>
            <p className={`text-base font-bold ${locked ? "text-[#3d444d]" : "text-[#e6edf3]"}`}>{label}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {!locked && topicTitle && (
        <div className="mb-3 rounded-xl border border-[#21262d] bg-[#0d1117] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8b949e] mb-1">Day {dayNo} — Today's Topic</p>
          <p className="text-sm font-semibold text-[#e6edf3]">{topicTitle}</p>
          {topicDescription && (
            <p className="mt-1 text-xs text-[#8b949e] leading-relaxed line-clamp-2">{topicDescription}</p>
          )}
        </div>
      )}

      {!locked && (preview || detail) && (
        <div className="mb-3 rounded-xl border border-[#21262d] bg-[#0d1117] p-3">
          <p className="text-xs text-[#8b949e] leading-relaxed line-clamp-3">{preview || detail}</p>
        </div>
      )}

      {!locked && (
        <p className={`text-xs font-medium ${complete ? "text-green-400" : "text-[#0071e3]"}`}>
          {complete ? "Review →" : "Open →"}
        </p>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [track, setTrack] = useState("sd1");
  const [guideVisible, setGuideVisible] = useState(
    () => localStorage.getItem("preploop_guide_dismissed") !== "1"
  );

  const { data, isLoading, error } = useQuery<DashboardToday>({
    queryKey: ["dashboard", track],
    queryFn: () => getDashboardToday(track),
    refetchInterval: 30_000,
    retry: 1,
  });

  const dismissGuide = () => {
    localStorage.setItem("preploop_guide_dismissed", "1");
    setGuideVisible(false);
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Nav */}
      <div className="border-b border-[#21262d] px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-xl font-bold gradient-text">PrepLoop</span>
          <div className="flex items-center gap-3">
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs text-[#e6edf3] focus:border-[#0071e3] focus:outline-none"
            >
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <span className="text-xs text-[#8b949e]">{today}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Guide */}
        {guideVisible && <GuideBar onDismiss={dismissGuide} />}

        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Today's Loop</h1>
            <p className="mt-0.5 text-sm text-[#8b949e]">Complete each phase in order to unlock the next.</p>
          </div>
          <Link to="/curriculum" className="text-xs text-[#0071e3] hover:underline">
            View curriculum →
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-[#161b22]" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 text-sm text-red-400">
            Could not load today's status. Check your connection.
          </div>
        )}

        {data && (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              {(() => {
                const done = [data.study.complete, data.quiz.complete, data.build.complete, data.recap.complete].filter(Boolean).length;
                const pct = Math.round((done / 4) * 100);
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                      <div className="h-full rounded-full bg-[#0071e3] transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[#8b949e] shrink-0">{done}/4 phases done</span>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PhaseCard
                phase={1}
                label="Study"
                icon="📚"
                to={`/study?track=${track}`}
                locked={false}
                complete={data.study.complete}
                topicTitle={data.study.topic_title}
                topicDescription={data.study.topic_description}
                dayNo={data.study.day_no}
                preview={data.study.notes_preview}
                detail={data.study.content?.summary ?? undefined}
              />
              <PhaseCard
                phase={2}
                label="Quiz"
                icon="🧠"
                to={`/quiz?track=${track}`}
                locked={data.quiz.locked}
                complete={data.quiz.complete}
                topicTitle={!data.quiz.locked ? data.study.topic_title : undefined}
                topicDescription={!data.quiz.locked ? data.study.topic_description : undefined}
                dayNo={!data.quiz.locked ? data.study.day_no : undefined}
                detail={data.quiz.last_score !== null ? `Last score: ${Math.round(data.quiz.last_score)}%` : undefined}
              />
              <PhaseCard
                phase={3}
                label="Build"
                icon="🔨"
                to="/project"
                locked={data.build.locked}
                complete={data.build.complete}
                preview={data.build.log_preview}
              />
              <PhaseCard
                phase={4}
                label="Recap"
                icon="☀️"
                to="/recap"
                locked={data.recap.locked}
                complete={data.recap.complete}
                preview={data.recap.summary}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
