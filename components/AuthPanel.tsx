"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ProfileResponse = {
  profile: {
    username: string;
    email: string | null;
    avatar: string | null;
  } | null;
};

const STAY_KEY = "slubstack_stay_signed_in";

function markStaySignedIn(stay: boolean) {
  if (stay) {
    localStorage.setItem(STAY_KEY, "1");
    sessionStorage.removeItem(STAY_KEY);
  } else {
    sessionStorage.setItem(STAY_KEY, "1");
    localStorage.removeItem(STAY_KEY);
  }
}

function clearStaySignedIn() {
  localStorage.removeItem(STAY_KEY);
  sessionStorage.removeItem(STAY_KEY);
}

function shouldSignOut(): boolean {
  return !localStorage.getItem(STAY_KEY) && !sessionStorage.getItem(STAY_KEY);
}

const ANIMALS = [
  "🐼","🦊","🐨","🐯","🦁","🐸","🐧","🦆",
  "🐺","🦝","🐻","🦉","🦋","🐙","🦜","🐬",
  "🦒","🦓","🐘","🐲",
];

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(async ({ data }) => {
      const loggedIn = data.user ?? null;
      if (loggedIn && shouldSignOut()) {
        await supabase.auth.signOut();
        setUser(null);
        return;
      }
      setUser(loggedIn);
      if (!loggedIn) setUsername("");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // New sign-in (magic link or password) with no persistence flag → default stay signed in
      if (event === "SIGNED_IN" && session?.user && shouldSignOut()) {
        markStaySignedIn(true);
      }
      setUser(session?.user ?? null);
      if (!session?.user) { setUsername(""); setAvatar(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as ProfileResponse;
      })
      .then((data) => {
        if (cancelled || !data?.profile) return;
        setUsername(data.profile.username);
        setAvatar(data.profile.avatar);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [user]);

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email || !password) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) markStaySignedIn(staySignedIn);

    setLoading(false);
    if (error) setMessage(error.message);
  }

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email) return;

    setLoading(true);
    setMessage(null);

    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}/auth/callback?next=/stats`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    setMessage(error ? error.message : "Check your email for the sign-in link.");
  }

  async function handleSaveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const profileRes = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, avatar }),
    });
    const profilePayload = (await profileRes.json()) as { error?: string; ok?: boolean };

    if (profilePayload.error) {
      setLoading(false);
      setMessage(profilePayload.error);
      return;
    }

    if (newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setLoading(false);
        setMessage(error.message);
        return;
      }
    }

    setLoading(false);
    setMessage(newPassword ? "Account saved. You can now sign in with your password." : "Saved.");
    setNewPassword("");
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    setMessage(null);
    clearStaySignedIn();
    await supabase.auth.signOut();
    setLoading(false);
    setMessage("Signed out.");
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
        Add Supabase env vars to enable sign-in and the leaderboard.
      </div>
    );
  }

  if (user) {
    return (
      <section className="mt-6 rounded-3xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-border/50 text-2xl">
            {avatar ?? "🐼"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{username || user.email}</div>
            <div className="text-xs text-muted">{user.email}</div>
          </div>
        </div>

        <form onSubmit={handleSaveAccount} className="mt-5 space-y-4">
          {/* Avatar picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
              Avatar
            </label>
            <div className="mt-2 grid grid-cols-10 gap-1.5">
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
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="username">
              Leaderboard name
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-name"
              className="mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
              maxLength={20}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="new-password">
              Set a password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a password"
              className="mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
              minLength={6}
            />
            <p className="mt-1 text-xs text-muted">Set a password so you can sign in with email next time.</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || username.trim().length < 3}
              className="flex-1 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        </form>

        {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
      {/* Header CTA */}
      <div
        className="px-5 py-5"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent)" }}
      >
        <div className="text-base font-semibold">Join the leaderboard</div>
        <p className="mt-1 text-sm text-muted">
          Sign in to sync your progress and compete with other learners.
        </p>
      </div>

      <div className="px-5 pb-5">
        {useMagicLink ? (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
            >
              Send magic link
            </button>
            <button
              type="button"
              onClick={() => { setUseMagicLink(false); setMessage(null); }}
              className="w-full py-1 text-center text-sm text-muted"
            >
              Sign in with password instead
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSignIn} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--accent)]"
              />
              <span className="text-sm">Stay signed in</span>
            </label>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-fg)] shadow-md shadow-[var(--accent)]/20 disabled:opacity-50"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setUseMagicLink(true); setMessage(null); }}
              className="w-full py-1 text-center text-sm text-muted"
            >
              First time? Send a magic link
            </button>
          </form>
        )}

        {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      </div>
    </section>
  );
}
