"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { PlayBoardProps } from "@/lib/multiplayer/types";
import type { HoLQuestion } from "@/lib/games/higher-lower/questions";

export type { HoLQuestion } from "@/lib/games/higher-lower/questions";

const TOTAL_MS = 30_000;

export function PlayBoard({
  question,
  remainingMs,
  feedback,
  onAnswerAction,
}: PlayBoardProps<HoLQuestion, 0 | 1>) {
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const [prevQuestion, setPrevQuestion] = useState(question);
  if (question !== prevQuestion) {
    setPrevQuestion(question);
    setPicked(null);
  }

  const inFeedback = feedback !== null;

  function handlePick(a: 0 | 1) {
    if (inFeedback || picked !== null) return;
    setPicked(a);
    onAnswerAction(a);
  }

  const pct = Math.max(0, Math.min(100, (remainingMs / TOTAL_MS) * 100));
  const secs = Math.ceil(remainingMs / 1000);
  const barColor = secs <= 4 ? "#e11d48" : secs <= 8 ? "#f97316" : "var(--game)";

  const reveal = inFeedback;
  const correct = feedback?.correct ?? false;

  function buttonStyle(a: 0 | 1) {
    if (!reveal || picked !== a) {
      return { background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" };
    }
    if (correct) return { background: "#059669", borderColor: "#059669", color: "#fff" };
    return { background: "#e11d48", borderColor: "#e11d48", color: "#fff" };
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden px-4 pt-2 pb-3 select-none"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
            {secs}s
          </span>
          <span className="text-xs font-medium text-muted">{question.metricLabel}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      <div className="shrink-0 text-center mb-3 text-sm font-semibold text-fg">
        {question.caption}
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto w-full content-start">
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col items-center justify-center min-h-[120px]">
          <div className="text-base sm:text-lg font-bold text-fg text-center leading-tight">
            {question.left.label}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums" style={{ color: "var(--game)" }}>
            {question.left.valueLabel}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col items-center justify-center gap-3 min-h-[120px]">
          <div className="text-base sm:text-lg font-bold text-fg text-center leading-tight">
            {question.right.label}
          </div>

          {reveal ? (
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums" style={{ color: correct ? "#059669" : "#e11d48" }}>
              {question.right.valueLabel}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => handlePick(1)}
                disabled={inFeedback || picked !== null}
                className="rounded-xl border px-3 py-3 text-sm font-semibold transition-colors duration-100 active:scale-[0.97] disabled:cursor-default flex items-center justify-center gap-1"
                style={buttonStyle(1)}
              >
                <ArrowUp className="size-4" /> Higher
              </button>
              <button
                onClick={() => handlePick(0)}
                disabled={inFeedback || picked !== null}
                className="rounded-xl border px-3 py-3 text-sm font-semibold transition-colors duration-100 active:scale-[0.97] disabled:cursor-default flex items-center justify-center gap-1"
                style={buttonStyle(0)}
              >
                <ArrowDown className="size-4" /> Lower
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
