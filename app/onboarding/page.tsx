"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const STAY_KEY = "slubstack_stay_signed_in";
function markStaySignedIn() {
  localStorage.setItem(STAY_KEY, "1");
  sessionStorage.removeItem(STAY_KEY);
}

const ANIMALS = [
  "🐼","🦊","🐨","🐯","🦁","🐸","🐧","🦆",
  "🐺","🦝","🐻","🦉","🦋","🐙","🦜","🐬",
  "🦒","🦓","🐘","🐲",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState<string>("🐼");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { router.replace("/stats"); return; }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/stats"); return; }
      setUser(data.user);
      setReady(true);
    });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    const profileRes = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, avatar }),
    });
    const profilePayload = (await profileRes.json()) as { error?: string; ok?: boolean };

    if (profilePayload.error) {
      setLoading(false);
      setError(profilePayload.error);
      return;
    }

    if (password) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) {
          setLoading(false);
          setError(pwError.message);
          return;
        }
      }
    }

    localStorage.setItem("slubstack_avatar", avatar);
    markStaySignedIn();
    router.replace("/");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center text-5xl">{avatar}</div>
          <h1 className="text-2xl font-bold tracking-tight">Set up your account</h1>
          <p className="mt-1.5 text-sm text-muted">Choose an avatar, pick a name, set a password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
              Pick an avatar
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
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-name"
              maxLength={20}
              required
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
            <p className="mt-1 text-xs text-muted">3–20 characters, shown on the leaderboard.</p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              minLength={6}
              required
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
            <p className="mt-1 text-xs text-muted">You'll use this to sign in next time.</p>
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button
            type="submit"
            disabled={loading || username.trim().length < 3 || password.length < 6}
            className="w-full rounded-xl bg-[var(--accent)] py-4 text-sm font-bold text-[var(--accent-fg)] shadow-md shadow-[var(--accent)]/20 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Get started"}
          </button>
        </form>
      </div>
    </div>
  );
}
