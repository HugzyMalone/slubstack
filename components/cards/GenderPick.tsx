"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Card, Gender } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { speak, cardLang } from "@/lib/speech";
import { GENDER_COLORS, cardGender, cardNoun } from "@/lib/german";
import { cn } from "@/lib/utils";
import { meaningOf, useNativeLanguage } from "@/lib/native";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

const GENDERS: Gender[] = ["der", "die", "das"];

export function GenderPick({ card, onResult, onFeedback }: Props) {
  const native = useNativeLanguage();
  const actual = cardGender(card);
  const noun = cardNoun(card);

  const [selected, setSelected] = useState<Gender | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === actual;

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
        Pick the article
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="hanzi text-4xl w-full break-words leading-tight text-fg">{noun}</div>
        {card.pinyin && <div className="mt-1 text-sm text-muted">{card.pinyin}</div>}
        <div className="mt-1 text-sm text-muted">{meaningOf(card, native)}</div>
        <button
          onClick={() => speak(noun, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2">
        {GENDERS.map((g) => {
          const color = GENDER_COLORS[g];
          const isSelected = g === selected;
          const showCorrect = submitted && g === actual;
          const showWrong = submitted && isSelected && !correct;
          return (
            <motion.button
              key={g}
              onClick={() => !submitted && setSelected(g)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "rounded-xl border-2 py-4 text-lg font-semibold transition",
                showCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : showWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                    : isSelected
                      ? ""
                      : "bg-surface",
              )}
              style={
                submitted
                  ? undefined
                  : {
                      borderColor: isSelected ? color : `${color}55`,
                      color,
                      background: isSelected ? `${color}22` : undefined,
                    }
              }
            >
              {g}
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
                Correct — {actual} {noun}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                It&apos;s {actual} {noun}
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
