"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useGlobalStore } from "@/lib/globalStore";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { BullMascot } from "@/components/BullMascot";
import { useGameStore } from "@/lib/store";
import { levelFromXp, xpToNextLevel, xpForLevel } from "@/lib/xp";
import type { Language } from "@/lib/content";
import { playFanfare } from "@/lib/sound";
import { tapLight, streak as hapticStreak, levelUp as hapticLevelUp } from "@/lib/haptics";

const LANG_LABEL: Record<Language, string> = {
  mandarin: "Mandarin",
  german: "German",
  spanish: "Spanish",
  "vibe-coding": "Vibe Coding",
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
        playFanfare();
        hapticLevelUp();
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
    <div
      className="w-full rounded-[var(--radius-chunk)] p-4"
      style={{
        background: "var(--surface)",
        border: "2px solid var(--border)",
        boxShadow: "var(--shadow-bouncy)",
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-bold uppercase tracking-wide text-muted">{LANG_LABEL[language]}</span>
        <div className="flex items-center gap-1.5">
          {levelUpVisible && (
            <motion.span
              initial={{ scale: 0, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 12 }}
              className="rounded-full px-2 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider text-white"
              style={{
                background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
                boxShadow: "0 2px 0 color-mix(in srgb, var(--game) 70%, black)",
              }}
            >
              Level Up!
            </motion.span>
          )}
          <span className="font-display text-[14px] font-extrabold tabular-nums" style={{ color: "var(--accent)" }}>
            Lv. {displayLevel}
          </span>
        </div>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--accent) 12%, var(--surface))" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${barWidth}%`,
            background: "linear-gradient(90deg, var(--accent) 0%, var(--game) 100%)",
            boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 50%, transparent)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
      <div className="mt-2 flex justify-between">
        <span className="font-display text-[11px] font-bold text-muted tabular-nums">{xpForLevel(displayLevel)} XP</span>
        <span className="font-display text-[11px] font-bold text-muted tabular-nums">{xpForLevel(displayLevel + 1)} XP</span>
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
  character?: "panda" | "bear" | "bull";
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
    const ticks = [250, 500, 750].map((ms) => setTimeout(tapLight, ms));
    return () => { clearInterval(iv); ticks.forEach(clearTimeout); };
  }, [gained]);

  useEffect(() => {
    if (streakIncremented) hapticStreak();
  }, [streakIncremented]);

  const CharComponent = character === "bear" ? Bear : character === "bull" ? null : Panda;

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
        {CharComponent ? (
          <CharComponent mood="celebrating" fill />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BullMascot size={160} />
          </div>
        )}
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="font-display mt-3 text-3xl font-extrabold tracking-tight flex-shrink-0"
      >
        Lesson complete!
      </motion.h1>

      {/* XP */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 12 }}
        className="mt-3 flex items-baseline gap-1 flex-shrink-0"
      >
        <span
          className="font-display text-6xl font-black tabular-nums"
          style={{
            background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          +{displayXP}
        </span>
        <span className="font-display text-2xl font-extrabold" style={{ color: "var(--accent)" }}>XP</span>
      </motion.div>
      <p className="mt-1 text-[13px] font-semibold text-muted flex-shrink-0">added to {LANG_LABEL[language]}</p>

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
        <div
          className="flex-1 rounded-2xl p-3 text-center"
          style={{
            background: "var(--surface)",
            border: "2px solid var(--border)",
            boxShadow: "0 3px 0 color-mix(in srgb, var(--fg) 8%, transparent)",
          }}
        >
          <div className="flex items-center justify-center"><Target size={18} strokeWidth={2.5} className="text-success" /></div>
          <div className="mt-1 font-display text-lg font-extrabold tabular-nums">{firstTryCorrect}/{total}</div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">First try</div>
        </div>
        {streakIncremented && (
          <div
            className="flex-1 rounded-2xl p-3 text-center"
            style={{
              background: "color-mix(in srgb, #ff8a4c 14%, var(--surface))",
              border: "2px solid color-mix(in srgb, #ff8a4c 36%, transparent)",
              boxShadow: "0 3px 0 color-mix(in srgb, #ff8a4c 32%, transparent)",
            }}
          >
            <div className="flex items-center justify-center"><Flame size={18} strokeWidth={2.5} fill="#ff8a4c" className="text-[#ff6a1c]" /></div>
            <div className="mt-1 font-display text-lg font-extrabold tabular-nums text-[#c2410c]">{streak}d</div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#9a3412]">Streak!</div>
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
          className="block w-full rounded-2xl px-4 py-4 text-center font-display text-[16px] font-extrabold uppercase tracking-wide text-[var(--accent-fg)] transition-transform duration-100 active:translate-y-[2px]"
          style={{
            background: "var(--accent)",
            boxShadow: "0 4px 0 color-mix(in srgb, var(--accent) 70%, black)",
          }}
        >
          Done
        </Link>
      </motion.div>
    </div>
  );
}
