"use client";

import { useState, useRef, useEffect } from "react";
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
  // Split on "/" for alternates; strip parentheticals that describe register etc.
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
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const accepted = acceptedAnswers(card.english);
  const correct = accepted.some((a) => norm(value) === a);

  function submit() {
    if (submitted) {
      onResult({
        quality: correct ? (firstTryFailed ? 2 : 4) : 0,
        correct,
        firstTry: !firstTryFailed,
      });
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
      <div className="pt-4 text-center text-xs uppercase tracking-widest text-muted">
        Type the meaning
      </div>

      <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-border bg-surface px-6 py-8 text-center">
        <div className={`hanzi ${wordSize(card.hanzi)} w-full break-words leading-tight text-fg`}>{card.hanzi}</div>
        <div className="mt-3 text-base text-muted">{card.pinyin}</div>
      </div>

      <div className="mx-auto mt-6 max-w-sm">
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim().length > 0) submit();
          }}
          disabled={submitted}
          placeholder="Type in English…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck="false"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none ring-0 placeholder:text-muted focus:border-[var(--accent)]"
        />
      </div>

      <CardFooter
        variant={submitted ? (correct ? "correct" : "wrong") : "idle"}
        feedback={
          submitted ? (
            correct ? (
              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                Correct — {card.english}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                Answer: {card.english}
              </span>
            )
          ) : firstTryFailed ? (
            <span className="text-amber-700 dark:text-amber-300">Not quite — try again.</span>
          ) : null
        }
        primary={{
          label: submitted ? "Continue" : "Check",
          onClick: submit,
          disabled: !submitted && value.trim().length === 0,
        }}
      />
    </>
  );
}
