"use client";

import React from "react";
import { Brush, Timer } from "lucide-react";

type RoundHeaderProps = {
  roundIndex: number;
  totalRounds: number;
  drawerName: string;
  isDrawer: boolean;
  word?: string;
  msRemaining: number;
  roundDurationMs: number;
};

export function RoundHeader({
  roundIndex,
  totalRounds,
  drawerName,
  isDrawer,
  word,
  msRemaining,
  roundDurationMs,
}: RoundHeaderProps): React.JSX.Element {
  const pct = Math.max(0, Math.min(1, msRemaining / roundDurationMs));
  const secs = Math.ceil(msRemaining / 1000);
  const urgent = msRemaining <= 10_000;

  return (
    <div
      className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-bg/95 px-3 pb-2 pt-3 backdrop-blur"
      style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold tracking-wide text-muted">
            Round {roundIndex + 1}/{totalRounds}
          </span>
          <span className="flex items-center gap-1.5 text-fg">
            <Brush className="h-4 w-4 text-[var(--accent)]" />
            <span className="font-semibold">{drawerName}</span>
            <span className="text-muted">drawing</span>
          </span>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${urgent ? "bg-red-500/15 text-red-500" : "bg-surface text-fg"}`}
        >
          <Timer className="h-3.5 w-3.5" />
          {secs}s
        </div>
      </div>

      {isDrawer && word ? (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)]/12 px-3 py-2 text-sm">
          <span className="text-muted">Your word:</span>
          <span className="text-base font-black uppercase tracking-[0.15em] text-[var(--accent)]">
            {word}
          </span>
        </div>
      ) : (
        <div className="text-center text-xs font-medium text-muted">
          Guess the drawing!
        </div>
      )}

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-linear ${urgent ? "bg-red-500" : "bg-[var(--accent)]"}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
