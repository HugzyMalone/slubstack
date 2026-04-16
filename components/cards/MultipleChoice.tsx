"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { shuffle, cn } from "@/lib/utils";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  distractors: Card[];
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
};

export function MultipleChoice({ card, distractors, onResult }: Props) {
  const options = useMemo(
    () => shuffle([card, ...distractors].slice(0, 4)),
    [card, distractors],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correct = selected === card.id;

  function submit() {
    if (submitted) {
      onResult({
        quality: correct ? 4 : 0,
        correct,
        firstTry: true,
      });
      return;
    }
    if (!selected) return;
    setSubmitted(true);
  }

  return (
    <>
      <div className="pt-4 text-center text-xs uppercase tracking-widest text-muted">
        Choose the meaning
      </div>

      <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-border bg-surface px-6 py-8 text-center">
        <div className="hanzi text-6xl leading-none text-fg">{card.hanzi}</div>
        <div className="mt-3 text-base text-muted">{card.pinyin}</div>
      </div>

      <div className="mx-auto mt-6 grid max-w-sm grid-cols-1 gap-2">
        {options.map((opt) => {
          const isSelected = opt.id === selected;
          const showCorrect = submitted && opt.id === card.id;
          const showWrong = submitted && isSelected && !correct;
          return (
            <motion.button
              key={opt.id}
              onClick={() => !submitted && setSelected(opt.id)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                showCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : showWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                    : isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-border bg-surface hover:bg-border/40",
              )}
            >
              {opt.english}
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
                Correct! {card.hanzi} — {card.english}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                {card.hanzi} means &quot;{card.english}&quot;
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
