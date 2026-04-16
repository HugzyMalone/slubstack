"use client";

import { useState } from "react";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { StatsClient } from "./StatsClient";
import { AuthPanel } from "@/components/AuthPanel";
import type { LeaderboardEntry } from "@/lib/supabase/queries";

type Props = {
  entries: LeaderboardEntry[];
  configured: boolean;
};

export function ProfileClient({ entries, configured }: Props) {
  const [tab, setTab] = useState<"account" | "leaderboard">("account");

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-2xl bg-border/30 p-1">
        <TabBtn active={tab === "account"} onClick={() => setTab("account")}>
          Account
        </TabBtn>
        <TabBtn active={tab === "leaderboard"} onClick={() => setTab("leaderboard")}>
          Leaderboard
        </TabBtn>
      </div>

      {tab === "account" ? (
        <>
          <StatsClient />
          <AuthPanel />
        </>
      ) : (
        <LeaderboardTab entries={entries} configured={configured} />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-150 ${
        active
          ? "bg-surface text-fg shadow-sm"
          : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function LeaderboardTab({
  entries,
  configured,
}: {
  entries: LeaderboardEntry[];
  configured: boolean;
}) {
  if (!configured) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
        Supabase not configured.
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
        No entries yet — sign in and finish a session to appear here.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-[var(--accent)]" />
        <span className="text-sm font-semibold">Top learners</span>
        <span className="text-xs text-muted">ranked by XP</span>
      </div>
      {entries.map((entry, index) => (
        <div
          key={entry.userId}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
            index === 0
              ? "border-amber-300/60 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/20"
              : "border-border bg-surface"
          }`}
        >
          <div className="w-6 text-center text-xs font-bold tabular-nums text-muted">
            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border/60 text-xl">
            {entry.avatar ?? "🐼"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{entry.username}</div>
            <div className="mt-0.5 flex flex-wrap gap-2.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                {entry.xp} XP
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame size={11} className="text-orange-500" />
                {entry.streak}d streak
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
