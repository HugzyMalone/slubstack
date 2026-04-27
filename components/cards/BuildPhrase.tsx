"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { shuffle } from "@/lib/utils";
import { meaningOf, useNativeLanguage } from "@/lib/native";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

type Tile = { id: string; text: string };

const DECOY_POOL = ["了", "吗", "的", "在", "和", "不", "很", "个", "也", "就"];

/** Let the user tap character tiles to reconstruct the hanzi. */
export function BuildPhrase({ card, onResult, onFeedback }: Props) {
  const native = useNativeLanguage();
  const meaning = meaningOf(card, native);
  const tiles = useMemo<Tile[]>(() => {
    const chars = Array.from(card.hanzi);
    const realTiles: Tile[] = chars.map((ch, i) => ({ id: `r-${i}`, text: ch }));
    const decoyCount = Math.max(1, Math.min(3, 5 - chars.length));
    const usedChars = new Set(chars);
    const availableDecoys = DECOY_POOL.filter((d) => !usedChars.has(d));
    const decoys: Tile[] = shuffle(availableDecoys)
      .slice(0, decoyCount)
      .map((text, i) => ({ id: `d-${i}`, text }));
    return shuffle([...realTiles, ...decoys]);
  }, [card.hanzi]);

  const [picked, setPicked] = useState<Tile[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [firstTryFailed, setFirstTryFailed] = useState(false);

  const assembled = picked.map((t) => t.text).join("");
  const correct = assembled === card.hanzi;
  const canSubmit = assembled.length === card.hanzi.length;

  function pick(t: Tile) {
    if (submitted) return;
    setPicked((p) => (p.some((x) => x.id === t.id) ? p : [...p, t]));
  }

  function unpick(t: Tile) {
    if (submitted) return;
    setPicked((p) => p.filter((x) => x.id !== t.id));
  }

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
    // wrong: let them try again once, then mark as submitted
    if (firstTryFailed) {
      setSubmitted(true);
      onFeedback?.(false);
    } else {
      setFirstTryFailed(true);
      onFeedback?.(false);
      setPicked([]);
    }
  }

  const available = tiles.filter(
    (t) => !picked.some((p) => p.id === t.id),
  );

  return (
    <>
      <div className="pt-2 text-center text-xs uppercase tracking-widest text-muted">
        Build the word
      </div>

      <div className="mt-6">
        <div className="text-center">
          <div className="text-base text-muted">Translate to Mandarin:</div>
          <div className="mt-2 text-3xl font-semibold text-fg">{meaning}</div>
          <div className="mt-1 text-sm text-muted">({card.pinyin})</div>
        </div>

        {/* answer slots */}
        <div className="mt-8 flex min-h-[72px] items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 p-3">
          <AnimatePresence>
            {picked.map((t) => (
              <motion.button
                key={t.id}
                layout
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => unpick(t)}
                className="hanzi rounded-xl border border-border bg-surface px-3 py-2 text-2xl shadow-sm"
              >
                {t.text}
              </motion.button>
            ))}
          </AnimatePresence>
          {picked.length === 0 && (
            <span className="text-sm text-muted">Tap tiles below</span>
          )}
        </div>

        {/* tile bank */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {available.map((t) => (
            <motion.button
              key={t.id}
              layout
              whileTap={{ scale: 0.94 }}
              onClick={() => pick(t)}
              className="hanzi rounded-xl border border-border bg-surface px-4 py-2 text-2xl shadow-sm"
            >
              {t.text}
            </motion.button>
          ))}
        </div>
      </div>

      <CardFooter
        variant={submitted ? (correct ? "correct" : "wrong") : "idle"}
        feedback={
          submitted ? (
            correct ? (
              <span className="font-bold text-success">
                Nice! {card.hanzi} — {meaning}
              </span>
            ) : (
              <span className="font-bold text-game">
                The answer was {card.hanzi}
              </span>
            )
          ) : firstTryFailed ? (
            <span className="text-amber-700 dark:text-amber-300">Not quite — give it another try.</span>
          ) : null
        }
        primary={{
          label: submitted ? "Continue" : "Check",
          onClick: submit,
          disabled: !submitted && !canSubmit,
        }}
      />
    </>
  );
}
