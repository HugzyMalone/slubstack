"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, Trophy } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { StatsClient } from "./StatsClient";
import { AuthPanel } from "@/components/AuthPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useGameStore } from "@/lib/store";
import type { LeaderboardEntry } from "@/lib/supabase/queries";
import type { ActorBest } from "@/components/trivia/ActorBlitz";
import Link from "next/link";

const STAY_KEY = "slubstack_stay_signed_in";
function clearStaySignedIn() {
  localStorage.removeItem(STAY_KEY);
  sessionStorage.removeItem(STAY_KEY);
}

const ANIMALS = [
  "🐼","🦊","🐨","🐯","🦁","🐸","🐧","🦆",
  "🐺","🦝","🐻","🦉","🦋","🐙","🦜","🐬",
  "🦒","🦓","🐘","🐲",
];

type LBFilter = "overall" | "mandarin" | "german" | "spanish" | "actor-blitz";

export function ProfileClient() {
  const [tab, setTab] = useState<"account" | "leaderboard" | "settings">("account");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("🐼");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const reset = useGameStore((s) => s.reset);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [lbFilter, setLbFilter] = useState<LBFilter>("overall");
  const [actorBest, setActorBest] = useState<ActorBest | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    fetch("/api/profile", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.profile) return;
        setUsername(data.profile.username ?? "");
        setAvatar(data.profile.avatar ?? "🐼");
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [user]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, avatar }),
    });
    const payload = (await res.json()) as { error?: string; ok?: boolean };

    if (payload.error) { setSaving(false); setSaveMsg(payload.error); return; }

    if (newPassword) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) { setSaving(false); setSaveMsg(error.message); return; }
      }
    }

    localStorage.setItem("slubstack_avatar", avatar);
    setSaving(false);
    setSaveMsg("Saved.");
    setNewPassword("");
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    clearStaySignedIn();
    await supabase.auth.signOut();
    setUser(null);
    setTab("account");
  }

  function openTab(t: "account" | "leaderboard" | "settings") {
    setTab(t);
    if (t === "leaderboard" && !leaderboardLoaded) {
      setLeaderboardLoaded(true);
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then((d) => setEntries(d.entries ?? []))
        .catch(() => {});
      try {
        const s = localStorage.getItem("slubstack_actorblitz_best");
        if (s) setActorBest(JSON.parse(s));
      } catch {}
    }
  }

  const tabs = user
    ? (["account", "leaderboard", "settings"] as const)
    : (["account", "leaderboard"] as const);

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      <div className="mb-5 flex gap-1 rounded-2xl bg-border/30 p-1">
        {tabs.map((t) => (
          <TabBtn key={t} active={tab === t} onClick={() => openTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </TabBtn>
        ))}
      </div>

      {tab === "account" && (
        <>
          <StatsClient />
          {!user && <AuthPanel />}
        </>
      )}

      {tab === "leaderboard" && (
        <LeaderboardTab
          entries={entries}
          loading={!leaderboardLoaded}
          filter={lbFilter}
          onFilter={setLbFilter}
          actorBest={actorBest}
        />
      )}

      {tab === "settings" && user && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Who you are */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-border/50 text-2xl">
              {avatar}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{username || "—"}</div>
              <div className="text-xs text-muted">{user.email}</div>
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
              Avatar
            </label>
            <div className="grid grid-cols-10 gap-1.5">
              {ANIMALS.map((animal) => (
                <button
                  key={animal}
                  type="button"
                  onClick={() => setAvatar(animal)}
                  className={`flex h-9 w-full items-center justify-center rounded-xl text-xl transition-all ${
                    avatar === animal
                      ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]"
                      : "bg-border/40 hover:bg-border/70"
                  }`}
                >
                  {animal}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="s-username">
              Username
            </label>
            <input
              id="s-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-name"
              maxLength={20}
              className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="s-password">
              New password
            </label>
            <input
              id="s-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              minLength={6}
              className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
          </div>

          {saveMsg && <p className="text-sm text-muted">{saveMsg}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || username.trim().length < 3}
              className="flex-1 rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-fg)] shadow-md shadow-[var(--accent)]/20 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-border px-4 py-3.5 text-sm font-medium text-muted"
            >
              Sign out
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => { if (confirm("Reset all progress? This cannot be undone.")) reset(); }}
              className="text-xs text-muted underline-offset-2 hover:text-[var(--danger)] hover:underline"
            >
              Reset progress
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-150 ${
        active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

const LB_FILTERS: { id: LBFilter; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "mandarin", label: "Mandarin" },
  { id: "german", label: "German" },
  { id: "spanish", label: "Spanish" },
  { id: "actor-blitz", label: "Actor Blitz" },
];

function LeaderboardTab({
  entries,
  loading,
  filter,
  onFilter,
  actorBest,
}: {
  entries: LeaderboardEntry[];
  loading: boolean;
  filter: LBFilter;
  onFilter: (f: LBFilter) => void;
  actorBest: ActorBest | null;
}) {
  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {LB_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onFilter(id)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
            style={
              filter === id
                ? { background: "var(--accent)", color: "var(--accent-fg)" }
                : { background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: "var(--muted)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {filter === "overall" && (
        loading
          ? <LoadingState />
          : entries.length === 0
            ? <EmptyState message="No entries yet — finish a session to appear here." />
            : <XPLeaderboard entries={entries} />
      )}

      {(filter === "mandarin" || filter === "german" || filter === "spanish") && (
        <LanguagePlaceholder language={filter} />
      )}

      {filter === "actor-blitz" && (
        <ActorBlitzSection best={actorBest} />
      )}
    </div>
  );
}

function XPLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7c54"];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={14} className="text-muted" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Ranked by XP</span>
      </div>
      {entries.map((entry, index) => (
        <div
          key={entry.userId}
          className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
          style={{
            borderColor: index === 0
              ? "color-mix(in srgb, #f59e0b 30%, var(--border))"
              : "color-mix(in srgb, var(--fg) 8%, transparent)",
            background: index === 0
              ? "color-mix(in srgb, #f59e0b 4%, var(--surface))"
              : "var(--surface)",
          }}
        >
          {/* Rank */}
          <div className="w-7 shrink-0 flex justify-center">
            {index < 3 ? (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: RANK_COLORS[index] }}
              >
                {index + 1}
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted tabular-nums">#{index + 1}</span>
            )}
          </div>

          {/* Avatar — initials circle */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase"
            style={{
              background: "color-mix(in srgb, var(--fg) 10%, transparent)",
              color: "var(--fg)",
            }}
          >
            {entry.username.slice(0, 2)}
          </div>

          {/* Name + stats */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{entry.username}</div>
            <div className="mt-0.5 flex gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Zap size={10} className="text-amber-400" />{entry.xp} XP
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame size={10} className="text-orange-400" />{entry.streak}d streak
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LanguagePlaceholder({ language }: { language: "mandarin" | "german" | "spanish" }) {
  const labels: Record<typeof language, { code: string; name: string; accent: string }> = {
    mandarin: { code: "中", name: "Mandarin", accent: "#e11d48" },
    german: { code: "DE", name: "German", accent: "#f97316" },
    spanish: { code: "ES", name: "Spanish", accent: "#c2410c" },
  };
  const { code, name, accent } = labels[language];

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{ background: accent }}
      >
        {code}
      </div>
      <div className="text-sm font-semibold">{name} leaderboard</div>
      <div className="mt-1 text-xs text-muted leading-relaxed">
        Per-language rankings are coming soon.<br />Keep learning to build your score!
      </div>
    </div>
  );
}

function ActorBlitzSection({ best }: { best: ActorBest | null }) {
  function FilmIconSVG() {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.5" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    );
  }

  if (!best) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)" }}
        >
          <FilmIconSVG />
        </div>
        <div className="text-sm font-semibold">No score yet</div>
        <div className="mt-1 text-xs text-muted">Play Actor Blitz to set a personal best</div>
        <Link
          href="/trivia/actors"
          className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--game)" }}
        >
          Play now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted">Your personal best</div>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Score", value: `${best.score}/${best.total}` },
          { label: "Accuracy", value: `${best.accuracy}%` },
          { label: "Best streak", value: String(best.bestStreak) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-3 text-center">
            <div className="text-lg font-bold" style={{ color: "var(--game)" }}>{value}</div>
            <div className="text-xs text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <Link
        href="/trivia/actors"
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-colors active:scale-[0.98]"
        style={{ background: "var(--game)" }}
      >
        Beat your score →
      </Link>
      <p className="text-center text-xs text-muted">Global Actor Blitz rankings — coming soon</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
      Loading…
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
      {message}
    </div>
  );
}
