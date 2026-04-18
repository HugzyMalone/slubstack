"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useGlobalStore } from "@/lib/globalStore";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import type { Language } from "@/lib/content";

const LANG_LABEL: Record<Language, string> = {
  mandarin: "Mandarin",
  german: "German",
  spanish: "Spanish",
};

type Props = {
  gained: number;
  firstTryCorrect: number;
  total: number;
  exitHref?: string;
  reviewHref?: string;
  language?: Language;
  streakIncremented?: boolean;
  character?: "panda" | "bear";
};

export function LessonCompleteScreen({
  gained,
  firstTryCorrect,
  total,
  exitHref = "/",
  reviewHref = "/review",
  language = "mandarin",
  streakIncremented = false,
  character = "panda",
}: Props) {
  const streak = useGlobalStore((s) => s.streak);
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.round(gained / 30));
    const iv = setInterval(() => {
      cur = Math.min(gained, cur + step);
      setDisplayXP(cur);
      if (cur >= gained) clearInterval(iv);
    }, 20);
    return () => clearInterval(iv);
  }, [gained]);

  const CharComponent = character === "bear" ? Bear : Panda;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="relative w-full"
        style={{ height: "32vh", maxHeight: 280 }}
      >
        <CharComponent mood="celebrating" fill />
      </motion.div>

      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-4 text-3xl font-bold tracking-tight"
      >
        Lesson complete!
      </motion.h1>

      {/* XP hero */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 12 }}
        className="mt-5 flex flex-col items-center"
      >
        <div className="flex items-baseline gap-1">
          <span className="text-6xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
            +{displayXP}
          </span>
          <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>XP</span>
        </div>
        <p className="mt-1 text-sm text-muted">added to {LANG_LABEL[language]}</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex w-full gap-3"
      >
        <div className="flex-1 rounded-2xl border border-border bg-surface p-3 text-center">
          <div className="flex items-center justify-center"><Target size={18} className="text-emerald-500" /></div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{firstTryCorrect}/{total}</div>
          <div className="text-xs text-muted">First try</div>
        </div>
        {streakIncremented && (
          <div className="flex-1 rounded-2xl border border-border bg-surface p-3 text-center">
            <div className="flex items-center justify-center"><Flame size={18} className="text-orange-500" /></div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{streak}d</div>
            <div className="text-xs text-muted">Streak!</div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-6 flex w-full flex-col gap-2"
      >
        <Link
          href={exitHref}
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent-fg)] active:scale-[0.98]"
        >
          Done
        </Link>
      </motion.div>
    </div>
  );
}
