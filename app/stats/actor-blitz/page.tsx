"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ActorBest } from "@/components/trivia/ActorBlitz";

export default function ActorBlitzStatsPage() {
  const [best, setBest] = useState<ActorBest | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("slubstack_actorblitz_best");
      if (s) setBest(JSON.parse(s));
    } catch {}
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-4">
      <div className="mb-6">
        <Link href="/stats" className="text-xs text-muted hover:text-fg transition-colors">← Profile</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Actor Blitz</h1>
        <p className="text-sm text-muted mt-0.5">Your personal best scores</p>
      </div>

      {!best ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)" }}>
            <span className="text-xl">🎬</span>
          </div>
          <div className="text-sm font-semibold">No score yet</div>
          <div className="mt-1 text-xs text-muted">Play Actor Blitz to set a personal best</div>
          <Link href="/trivia/actors"
            className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--game)" }}>
            Play now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">Personal best</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Correct", value: `${best.correct ?? best.score}/${best.total}` },
              { label: "Accuracy", value: `${best.accuracy}%` },
              { label: "Best streak", value: String(best.bestStreak) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-border bg-surface p-4 text-center">
                <div className="text-xl font-bold" style={{ color: "var(--game)" }}>{value}</div>
                <div className="text-xs text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
          <Link href="/trivia/actors"
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
            style={{ background: "var(--game)" }}>
            Beat your score →
          </Link>
          <p className="text-center text-xs text-muted">Global rankings — coming soon</p>
        </div>
      )}
    </div>
  );
}
