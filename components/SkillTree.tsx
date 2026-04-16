"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Star } from "lucide-react";
import { ALL_UNITS } from "@/lib/content";
import { useGameStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Panda } from "@/components/Panda";
import { useHydrated } from "@/lib/hooks";

export function SkillTree() {
  const hydrated = useHydrated();
  const completedUnits = useGameStore((s) => s.completedUnits);
  const seenCardIds = useGameStore((s) => s.seenCardIds);

  const unlockedIndex = hydrated ? Math.min(ALL_UNITS.length - 1, completedUnits.length) : 0;

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-2">
      <header className="flex items-center gap-4 px-2 py-4">
        <Panda mood="idle" size={72} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">你好!</h1>
          <p className="text-sm text-muted">
            {hydrated && seenCardIds.length > 0
              ? `${seenCardIds.length} words in your head — keep going.`
              : "Learn Mandarin one word at a time."}
          </p>
        </div>
      </header>

      <ol className="relative mt-2 space-y-6 pl-8">
        <div
          className="absolute left-4 top-4 bottom-4 w-[2px] rounded-full"
          style={{ background: "var(--border)" }}
        />
        {ALL_UNITS.map((unit, i) => {
          const state: "locked" | "active" | "done" =
            !hydrated
              ? i === 0
                ? "active"
                : "locked"
              : completedUnits.includes(unit.id)
                ? "done"
                : i === unlockedIndex
                  ? "active"
                  : "locked";

          return (
            <motion.li
              key={unit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative"
            >
              <Node state={state} index={i} />
              {state === "locked" ? (
                <div
                  className="ml-4 flex cursor-not-allowed items-center gap-3 rounded-2xl border border-border bg-surface/60 p-4 opacity-70"
                  aria-disabled
                >
                  <span className="text-2xl">{unit.emoji}</span>
                  <div>
                    <div className="font-medium">{unit.title}</div>
                    <div className="text-xs text-muted">{unit.subtitle}</div>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/learn/${unit.id}`}
                  className={cn(
                    "ml-4 flex items-center gap-3 rounded-2xl border bg-surface p-4 transition active:scale-[0.99]",
                    state === "active"
                      ? "border-[var(--accent)] shadow-[0_0_0_2px_var(--accent-soft)]"
                      : "border-border hover:bg-border/40",
                  )}
                >
                  <span className="text-2xl">{unit.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium">{unit.title}</div>
                    <div className="text-xs text-muted">{unit.subtitle}</div>
                  </div>
                  {state === "done" && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Done
                    </span>
                  )}
                  {state === "active" && (
                    <span className="text-xs font-medium text-[var(--accent)]">Start</span>
                  )}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function Node({ state, index }: { state: "locked" | "active" | "done"; index: number }) {
  const color =
    state === "done"
      ? "bg-emerald-500 text-white"
      : state === "active"
        ? "bg-[var(--accent)] text-[var(--accent-fg)]"
        : "bg-border text-muted";
  const Icon =
    state === "done" ? Star : state === "locked" ? Lock : null;
  return (
    <span
      className={cn(
        "absolute -left-8 top-3 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-bg",
        color,
      )}
    >
      {Icon ? <Icon size={15} /> : <span className="text-xs font-bold">{index + 1}</span>}
    </span>
  );
}
