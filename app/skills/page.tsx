"use client";

import Link from "next/link";
import { useStore } from "zustand";
import { vibeCodingStore } from "@/lib/store";
import { levelFromXp } from "@/lib/xp";
import { useHydrated } from "@/lib/hooks";

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const SKILLS = [
  {
    href: "/vibe-coding",
    code: "🪄",
    title: "Vibe Coding",
    description: "Prompting, debugging & web patterns",
    iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    units: "6 units · 88 cards",
  },
];

export default function SkillsPage() {
  const hydrated = useHydrated();
  const vibeXp = useStore(vibeCodingStore, (s) => s.xp);

  const xpMap: Record<string, number> = {
    "/vibe-coding": vibeXp,
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
        <p className="mt-1 text-sm text-muted">Learn to build smarter with AI.</p>
      </div>

      <div className="flex flex-col gap-3">
        {SKILLS.map(({ href, code, title, description, iconBg, units }) => {
          const level = hydrated ? levelFromXp(xpMap[href] ?? 0) : 0;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150 active:scale-[0.98]"
              style={{
                background: "var(--surface)",
                border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
                boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ background: iconBg }}
              >
                {code}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{title}</span>
                  {hydrated && (
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-muted/70 bg-border/60">
                      Lv. {level}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted">{description}</div>
                <div className="mt-0.5 text-xs text-muted/60">{units}</div>
              </div>
              <span className="shrink-0 text-muted"><ChevronRight /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
