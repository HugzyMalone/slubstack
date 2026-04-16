"use client";

import Link from "next/link";
import { Flame, Sparkles, User } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { levelFromXp } from "@/lib/xp";
import { useHydrated } from "@/lib/hooks";

export function TopBar() {
  const hydrated = useHydrated();
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const level = hydrated ? levelFromXp(xp) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            学
          </span>
          slubstack
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Stat
            icon={<Flame size={15} className="text-orange-500" />}
            label={`${hydrated ? streak : 0}`}
            title="Streak"
          />
          <Stat
            icon={<Sparkles size={15} className="text-amber-500" />}
            label={`${hydrated ? xp : 0}`}
            title="XP"
          />
          <Link
            href="/stats"
            className="rounded-full border border-border px-2 py-1 text-xs text-muted hover:text-fg"
          >
            Lv {level}
          </Link>
          <Link
            href="/stats"
            className="rounded-full border border-border p-2 text-muted hover:text-fg"
            aria-label="Account and stats"
          >
            <User size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, label, title }: { icon: React.ReactNode; label: string; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-1 tabular-nums"
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
