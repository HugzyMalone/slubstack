"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { PlayBoardProps } from "@/lib/multiplayer/types";

export type TypePassage = { text: string };

const TOTAL_MS = 30_000;

export function PlayBoard({
  question,
  remainingMs,
  feedback,
  onAnswerAction,
}: PlayBoardProps<TypePassage, string>) {
  const target = question.text;
  const reduceMotion = useReducedMotion();

  const [typed, setTyped] = useState("");
  const startRef = useRef<number | null>(null);
  const keystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTyped("");
    startRef.current = null;
    keystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    inputRef.current?.focus();
  }, [question]);

  const liveAccuracy =
    keystrokesRef.current > 0
      ? Math.round((correctKeystrokesRef.current / keystrokesRef.current) * 100)
      : 100;

  const liveWpm = (() => {
    if (startRef.current === null || typed.length === 0) return 0;
    const minutes = (Date.now() - startRef.current) / 60_000;
    if (minutes <= 0) return 0;
    return Math.round(typed.length / 5 / minutes);
  })();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (feedback !== null) return;
    const next = e.target.value;

    if (next.length > typed.length) {
      if (startRef.current === null) startRef.current = Date.now();
      const added = next.slice(typed.length);
      for (let i = 0; i < added.length; i++) {
        const pos = typed.length + i;
        keystrokesRef.current++;
        if (added[i] === target[pos]) correctKeystrokesRef.current++;
      }
    }

    // Classic model: only advance while the prefix matches the target exactly.
    let valid = "";
    for (let i = 0; i < next.length && i < target.length; i++) {
      if (next[i] === target[i]) valid = next.slice(0, i + 1);
      else break;
    }
    setTyped(valid);

    if (valid === target) {
      const minutes = startRef.current ? (Date.now() - startRef.current) / 60_000 : 0;
      const wpm = minutes > 0 ? Math.round(target.length / 5 / minutes) : 0;
      const accuracy =
        keystrokesRef.current > 0
          ? Math.round((correctKeystrokesRef.current / keystrokesRef.current) * 100)
          : 100;
      onAnswerAction(JSON.stringify({ wpm, accuracy }));
    }
  }

  const chars = useMemo(() => target.split(""), [target]);
  const cursor = typed.length;

  const pct = Math.max(0, Math.min(100, (remainingMs / TOTAL_MS) * 100));
  const secs = Math.ceil(remainingMs / 1000);
  const barColor = secs <= 4 ? "#e11d48" : secs <= 8 ? "#f97316" : "var(--game)";

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 pt-2 pb-3" onClick={() => inputRef.current?.focus()}>
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
            {secs}s
          </span>
          <span className="text-xs font-medium text-muted tabular-nums">
            {liveWpm} WPM · {liveAccuracy}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: barColor,
              transition: reduceMotion ? "none" : "width 200ms linear",
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface px-5 py-6">
          <p className="text-xl font-medium leading-relaxed tracking-wide">
            {chars.map((ch, i) => {
              const isCursor = i === cursor;
              const isTyped = i < cursor;
              let className = "text-muted";
              if (isTyped) className = "text-fg";
              if (isCursor) className = "text-fg underline decoration-2 underline-offset-4 decoration-[var(--game)]";
              return (
                <span
                  key={i}
                  className={className}
                  style={isCursor ? { background: "color-mix(in srgb, var(--game) 18%, transparent)" } : undefined}
                >
                  {ch}
                </span>
              );
            })}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        value={typed}
        onChange={handleChange}
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        aria-label="Type the passage"
        className="absolute -z-10 h-px w-px opacity-0"
      />
    </div>
  );
}
