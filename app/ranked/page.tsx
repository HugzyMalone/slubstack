"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type LadderTab = { key: string; label: string };

const LADDERS: LadderTab[] = [
  { key: "global", label: "Global" },
  { key: "math_blitz", label: "Math Blitz" },
  { key: "trivia", label: "Trivia" },
  { key: "geo_clone", label: "GeoClone" },
];

type Entry = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  matches: number;
  wins?: number;
  draws?: number;
  losses?: number;
  gameKind?: string;
};

const MEDAL = ["#f59e0b", "#94a3b8", "#b45309"];

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url && (url.startsWith("http") || url.startsWith("/"))) {
    return (
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
      style={{ background: "color-mix(in srgb, var(--accent) 15%, var(--surface))" }}
    >
      {url || name[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function RankedPage() {
  const [tab, setTab] = useState<string>("global");
  const [level, setLevel] = useState<number>(1);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setEntries(null);
    const url =
      tab === "global"
        ? "/api/ranked/global?limit=50"
        : `/api/live/leaderboard?kind=${tab}&level=${level}&limit=50`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [tab, level]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-4">
      <div className="mb-5">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-fg">
          <ArrowLeft size={13} /> Home
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Swords size={22} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-bold tracking-tight">Ranked</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          Competitive Elo rating, separate from XP. Win matches to climb — solo games are rated against the bots.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {LADDERS.map((l) => (
          <button
            key={l.key}
            onClick={() => setTab(l.key)}
            className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors"
            style={{
              background: tab === l.key ? "var(--accent)" : "var(--border)",
              color: tab === l.key ? "#fff" : "var(--muted)",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {tab !== "global" && (
        <div className="mb-4 flex gap-1.5">
          {[1, 2, 3].map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: level === lv ? "color-mix(in srgb, var(--accent) 30%, var(--surface))" : "var(--border)",
                color: level === lv ? "var(--fg)" : "var(--muted)",
              }}
            >
              Level {lv}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">Loading…</div>
      ) : !entries || entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="text-sm text-muted">No ranked players yet</div>
          <div className="mt-1 text-xs text-muted">Play a ranked match to get on the board.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => {
            const isMe = e.userId === userId;
            return (
              <div
                key={e.userId}
                className="flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3"
                style={{
                  borderColor: isMe ? "var(--accent)" : "var(--border)",
                  background: isMe ? "color-mix(in srgb, var(--accent) 8%, var(--surface))" : "var(--surface)",
                }}
              >
                <span
                  className="w-5 text-center text-xs font-bold tabular-nums"
                  style={{ color: e.rank <= 3 ? MEDAL[e.rank - 1] : "var(--muted)" }}
                >
                  {e.rank}
                </span>
                <Avatar url={e.avatarUrl} name={e.username} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {e.username}
                    {isMe && <span className="ml-1.5 text-[11px] font-medium text-[var(--accent)]">You</span>}
                  </div>
                  <div className="text-xs text-muted">
                    {e.wins !== undefined ? `${e.wins}W ${e.draws ?? 0}D ${e.losses ?? 0}L` : `${e.matches} matches`}
                  </div>
                </div>
                <div className="text-lg font-black tabular-nums" style={{ color: "var(--accent)" }}>
                  {e.rating}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
