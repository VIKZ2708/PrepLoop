import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getTodaySyllabus,
  getTodayStudySession,
  patchStudySession,
  type StudySession,
} from "../api/client";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw }))
);

const TRACKS = [
  { id: "sd1", label: "System Design Vol 1" },
  { id: "sd2", label: "System Design Vol 2" },
  { id: "ai",  label: "AI Engineering" },
];

export default function Study() {
  const [params, setParams] = useSearchParams();
  const track = params.get("track") ?? "sd1";
  const [previewOn, setPreviewOn] = useState(false);
  const [notes, setNotes] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const qc = useQueryClient();

  const { data: syllabus } = useQuery({
    queryKey: ["syllabus", track],
    queryFn: () => getTodaySyllabus(track),
  });

  const { data: session } = useQuery<StudySession>({
    queryKey: ["study", track],
    queryFn: () => getTodayStudySession(track),
  });

  const patch = useMutation({
    mutationFn: (data: Parameters<typeof patchStudySession>[1]) =>
      patchStudySession(session!.id, data),
    onSuccess: (updated) => qc.setQueryData(["study", track], updated),
  });

  // Sync notes from server on first load
  useEffect(() => {
    if (session) setNotes(session.notes ?? "");
  }, [session?.id]);

  const saveNotes = useCallback(
    (value: string) => {
      if (!session) return;
      patch.mutate({ notes: value });
    },
    [session, patch]
  );

  const handleNotesChange = (value: string) => {
    setNotes(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNotes(value), 1500);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDiagramChange = useCallback((elements: readonly any[], appState: any) => {
    if (!session) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      patch.mutate({ diagram_json: { elements: [...elements], appState } });
    }, 1500);
  }, [session, patch]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="border-b border-[#21262d] px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-[#8b949e] hover:text-[#e6edf3] transition-colors text-sm">
              ← Dashboard
            </a>
            <span className="text-[#30363d]">/</span>
            <h1 className="text-lg font-semibold">
              <span className="gradient-text">Study</span>
            </h1>
          </div>

          {/* Track selector */}
          <select
            value={track}
            onChange={(e) => setParams({ track: e.target.value })}
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-sm text-[#e6edf3] focus:border-[#0071e3] focus:outline-none"
          >
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Today's topic */}
      {syllabus && (
        <div className="border-b border-[#21262d] bg-[#161b22] px-6 py-3">
          <div className="mx-auto max-w-[1600px]">
            <span className="text-xs text-[#8b949e] uppercase tracking-widest">Today — Day {syllabus.day_no}</span>
            <h2 className="mt-0.5 text-base font-semibold text-[#e6edf3]">{syllabus.title}</h2>
          </div>
        </div>
      )}

      {/* Main: notes + diagram side by side */}
      <div className="mx-auto flex max-w-[1600px] gap-0" style={{ height: "calc(100vh - 120px)" }}>
        {/* Notes pane */}
        <div className="flex flex-1 flex-col border-r border-[#21262d]">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-2">
            <span className="text-xs font-medium text-[#8b949e] uppercase tracking-widest">Notes</span>
            <div className="flex items-center gap-2">
              {patch.isPending && (
                <span className="text-xs text-[#8b949e]">Saving…</span>
              )}
              {patch.isSuccess && !patch.isPending && (
                <span className="text-xs text-green-500">Saved</span>
              )}
              <button
                onClick={() => setPreviewOn(!previewOn)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  previewOn
                    ? "bg-[#0071e3] text-white"
                    : "bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                {previewOn ? "Edit" : "Preview"}
              </button>
            </div>
          </div>

          {previewOn ? (
            <div className="prose prose-invert max-w-none flex-1 overflow-auto px-6 py-4 text-sm leading-relaxed text-[#e6edf3]
              [&_h1]:text-[#e6edf3] [&_h2]:text-[#e6edf3] [&_h3]:text-[#e6edf3]
              [&_code]:rounded [&_code]:bg-[#161b22] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#00c9ff]
              [&_pre]:rounded-lg [&_pre]:bg-[#161b22] [&_pre]:p-4
              [&_a]:text-[#0071e3] [&_blockquote]:border-l-[#0071e3] [&_blockquote]:text-[#8b949e]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes || "_Start writing your notes…_"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={() => saveNotes(notes)}
              placeholder="Write your notes in Markdown…&#10;&#10;## Key concepts&#10;- ..."
              className="flex-1 resize-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed text-[#e6edf3] placeholder-[#3d444d] focus:outline-none"
            />
          )}
        </div>

        {/* Diagram pane */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center border-b border-[#21262d] px-4 py-2">
            <span className="text-xs font-medium text-[#8b949e] uppercase tracking-widest">Whiteboard</span>
          </div>
          <div className="flex-1">
            <Suspense fallback={
              <div className="flex h-full items-center justify-center text-sm text-[#8b949e]">
                Loading whiteboard…
              </div>
            }>
              <Excalidraw
                initialData={
                  session?.diagram_json
                    ? {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        elements: (session.diagram_json as any).elements ?? [],
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        appState: (session.diagram_json as any).appState ?? {},
                      }
                    : undefined
                }
                onChange={handleDiagramChange}
                theme="dark"
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
