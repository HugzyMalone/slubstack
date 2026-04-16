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

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) {
        setUsername("");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setUsername("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ProfileResponse;
      })
      .then((data) => {
        if (cancelled || !data?.profile) return;
        setUsername(data.profile.username);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

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
    setMessage(
      error ? error.message : "Check your email for the sign-in link.",
    );
  }

  async function handleSaveUsername(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const payload = (await response.json()) as { error?: string; ok?: boolean };
    setLoading(false);
    setMessage(payload.error ?? (payload.ok ? "Username saved." : "Could not save username."));
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    setMessage(null);
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
          <form onSubmit={handleSaveUsername} className="mt-4 space-y-3">
            <label className="block text-sm font-medium" htmlFor="username">
              Leaderboard name
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your-name"
              className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none ring-0 placeholder:text-muted"
              maxLength={20}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || username.trim().length < 3}
                className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
              >
                Save name
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
      ) : (
        <form onSubmit={handleMagicLink} className="mt-4 space-y-3">
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none ring-0 placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-50"
          >
            Send magic link
          </button>
        </form>
      )}

      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </section>
  );
}
