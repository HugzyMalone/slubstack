"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { spring, springy } from "@/lib/motion";
import { playLeaguePromote } from "@/lib/sound";
import { levelUp as hapticLevelUp } from "@/lib/haptics";

const TIER_SEEN_KEY = "league_last_seen_tier";

type Tier = { id: number; name: string; rank: number; minXp: number };
type Member = {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  lifetimeXp: number;
  isYou: boolean;
};
type LeagueData = {
  tier: { id: number; name: string; rank: number; minXp: number };
  lifetimeXp: number;
  members: Member[];
  tiers: Tier[];
};

const TIER_COLOURS: Record<string, string> = {
  Bronze: "#cd7c54",
  Silver: "#94a3b8",
  Gold: "#f59e0b",
  Platinum: "#b0bec5",
  Diamond: "#60d5fa",
};

function isAvatarUrl(v: string | null): v is string {
  return !!v && (v.startsWith("http") || v.startsWith("data:") || v.startsWith("/"));
}

export function LeagueClient() {
  const [data, setData] = useState<LeagueData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/leagues/current", { cache: "no-store" });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(body.error ?? `HTTP ${res.status}`);
          return;
        }
        const payload = (await res.json()) as LeagueData;
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="font-display text-2xl font-extrabold">League unavailable</h1>
        <p className="mt-2 text-sm text-muted">{error}. Sign in and earn some XP to climb the ladder.</p>
        <Link
          href="/stats"
          className="mt-5 inline-block rounded-2xl px-5 py-3 font-display text-sm font-extrabold uppercase tracking-wide text-[var(--accent-fg)]"
          style={{ background: "var(--accent)", boxShadow: "0 4px 0 color-mix(in srgb, var(--accent) 70%, black)" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center text-muted">Loading league…</div>
    );
  }

  const tierName = data.tier.name;
  const tierColour = TIER_COLOURS[tierName] ?? "#cd7c54";
  const nextTier = data.tiers
    .filter((t) => t.rank > data.tier.rank)
    .sort((a, b) => a.rank - b.rank)[0] ?? null;

  return <LeagueView
    data={data}
    tierName={tierName}
    tierColour={tierColour}
    tierRank={data.tier.rank}
    nextTier={nextTier}
  />;
}

type ViewProps = {
  data: LeagueData;
  tierName: string;
  tierColour: string;
  tierRank: number;
  nextTier: Tier | null;
};

function LeagueView({ data, tierName, tierColour, tierRank, nextTier }: ViewProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seenRaw = window.localStorage.getItem(TIER_SEEN_KEY);
    const seen = seenRaw ? Number(seenRaw) : null;
    if (seen !== null && Number.isFinite(seen) && tierRank > seen) {
      playLeaguePromote();
      hapticLevelUp();
      toast.success(`Promoted to ${tierName} League`);
    }
    window.localStorage.setItem(TIER_SEEN_KEY, String(tierRank));
  }, [tierRank, tierName]);

  const toNext = nextTier ? Math.max(0, nextTier.minXp - data.lifetimeXp) : 0;

  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-4 lg:max-w-2xl lg:px-8 lg:py-10">
      <header className="mb-5 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.7, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={spring}
          className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(135deg, ${tierColour} 0%, color-mix(in srgb, ${tierColour} 60%, var(--game)) 100%)`,
            boxShadow: `0 6px 0 color-mix(in srgb, ${tierColour} 70%, black)`,
          }}
        >
          <Trophy size={28} strokeWidth={2.4} fill="white" className="text-white" />
        </motion.div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{tierName} League</h1>
        <p className="mt-1 text-sm text-muted">
          {data.lifetimeXp} XP all-time
          {nextTier ? ` · ${toNext} to ${nextTier.name}` : " · top tier reached"}
        </p>
      </header>

      <div
        className="mb-4 rounded-2xl p-3 text-center text-[12px] text-muted"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        Climb tiers as your lifetime XP grows. Everyone in {tierName} is ranked below.
      </div>

      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {data.members.map((m) => (
            <motion.li
              key={m.userId}
              layout
              transition={springy}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
              style={{
                background: m.isYou
                  ? "color-mix(in srgb, var(--accent) 14%, var(--surface))"
                  : "var(--surface)",
                border: m.isYou
                  ? "2px solid color-mix(in srgb, var(--accent) 40%, transparent)"
                  : "1px solid var(--border)",
                boxShadow: m.isYou ? "var(--shadow-bouncy)" : undefined,
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-extrabold tabular-nums"
                style={{
                  background: m.rank <= 3
                    ? `color-mix(in srgb, ${tierColour} 26%, var(--surface))`
                    : "color-mix(in srgb, var(--fg) 6%, transparent)",
                  color: m.rank <= 3 ? tierColour : "var(--muted)",
                }}
              >
                {m.rank}
              </span>
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--fg) 5%, transparent)" }}>
                {isAvatarUrl(m.avatar) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                    {m.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {m.username}
                  {m.isYou && <span className="ml-2 text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)]">You</span>}
                </div>
              </div>
              <div className="font-display text-sm font-extrabold tabular-nums" style={{ color: "var(--accent)" }}>
                {m.lifetimeXp} XP
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {data.members.length === 0 && (
          <li className="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
            No one in {tierName} yet. Earn some XP to claim the top spot.
          </li>
        )}
      </ul>
    </div>
  );
}
