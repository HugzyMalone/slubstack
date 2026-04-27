"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

type Game = "wordle" | "connections" | "math-blitz";
type Score = {
  userId: string;
  isMe: boolean;
  username: string;
  avatar: string | null;
  attempts?: number;
  solved?: boolean;
  mistakes?: number;
  score?: number;
};

function isUrl(v: string | null | undefined): v is string {
  return !!v && (v.startsWith("http") || v.startsWith("/") || v.startsWith("data:"));
}

function MetricLabel({ game, s }: { game: Game; s: Score }) {
  if (game === "wordle") return <>{s.solved ? `${s.attempts}/6` : "X/6"}</>;
  if (game === "connections") return <>{s.solved ? `${4 - (s.mistakes ?? 0)}/4` : "Failed"}</>;
  return <>{s.score ?? 0}</>;
}

type Props = {
  game: Game;
  date?: string;
  title?: string;
};

export function FriendsCompare({ game, date, title = "Friends today" }: Props) {
  const [scores, setScores] = useState<Score[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ game });
    if (date) params.set("date", date);
    fetch(`/api/friends/today?${params}`)
      .then((r) => (r.ok ? r.json() : { scores: [] }))
      .then((d) => setScores(d.scores ?? []))
      .catch(() => setScores([]));
  }, [game, date]);

  if (scores === null) return null;
  if (scores.length === 0) {
    return (
      <div
        className="rounded-2xl px-4 py-3 text-center"
        style={{
          background: "var(--surface)",
          border: "2px dashed var(--border-hi)",
        }}
      >
        <Users size={16} strokeWidth={2.5} className="mx-auto mb-1 text-muted" />
        <p className="text-[12px] font-semibold text-muted">
          <Link href="/stats/friends" className="text-[var(--accent)] underline-offset-2 hover:underline">
            Add friends
          </Link>{" "}
          to race their daily score
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: "var(--surface)",
        border: "2px solid var(--border)",
        boxShadow: "0 3px 0 color-mix(in srgb, var(--fg) 8%, transparent)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Users size={14} strokeWidth={2.5} className="text-[var(--accent)]" />
        <h3 className="font-display text-[12px] font-extrabold uppercase tracking-wide text-muted">{title}</h3>
      </div>
      <div className="space-y-1.5">
        {scores.slice(0, 6).map((s, i) => (
          <div
            key={`${s.userId}-${i}`}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5"
            style={
              s.isMe
                ? {
                    background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--game-soft) 100%)",
                    border: "1.5px solid color-mix(in srgb, var(--accent) 28%, transparent)",
                  }
                : { border: "1.5px solid transparent" }
            }
          >
            <span className="font-display w-5 text-[12px] font-extrabold tabular-nums text-muted">
              {i + 1}
            </span>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden text-[10px] font-bold"
              style={{
                background: isUrl(s.avatar) ? undefined : "color-mix(in srgb, var(--accent) 14%, var(--surface))",
                border: "1.5px solid color-mix(in srgb, var(--fg) 10%, transparent)",
              }}
            >
              {isUrl(s.avatar) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                s.username.slice(0, 1).toUpperCase()
              )}
            </div>
            <span className={`flex-1 truncate text-[13px] ${s.isMe ? "font-extrabold" : "font-semibold"}`}>
              {s.isMe ? "You" : s.username}
            </span>
            <span className="font-display text-[14px] font-extrabold tabular-nums" style={{ color: s.isMe ? "var(--accent)" : "var(--fg)" }}>
              <MetricLabel game={game} s={s} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
