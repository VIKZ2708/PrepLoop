import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  startQuiz,
  submitAnswer,
  finishQuiz,
  type QuizQuestion,
  type AnswerResponse,
  type QuizFinishResponse,
} from "../api/client";

const TRACKS = [
  { id: "sd1", label: "System Design Vol 1" },
  { id: "sd2", label: "System Design Vol 2" },
  { id: "ai",  label: "AI Engineering" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "question"; attemptId: number; questions: QuizQuestion[]; index: number }
  | { kind: "feedback"; attemptId: number; questions: QuizQuestion[]; index: number; feedback: AnswerResponse; selected: string }
  | { kind: "finished"; result: QuizFinishResponse };

export default function Quiz() {
  const [params, setParams] = useSearchParams();
  const track = params.get("track") ?? "sd1";
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = (): QuizQuestion | null => {
    if (phase.kind === "question" || phase.kind === "feedback") {
      return phase.questions[phase.index] ?? null;
    }
    return null;
  };

  async function handleStart() {
    setError(null);
    setPhase({ kind: "loading" });
    try {
      const data = await startQuiz(track);
      setPhase({ kind: "question", attemptId: data.attempt_id, questions: data.questions, index: 0 });
    } catch (e) {
      setError("Failed to start quiz. Try again.");
      setPhase({ kind: "idle" });
    }
  }

  async function handleAnswer(selected: string) {
    if (phase.kind !== "question") return;
    const q = phase.questions[phase.index];
    try {
      const fb = await submitAnswer(phase.attemptId, q.id, selected);
      setPhase({ kind: "feedback", attemptId: phase.attemptId, questions: phase.questions, index: phase.index, feedback: fb, selected });
    } catch {
      setError("Failed to submit answer.");
    }
  }

  async function handleNext() {
    if (phase.kind !== "feedback") return;
    const nextIndex = phase.index + 1;
    if (nextIndex >= phase.questions.length) {
      try {
        const result = await finishQuiz(phase.attemptId);
        setPhase({ kind: "finished", result });
      } catch {
        setError("Failed to finish quiz.");
      }
    } else {
      setPhase({ kind: "question", attemptId: phase.attemptId, questions: phase.questions, index: nextIndex });
    }
  }

  const q = currentQuestion();

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
            <h1 className="text-lg font-semibold">
              <span className="gradient-text">Night Quiz</span>
            </h1>
          </div>
          <select
            value={track}
            onChange={(e) => { setParams({ track: e.target.value }); setPhase({ kind: "idle" }); }}
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-sm text-[#e6edf3] focus:border-[#0071e3] focus:outline-none"
          >
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10">

        {/* ── Idle ── */}
        {phase.kind === "idle" && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <span className="text-6xl">🌙</span>
            <h2 className="text-2xl font-bold">Ready for tonight's quiz?</h2>
            <p className="text-[#8b949e]">
              5 questions generated from your study notes.<br />
              MCQ graded instantly. Short answers saved for later review.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleStart}
              className="mt-2 rounded-xl bg-[#0071e3] px-8 py-3 font-semibold text-white hover:bg-[#0058b3] transition-colors"
            >
              Start Quiz
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {phase.kind === "loading" && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
            <p className="text-[#8b949e]">Generating questions from your notes…</p>
          </div>
        )}

        {/* ── Question ── */}
        {(phase.kind === "question" || phase.kind === "feedback") && q && (
          <div>
            {/* Progress */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0071e3] transition-all duration-300"
                  style={{ width: `${((phase.index + 1) / (phase as { questions: QuizQuestion[] }).questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#8b949e] shrink-0">
                {phase.index + 1} / {(phase as { questions: QuizQuestion[] }).questions.length}
              </span>
            </div>

            {/* Question card */}
            <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-6 mb-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-xs text-[#8b949e] uppercase tracking-widest">
                  {q.type === "mcq" ? "Multiple choice" : "Short answer"}
                </span>
                <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-xs text-[#8b949e]">
                  {q.difficulty}
                </span>
              </div>
              <p className="mt-3 text-base font-medium leading-relaxed text-[#e6edf3]">{q.prompt}</p>
            </div>

            {/* MCQ options */}
            {q.type === "mcq" && q.options && (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const isFeedback = phase.kind === "feedback";
                  const isSelected = isFeedback && (phase as { selected: string }).selected === opt;
                  const isCorrect = isFeedback && (phase as { feedback: AnswerResponse }).feedback.correct_answer === opt;
                  const wasWrong = isFeedback && isSelected && !isCorrect;

                  let cls = "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ";
                  if (!isFeedback) {
                    cls += "border-[#30363d] bg-[#0d1117] text-[#e6edf3] hover:border-[#0071e3] hover:bg-[#161b22] cursor-pointer";
                  } else if (isCorrect) {
                    cls += "border-green-600 bg-green-900/20 text-green-400 cursor-default";
                  } else if (wasWrong) {
                    cls += "border-red-600 bg-red-900/20 text-red-400 cursor-default";
                  } else {
                    cls += "border-[#21262d] bg-[#0d1117] text-[#3d444d] cursor-default";
                  }

                  return (
                    <button
                      key={opt}
                      className={cls}
                      onClick={() => phase.kind === "question" && handleAnswer(opt)}
                      disabled={phase.kind === "feedback"}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short answer */}
            {q.type !== "mcq" && phase.kind === "question" && (
              <ShortAnswerInput onSubmit={handleAnswer} />
            )}

            {/* Feedback panel */}
            {phase.kind === "feedback" && (
              <div className={`mt-4 rounded-xl border p-4 ${
                phase.feedback.is_correct
                  ? "border-green-700/40 bg-green-900/10"
                  : "border-red-700/40 bg-red-900/10"
              }`}>
                <p className={`font-semibold ${phase.feedback.is_correct ? "text-green-400" : "text-red-400"}`}>
                  {phase.feedback.is_correct ? "✓ Correct!" : "✗ Not quite"}
                </p>
                {!phase.feedback.is_correct && q.type === "mcq" && (
                  <p className="mt-1 text-sm text-[#8b949e]">
                    Correct answer: <span className="text-[#e6edf3]">{phase.feedback.correct_answer}</span>
                  </p>
                )}
                {phase.feedback.explanation && (
                  <p className="mt-2 text-sm text-[#8b949e] leading-relaxed">{phase.feedback.explanation}</p>
                )}
                <button
                  onClick={handleNext}
                  className="mt-4 rounded-lg bg-[#0071e3] px-5 py-2 text-sm font-medium text-white hover:bg-[#0058b3] transition-colors"
                >
                  {phase.index + 1 < phase.questions.length ? "Next Question →" : "Finish Quiz"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Finished ── */}
        {phase.kind === "finished" && (
          <div className="flex flex-col items-center gap-6 py-10 text-center">
            <ScoreRing score={phase.result.score} />
            <div>
              <h2 className="text-2xl font-bold">Quiz complete</h2>
              <p className="mt-1 text-[#8b949e]">
                {phase.result.correct} / {phase.result.total} correct
              </p>
            </div>
            <div className="w-full rounded-2xl border border-[#21262d] bg-[#161b22] p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8b949e] mb-3">Summary</p>
              <div className="flex justify-around">
                <Stat label="Score" value={`${Math.round(phase.result.score * 100)}%`} />
                <Stat label="Correct" value={String(phase.result.correct)} color="text-green-400" />
                <Stat label="Missed" value={String(phase.result.total - phase.result.correct)} color="text-red-400" />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPhase({ kind: "idle" })}
                className="rounded-lg border border-[#30363d] px-5 py-2 text-sm text-[#8b949e] hover:border-[#0071e3] hover:text-[#e6edf3] transition-colors"
              >
                Retake
              </button>
              <Link
                to="/dashboard"
                className="rounded-lg bg-[#0071e3] px-5 py-2 text-sm font-medium text-white hover:bg-[#0058b3] transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShortAnswerInput({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <textarea
        rows={4}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type your answer…"
        className="w-full resize-none rounded-xl border border-[#30363d] bg-[#161b22] px-4 py-3 text-sm text-[#e6edf3] placeholder-[#3d444d] focus:border-[#0071e3] focus:outline-none transition-colors"
      />
      <button
        disabled={!val.trim()}
        onClick={() => onSubmit(val.trim())}
        className="self-end rounded-lg bg-[#0071e3] px-5 py-2 text-sm font-medium text-white hover:bg-[#0058b3] disabled:opacity-40 transition-colors"
      >
        Submit Answer
      </button>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#0071e3" : "#ef4444";
  return (
    <div className="relative flex items-center justify-center">
      <svg width={110} height={110} className="-rotate-90">
        <circle cx={55} cy={55} r={r} fill="none" stroke="#21262d" strokeWidth={8} />
        <circle
          cx={55} cy={55} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

function Stat({ label, value, color = "text-[#e6edf3]" }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[#8b949e]">{label}</p>
    </div>
  );
}
