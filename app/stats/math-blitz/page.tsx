"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

type Bests = { easy: number; medium: number; hard: number };
type LBEntry = { username: string; avatar: string | null; score: number; correct: number };

const DIFF_COLORS: Record<string, string> = { easy: "#10b981", medium: "#f59e0b", hard: "#e11d48" };
const DIFF_LABEL: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const GRAD = "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)";

function Avatar({ avatar, username }: { avatar: string | null; username: string }) {
  if (avatar && (avatar.startsWith("http") || avatar.startsWith("/"))) {
    return (
      <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={username} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm"
      style={{ background: "color-mix(in srgb, var(--accent) 15%, var(--surface))" }}>
      {avatar || username[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function MathBlitzStatsPage() {
  const [bests, setBests] = useState<Bests | null>(null);
  const [diff, setDiff] = useState<"easy" | "medium" | "hard">("medium");
  const [leaderboard, setLeaderboard] = useState<LBEntry[] | null>(null);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("slubstack_mathblitz_best");
      if (s) setBests(JSON.parse(s));
    } catch {}
  }, []);

  useEffect(() => {
    setLbLoading(true);
    fetch(`/api/scores/math-blitz?difficulty=${diff}`)
      .then((r) => r.json())
      .then(({ leaderboard }) => setLeaderboard(leaderboard ?? []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLbLoading(false));
  }, [diff]);

  const hasAny = bests && (bests.easy > 0 || bests.medium > 0 || bests.hard > 0);

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-4">
      <div className="mb-6">
        <Link href="/stats" className="text-xs text-muted hover:text-fg transition-colors">← Profile</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Math Blitz</h1>
        <p className="text-sm text-muted mt-0.5">Your scores & global rankings</p>
      </div>

      {/* Personal bests */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Personal bests</div>
        {!hasAny ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center">
            <div className="text-sm text-muted">No scores yet — play to set a personal best</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {(["easy", "medium", "hard"] as const).map((d) => {
              const score = bests?.[d] ?? 0;
              return (
                <div key={d} className="rounded-2xl border border-border bg-surface p-4 text-center">
                  <div className="text-2xl font-black tabular-nums" style={{ color: score > 0 ? DIFF_COLORS[d] : "var(--muted)" }}>
                    {score > 0 ? score : "—"}
                  </div>
                  <div className="text-xs text-muted mt-1">{DIFF_LABEL[d]}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Link href="/brain-training/math-blitz"
        className="mb-6 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
        style={{ background: GRAD }}>
        <Trophy size={15} /> {hasAny ? "Beat your score →" : "Play Math Blitz →"}
      </Link>

      {/* Global leaderboard */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">Global rankings</div>
          <div className="flex gap-1">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button key={d} onClick={() => setDiff(d)}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: diff === d ? DIFF_COLORS[d] : "var(--border)",
                  color: diff === d ? "#fff" : "var(--muted)",
                }}>
                {DIFF_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        {lbLoading ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">Loading…</div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <div className="text-sm text-muted">No scores yet for {DIFF_LABEL[diff]}</div>
            <div className="mt-1 text-xs text-muted">Be the first to get on the board!</div>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                <span className="w-5 text-center text-xs font-bold tabular-nums"
                  style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--muted)" }}>
                  {i + 1}
                </span>
                <Avatar avatar={entry.avatar} username={entry.username} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{entry.username}</div>
                  <div className="text-xs text-muted">{entry.correct} correct</div>
                </div>
                <div className="text-lg font-black tabular-nums" style={{ color: DIFF_COLORS[diff] }}>
                  {entry.score}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
