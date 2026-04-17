"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles, Trophy } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { StatsClient } from "./StatsClient";
import { AuthPanel } from "@/components/AuthPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { LeaderboardEntry } from "@/lib/supabase/queries";

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

type Props = { entries: LeaderboardEntry[]; configured: boolean };

export function ProfileClient({ entries, configured }: Props) {
  const [tab, setTab] = useState<"account" | "leaderboard" | "settings">("account");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("🐼");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

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

  const tabs = user
    ? (["account", "leaderboard", "settings"] as const)
    : (["account", "leaderboard"] as const);

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      <div className="mb-5 flex gap-1 rounded-2xl bg-border/30 p-1">
        {tabs.map((t) => (
          <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>
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
        <LeaderboardTab entries={entries} configured={configured} />
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

function LeaderboardTab({ entries, configured }: { entries: LeaderboardEntry[]; configured: boolean }) {
  if (!configured) {
    return <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted">Supabase not configured.</div>;
  }
  if (entries.length === 0) {
    return <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted">No entries yet — finish a session to appear here.</div>;
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
            <div className="mt-0.5 flex gap-2.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />{entry.xp} XP
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame size={11} className="text-orange-500" />{entry.streak}d
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
