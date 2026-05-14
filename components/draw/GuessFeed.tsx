"use client";

import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";

export type GuessEntry = {
  slot: number;
  displayName: string;
  text: string;
  correct: boolean;
  tsMs: number;
};

type GuessFeedProps = {
  entries: ReadonlyArray<GuessEntry>;
};

export function GuessFeed({ entries }: GuessFeedProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-border bg-surface px-3 py-2"
    >
      {entries.length === 0 ? (
        <div className="flex h-full items-center justify-center py-6 text-xs text-muted">
          Guesses will appear here…
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((e, i) => (
            <li
              key={`${e.tsMs}-${e.slot}-${i}`}
              className={`flex items-start gap-2 rounded-xl px-2 py-1.5 text-sm ${e.correct ? "bg-emerald-500/12" : ""}`}
            >
              <span className="shrink-0 text-xs font-bold text-muted">
                {e.displayName}
              </span>
              <span
                className={`flex-1 break-words ${e.correct ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-fg"}`}
              >
                {e.correct ? "guessed correctly!" : e.text}
              </span>
              {e.correct ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
