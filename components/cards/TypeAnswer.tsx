"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { speak, cardLang } from "@/lib/speech";
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

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10", eleven: "11", twelve: "12", thirteen: "13",
  fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17",
  eighteen: "18", nineteen: "19", twenty: "20",
  "one hundred": "100", "one thousand": "1000", "ten thousand": "10000",
};
const DIGIT_WORDS: Record<string, string> = Object.fromEntries(
  Object.entries(NUMBER_WORDS).map(([w, d]) => [d, w])
);

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[^\p{L}\d\s]/gu, "").replace(/\s+/g, " ");
}

function acceptedAnswers(english: string): string[] {
  const base = english
    .split(/\/|,/)
    .map((s) => s.replace(/\([^)]*\)/g, "").trim())
    .map(norm)
    .filter(Boolean);
  const extras: string[] = [];
  for (const a of base) {
    if (NUMBER_WORDS[a]) extras.push(NUMBER_WORDS[a]);
    else if (DIGIT_WORDS[a]) extras.push(norm(DIGIT_WORDS[a]));
  }
  return [...new Set([...base, ...extras])];
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

      <div className="mx-auto mt-4 max-w-sm rounded-3xl border border-border bg-surface px-5 py-5 text-center relative">
        <div className={`hanzi ${wordSize(card.hanzi)} w-full break-words leading-tight text-fg`}>{card.hanzi}</div>
        <div className="mt-2 text-base text-muted">{card.pinyin}</div>
        <button
          onClick={() => speak(card.hanzi, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
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
