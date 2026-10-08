import { useQuery } from "@tanstack/react-query";
import { getTodaySyllabus, type SyllabusItem } from "../api/client";

const TRACKS: { id: string; label: string; emoji: string; color: string }[] = [
  { id: "sd1", label: "System Design Vol 1", emoji: "🏗️", color: "border-blue-500 bg-blue-50" },
  { id: "sd2", label: "System Design Vol 2", emoji: "⚙️", color: "border-purple-500 bg-purple-50" },
  { id: "ai",  label: "AI Engineering",      emoji: "🤖", color: "border-green-500 bg-green-50" },
];

function TrackCard({ track }: { track: { id: string; label: string; emoji: string; color: string } }) {
  const { data, isLoading, isError } = useQuery<SyllabusItem>({
    queryKey: ["syllabus", track.id],
    queryFn: () => getTodaySyllabus(track.id),
    retry: 1,
  });

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-sm ${track.color}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">{track.emoji}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {track.label}
        </span>
      </div>

      {isLoading && (
        <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
      )}

      {isError && (
        <p className="text-sm text-red-500">Could not load today's topic.</p>
      )}

      {data && (
        <>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Day {data.day_no} — {data.title}
          </h2>
          <p className="text-sm leading-relaxed text-gray-700">{data.description}</p>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            PrepLoop
          </h1>
          <p className="mt-2 text-gray-500">Today's study plan</p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {TRACKS.map((t) => (
            <TrackCard key={t.id} track={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
