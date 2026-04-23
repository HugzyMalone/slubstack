"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { shuffle, cn } from "@/lib/utils";
import { speak, cardLang } from "@/lib/speech";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  distractors: Card[];
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

function hanziSize(text: string) {
  const len = Array.from(text).length;
  if (len <= 2) return "text-6xl";
  if (len <= 4) return "text-5xl";
  if (len <= 6) return "text-4xl";
  return "text-3xl";
}

export function CharacterFromPinyin({ card, distractors, onResult, onFeedback }: Props) {
  const options = useMemo(
    () => shuffle([card, ...distractors].slice(0, 4)),
    [card, distractors],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correct = selected === card.id;

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
        Pick the character
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="text-3xl font-semibold text-fg leading-tight">{card.pinyin}</div>
        <div className="mt-1 text-sm text-muted">{card.english}</div>
        <button
          onClick={() => speak(card.hanzi, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      <div className="mx-auto mt-3 grid max-w-sm grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = opt.id === selected;
          const showCorrect = submitted && opt.id === card.id;
          const showWrong = submitted && isSelected && !correct;
          return (
            <motion.button
              key={opt.id}
              onClick={() => !submitted && setSelected(opt.id)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "rounded-xl border py-6 text-center transition",
                showCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : showWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                    : isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-border bg-surface hover:bg-border/40",
              )}
            >
              <span className={`hanzi ${hanziSize(opt.hanzi)}`}>{opt.hanzi}</span>
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
                Correct — {card.hanzi} ({card.pinyin})
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                Answer: {card.hanzi}
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
