"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Card, GermanCase } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { langFromCardId } from "@/lib/content";
import { speak, cardLang } from "@/lib/speech";
import { CASE_LABELS, cardNoun, cardGender, GENDER_COLORS } from "@/lib/german";
import { shuffle, cn } from "@/lib/utils";
import { meaningOf, useNativeLanguage } from "@/lib/native";
import { Tappable } from "@/components/Tappable";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

const CASE_TEMPLATES: Record<GermanCase, (noun: string) => string> = {
  nom: (n) => `___ ${n} ist hier.`,
  acc: (n) => `Ich sehe ___ ${n}.`,
  dat: (n) => `Ich gebe ___ ${n} ein Buch.`,
  gen: (n) => `Das Buch ___ ${n}.`,
};

const ARTICLE_POOL = ["der", "die", "das", "den", "dem", "des"];

export function CasePick({ card, onResult, onFeedback }: Props) {
  const native = useNativeLanguage();
  const noun = cardNoun(card);
  const gender = cardGender(card);

  const { chosenCase, correctArticle, options } = useMemo(() => {
    const cases = card.cases ?? {};
    const caseKeys = Object.keys(cases) as GermanCase[];
    const pick = caseKeys[Math.floor(Math.random() * caseKeys.length)] ?? "nom";
    const phrase = cases[pick] ?? "";
    const article = phrase.trim().split(/\s+/)[0] ?? "der";
    const distractors = shuffle(ARTICLE_POOL.filter((a) => a !== article)).slice(0, 3);
    return {
      chosenCase: pick,
      correctArticle: article,
      options: shuffle([article, ...distractors]),
    };
  }, [card]);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === correctArticle;

  const sentence = CASE_TEMPLATES[chosenCase](noun);

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

      <div
        className="mx-auto mt-2 flex items-center gap-2 w-fit rounded-full border px-3 py-1 text-xs font-medium"
        style={{
          borderColor: gender ? `${GENDER_COLORS[gender]}80` : "var(--border)",
          color: gender ? GENDER_COLORS[gender] : "var(--muted)",
        }}
      >
        <span>{CASE_LABELS[chosenCase]}</span>
        {gender && <span className="opacity-70">· {gender}</span>}
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="hanzi text-2xl w-full break-words leading-snug text-fg">
          <Tappable text={sentence} card={card} lang={langFromCardId(card.id)} />
        </div>
        <div className="mt-2 text-sm text-muted">{meaningOf(card, native)}</div>
        <button
          onClick={() => speak(sentence.replace("___", correctArticle), cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = opt === selected;
          const showCorrect = submitted && opt === correctArticle;
          const showWrong = submitted && isSelected && !correct;
          return (
            <motion.button
              key={opt}
              onClick={() => !submitted && setSelected(opt)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "rounded-xl border px-4 py-3 text-base font-semibold transition",
                showCorrect
                  ? "border-success bg-success-soft text-fg"
                  : showWrong
                    ? "border-game bg-game-soft text-fg"
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
              <span className="font-bold text-success">
                Correct — {sentence.replace("___", correctArticle)}
              </span>
            ) : (
              <span className="font-bold text-game">
                Answer: {correctArticle}
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
