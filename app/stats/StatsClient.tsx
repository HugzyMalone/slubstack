"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles, BookOpen, Target } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { levelFromXp, xpToNextLevel } from "@/lib/xp";
import { ALL_CARDS } from "@/lib/content";
import { Panda } from "@/components/Panda";
import { isDue } from "@/lib/srs";

export function StatsClient() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const seen = useGameStore((s) => s.seenCardIds);
  const completed = useGameStore((s) => s.completedUnits);
  const srs = useGameStore((s) => s.srs);
  const reset = useGameStore((s) => s.reset);

  if (!hydrated) return null;

  const level = levelFromXp(xp);
  const { current, next, progress } = xpToNextLevel(xp);
  const now = Date.now();
  const due = Object.values(srs).filter((s) => isDue(s, now)).length;
  const totalCards = ALL_CARDS.length;

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      <div className="rounded-3xl border border-border bg-surface p-6 text-center">
        <Panda mood="happy" size={100} />
        <div className="mt-3 text-xs uppercase tracking-widest text-muted">Level</div>
        <div className="text-4xl font-bold tabular-nums">{level}</div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>
        <div className="mt-1 text-xs tabular-nums text-muted">
          {xp - current} / {next - current} XP to level {level + 1}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Tile
          icon={<Flame size={18} className="text-orange-500" />}
          label="Day streak"
          value={String(streak)}
        />
        <Tile
          icon={<Sparkles size={18} className="text-amber-500" />}
          label="Total XP"
          value={String(xp)}
        />
        <Tile
          icon={<BookOpen size={18} className="text-sky-500" />}
          label="Words learned"
          value={`${seen.length} / ${totalCards}`}
        />
        <Tile
          icon={<Target size={18} className="text-emerald-500" />}
          label="Units done"
          value={String(completed.length)}
        />
      </div>

      {due > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <div className="text-sm">
            <span className="font-semibold">{due}</span> card{due === 1 ? "" : "s"} due for review.
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={() => {
            if (confirm("Reset all progress? This cannot be undone.")) reset();
          }}
          className="text-xs text-muted underline hover:text-danger"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
