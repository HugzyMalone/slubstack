"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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

function shouldSignOut(): boolean {
  return !localStorage.getItem(STAY_KEY) && !sessionStorage.getItem(STAY_KEY);
}

export function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && shouldSignOut()) {
        markStaySignedIn(true);
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
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
    if (!supabase) return;
    setLoading(true);
    setMessage(null);
    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}/auth/callback?next=/onboarding`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    setMessage(error ? error.message : "Check your email for the sign-in link.");
  }

  // Already signed in — nothing to show here (Settings tab handles account management)
  if (user) return null;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
        Add Supabase env vars to enable sign-in and the leaderboard.
      </div>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
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
