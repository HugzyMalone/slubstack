"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Sparkles, Target } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { Panda } from "@/components/Panda";

type Props = {
  gained: number;
  firstTryCorrect: number;
  total: number;
};

export function LessonCompleteScreen({ gained, firstTryCorrect, total }: Props) {
  const streak = useGameStore((s) => s.streak);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
      >
        <Panda mood="celebrating" size={140} />
      </motion.div>

      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-4 text-3xl font-bold tracking-tight"
      >
        Lesson complete!
      </motion.h1>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-2 text-muted"
      >
        加油! Keep it going.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-8 grid w-full grid-cols-3 gap-3"
      >
        <Stat
          icon={<Sparkles size={18} className="text-amber-500" />}
          label="XP earned"
          value={`+${gained}`}
        />
        <Stat
          icon={<Target size={18} className="text-emerald-500" />}
          label="First try"
          value={`${firstTryCorrect}/${total}`}
        />
        <Stat
          icon={<Flame size={18} className="text-orange-500" />}
          label="Streak"
          value={`${streak}`}
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex w-full flex-col gap-2"
      >
        <Link
          href="/"
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent-fg)] active:scale-[0.98]"
        >
          Done
        </Link>
        <Link
          href="/review"
          className="w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-medium hover:bg-border/40"
        >
          Review more cards
        </Link>
      </motion.div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center justify-center">{icon}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
