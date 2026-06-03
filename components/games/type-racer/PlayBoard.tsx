"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { PlayBoardProps } from "@/lib/multiplayer/types";

export type TypePassage = { text: string };

// Caps WPM at a superhuman-but-finite ceiling so paste / instant-entry can't
// mint an absurd score and dominate the ranked ladder.
const MAX_WPM = 250;

export function PlayBoard({
  question,
  remainingMs,
  feedback,
  onLiveAction,
}: PlayBoardProps<TypePassage, string>) {
  const target = question.text;
  const reduceMotion = useReducedMotion();

  const [typed, setTyped] = useState("");
  const [finished, setFinished] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [viewportH, setViewportH] = useState<number | null>(null);

  const startRef = useRef<number | null>(null);
  const keystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const typedLenRef = useRef(0);
  const finishedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const liveActionRef = useRef(onLiveAction);
  liveActionRef.current = onLiveAction;

  const wpmFor = (len: number) => {
    if (startRef.current === null || len === 0) return 0;
    const minutes = (Date.now() - startRef.current) / 60_000;
    if (minutes <= 0) return 0;
    return Math.min(MAX_WPM, Math.round(len / 5 / minutes));
  };

  useEffect(() => {
    setTyped("");
    setFinished(false);
    setLiveWpm(0);
    startRef.current = null;
    keystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    typedLenRef.current = 0;
    finishedRef.current = false;
    inputRef.current?.focus();
  }, [question]);

  // Track the visual viewport so the play area shrinks to the space the iOS
  // keyboard leaves visible, instead of the passage sliding behind the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => setViewportH(vv.height);
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  // Live WPM ticks every 250ms while racing — it keeps falling if you stall, so
  // the headline number and the lane position stay honest between keystrokes.
  useEffect(() => {
    const iv = setInterval(() => {
      if (finishedRef.current || startRef.current === null) return;
      const wpm = wpmFor(typedLenRef.current);
      setLiveWpm(wpm);
      liveActionRef.current?.({
        score: wpm,
        progress: typedLenRef.current / target.length,
        finished: false,
      });
    }, 250);
    return () => clearInterval(iv);
  }, [target.length]);

  const liveAccuracy =
    keystrokesRef.current > 0
      ? Math.round((correctKeystrokesRef.current / keystrokesRef.current) * 100)
      : 100;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (feedback !== null || finishedRef.current) return;
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
    typedLenRef.current = valid.length;

    const wpm = wpmFor(valid.length);
    setLiveWpm(wpm);

    if (valid === target) {
      finishedRef.current = true;
      setFinished(true);
      liveActionRef.current?.({ score: wpm, progress: 1, finished: true });
    } else {
      liveActionRef.current?.({ score: wpm, progress: valid.length / target.length, finished: false });
    }
  }

  const chars = useMemo(() => target.split(""), [target]);
  const cursor = typed.length;
  const progressPct = Math.min(100, (typed.length / target.length) * 100);
  const secs = Math.ceil(remainingMs / 1000);
  const timeColor = secs <= 5 ? "#e11d48" : secs <= 12 ? "#f97316" : "var(--muted)";

  return (
    <div
      className="flex h-full flex-col overflow-hidden px-4 pt-2 pb-3"
      style={viewportH ? { height: viewportH } : undefined}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="shrink-0 mb-2">
        <div className="flex items-end justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums leading-none" style={{ color: "var(--game)" }}>
              {liveWpm}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">WPM</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium tabular-nums">
            <span className="text-muted">{liveAccuracy}%</span>
            <span className="font-bold" style={{ color: timeColor }}>{secs}s</span>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              background: "var(--game)",
              transition: reduceMotion ? "none" : "width 120ms linear",
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto pt-3">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface px-5 py-6">
          {finished && (
            <p className="mb-3 text-sm font-bold" style={{ color: "var(--game)" }}>
              Finished — {liveWpm} WPM · {liveAccuracy}%
            </p>
          )}
          <p className="text-xl font-medium leading-relaxed tracking-wide">
            {chars.map((ch, i) => {
              const isCursor = i === cursor && !finished;
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
        onPaste={(e) => e.preventDefault()}
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
