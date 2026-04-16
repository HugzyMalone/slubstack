"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ProfileResponse = {
  profile: {
    username: string;
    email: string | null;
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
  // If neither storage has the flag, the tab was closed during a session-only login
  return !localStorage.getItem(STAY_KEY) && !sessionStorage.getItem(STAY_KEY);
}

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
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

      // If Supabase has a session but neither flag exists, the user closed the tab
      // during a "don't stay signed in" session — sign them out silently.
      if (loggedIn && shouldSignOut()) {
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      setUser(loggedIn);
      if (!loggedIn) setUsername("");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setUsername("");
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

    if (!error) {
      markStaySignedIn(staySignedIn);
    }

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
      body: JSON.stringify({ username }),
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
    setMessage(newPassword ? "Account saved. You can now sign in with your password." : "Username saved.");
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
      <section className="mt-6 rounded-3xl border border-border bg-surface p-5">
        <div className="text-sm font-semibold">Account sync not configured</div>
        <p className="mt-2 text-sm text-muted">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to connect sign-in and the leaderboard.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Account</h2>
          <p className="mt-1 text-sm text-muted">
            Sign in to sync progress and appear on the leaderboard.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-border/40"
        >
          Leaderboard
        </Link>
      </div>

      {user ? (
        <>
          <div className="mt-4 rounded-2xl bg-bg px-4 py-3 text-sm">
            Signed in as <span className="font-semibold">{user.email ?? "anonymous user"}</span>
          </div>
          <form onSubmit={handleSaveAccount} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium" htmlFor="username">
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
            <div>
              <label className="block text-sm font-medium" htmlFor="new-password">
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
              <p className="mt-1 text-xs text-muted">
                Set a password so you can sign in with email next time.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || username.trim().length < 3}
                className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
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
        </>
      ) : useMagicLink ? (
        <form onSubmit={handleMagicLink} className="mt-4 space-y-3">
          <label className="block text-sm font-medium" htmlFor="email-magic">
            Email
          </label>
          <input
            id="email-magic"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
          >
            Send magic link
          </button>
          <button
            type="button"
            onClick={() => { setUseMagicLink(false); setMessage(null); }}
            className="w-full text-center text-sm text-muted hover:text-fg"
          >
            Sign in with password instead
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSignIn} className="mt-4 space-y-3">
          <label className="block text-sm font-medium" htmlFor="email-pw">
            Email
          </label>
          <input
            id="email-pw"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted"
          />
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
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
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setUseMagicLink(true); setMessage(null); }}
            className="w-full text-center text-sm text-muted hover:text-fg"
          >
            First time? Send a magic link
          </button>
        </form>
      )}

      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </section>
  );
}
