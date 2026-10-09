import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTodayRecap, triggerRecapBuild, type RecapOut } from "../api/client";

function RecallQuestion({ index, question }: { index: number; question: string }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#8b949e]">
        Recall {index + 1}
      </p>
      <p className="mb-3 text-sm font-medium text-[#e6edf3]">{question}</p>
      {!submitted ? (
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer…"
            className="flex-1 resize-none rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#3d444d] focus:border-[#0071e3] focus:outline-none transition-colors"
          />
          <button
            disabled={!answer.trim()}
            onClick={() => setSubmitted(true)}
            className="self-end rounded-lg bg-[#0071e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0058b3] disabled:opacity-40 transition-colors"
          >
            Submit
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-green-700/30 bg-green-900/10 px-3 py-2">
          <p className="text-xs text-green-400 mb-1">Logged ✓</p>
          <p className="text-sm text-[#8b949e]">{answer}</p>
        </div>
      )}
    </div>
  );
}

function RecapView({ recap }: { recap: RecapOut }) {
  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#8b949e]">Yesterday's recap</p>
        <p className="text-sm leading-relaxed text-[#e6edf3]">{recap.summary}</p>

        {recap.weak_topics.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-[#8b949e]">Revisit these:</p>
            <div className="flex flex-wrap gap-2">
              {recap.weak_topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-orange-700/40 bg-orange-900/10 px-3 py-0.5 text-xs text-orange-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recall questions */}
      {recap.recall_questions.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8b949e]">3 quick recalls</p>
          <div className="space-y-3">
            {recap.recall_questions.map((q, i) => (
              <RecallQuestion key={i} index={i} question={q} />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-3 pt-2">
        <Link
          to="/study"
          className="rounded-lg bg-[#0071e3] px-5 py-2 text-sm font-medium text-white hover:bg-[#0058b3] transition-colors"
        >
          Start today's study →
        </Link>
        <Link
          to="/curriculum"
          className="rounded-lg border border-[#30363d] px-5 py-2 text-sm text-[#8b949e] hover:border-[#0071e3] hover:text-[#e6edf3] transition-colors"
        >
          View curriculum
        </Link>
      </div>
    </div>
  );
}

export default function Recap() {
  const { data: recap, isLoading, error, refetch } = useQuery({
    queryKey: ["recap", "today"],
    queryFn: getTodayRecap,
    retry: false,
  });

  const build = useMutation({
    mutationFn: triggerRecapBuild,
    onSuccess: () => refetch(),
  });

  const notBuilt = (error as Error)?.message?.includes("404");

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="border-b border-[#21262d] px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-[#8b949e] hover:text-[#e6edf3] transition-colors text-sm">
              ← Dashboard
            </Link>
            <span className="text-[#30363d]">/</span>
            <h1 className="text-lg font-semibold gradient-text">Morning Recap</h1>
          </div>
          <span className="text-xs text-[#8b949e]">☀️ 06:00 daily</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8">
        {isLoading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
            <p className="text-[#8b949e]">Loading recap…</p>
          </div>
        )}

        {notBuilt && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <span className="text-5xl">☀️</span>
            <div>
              <h2 className="text-xl font-bold">No recap yet for today</h2>
              <p className="mt-1 text-sm text-[#8b949e]">
                Recaps are generated automatically at 06:00 IST.<br />
                You can also build one manually right now.
              </p>
            </div>
            <button
              onClick={() => build.mutate()}
              disabled={build.isPending}
              className="rounded-xl bg-[#0071e3] px-6 py-2.5 font-semibold text-white hover:bg-[#0058b3] disabled:opacity-40 transition-colors"
            >
              {build.isPending ? "Building recap…" : "Build now"}
            </button>
            {build.isError && (
              <p className="text-sm text-red-400">Failed to build recap. Try again.</p>
            )}
          </div>
        )}

        {recap && <RecapView recap={recap} />}
      </div>
    </div>
  );
}
