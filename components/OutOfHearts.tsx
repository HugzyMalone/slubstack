"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartCrack } from "lucide-react";
import { heartsStore, useHeartsStore, HEART_REGEN_MS } from "@/lib/heartsStore";
import { screenEnterVariants } from "@/lib/motion";

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  exitHref?: string;
  reviewHref?: string;
};

export function OutOfHearts({ exitHref = "/", reviewHref = "/review" }: Props) {
  const lastRegenAt = useHeartsStore((s) => s.lastRegenAt);
  const [remaining, setRemaining] = useState(() => Math.max(0, HEART_REGEN_MS - (Date.now() - lastRegenAt)));

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, HEART_REGEN_MS - (Date.now() - heartsStore.getState().lastRegenAt));
      setRemaining(ms);
      if (ms === 0) heartsStore.getState().applyRegen();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastRegenAt]);

  return (
    <motion.div
      variants={screenEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "color-mix(in srgb, var(--bg) 92%, transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.05 }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, var(--game) 0%, var(--accent) 100%)",
          boxShadow: "0 6px 0 color-mix(in srgb, var(--game) 70%, black)",
        }}
      >
        <HeartCrack size={40} strokeWidth={2.4} className="text-white" fill="white" />
      </motion.div>

      <h1 className="font-display text-3xl font-extrabold tracking-tight">Out of hearts</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        You&apos;ve burned through your five. Practise something free, or wait it out.
      </p>

      <div
        className="mt-6 rounded-2xl px-5 py-3 font-display text-base font-extrabold tabular-nums"
        style={{
          background: "var(--surface)",
          border: "2px solid var(--border)",
          boxShadow: "var(--shadow-bouncy)",
        }}
      >
        Next heart in {formatCountdown(remaining)}
      </div>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
        <Link
          href={reviewHref}
          className="block w-full rounded-2xl px-4 py-4 text-center font-display text-[15px] font-extrabold uppercase tracking-wide text-[var(--accent-fg)] transition-transform duration-100 active:translate-y-[2px]"
          style={{
            background: "var(--accent)",
            boxShadow: "0 4px 0 color-mix(in srgb, var(--accent) 70%, black)",
          }}
        >
          Practise review (free)
        </Link>
        <Link
          href={exitHref}
          className="block w-full rounded-2xl px-4 py-3 text-center text-sm font-bold text-fg/70 hover:text-fg transition-colors"
        >
          Back to home
        </Link>
      </div>
    </motion.div>
  );
}
