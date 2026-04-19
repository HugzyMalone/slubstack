"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { type Unit } from "@/lib/content";
import { useGameStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { useHydrated } from "@/lib/hooks";

type Props = {
  units: Unit[];
  basePath: string;
  greeting: string;
  subGreeting?: string;
  character?: "panda" | "bear";
};

export function SkillTree({ units, basePath, greeting, subGreeting, character = "panda" }: Props) {
  const hydrated = useHydrated();
  const completedUnits = useGameStore((s) => s.completedUnits);
  const seenCardIds = useGameStore((s) => s.seenCardIds);
  const firstIncompleteIndex = hydrated ? units.findIndex((u) => !completedUnits.includes(u.id)) : 0;
  const unlockedIndex = firstIncompleteIndex === -1 ? units.length - 1 : firstIncompleteIndex;

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-0">
      <header className="flex items-center gap-4 px-2 py-1">
        {character === "bear" ? <Bear mood="idle" size={200} /> : <Panda mood="idle" size={200} />}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted">
            {subGreeting ?? (hydrated && seenCardIds.length > 0
              ? `${seenCardIds.length} words in your head — keep going.`
              : "Learn one word at a time.")}
          </p>
        </div>
      </header>

      <ol className="relative -mt-16 space-y-4 pl-8">
        <div
          className="absolute left-4 top-4 bottom-4 w-px rounded-full"
          style={{ background: "var(--border)" }}
        />
        {units.map((unit, i) => {
          const state: "locked" | "active" | "done" =
            !hydrated
              ? i === 0 ? "active" : "locked"
              : completedUnits.includes(unit.id)
                ? "done"
                : i === unlockedIndex
                  ? "active"
                  : "locked";

          return (
            <motion.li
              key={unit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, ease: "easeOut" }}
              className="relative"
            >
              <Node state={state} />

              {state === "locked" ? (
                <div className="ml-4 flex cursor-not-allowed items-center gap-3 rounded-2xl border border-border bg-surface/50 px-4 py-3.5 opacity-50">
                  <span className="text-xl">{unit.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-muted">{unit.title}</div>
                    <div className="truncate text-xs text-muted/70">{unit.subtitle}</div>
                  </div>
                </div>
              ) : (
                <Link
                  href={`${basePath}/learn/${unit.id}`}
                  className={cn(
                    "ml-4 flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-150 active:scale-[0.98]",
                    state === "active"
                      ? "border-[var(--accent)]/40 bg-surface shadow-md shadow-[var(--accent)]/10 ring-1 ring-[var(--accent)]/20"
                      : "border-border bg-surface hover:border-border/80 hover:shadow-sm",
                  )}
                >
                  <span className="text-xl">{unit.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{unit.title}</div>
                    <div className="truncate text-xs text-muted">{unit.subtitle}</div>
                  </div>
                  {state === "done" && (
                    <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />
                  )}
                  {state === "active" && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
                    >
                      Start
                    </span>
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

function Node({ state }: { state: "locked" | "active" | "done" }) {
  return (
    <span
      className={cn(
        "absolute -left-8 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-bg transition-colors",
        state === "done"
          ? "bg-emerald-500 text-white"
          : state === "active"
            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "bg-border text-muted/50",
      )}
    >
      {state === "locked" && <Lock size={10} />}
    </span>
  );
}
