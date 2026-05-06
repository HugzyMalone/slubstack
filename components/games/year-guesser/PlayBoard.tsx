"use client";

import { useState, useEffect } from "react";
import type { PlayBoardProps } from "@/lib/multiplayer/types";

export type YearQuestion = {
  imageSrc: string;
  imageAlt: string;
  caption: string;
  actualYear: number;
  rangeMin: number;
  rangeMax: number;
};

const TOTAL_MS = 30_000;

export function PlayBoard({
  question,
  remainingMs,
  feedback,
  onAnswerAction,
}: PlayBoardProps<YearQuestion, number>) {
  const initial = Math.round((question.rangeMin + question.rangeMax) / 2);
  const [value, setValue] = useState<number>(initial);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setValue(Math.round((question.rangeMin + question.rangeMax) / 2));
    setSubmitted(null);
    setImageLoaded(false);
  }, [question]);

  const inFeedback = feedback !== null;

  function handleSubmit() {
    if (inFeedback || submitted !== null) return;
    setSubmitted(value);
    onAnswerAction(value);
  }

  function handleTyped(raw: string) {
    if (inFeedback || submitted !== null) return;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const clamped = Math.max(question.rangeMin, Math.min(question.rangeMax, n));
    setValue(clamped);
  }

  const pct = Math.max(0, Math.min(100, (remainingMs / TOTAL_MS) * 100));
  const secs = Math.ceil(remainingMs / 1000);
  const barColor = secs <= 4 ? "#e11d48" : secs <= 8 ? "#f97316" : "var(--game)";
  const points = feedback?.points ?? 0;

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 pt-2 pb-3 select-none">
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
            {secs}s
          </span>
          <span className="text-xs font-medium text-muted">When did this happen?</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      <div
        key={question.imageSrc}
        className="shrink-0 relative w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-surface border border-border"
        style={{ height: "min(38svh, 320px)" }}
      >
        {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-border" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={question.imageSrc}
          alt={question.imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: imageLoaded ? 1 : 0, transition: "opacity 0.15s ease" }}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
      </div>

      <div className="mt-2 max-w-md mx-auto w-full text-center text-sm font-semibold leading-tight">
        {question.caption}
      </div>

      <div className="mt-3 flex flex-1 flex-col items-center justify-start max-w-md mx-auto w-full">
        <input
          type="number"
          inputMode="numeric"
          min={question.rangeMin}
          max={question.rangeMax}
          value={value}
          onChange={(e) => handleTyped(e.target.value)}
          disabled={inFeedback || submitted !== null}
          className="w-full text-center text-5xl font-black tabular-nums bg-transparent border-0 outline-none focus:ring-0 disabled:opacity-90"
          style={{ color: inFeedback ? "var(--muted)" : "var(--fg)" }}
        />

        <input
          type="range"
          min={question.rangeMin}
          max={question.rangeMax}
          step={1}
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value, 10))}
          disabled={inFeedback || submitted !== null}
          className="mt-2 w-full accent-[var(--game)]"
          aria-label="Year slider"
        />
        <div className="mt-1 flex w-full justify-between text-xs text-muted tabular-nums">
          <span>{question.rangeMin}</span>
          <span>{question.rangeMax}</span>
        </div>

        {inFeedback ? (
          <div className="mt-3 w-full rounded-2xl border px-4 py-3 text-center text-sm font-bold"
            style={{
              borderColor: points > 0 ? "#059669" : "#e11d48",
              color: points > 0 ? "#059669" : "#e11d48",
              background: "var(--surface)",
            }}
          >
            Actual: <span className="tabular-nums">{question.actualYear}</span>
            <span className="mx-2 opacity-50">·</span>
            +{points} pts
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitted !== null}
            className="mt-3 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "var(--game)" }}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
