"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Card, Tone } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { speak, cardLang } from "@/lib/speech";
import { tonesOf, stripTones, TONE_COLORS, TONE_LABELS, TONE_CONTOURS } from "@/lib/mandarin";
import { cn } from "@/lib/utils";
import { meaningOf, useNativeLanguage } from "@/lib/native";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

const TONE_OPTIONS: Tone[] = [1, 2, 3, 4, 5];

export function TonePick({ card, onResult, onFeedback }: Props) {
  const native = useNativeLanguage();
  const { syllableIdx, expectedTone, hanziChars, pinyinParts } = useMemo(() => {
    const tones: Tone[] = card.tones && card.tones.length > 0 ? card.tones : tonesOf(card.pinyin);
    const parts = card.pinyin.split(/\s+|'/).filter(Boolean);
    const chars = Array.from(card.hanzi);
    const idx = Math.floor(Math.random() * Math.max(1, tones.length));
    return {
      syllableIdx: idx,
      expectedTone: tones[idx] ?? 5,
      hanziChars: chars,
      pinyinParts: parts,
    };
  }, [card]);

  const [selected, setSelected] = useState<Tone | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === expectedTone;

  function submit() {
    if (submitted) {
      onResult({ quality: correct ? 4 : 0, correct, firstTry: true });
      return;
    }
    if (selected === null) return;
    setSubmitted(true);
    onFeedback?.(correct);
  }

  return (
    <>
      <div className="pt-2 text-center text-xs uppercase tracking-widest text-muted">
        Pick the tone
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="flex justify-center gap-1 text-5xl">
          {hanziChars.map((ch, i) => (
            <span key={i} className={cn("leading-tight", i === syllableIdx && "text-fg")}
                  style={i === syllableIdx ? { textShadow: "0 0 0 rgba(0,0,0,0)", filter: "none" } : { opacity: 0.35 }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-2 text-base text-muted">
          {pinyinParts.map((p, i) => (
            <span key={i} className={i === syllableIdx ? "font-semibold text-fg" : ""}>
              {i === syllableIdx ? stripTones(p) : p}
            </span>
          ))}
        </div>
        <div className="mt-1 text-sm text-muted">{meaningOf(card, native)}</div>
        <button
          onClick={() => speak(card.hanzi, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-5 gap-2">
        {TONE_OPTIONS.map((t) => {
          const color = TONE_COLORS[t];
          const isSelected = t === selected;
          const showCorrect = submitted && t === expectedTone;
          const showWrong = submitted && isSelected && !correct;
          return (
            <motion.button
              key={t}
              onClick={() => !submitted && setSelected(t)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "rounded-xl border-2 py-3 text-center transition",
                showCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : showWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
                    : "",
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
              <div className="text-2xl leading-none">{TONE_CONTOURS[t]}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider">{t === 5 ? "neu" : t}</div>
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
                Correct — {TONE_LABELS[expectedTone]}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                {TONE_LABELS[expectedTone]}: {pinyinParts[syllableIdx] ?? card.pinyin}
              </span>
            )
          ) : null
        }
        primary={{
          label: submitted ? "Continue" : "Check",
          onClick: submit,
          disabled: !submitted && selected === null,
        }}
      />
    </>
  );
}
