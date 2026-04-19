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

  async function handleOAuth(provider: "google" | "apple" | "linkedin_oidc") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    markStaySignedIn(staySignedIn);
    setLoading(true);
    setMessage(null);
    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}/auth/callback?next=/onboarding`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      setLoading(false);
      setMessage({ text: error.message, ok: false });
    }
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
        <div className="mb-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={loading}
            aria-label="Continue with Google"
            className="flex items-center justify-center rounded-xl border border-border bg-bg py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c6.9 0 9.5-4.8 9.5-7.3 0-.5-.05-.9-.12-1.3H12z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={loading}
            aria-label="Continue with Apple"
            className="flex items-center justify-center rounded-xl border border-border bg-bg py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M16.365 12.02c-.02-2.17 1.77-3.21 1.85-3.26-1.01-1.47-2.58-1.67-3.14-1.7-1.34-.13-2.61.78-3.29.78-.68 0-1.73-.76-2.85-.74-1.47.02-2.82.85-3.58 2.16-1.52 2.64-.39 6.55 1.1 8.69.72 1.05 1.58 2.22 2.7 2.18 1.08-.04 1.49-.7 2.8-.7 1.31 0 1.68.7 2.82.68 1.17-.02 1.9-1.06 2.61-2.11.82-1.21 1.16-2.38 1.18-2.44-.03-.01-2.26-.87-2.29-3.45zM14.3 5.37c.59-.72.99-1.71.88-2.71-.85.04-1.88.57-2.49 1.29-.55.63-1.04 1.65-.91 2.61.96.07 1.93-.48 2.52-1.19z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("linkedin_oidc")}
            disabled={loading}
            aria-label="Continue with LinkedIn"
            className="flex items-center justify-center rounded-xl border border-border bg-bg py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/>
            </svg>
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">or continue with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

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
