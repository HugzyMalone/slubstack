"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { shuffle, cn } from "@/lib/utils";

type ItemState = "idle" | "selected" | "matched" | "wrong";

type Props = {
  card: Card;
  distractors: Card[];
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

export function MatchPairs({ card, distractors, onResult, onFeedback }: Props) {
  // Shuffle once on mount — stable for the lifetime of this game
  const allCards = useRef(shuffle([card, ...distractors].slice(0, 4))).current;
  const rightOrder = useRef(shuffle([...allCards])).current;

  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [rightSel, setRightSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const [errors, setErrors] = useState(0);
  const [locked, setLocked] = useState(false);
  // Counts wrong attempts per card to force shake re-animation
  const [shakeCount, setShakeCount] = useState<Record<string, number>>({});

  function tryMatch(left: string, right: string, currentErrors: number) {
    if (left === right) {
      onFeedback?.(true);
      setMatched((prev) => {
        const next = new Set([...prev, left]);
        if (next.size === allCards.length) {
          setTimeout(() => {
            onResult({
              quality: currentErrors === 0 ? 4 : 2,
              correct: true,
              firstTry: currentErrors === 0,
            });
          }, 450);
        }
        return next;
      });
      setLeftSel(null);
      setRightSel(null);
    } else {
      onFeedback?.(false);
      const nextErrors = currentErrors + 1;
      setErrors(nextErrors);
      setWrongPair({ left, right });
      setShakeCount((prev) => ({
        ...prev,
        [left]: (prev[left] ?? 0) + 1,
        [right]: (prev[right] ?? 0) + 1,
      }));
      setLocked(true);
      setTimeout(() => {
        setWrongPair(null);
        setLeftSel(null);
        setRightSel(null);
        setLocked(false);
      }, 650);
    }
  }

  function selectLeft(id: string) {
    if (matched.has(id) || locked) return;
    setLeftSel(id);
    if (rightSel) tryMatch(id, rightSel, errors);
  }

  function selectRight(id: string) {
    if (matched.has(id) || locked) return;
    setRightSel(id);
    if (leftSel) tryMatch(leftSel, id, errors);
  }

  function getLeftState(id: string): ItemState {
    if (matched.has(id)) return "matched";
    if (wrongPair?.left === id) return "wrong";
    if (leftSel === id) return "selected";
    return "idle";
  }

  function getRightState(id: string): ItemState {
    if (matched.has(id)) return "matched";
    if (wrongPair?.right === id) return "wrong";
    if (rightSel === id) return "selected";
    return "idle";
  }

  const matchedCount = matched.size;

  return (
    <>
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs uppercase tracking-widest text-muted">Tap to match</span>
        {matchedCount > 0 && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {matchedCount}/{allCards.length} matched
          </span>
        )}
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2.5">
        {/* Spanish words */}
        <div className="flex flex-col gap-2.5">
          {allCards.map((c) => (
            <MatchTile
              key={`${c.id}-${shakeCount[c.id] ?? 0}`}
              label={c.hanzi}
              state={getLeftState(c.id)}
              onClick={() => selectLeft(c.id)}
            />
          ))}
        </div>

        {/* English translations */}
        <div className="flex flex-col gap-2.5">
          {rightOrder.map((c) => (
            <MatchTile
              key={`${c.id}-right-${shakeCount[c.id] ?? 0}`}
              label={c.english.split("/")[0].trim()}
              state={getRightState(c.id)}
              onClick={() => selectRight(c.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function MatchTile({
  label,
  state,
  onClick,
}: {
  label: string;
  state: ItemState;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={state === "idle" || state === "selected" ? { scale: 0.95 } : {}}
      animate={state === "wrong" ? { x: [-5, 5, -5, 5, -2, 2, 0] } : state === "matched" ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: state === "wrong" ? 0.35 : 0.25 }}
      className={cn(
        "min-h-[52px] w-full rounded-xl border px-2.5 py-2 text-sm font-medium leading-snug transition-colors duration-150",
        state === "matched"
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-default"
          : state === "wrong"
            ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
            : state === "selected"
              ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]"
              : "border-border bg-surface text-fg hover:border-[var(--accent)]/50 hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]",
      )}
    >
      {label}
    </motion.button>
  );
}
