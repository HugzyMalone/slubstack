"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Card, GermanCase } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { speak, cardLang } from "@/lib/speech";
import { CASE_LABELS, cardGender, stripArticle } from "@/lib/german";
import { cn, shuffle } from "@/lib/utils";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

/** Build a set of 4 plausible article/pronoun options based on the correct form. */
function buildOptions(correct: string): string[] {
  // Common German definite articles across cases and genders.
  const pool = ["der", "die", "das", "den", "dem", "des"];
  const distractors = pool.filter((w) => w.toLowerCase() !== correct.toLowerCase());
  return shuffle([correct, ...shuffle(distractors).slice(0, 3)]);
}

function pickCase(card: Card): GermanCase | undefined {
  if (!card.cases) return undefined;
  const keys = Object.keys(card.cases) as GermanCase[];
  if (keys.length === 0) return undefined;
  // Prefer accusative/dative (the teaching sweet spot) if available, else first.
  const preferred: GermanCase[] = ["acc", "dat", "nom", "gen"];
  for (const k of preferred) if (keys.includes(k)) return k;
  return keys[0];
}

function templateFor(caseKind: GermanCase, noun: string): { before: string; after: string } {
  // Simple generic teaching frames keyed by case.
  switch (caseKind) {
    case "nom":
      return { before: "", after: `${noun} ist hier.` };
    case "acc":
      return { before: "Ich sehe", after: `${noun}.` };
    case "dat":
      return { before: "Ich gebe es", after: `${noun}.` };
    case "gen":
      return { before: "Das Auto", after: `${noun}.` };
  }
}

/** Extract the inflected article (first word) from a `card.cases[caseKind]` value. */
function extractArticle(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[0] ?? full;
}

export function CasePick({ card, onResult, onFeedback }: Props) {
  const caseKind = pickCase(card);
  const answerFull = caseKind && card.cases ? card.cases[caseKind] : undefined;
  const answer = answerFull ? extractArticle(answerFull) : undefined;

  const noun = stripArticle(card.hanzi);
  const frame = caseKind ? templateFor(caseKind, noun) : null;
  const options = useMemo(() => (answer ? buildOptions(answer) : []), [answer]);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correct = selected !== null && answer !== undefined && selected.toLowerCase() === answer.toLowerCase();

  function submit() {
    if (submitted) {
      onResult({ quality: correct ? 4 : 0, correct, firstTry: true });
      return;
    }
    if (!selected) return;
    setSubmitted(true);
    onFeedback?.(correct);
  }

  // Defensive fallback — should never render if session builder is correct.
  if (!caseKind || !answer || !frame) {
    return (
      <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-border bg-surface px-5 py-4 text-center text-sm text-muted">
        This card is missing case data.
      </div>
    );
  }

  const speakText = `${frame.before} ${answer} ${noun}`.trim().replace(/\s+/g, " ");
  const gender = cardGender(card);

  return (
    <>
      <div className="pt-2 flex flex-col items-center gap-1.5">
        <div className="text-xs uppercase tracking-widest text-muted">Pick the article</div>
        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
          {CASE_LABELS[caseKind]}
        </span>
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="text-2xl leading-snug text-fg">
          {frame.before && <span>{frame.before} </span>}
          <span
            className="mx-1 inline-block min-w-[2.5ch] rounded-md border-b-2 border-dashed border-border px-1 text-muted"
            aria-label="blank"
          >
            ___
          </span>
          <span>{frame.after.replace(new RegExp(`^${noun}`), "")}</span>
          <span className="font-semibold"> {noun}</span>
        </div>
        <div className="mt-1 text-xs text-muted">({gender ? `${gender} ` : ""}{noun} — {card.english})</div>
        <button
          onClick={() => speak(speakText, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      <div className="mx-auto mt-3 grid max-w-sm grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt;
          const showCorrect = submitted && opt.toLowerCase() === answer.toLowerCase();
          const showWrong = submitted && isSelected && !correct;
          return (
            <motion.button
              key={opt}
              onClick={() => !submitted && setSelected(opt)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "rounded-xl border px-4 py-3 text-center text-lg font-semibold transition",
                showCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : showWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                    : isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-border bg-surface hover:bg-border/40",
              )}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      <CardFooter
        variant={submitted ? (correct ? "correct" : "wrong") : "idle"}
        feedback={
          submitted ? (
            correct ? (
              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                Correct — {answer} {noun}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                Answer: {answer} {noun}
              </span>
            )
          ) : null
        }
        primary={{
          label: submitted ? "Continue" : "Check",
          onClick: submit,
          disabled: !submitted && !selected,
        }}
      />
    </>
  );
}
