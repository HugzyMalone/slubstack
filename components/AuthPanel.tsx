"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

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
    if (error) setMessage({ text: error.message, ok: false });
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
    setMessage(
      error
        ? { text: error.message, ok: false }
        : { text: "Check your email — a sign-in link is on its way.", ok: true },
    );
  }

  if (user) return null;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-surface p-5 text-sm text-muted">
        Add Supabase env vars to enable sign-in and the leaderboard.
      </div>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
          >
            <ShieldCheck size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <div className="text-sm font-semibold">Secure sign-in</div>
            <div className="text-xs text-muted">Join the leaderboard &amp; sync your progress</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 py-5">
        {useMagicLink ? (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Email address</span>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>

            <button
              type="button"
              onClick={() => { setUseMagicLink(false); setMessage(null); }}
              className="w-full py-1 text-center text-sm text-muted hover:text-fg"
            >
              Sign in with password instead
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSignIn} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Email address</span>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Password</span>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-10 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--accent)]"
              />
              <span className="text-sm">Stay signed in on this device</span>
            </label>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => { setUseMagicLink(true); setMessage(null); }}
              className="w-full py-1 text-center text-sm text-muted hover:text-fg"
            >
              New here? Get a magic link instead
            </button>
          </form>
        )}

        {message && (
          <p
            className="mt-3 rounded-xl px-3 py-2 text-sm"
            style={{
              background: message.ok
                ? "color-mix(in srgb, #10b981 10%, transparent)"
                : "color-mix(in srgb, #e11d48 10%, transparent)",
              color: message.ok ? "#059669" : "#e11d48",
            }}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* Trust footer */}
      <div className="border-t border-border px-6 py-3">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Lock size={11} />
          Your data is encrypted and never shared.
        </p>
      </div>
    </section>
  );
}
