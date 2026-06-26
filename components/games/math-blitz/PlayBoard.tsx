"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PlayBoardProps } from "@/lib/multiplayer/types";
import type { Question } from "@/lib/math-blitz/engine";

const PAD_ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["−", "0", "⌫"],
];

const TOTAL_SECS = 30;

function TimerRing({ secs, total }: { secs: number; total: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - secs / total);
  const color = secs <= 5 ? "#e11d48" : secs <= 10 ? "#f59e0b" : "var(--accent)";
  return (
    <svg width="78" height="78" viewBox="0 0 78 78" className="select-none">
      <circle cx="39" cy="39" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx="39"
        cy="39"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "39px 39px",
          transition: "stroke-dashoffset 0.95s linear, stroke 0.4s",
        }}
      />
      <text
        x="39"
        y="44"
        textAnchor="middle"
        style={{ fontSize: 18, fontWeight: 700, fill: color, fontVariantNumeric: "tabular-nums", transition: "fill 0.4s" }}
      >
        {secs}
      </text>
    </svg>
  );
}

export function PlayBoard({ question, remainingMs, feedback, onAnswerAction }: PlayBoardProps<Question, number>) {
  const [answer, setAnswer] = useState("");
  const [prevQuestion, setPrevQuestion] = useState(question);
  if (question !== prevQuestion) {
    setPrevQuestion(question);
    setAnswer("");
  }
  const secsLeft = Math.ceil(remainingMs / 1000);

  const fb: "correct" | "wrong" | null = feedback?.correct ? "correct" : feedback ? "wrong" : null;

  const feedbackBg =
    fb === "correct"
      ? "color-mix(in srgb, #10b981 12%, var(--surface))"
      : fb === "wrong"
        ? "color-mix(in srgb, #e11d48 12%, var(--surface))"
        : "var(--surface)";

  const inFeedback = fb !== null;
  const submitDisabled = !answer.trim() || inFeedback;

  function padPress(key: string) {
    if (inFeedback) return;
    if (key === "⌫") setAnswer((a) => a.slice(0, -1));
    else if (key === "−") setAnswer((a) => (a.startsWith("-") ? a.slice(1) : a.length ? "-" + a : "-"));
    else setAnswer((a) => (a.length < 4 ? a + key : a));
  }

  function submitAnswer() {
    if (submitDisabled) return;
    const parsed = parseInt(answer.trim(), 10);
    if (isNaN(parsed)) return;
    onAnswerAction(parsed);
    setAnswer("");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex justify-center py-1 shrink-0">
        <TimerRing secs={secsLeft} total={TOTAL_SECS} />
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          key={question.display}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="w-full rounded-3xl px-6 py-5 text-center transition-colors duration-150"
          style={{ background: feedbackBg, border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)" }}
        >
          <div className="text-4xl font-black tracking-tight select-none">
            {question.display} =
          </div>
          <div
            className="mt-4 text-3xl font-black tabular-nums min-h-[2.5rem]"
            style={{ color: "var(--accent)" }}
          >
            {answer || <span className="text-muted/30">?</span>}
          </div>
        </motion.div>
      </div>

      <div
        className="shrink-0 px-4 pt-2 space-y-1.5"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {PAD_ROWS.map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-1.5">
            {row.map((key) => {
              const isSpecial = key === "⌫" || key === "−";
              return (
                <motion.button
                  key={key}
                  onPointerDown={(e) => { e.preventDefault(); padPress(key); }}
                  variants={{
                    rest: { y: 0, scale: 1, boxShadow: "0 4px 0 color-mix(in srgb, var(--fg) 14%, transparent)" },
                    pressed: { y: 4, scale: 0.97, boxShadow: "0 0px 0 color-mix(in srgb, var(--fg) 14%, transparent)" },
                  }}
                  initial="rest"
                  whileTap="pressed"
                  transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
                  className="rounded-2xl py-3 text-lg font-bold select-none"
                  style={{
                    background: isSpecial
                      ? "color-mix(in srgb, var(--fg) 9%, var(--surface))"
                      : "color-mix(in srgb, var(--fg) 4%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--fg) 12%, transparent)",
                    color: key === "⌫" ? "var(--muted)" : "var(--fg)",
                  }}
                >
                  {key}
                </motion.button>
              );
            })}
          </div>
        ))}
        <motion.button
          onPointerDown={(e) => { e.preventDefault(); submitAnswer(); }}
          disabled={submitDisabled}
          variants={{
            rest: { y: 0, scale: 1, boxShadow: "0 4px 0 color-mix(in srgb, var(--accent) 45%, #0006)" },
            pressed: { y: 4, scale: 0.98, boxShadow: "0 0px 0 color-mix(in srgb, var(--accent) 45%, #0006)" },
          }}
          initial="rest"
          whileTap="pressed"
          transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
          className="w-full rounded-2xl py-3 text-base font-bold text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          Check ✓
        </motion.button>
      </div>
    </div>
  );
}
