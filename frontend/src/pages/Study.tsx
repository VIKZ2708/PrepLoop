import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";
import {
  getTodaySyllabus,
  getTodayStudySession,
  submitTeachBack,
  type TeachBackResponse,
  type TopicContent,
} from "../api/client";

// ── Mermaid init ──────────────────────────────────────────────────────────────
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#0071e3",
    primaryTextColor: "#e6edf3",
    primaryBorderColor: "#30363d",
    lineColor: "#8b949e",
    secondaryColor: "#161b22",
    tertiaryColor: "#0d1117",
    background: "#0d1117",
    mainBkg: "#161b22",
    nodeBorder: "#30363d",
    clusterBkg: "#0d1117",
    titleColor: "#e6edf3",
    edgeLabelBackground: "#161b22",
    fontFamily: "Inter, system-ui, sans-serif",
  },
});

async function getTopicContent(id: number): Promise<TopicContent | null> {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
  const res = await fetch(`${API_URL}/content/${id}`);
  if (!res.ok) return null;
  return res.json();
}

// ── Mermaid diagram component ─────────────────────────────────────────────────
function MermaidDiagram({ code, id }: { code: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !code) return;
    const el = ref.current;
    el.innerHTML = "";
    mermaid.render(`mermaid-${id}`, code)
      .then(({ svg }) => { el.innerHTML = svg; })
      .catch(() => setError(true));
  }, [code, id]);

  if (error) return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-xs text-[#8b949e]">
      Diagram unavailable
    </div>
  );
  return <div ref={ref} className="w-full overflow-x-auto [&_svg]:max-w-full [&_svg]:mx-auto [&_svg]:block" />;
}

// ── Section components ────────────────────────────────────────────────────────

function OverviewSection({ content, syllabus }: { content: TopicContent; syllabus: { day_no: number; title: string; description: string } }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0071e3]/30 bg-gradient-to-br from-[#0071e3]/10 to-[#0d1117] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0071e3] mb-2">Day {syllabus.day_no} — Overview</p>
        <h2 className="text-2xl font-extrabold text-[#e6edf3] mb-3">{syllabus.title}</h2>
        <p className="text-[#8b949e] leading-relaxed">{content.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { count: content.key_concepts?.length ?? 0, label: "Key Concepts", icon: "💡" },
          { count: content.diagram_sections?.length ?? 0, label: "Diagrams", icon: "🏗️" },
          { count: content.code_examples?.length ?? 0, label: "Code Examples", icon: "⚡" },
          { count: content.interview_questions?.length ?? 0, label: "Interview Q&As", icon: "🎯" },
        ].map(({ count, label, icon }) => (
          <div key={label} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xl font-bold text-[#e6edf3]">{count}</p>
            <p className="text-xs text-[#8b949e]">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">What you'll learn</p>
        <p className="text-sm text-[#8b949e] leading-relaxed">{syllabus.description}</p>
      </div>
    </div>
  );
}

function ConceptsSection({ concepts }: { concepts: string[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-[#e6edf3]">Key Concepts</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {concepts.map((c, i) => {
          const colon = c.indexOf(":");
          const title = colon > 0 ? c.slice(0, colon) : `Concept ${i + 1}`;
          const body = colon > 0 ? c.slice(colon + 1).trim() : c;
          return (
            <div key={i} className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-[#0071e3]/50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071e3]/15 text-xs font-bold text-[#0071e3]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#e6edf3] mb-1">{title}</p>
                  <p className="text-xs text-[#8b949e] leading-relaxed">{body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiagramsSection({ diagrams }: { diagrams: Array<{ title: string; description: string; mermaid: string }> }) {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-bold text-[#e6edf3]">Architecture Diagrams</h3>
      {diagrams.map((d, i) => (
        <div key={i} className="rounded-2xl border border-[#21262d] bg-[#161b22] overflow-hidden">
          <div className="border-b border-[#21262d] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0071e3] mb-0.5">Diagram {i + 1}</p>
            <p className="text-base font-bold text-[#e6edf3]">{d.title}</p>
            <p className="text-xs text-[#8b949e] mt-1">{d.description}</p>
          </div>
          <div className="p-5 bg-[#0d1117]">
            <MermaidDiagram code={d.mermaid} id={`${i}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CodeSection({ examples }: { examples: Array<{ title: string; description: string; language: string; code: string }> }) {
  const [active, setActive] = useState(0);
  const ex = examples[active];
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#e6edf3]">Code Implementations</h3>
      <div className="flex gap-2 flex-wrap">
        {examples.map((e, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${active === i ? "bg-[#0071e3] text-white" : "border border-[#30363d] text-[#8b949e] hover:border-[#0071e3] hover:text-[#e6edf3]"}`}
          >
            {e.title}
          </button>
        ))}
      </div>
      {ex && (
        <div className="rounded-2xl border border-[#21262d] overflow-hidden">
          <div className="border-b border-[#21262d] bg-[#161b22] px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#e6edf3]">{ex.title}</p>
              <p className="text-xs text-[#8b949e] mt-0.5">{ex.description}</p>
            </div>
            <span className="rounded-full bg-[#0071e3]/10 px-2.5 py-1 text-xs font-bold text-[#0071e3] uppercase">{ex.language}</span>
          </div>
          <SyntaxHighlighter
            language={ex.language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: 0, background: "#0d1117", fontSize: "13px", lineHeight: "1.6" }}
            showLineNumbers
            lineNumberStyle={{ color: "#3d444d", minWidth: "2.5em" }}
          >
            {ex.code}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}

function DeepDiveSection({ notes }: { notes: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#e6edf3]">Deep Dive</h3>
      <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-6 prose prose-invert max-w-none
        [&_h2]:text-[#e6edf3] [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-[#21262d] [&_h2]:pb-2
        [&_h3]:text-[#0071e3] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
        [&_p]:text-[#8b949e] [&_p]:text-sm [&_p]:leading-relaxed
        [&_li]:text-[#8b949e] [&_li]:text-sm [&_li]:leading-relaxed
        [&_strong]:text-[#e6edf3] [&_strong]:font-semibold
        [&_code]:bg-[#0d1117] [&_code]:text-[#00c9ff] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs
        [&_pre]:bg-[#0d1117] [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto
        [&_blockquote]:border-l-2 [&_blockquote]:border-[#0071e3] [&_blockquote]:pl-4 [&_blockquote]:text-[#8b949e]
        [&_hr]:border-[#21262d]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {notes.replace(/\\n/g, "\n")}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function InterviewSection({ questions }: { questions: Array<{ question: string; answer: string }> }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setRevealed(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#e6edf3]">Interview Questions</h3>
        <span className="text-xs text-[#8b949e]">{revealed.size}/{questions.length} revealed</span>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-[#0071e3]/5 transition-colors"
          >
            <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071e3]/15 text-xs font-bold text-[#0071e3] mt-0.5">
              Q{i + 1}
            </span>
            <p className="flex-1 text-sm font-medium text-[#e6edf3] leading-relaxed">{q.question}</p>
            <span className="shrink-0 text-[#8b949e] text-lg leading-none mt-0.5">
              {revealed.has(i) ? "▲" : "▼"}
            </span>
          </button>
          {revealed.has(i) && (
            <div className="border-t border-[#21262d] bg-[#0d1117] px-5 py-4">
              <p className="text-sm text-[#8b949e] leading-relaxed">{q.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MistakesSection({ mistakes }: { mistakes: string[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-[#e6edf3]">Common Mistakes</h3>
      {mistakes.map((m, i) => {
        const colon = m.indexOf(":");
        const title = colon > 0 ? m.slice(0, colon) : `Mistake ${i + 1}`;
        const body = colon > 0 ? m.slice(colon + 1).trim() : m;
        return (
          <div key={i} className="rounded-xl border border-red-800/30 bg-red-900/5 p-4 flex gap-3">
            <span className="shrink-0 text-red-400 text-lg leading-none mt-0.5">⚠</span>
            <div>
              <p className="text-sm font-semibold text-red-300 mb-1">{title}</p>
              <p className="text-xs text-[#8b949e] leading-relaxed">{body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeachBackSection({ sessionId, topicTitle }: { sessionId: number; topicTitle: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<TeachBackResponse | null>(null);

  const mutation = useMutation({
    mutationFn: (explanation: string) =>
      submitTeachBack(sessionId, explanation, topicTitle),
    onSuccess: setResult,
  });

  if (result) return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#e6edf3]">AI Critique</h3>
      <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-2">Critique</p>
        <p className="text-sm text-[#e6edf3] leading-relaxed">{result.critique}</p>
      </div>
      <div className="rounded-xl border border-[#0071e3]/30 bg-[#0071e3]/5 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0071e3] mb-3">Follow-up Questions</p>
        <ol className="space-y-2">
          {result.follow_up_questions.map((q, i) => (
            <li key={i} className="text-sm text-[#e6edf3]">{i + 1}. {q}</li>
          ))}
        </ol>
      </div>
      <button onClick={() => { setResult(null); setText(""); }} className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors">
        Try again →
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#e6edf3]">Teach It Back</h3>
      <p className="text-sm text-[#8b949e]">Explain {topicTitle} as if you're in a senior engineering interview. An AI will critique your answer and ask follow-ups.</p>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start explaining the concept in your own words..."
        className="w-full resize-none rounded-xl border border-[#30363d] bg-[#161b22] px-4 py-3 text-sm text-[#e6edf3] placeholder-[#3d444d] focus:border-[#0071e3] focus:outline-none transition-colors"
      />
      <button
        onClick={() => mutation.mutate(text)}
        disabled={!text.trim() || mutation.isPending}
        className="rounded-xl bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0058b3] disabled:opacity-40 transition-colors"
      >
        {mutation.isPending ? "Getting critique…" : "Get AI critique →"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TRACKS = [
  { id: "sd1", label: "System Design Vol 1" },
  { id: "sd2", label: "System Design Vol 2" },
  { id: "ai",  label: "AI Engineering" },
];

const SECTIONS = [
  { id: "overview",   label: "Overview",   icon: "📋" },
  { id: "concepts",   label: "Concepts",   icon: "💡" },
  { id: "diagrams",   label: "Diagrams",   icon: "🏗️" },
  { id: "code",       label: "Code",       icon: "⚡" },
  { id: "deep-dive",  label: "Deep Dive",  icon: "📖" },
  { id: "interview",  label: "Interview",  icon: "🎯" },
  { id: "mistakes",   label: "Pitfalls",   icon: "⚠️" },
  { id: "teach-back", label: "Teach Back", icon: "🧠" },
];

export default function Study() {
  const [params, setParams] = useSearchParams();
  const track = params.get("track") ?? "sd1";
  const [activeSection, setActiveSection] = useState("overview");

  const { data: syllabus } = useQuery({
    queryKey: ["syllabus", track],
    queryFn: () => getTodaySyllabus(track),
  });

  const { data: session } = useQuery({
    queryKey: ["study", track],
    queryFn: () => getTodayStudySession(track),
  });

  const { data: content } = useQuery<TopicContent | null>({
    queryKey: ["content", syllabus?.id],
    queryFn: () => (syllabus ? getTopicContent(syllabus.id) : null),
    enabled: !!syllabus,
    staleTime: 3_600_000,
  });

  const visibleSections = SECTIONS.filter(s => {
    if (s.id === "diagrams" && !content?.diagram_sections?.length) return false;
    if (s.id === "code" && !content?.code_examples?.length) return false;
    return true;
  });

  const renderSection = () => {
    if (!content || !syllabus) return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent mx-auto" />
          <p className="text-sm text-[#8b949e]">Loading study material…</p>
        </div>
      </div>
    );

    switch (activeSection) {
      case "overview":
        return <OverviewSection content={content} syllabus={syllabus} />;
      case "concepts":
        return <ConceptsSection concepts={content.key_concepts ?? []} />;
      case "diagrams":
        return <DiagramsSection diagrams={(content.diagram_sections as any[]) ?? []} />;
      case "code":
        return <CodeSection examples={(content.code_examples as any[]) ?? []} />;
      case "deep-dive":
        return <DeepDiveSection notes={content.starter_notes ?? ""} />;
      case "interview":
        return <InterviewSection questions={(content.interview_questions as any[]) ?? []} />;
      case "mistakes":
        return <MistakesSection mistakes={content.common_mistakes ?? []} />;
      case "teach-back":
        return session
          ? <TeachBackSection sessionId={session.id} topicTitle={syllabus.title} />
          : <p className="text-sm text-[#8b949e]">Loading session…</p>;
      default:
        return null;
    }
  };

  const currentIdx = visibleSections.findIndex(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Top nav */}
      <div className="sticky top-0 z-20 border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-[#8b949e] hover:text-[#e6edf3] text-sm transition-colors">← Dashboard</Link>
            <span className="text-[#30363d]">/</span>
            <span className="gradient-text font-semibold text-sm">Study</span>
          </div>
          <select
            value={track}
            onChange={(e) => { setParams({ track: e.target.value }); setActiveSection("overview"); }}
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs text-[#e6edf3] focus:border-[#0071e3] focus:outline-none"
          >
            {TRACKS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Topic header */}
      {syllabus && (
        <div className="border-b border-[#21262d] bg-[#161b22] px-6 py-4">
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0071e3]">Day {syllabus.day_no}</p>
            <h1 className="mt-0.5 text-xl font-extrabold text-[#e6edf3]">{syllabus.title}</h1>
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="sticky top-[57px] z-10 border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {visibleSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeSection === s.id
                    ? "bg-[#0071e3] text-white"
                    : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                }`}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {renderSection()}

        {/* Prev / Next */}
        <div className="mt-10 flex items-center justify-between border-t border-[#21262d] pt-6">
          <button
            onClick={() => setActiveSection(visibleSections[currentIdx - 1]?.id ?? activeSection)}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 rounded-xl border border-[#30363d] px-4 py-2 text-sm text-[#8b949e] hover:border-[#0071e3] hover:text-[#e6edf3] disabled:opacity-30 transition-colors"
          >
            ← {visibleSections[currentIdx - 1]?.label ?? ""}
          </button>
          <span className="text-xs text-[#3d444d]">{currentIdx + 1} / {visibleSections.length}</span>
          <button
            onClick={() => setActiveSection(visibleSections[currentIdx + 1]?.id ?? activeSection)}
            disabled={currentIdx === visibleSections.length - 1}
            className="flex items-center gap-2 rounded-xl border border-[#30363d] px-4 py-2 text-sm text-[#8b949e] hover:border-[#0071e3] hover:text-[#e6edf3] disabled:opacity-30 transition-colors"
          >
            {visibleSections[currentIdx + 1]?.label ?? ""} →
          </button>
        </div>
      </div>
    </div>
  );
}
