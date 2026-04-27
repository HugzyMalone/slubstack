"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { shuffle, cn } from "@/lib/utils";
import { speak, cardLang } from "@/lib/speech";
import { cardGender, GENDER_COLORS } from "@/lib/german";
import { meaningOf, useNativeLanguage } from "@/lib/native";
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
  distractors: Card[];
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

export function MultipleChoice({ card, distractors, onResult, onFeedback }: Props) {
  const native = useNativeLanguage();
  const options = useMemo(
    () => shuffle([card, ...distractors].slice(0, 4)),
    [card, distractors],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correct = selected === card.id;
  const gender = card.id.startsWith("de-") ? cardGender(card) : undefined;

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
    onFeedback?.(correct);
  }

  return (
    <>
      <div className="pt-2 text-center text-xs uppercase tracking-widest text-muted">
        Choose the meaning
      </div>

      <div
        className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-3 text-center relative"
        style={gender ? { borderLeft: `3px solid ${GENDER_COLORS[gender]}` } : undefined}
      >
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

      <div className="mx-auto mt-2 grid max-w-sm grid-cols-1 gap-2">
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
                  ? "border-success bg-success-soft text-fg"
                  : showWrong
                    ? "border-game bg-game-soft text-fg"
                    : isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-border bg-surface hover:bg-border/40",
              )}
            >
              {meaningOf(opt, native)}
            </motion.button>
          );
        })}
      </div>

      <CardFooter
        variant={submitted ? (correct ? "correct" : "wrong") : "idle"}
        feedback={
          submitted ? (
            correct ? (
              <span className="font-bold text-success">
                Correct! {card.hanzi} — {meaningOf(card, native)}
              </span>
            ) : (
              <span className="font-bold text-game">
                {card.hanzi} means &quot;{meaningOf(card, native)}&quot;
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
