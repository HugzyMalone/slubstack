"use client";

import { Flame, Sparkles, BookOpen, Target } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { levelFromXp, xpToNextLevel } from "@/lib/xp";
import { ALL_CARDS } from "@/lib/content";
import { Panda } from "@/components/Panda";
import { isDue } from "@/lib/srs";
import { useHydrated, useNow } from "@/lib/hooks";

export function StatsClient() {
  const hydrated = useHydrated();
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const seen = useGameStore((s) => s.seenCardIds);
  const completed = useGameStore((s) => s.completedUnits);
  const srs = useGameStore((s) => s.srs);
  const reset = useGameStore((s) => s.reset);
  const now = useNow(hydrated);

  if (!hydrated) return null;

  const level = levelFromXp(xp);
  const { current, next, progress } = xpToNextLevel(xp);
  const due = Object.values(srs).filter((s) => isDue(s, now)).length;
  const totalCards = ALL_CARDS.length;

  return (
    <div>
      {/* Level card */}
      <div className="rounded-3xl border border-border bg-surface p-6 text-center shadow-sm">
        <Panda mood="happy" size={96} />
        <div className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted">Level</div>
        <div className="count-up mt-0.5 text-5xl font-bold tabular-nums">{level}</div>
        <div className="mx-auto mt-4 h-1.5 max-w-48 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>
        <div className="mt-1.5 text-xs tabular-nums text-muted">
          {xp - current} / {next - current} XP to level {level + 1}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Tile
          icon={<Flame size={16} />}
          iconBg="bg-orange-100 text-orange-500 dark:bg-orange-950/60 dark:text-orange-400"
          label="Day streak"
          value={String(streak)}
        />
        <Tile
          icon={<Sparkles size={16} />}
          iconBg="bg-amber-100 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400"
          label="Total XP"
          value={String(xp)}
        />
        <Tile
          icon={<BookOpen size={16} />}
          iconBg="bg-sky-100 text-sky-500 dark:bg-sky-950/60 dark:text-sky-400"
          label="Words learned"
          value={`${seen.length}`}
          sub={`of ${totalCards}`}
        />
        <Tile
          icon={<Target size={16} />}
          iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          label="Units done"
          value={String(completed.length)}
        />
      </div>

      {due > 0 && (
        <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/40 px-4 py-3.5">
          <div className="text-sm">
            <span className="font-semibold">{due}</span> flashcard{due === 1 ? "" : "s"} ready to review
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Review
          </span>
        </div>
      )}

    </div>
  );
}

function Tile({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className={`inline-flex rounded-xl p-2 ${iconBg}`}>{icon}</div>
      <div className="count-up mt-2.5 text-2xl font-bold tabular-nums leading-none">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-muted">{sub}</span>}
      </div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
