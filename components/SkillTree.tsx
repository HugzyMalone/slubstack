"use client";

import Link from "next/link";
import { motion, useAnimationControls } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { type Unit } from "@/lib/content";
import { useGameStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { useHydrated } from "@/lib/hooks";
import { tapMedium } from "@/lib/haptics";
import { wrongVariants } from "@/lib/motion";

function useLockedShake() {
  const controls = useAnimationControls();
  return {
    controls,
    onTap: () => {
      tapMedium();
      controls.start("shake");
      toast("Finish the previous unit first", { duration: 1600 });
    },
  };
}

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

  const completedCount = hydrated ? units.filter((u) => completedUnits.includes(u.id)).length : 0;
  const progressPct = units.length > 0 ? Math.round((completedCount / units.length) * 100) : 0;
  const wordsInHead = hydrated ? seenCardIds.length : 0;

  const HeroCharacter = character === "bear" ? Bear : Panda;

  return (
    <div className="w-full px-4 pb-24 pt-0 lg:max-w-[1200px] lg:mx-auto lg:px-8 lg:py-10 lg:pb-16">
      {/* ─── Mobile — vertical timeline (unchanged) ─── */}
      <div className="lg:hidden mx-auto max-w-xl">
        <header className="flex items-center gap-4 px-2 py-1">
          <HeroCharacter mood="idle" size={200} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
            <p className="text-sm text-muted">
              {subGreeting ?? (wordsInHead > 0
                ? `${wordsInHead} words in your head — keep going.`
                : "Learn one word at a time.")}
            </p>
          </div>
        </header>

        <ol className="relative -mt-16 space-y-4 pl-8">
          <div className="absolute left-4 top-4 bottom-4 w-px rounded-full" style={{ background: "var(--border)" }} />
          {units.map((unit, i) => {
            const state: "locked" | "active" | "done" =
              !hydrated
                ? i === 0 ? "active" : "locked"
                : completedUnits.includes(unit.id) ? "done"
                  : i === unlockedIndex ? "active"
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
                <UnitRow unit={unit} state={state} basePath={basePath} />
              </motion.li>
            );
          })}
        </ol>
      </div>

      {/* ─── Desktop — character/progress left, unit grid right ─── */}
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-5">
          <div className="flex items-center justify-center" style={{ height: 220 }}>
            <HeroCharacter mood="idle" size={220} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {subGreeting ?? (wordsInHead > 0
                ? `${wordsInHead} words in your head — keep going.`
                : "Learn one word at a time.")}
            </p>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-panel)",
            }}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold tracking-widest text-muted uppercase">Progress</span>
              <span className="text-xs text-muted">{completedCount} of {units.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-muted">{progressPct}% complete</span>
              {wordsInHead > 0 && <span className="text-xs text-muted">{wordsInHead} words seen</span>}
            </div>
          </div>
        </aside>

        <section>
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted uppercase">Units</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {units.map((unit, i) => {
              const state: "locked" | "active" | "done" =
                !hydrated
                  ? i === 0 ? "active" : "locked"
                  : completedUnits.includes(unit.id) ? "done"
                    : i === unlockedIndex ? "active"
                    : "locked";
              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, ease: "easeOut" }}
                >
                  <UnitCard unit={unit} index={i + 1} state={state} basePath={basePath} />
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function UnitRow({ unit, state, basePath }: { unit: Unit; state: "locked" | "active" | "done"; basePath: string }) {
  const locked = useLockedShake();
  if (state === "locked") {
    return (
      <motion.button
        type="button"
        animate={locked.controls}
        variants={wrongVariants}
        onClick={locked.onTap}
        className="ml-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/50 px-4 py-3.5 text-left opacity-60"
      >
        <span className="text-xl">{unit.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-muted">{unit.title}</div>
          <div className="truncate text-xs text-muted/70">{unit.subtitle}</div>
        </div>
        <Lock size={14} className="shrink-0 text-muted" />
      </motion.button>
    );
  }
  return (
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
      {state === "done" && <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />}
      {state === "active" && (
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          Start
        </span>
      )}
    </Link>
  );
}

function UnitCard({ unit, index, state, basePath }: { unit: Unit; index: number; state: "locked" | "active" | "done"; basePath: string }) {
  const content = (
    <>
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{
            background: state === "active"
              ? "color-mix(in srgb, var(--accent) 14%, var(--surface))"
              : state === "done"
                ? "color-mix(in srgb, #10b981 12%, var(--surface))"
                : "var(--elevated)",
          }}
        >
          {state === "locked" ? <Lock size={16} className="text-muted" /> : unit.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold tracking-widest text-muted uppercase">Unit {index}</span>
            {state === "done" && <CheckCircle2 size={13} className="text-emerald-500" />}
            {state === "active" && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase leading-none"
                style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
              >
                Active
              </span>
            )}
          </div>
          <div className={cn("mt-1 text-[15px] font-bold leading-tight", state === "locked" && "text-muted")}>
            {unit.title}
          </div>
          <div className="mt-1 text-[13px] leading-snug text-muted line-clamp-2">{unit.subtitle}</div>
        </div>
      </div>
    </>
  );
  const base = "block rounded-2xl p-5 transition-all duration-150";
  const baseStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
  };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const locked = useLockedShake();
  if (state === "locked") {
    return (
      <motion.button
        type="button"
        animate={locked.controls}
        variants={wrongVariants}
        onClick={locked.onTap}
        className={cn(base, "w-full text-left opacity-60")}
        style={baseStyle}
      >
        {content}
      </motion.button>
    );
  }
  return (
    <Link
      href={`${basePath}/learn/${unit.id}`}
      className={cn(base, "hover:-translate-y-0.5")}
      style={
        state === "active"
          ? {
              ...baseStyle,
              borderColor: "color-mix(in srgb, var(--accent) 40%, var(--border))",
              boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent), var(--shadow-panel)",
            }
          : {
              ...baseStyle,
              boxShadow: "var(--shadow-panel)",
            }
      }
    >
      {content}
    </Link>
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
