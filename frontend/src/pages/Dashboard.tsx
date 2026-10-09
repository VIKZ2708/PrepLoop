import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTodaySyllabus } from "../api/client";

function StudyCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["syllabus", "sd1"],
    queryFn: () => getTodaySyllabus("sd1"),
    retry: 1,
  });

  return (
    <Link to="/study?track=sd1" className="group block">
      <div className="h-full rounded-2xl border border-[#21262d] bg-[#161b22] p-6 card-glow transition-all duration-200 group-hover:border-[#0071e3]">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b949e]">Afternoon</p>
              <p className="text-xs text-[#3d444d]">40–60 min</p>
            </div>
          </div>
          <span className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-xs font-medium text-[#0071e3]">Active</span>
        </div>
        <h3 className="mb-1 text-lg font-bold text-[#e6edf3]">Study</h3>
        {isLoading ? (
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#21262d]" />
        ) : data ? (
          <p className="text-sm text-[#8b949e] leading-snug">
            Day {data.day_no} — {data.title}
          </p>
        ) : null}
        <p className="mt-4 text-xs text-[#0071e3] group-hover:underline">Open workspace →</p>
      </div>
    </Link>
  );
}

function BuildCard() {
  return (
    <Link to="/project" className="group block">
      <div className="h-full rounded-2xl border border-[#21262d] bg-[#161b22] p-6 card-glow transition-all duration-200 group-hover:border-[#0071e3]">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔨</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b949e]">Evening</p>
              <p className="text-xs text-[#3d444d]">45–60 min</p>
            </div>
          </div>
          <span className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-xs font-medium text-[#0071e3]">Active</span>
        </div>
        <h3 className="mb-1 text-lg font-bold text-[#e6edf3]">Build</h3>
        <p className="text-sm text-[#8b949e] leading-snug">Tasks, milestones, daily build log</p>
        <p className="mt-4 text-xs text-[#0071e3] group-hover:underline">Open tracker →</p>
      </div>
    </Link>
  );
}

function RecapCard() {
  return (
    <Link to="/recap" className="group block">
      <div className="h-full rounded-2xl border border-[#21262d] bg-[#161b22] p-6 card-glow transition-all duration-200 group-hover:border-[#0071e3]">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☀️</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b949e]">Morning</p>
              <p className="text-xs text-[#3d444d]">5 min</p>
            </div>
          </div>
          <span className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-xs font-medium text-[#0071e3]">Active</span>
        </div>
        <h3 className="mb-1 text-lg font-bold text-[#e6edf3]">Recap</h3>
        <p className="text-sm text-[#8b949e] leading-snug">Yesterday's summary, weak spots, 3 recall questions</p>
        <p className="mt-4 text-xs text-[#0071e3] group-hover:underline">Open recap →</p>
      </div>
    </Link>
  );
}

function QuizCard() {
  return (
    <Link to="/quiz?track=sd1" className="group block">
      <div className="h-full rounded-2xl border border-[#21262d] bg-[#161b22] p-6 card-glow transition-all duration-200 group-hover:border-[#0071e3]">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b949e]">Night</p>
              <p className="text-xs text-[#3d444d]">15–20 min</p>
            </div>
          </div>
          <span className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-xs font-medium text-[#0071e3]">Active</span>
        </div>
        <h3 className="mb-1 text-lg font-bold text-[#e6edf3]">Quiz</h3>
        <p className="text-sm text-[#8b949e] leading-snug">5 questions from today's notes, graded instantly</p>
        <p className="mt-4 text-xs text-[#0071e3] group-hover:underline">Start quiz →</p>
      </div>
    </Link>
  );
}


export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Nav */}
      <div className="border-b border-[#21262d] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-bold gradient-text">PrepLoop</span>
          <span className="text-xs text-[#8b949e]">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Today's Loop
          </h1>
          <p className="mt-1 text-[#8b949e]">Four sessions. One continuous loop.</p>
        </div>

        {/* 4 cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RecapCard />
          <StudyCard />
          <BuildCard />
          <QuizCard />
        </div>

        {/* Quick links */}
        <div className="mt-8 rounded-xl border border-[#21262d] bg-[#161b22] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8b949e]">All Tracks</p>
            <Link to="/curriculum" className="text-xs text-[#0071e3] hover:underline">View full curriculum →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { track: "sd1", label: "System Design Vol 1" },
              { track: "sd2", label: "System Design Vol 2" },
              { track: "ai",  label: "AI Engineering" },
            ].map(({ track, label }) => (
              <Link
                key={track}
                to={`/study?track=${track}`}
                className="rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-xs text-[#8b949e] hover:border-[#0071e3] hover:text-[#e6edf3] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
