"use client";

import { useState, useEffect } from "react";
import type { PlayBoardProps } from "@/lib/multiplayer/types";

export type YearQuestion = {
  caption: string;
  prompt: string;
  actualYear: number;
  options: number[];
  answerIndex: number;
};

const TOTAL_MS = 30_000;

export function PlayBoard({
  question,
  remainingMs,
  feedback,
  onAnswerAction,
}: PlayBoardProps<YearQuestion, number>) {
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [question]);

  const inFeedback = feedback !== null;

  function handlePick(i: number) {
    if (inFeedback || picked !== null) return;
    setPicked(i);
    onAnswerAction(i);
  }

  const pct = Math.max(0, Math.min(100, (remainingMs / TOTAL_MS) * 100));
  const secs = Math.ceil(remainingMs / 1000);
  const barColor = secs <= 4 ? "#e11d48" : secs <= 8 ? "#f97316" : "var(--game)";

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 pt-2 pb-3 select-none">
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
            {secs}s
          </span>
          <span className="text-xs font-medium text-muted">{question.caption}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      <div
        className="shrink-0 relative w-full max-w-md mx-auto rounded-2xl bg-surface border border-border flex items-center justify-center px-5 py-6"
        style={{ minHeight: "min(38svh, 320px)" }}
      >
        <div className="text-center text-xl font-bold leading-snug">
          {question.prompt}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 flex-1 content-start max-w-md mx-auto w-full">
        {question.options.map((option, i) => {
          const isPicked = picked === i;
          const isAnswer = i === question.answerIndex;
          const showCorrect = inFeedback && isAnswer;
          const showWrong = inFeedback && isPicked && !feedback?.correct;

          let bg = "var(--surface)";
          let borderColor = "var(--border)";
          let textColor = "var(--fg)";

          if (showWrong) {
            bg = "#e11d48";
            borderColor = "#e11d48";
            textColor = "#fff";
          } else if (showCorrect && isPicked && feedback?.correct) {
            bg = "#059669";
            borderColor = "#059669";
            textColor = "#fff";
          } else if (showCorrect) {
            borderColor = "#059669";
            textColor = "#059669";
          }

          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={inFeedback || picked !== null}
              className="rounded-xl border px-3 py-3.5 text-base font-bold tabular-nums transition-colors duration-100 active:scale-[0.97] disabled:cursor-default leading-tight"
              style={{ background: bg, borderColor, color: textColor }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
