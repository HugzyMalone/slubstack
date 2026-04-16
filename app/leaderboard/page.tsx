import Link from "next/link";
import { Trophy, Flame, Sparkles } from "lucide-react";
import { getLeaderboard } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function LeaderboardPage() {
  const configured = isSupabaseConfigured();
  const entries = configured ? await getLeaderboard(50) : [];

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-6">
      <div className="rounded-[28px] border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              <Trophy size={14} />
              Leaderboard
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Top learners</h1>
            <p className="mt-2 text-sm text-muted">
              Ranked by total XP, with streaks as the tiebreaker.
            </p>
          </div>
          <Link
            href="/stats"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-border/40"
          >
            Account
          </Link>
        </div>
      </div>

      {!configured ? (
        <div className="mt-4 rounded-3xl border border-border bg-surface p-5">
          <div className="text-sm font-semibold">Supabase setup required</div>
          <p className="mt-2 text-sm text-muted">
            Add your Supabase URL and publishable key, then create the schema in `supabase/schema.sql`.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
          No leaderboard entries yet. Sign in on the stats page and finish a session to publish progress.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.userId}
              className="flex items-center gap-4 rounded-3xl border border-border bg-surface px-4 py-4"
            >
              <div className="w-8 text-center text-sm font-semibold tabular-nums text-muted">
                #{index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{entry.username}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" />
                    {entry.xp} XP
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Flame size={13} className="text-orange-500" />
                    {entry.streak} day streak
                  </span>
                  <span>{entry.wordsLearned} words</span>
                  <span>{entry.unitsDone} units</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
