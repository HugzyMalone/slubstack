"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useGlobalStore } from "@/lib/globalStore";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { useGameStore } from "@/lib/store";
import { levelFromXp, xpToNextLevel, xpForLevel } from "@/lib/xp";
import type { Language } from "@/lib/content";

const LANG_LABEL: Record<Language, string> = {
  mandarin: "Mandarin",
  german: "German",
  spanish: "Spanish",
};

function LevelBar({ gained, language }: { gained: number; language: Language }) {
  const currentXp = useGameStore((s) => s.xp);
  const xpBefore = Math.max(0, currentXp - gained);
  const levelBefore = levelFromXp(xpBefore);
  const levelAfter = levelFromXp(currentXp);
  const leveledUp = levelAfter > levelBefore;

  const { progress: progBefore } = xpToNextLevel(xpBefore);
  const { progress: progAfter } = xpToNextLevel(currentXp);

  const [displayLevel, setDisplayLevel] = useState(levelBefore);
  const [barWidth, setBarWidth] = useState(progBefore * 100);
  const [levelUpVisible, setLevelUpVisible] = useState(false);

  useEffect(() => {
    if (leveledUp) {
      const t1 = setTimeout(() => setBarWidth(100), 700);
      const t2 = setTimeout(() => {
        setDisplayLevel(levelAfter);
        setBarWidth(0);
        setLevelUpVisible(true);
      }, 1400);
      const t3 = setTimeout(() => setBarWidth(progAfter * 100), 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      const t = setTimeout(() => setBarWidth(progAfter * 100), 700);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted">{LANG_LABEL[language]}</span>
        <div className="flex items-center gap-1.5">
          {levelUpVisible && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ background: "var(--accent)" }}
            >
              Level Up!
            </motion.span>
          )}
          <span className="text-xs font-bold tabular-nums" style={{ color: "var(--accent)" }}>
            Lv. {displayLevel}
          </span>
        </div>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--accent) 15%, var(--surface))" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${barWidth}%`,
            background: "var(--accent)",
            transitionTimingFunction: "ease-out",
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px] text-muted tabular-nums">{xpForLevel(displayLevel)} XP</span>
        <span className="text-[10px] text-muted tabular-nums">{xpForLevel(displayLevel + 1)} XP</span>
      </div>
    </div>
  );
}

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
  language = "mandarin",
  streakIncremented = false,
  character = "panda",
}: Props) {
  const streak = useGlobalStore((s) => s.streak);
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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
    <div
      className="mx-auto flex max-w-md flex-col items-center px-6 text-center overflow-hidden"
      style={{
        height: "calc(100dvh - 52px - env(safe-area-inset-top, 0px))",
        paddingTop: "2vh",
        paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 16px), 20px)",
      }}
    >
      {/* Character */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="relative w-full flex-shrink-0"
        style={{ height: "22vh", maxHeight: 180 }}
      >
        <CharComponent mood="celebrating" fill />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-3 text-2xl font-bold tracking-tight flex-shrink-0"
      >
        Lesson complete!
      </motion.h1>

      {/* XP */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 12 }}
        className="mt-2 flex items-baseline gap-1 flex-shrink-0"
      >
        <span className="text-5xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
          +{displayXP}
        </span>
        <span className="text-xl font-bold" style={{ color: "var(--accent)" }}>XP</span>
      </motion.div>
      <p className="mt-0.5 text-sm text-muted flex-shrink-0">added to {LANG_LABEL[language]}</p>

      {/* Push remaining content to bottom */}
      <div className="flex-1" />

      {/* Level bar */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="w-full flex-shrink-0"
      >
        <LevelBar gained={gained} language={language} />
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 flex w-full gap-3 flex-shrink-0"
      >
        <div className="flex-1 rounded-2xl border border-border bg-surface p-3 text-center">
          <div className="flex items-center justify-center"><Target size={16} className="text-emerald-500" /></div>
          <div className="mt-1 text-base font-semibold tabular-nums">{firstTryCorrect}/{total}</div>
          <div className="text-xs text-muted">First try</div>
        </div>
        {streakIncremented && (
          <div className="flex-1 rounded-2xl border border-border bg-surface p-3 text-center">
            <div className="flex items-center justify-center"><Flame size={16} className="text-orange-500" /></div>
            <div className="mt-1 text-base font-semibold tabular-nums">{streak}d</div>
            <div className="text-xs text-muted">Streak!</div>
          </div>
        )}
      </motion.div>

      {/* Done button */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-3 w-full flex-shrink-0"
      >
        <Link
          href={exitHref}
          className="block w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent-fg)] active:scale-[0.98] transition-transform"
        >
          Done
        </Link>
      </motion.div>
    </div>
  );
}
