"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { speak, cardLang } from "@/lib/speech";
import { MEASURE_POOL } from "@/lib/mandarin";
import { shuffle, cn } from "@/lib/utils";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

export function MeasureWordPick({ card, onResult, onFeedback }: Props) {
  const correctMw = card.measureWord ?? "个";

  const options = useMemo(() => {
    const distractors = shuffle(MEASURE_POOL.filter((m) => m !== correctMw)).slice(0, 3);
    return shuffle([correctMw, ...distractors]);
  }, [correctMw]);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === correctMw;

  function submit() {
    if (submitted) {
      onResult({ quality: correct ? 4 : 0, correct, firstTry: true });
      return;
    }
    if (!selected) return;
    setSubmitted(true);
    onFeedback?.(correct);
  }

  return (
    <>
      <div className="pt-2 text-center text-xs uppercase tracking-widest text-muted">
        Pick the measure word
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="text-xs uppercase tracking-widest text-muted">一 ___ {card.hanzi}</div>
        <div className="hanzi mt-2 text-5xl w-full break-words leading-tight text-fg">{card.hanzi}</div>
        <div className="mt-1 text-sm text-muted">{card.pinyin}</div>
        <div className="mt-1 text-sm text-muted">{card.english}</div>
        <button
          onClick={() => speak(`一${correctMw}${card.hanzi}`, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-4 gap-2">
        {options.map((m) => {
          const isSelected = m === selected;
          const showCorrect = submitted && m === correctMw;
          const showWrong = submitted && isSelected && !correct;
          return (
            <motion.button
              key={m}
              onClick={() => !submitted && setSelected(m)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "rounded-xl border py-4 text-2xl font-semibold transition",
                showCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : showWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                    : isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-border bg-surface hover:bg-border/40",
              )}
            >
              {m}
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
                Correct — 一{correctMw}{card.hanzi}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                Answer: 一{correctMw}{card.hanzi}
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
