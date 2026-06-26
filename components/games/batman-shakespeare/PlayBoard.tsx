"use client";

import { useState } from "react";
import type { PlayBoardProps } from "@/lib/multiplayer/types";
import type { BatShakeQuestion, BatShakeSource } from "@/lib/games/batman-shakespeare/questions";

export type { BatShakeQuestion, BatShakeSource } from "@/lib/games/batman-shakespeare/questions";

const TOTAL_MS = 30_000;

export function PlayBoard({
  question,
  remainingMs,
  feedback,
  onAnswerAction,
}: PlayBoardProps<BatShakeQuestion, BatShakeSource>) {
  const [picked, setPicked] = useState<BatShakeSource | null>(null);
  const [prevQuestion, setPrevQuestion] = useState(question);
  if (question !== prevQuestion) {
    setPrevQuestion(question);
    setPicked(null);
  }

  const inFeedback = feedback !== null;

  function handlePick(a: BatShakeSource) {
    if (inFeedback || picked !== null) return;
    setPicked(a);
    onAnswerAction(a);
  }

  const pct = Math.max(0, Math.min(100, (remainingMs / TOTAL_MS) * 100));
  const secs = Math.ceil(remainingMs / 1000);
  const barColor = secs <= 4 ? "#e11d48" : secs <= 8 ? "#f97316" : "var(--game)";

  const reveal = inFeedback;
  const correct = feedback?.correct ?? false;

  function buttonStyle(a: BatShakeSource) {
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
          <span className="text-xs font-medium text-muted">Who said it?</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md sm:max-w-2xl mx-auto w-full gap-6">
        <div className="rounded-2xl border border-border bg-surface px-5 py-6 sm:px-8 sm:py-8 w-full">
          <div className="text-lg sm:text-2xl font-semibold text-fg text-center leading-snug">
            &ldquo;{question.quote}&rdquo;
          </div>
          {reveal && (
            <div
              className="mt-4 text-center text-xs sm:text-sm font-medium"
              style={{ color: correct ? "#059669" : "#e11d48" }}
            >
              {question.attribution}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => handlePick("batman")}
            disabled={inFeedback || picked !== null}
            className="rounded-xl border px-3 py-4 text-base font-semibold transition-colors duration-100 active:scale-[0.97] disabled:cursor-default"
            style={buttonStyle("batman")}
          >
            Batman
          </button>
          <button
            onClick={() => handlePick("shakespeare")}
            disabled={inFeedback || picked !== null}
            className="rounded-xl border px-3 py-4 text-base font-semibold transition-colors duration-100 active:scale-[0.97] disabled:cursor-default"
            style={buttonStyle("shakespeare")}
          >
            Shakespeare
          </button>
        </div>
      </div>
    </div>
  );
}
