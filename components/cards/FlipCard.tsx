"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
};

function wordSize(text: string) {
  const len = text.replace(/\s+/g, "").length;
  if (len <= 3) return "text-6xl";
  if (len <= 6) return "text-5xl";
  if (len <= 10) return "text-4xl";
  if (len <= 16) return "text-3xl";
  return "text-2xl";
}

export function FlipCard({ card, onResult }: Props) {
  const [flipped, setFlipped] = useState(false);

  function submit(quality: Quality) {
    onResult({ quality, correct: quality >= 3, firstTry: true });
  }

  return (
    <>
      <div className="pt-4 text-center text-xs uppercase tracking-widest text-muted">
        Flashcard
      </div>
      <p className="mb-6 mt-1 text-center text-sm text-muted">
        How well do you know this?
      </p>

      <div
        onClick={() => setFlipped((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped((v) => !v)}
        className="mx-auto block w-full max-w-sm cursor-pointer select-none rounded-3xl border border-border bg-surface px-6 py-10 text-center shadow-sm active:scale-[0.99]"
        style={{ minHeight: 260, perspective: 1200 }}
        aria-label="Tap to flip"
      >
        <motion.div
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformStyle: "preserve-3d", position: "relative", minHeight: 200 }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-2"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className={`hanzi ${wordSize(card.hanzi)} w-full break-words leading-tight text-fg`}>
              {card.hanzi}
            </div>
            <div className="mt-4 text-base text-muted">{card.pinyin}</div>
            <div className="mt-8 text-xs text-muted">Tap to reveal</div>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-2"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="text-3xl font-semibold text-fg">{card.english}</div>
            {card.note && (
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                {card.note}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="mx-auto max-w-xl">
          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] hover:opacity-90 active:scale-[0.98]"
            >
              Reveal
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <RateBtn label="Again" color="#e11d48" onClick={() => submit(0)} />
              <RateBtn label="Hard" color="#f97316" onClick={() => submit(2)} />
              <RateBtn label="Good" color="#10b981" onClick={() => submit(4)} />
              <RateBtn label="Easy" color="#0284c7" onClick={() => submit(5)} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RateBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-surface px-2 py-3 text-xs font-semibold active:scale-[0.97]"
      style={{ color }}
    >
      {label}
    </button>
  );
}
