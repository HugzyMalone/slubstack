"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

type Bests = { easy: number; medium: number; hard: number };

const DIFF_COLORS: Record<string, string> = { easy: "#10b981", medium: "#f59e0b", hard: "#e11d48" };

export default function MathBlitzStatsPage() {
  const [bests, setBests] = useState<Bests | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("slubstack_mathblitz_best");
      if (s) setBests(JSON.parse(s));
    } catch {}
  }, []);

  const hasAny = bests && (bests.easy > 0 || bests.medium > 0 || bests.hard > 0);

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-4">
      <div className="mb-6">
        <Link href="/stats" className="text-xs text-muted hover:text-fg transition-colors">← Profile</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Math Blitz</h1>
        <p className="text-sm text-muted mt-0.5">Your personal best scores</p>
      </div>

      {!hasAny ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)" }}>
            <Trophy size={22} />
          </div>
          <div className="text-sm font-semibold">No scores yet</div>
          <div className="mt-1 text-xs text-muted">Play Math Blitz to set a personal best</div>
          <Link href="/brain-training/math-blitz"
            className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)" }}>
            Play now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">Personal bests</div>
          <div className="grid grid-cols-3 gap-3">
            {(["easy", "medium", "hard"] as const).map((diff) => {
              const score = bests?.[diff] ?? 0;
              return (
                <div key={diff} className="rounded-2xl border border-border bg-surface p-4 text-center">
                  <div className="text-2xl font-black tabular-nums" style={{ color: score > 0 ? DIFF_COLORS[diff] : "var(--muted)" }}>
                    {score > 0 ? score : "—"}
                  </div>
                  <div className="text-xs text-muted mt-1 capitalize">{diff}</div>
                </div>
              );
            })}
          </div>
          <Link href="/brain-training/math-blitz"
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)" }}>
            Beat your score →
          </Link>
          <p className="text-center text-xs text-muted">Global rankings — coming soon</p>
        </div>
      )}
    </div>
  );
}
