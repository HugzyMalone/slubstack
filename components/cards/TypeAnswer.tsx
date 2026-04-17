"use client";

import { useState } from "react";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { CardFooter } from "./CardShell";

function wordSize(text: string) {
  const len = text.replace(/\s+/g, "").length;
  if (len <= 3) return "text-6xl";
  if (len <= 6) return "text-5xl";
  if (len <= 10) return "text-4xl";
  if (len <= 16) return "text-3xl";
  return "text-2xl";
}

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ");
}

function acceptedAnswers(english: string): string[] {
  return english
    .split(/\/|,/)
    .map((s) => s.replace(/\([^)]*\)/g, "").trim())
    .map(norm)
    .filter(Boolean);
}

export function TypeAnswer({ card, onResult, onFeedback }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [firstTryFailed, setFirstTryFailed] = useState(false);

  const accepted = acceptedAnswers(card.english);
  const correct = accepted.some((a) => norm(value) === a);

  function submit() {
    if (submitted) {
      onResult({ quality: correct ? (firstTryFailed ? 2 : 4) : 0, correct, firstTry: !firstTryFailed });
      return;
    }
    if (correct) {
      setSubmitted(true);
      onFeedback?.(true);
      return;
    }
    if (firstTryFailed) {
      setSubmitted(true);
      onFeedback?.(false);
    } else {
      setFirstTryFailed(true);
      onFeedback?.(false);
    }
  }

  return (
    <>
      <div className="pt-2 text-center text-xs uppercase tracking-widest text-muted">
        Type the meaning
      </div>

      <div className="mx-auto mt-4 max-w-sm rounded-3xl border border-border bg-surface px-5 py-5 text-center">
        <div className={`hanzi ${wordSize(card.hanzi)} w-full break-words leading-tight text-fg`}>{card.hanzi}</div>
        <div className="mt-2 text-base text-muted">{card.pinyin}</div>
      </div>

      {/* Input + inline Check — stays visible above keyboard, no fixed footer before submit */}
      {!submitted && (
        <div className="mx-auto mt-4 max-w-sm space-y-2">
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && value.trim().length > 0) submit(); }}
              placeholder="Type in English…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="go"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-[var(--accent)]"
            />
            <button
              onClick={submit}
              disabled={value.trim().length === 0}
              className="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-150 active:scale-[0.97] disabled:pointer-events-none"
              style={{
                background: value.trim().length === 0 ? "color-mix(in srgb, var(--fg) 10%, transparent)" : "var(--accent)",
                color: value.trim().length === 0 ? "var(--muted)" : "var(--accent-fg)",
              }}
            >
              Check
            </button>
          </div>

          {firstTryFailed && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              Not quite — try again.
            </div>
          )}
        </div>
      )}

      {/* Footer only appears after submission — keyboard will be dismissed by then */}
      {submitted && (
        <CardFooter
          variant={correct ? "correct" : "wrong"}
          feedback={
            correct ? (
              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                Correct — {card.english}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                Answer: {card.english}
              </span>
            )
          }
          primary={{ label: "Continue", onClick: submit }}
        />
      )}
    </>
  );
}
