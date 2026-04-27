"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { spring, springy } from "@/lib/motion";

type Tier = { id: number; name: string; rank: number };
type Member = {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  weeklyXp: number;
  isYou: boolean;
};
type LeagueData = {
  cohort: { id: string; tierId: number; weekStart: string } | null;
  tiers: Tier[];
  members: Member[];
};

const PROMOTE_COUNT = 7;
const RELEGATE_COUNT = 5;
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

function timeUntilMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0));
  const diff = next.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days >= 1) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function LeagueClient() {
  const [data, setData] = useState<LeagueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(timeUntilMonday());

  useEffect(() => {
    const t = setInterval(() => setCountdown(timeUntilMonday()), 60000);
    return () => clearInterval(t);
  }, []);

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
        <p className="mt-2 text-sm text-muted">{error}. Sign in and finish a lesson to join this week&apos;s cohort.</p>
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

  const tier = data.tiers.find((t) => t.id === data.cohort?.tierId);
  const tierName = tier?.name ?? "Bronze";
  const tierColour = TIER_COLOURS[tierName] ?? "#cd7c54";
  const isTopTier = tier?.rank === Math.max(...data.tiers.map((t) => t.rank));
  const isBottomTier = tier?.rank === Math.min(...data.tiers.map((t) => t.rank));

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
        <p className="mt-1 text-sm text-muted">Resets in {countdown}</p>
      </header>

      <div
        className="mb-4 rounded-2xl p-3 text-center text-[12px] text-muted"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        Top {PROMOTE_COUNT} promote · Bottom {RELEGATE_COUNT} relegate · Up to 30 per cohort
      </div>

      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {data.members.map((m) => {
            const promoting = !isTopTier && m.rank <= PROMOTE_COUNT;
            const relegating = !isBottomTier && m.rank > data.members.length - RELEGATE_COUNT;
            const indicator = promoting ? "promote" : relegating ? "relegate" : "hold";
            return (
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
                    : promoting
                      ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
                      : relegating
                        ? "color-mix(in srgb, var(--game) 8%, var(--surface))"
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
                  {m.weeklyXp} XP
                </div>
                <div className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {indicator === "promote" && <ChevronUp size={16} strokeWidth={2.6} className="text-[color:var(--success)]" />}
                  {indicator === "relegate" && <ChevronDown size={16} strokeWidth={2.6} className="text-[color:var(--game)]" />}
                  {indicator === "hold" && <Minus size={14} strokeWidth={2.6} className="text-muted" />}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {data.members.length === 0 && (
          <li className="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
            Cohort empty. Earn some XP to populate it.
          </li>
        )}
      </ul>
    </div>
  );
}
