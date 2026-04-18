"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Flame, Zap, Trophy, Lock, Mail, Eye, EyeOff, Camera,
  BookOpen, Target, Sparkles, ChevronDown, CheckCircle,
  User, Settings, BarChart3, Clipboard, ClipboardCheck,
} from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGameStore } from "@/lib/store";
import { levelFromXp, xpToNextLevel } from "@/lib/xp";
import { ALL_CARDS } from "@/lib/content";
import { isDue } from "@/lib/srs";
import { useHydrated, useNow } from "@/lib/hooks";
import type { LeaderboardEntry } from "@/lib/supabase/queries";
import type { ActorBest } from "@/components/trivia/ActorBlitz";
import Link from "next/link";

// ── helpers ────────────────────────────────────────────────────────────────

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

function isAvatarUrl(v: string | null | undefined): v is string {
  return !!v && (v.startsWith("http") || v.startsWith("data:") || v.startsWith("/"));
}

const ANIMALS = [
  "🐼","🦊","🐨","🐯","🦁","🐸","🐧","🦆",
  "🐺","🦝","🐻","🦉","🦋","🐙","🦜","🐬",
  "🦒","🦓","🐘","🐲",
];

type LBFilter = "overall" | "mandarin" | "german" | "spanish" | "actor-blitz";
type Tab = "profile" | "leaderboard" | "settings";

// ── AvatarDisplay ──────────────────────────────────────────────────────────

function AvatarDisplay({
  avatar,
  size = "md",
  className = "",
}: {
  avatar: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const dim = { sm: "h-8 w-8", md: "h-12 w-12", lg: "h-20 w-20", xl: "h-24 w-24" }[size];
  const text = { sm: "text-sm", md: "text-2xl", lg: "text-4xl", xl: "text-5xl" }[size];

  if (isAvatarUrl(avatar)) {
    return (
      <div className={`${dim} shrink-0 rounded-full overflow-hidden bg-border ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="avatar" className="h-full w-full object-cover object-center" />
      </div>
    );
  }

  return (
    <div
      className={`${dim} shrink-0 rounded-full flex items-center justify-center ${className}`}
      style={{ background: "color-mix(in srgb, var(--accent) 15%, var(--surface))" }}
    >
      {avatar ? (
        <span className={text}>{avatar}</span>
      ) : (
        <User size={size === "sm" ? 13 : size === "md" ? 20 : 32} className="text-muted" />
      )}
    </div>
  );
}

// ── Auth page (unauthenticated) ────────────────────────────────────────────

const FEATURES = [
  "Free forever — no credit card needed",
  "Progress saved and synced to the cloud",
  "Compete on the global leaderboard",
  "Daily streak & XP tracking across all games",
];

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [stay, setStay] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        Configure Supabase environment variables to enable sign-in.
      </div>
    );
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) markStaySignedIn(stay);
    setLoading(false);
    if (error) setMsg({ text: error.message, ok: false });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true); setMsg(null);
    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}/auth/callback?next=/onboarding`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    setMsg(
      error
        ? { text: error.message, ok: false }
        : { text: "Check your inbox — a sign-in link is on its way.", ok: true },
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-56px-60px)] lg:min-h-[calc(100dvh-56px)] flex-col items-center justify-center px-4 py-8">
      {/* Brand */}
      <div className="mb-8 text-center select-none">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white text-2xl font-black shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--accent) 0%, #ea580c 100%)" }}
        >
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight">slubstack</h1>
        <p className="mt-1 text-sm text-muted">Learn languages. Track progress. Compete.</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-surface shadow-xl shadow-black/5"
        style={{ boxShadow: "0 8px 40px color-mix(in srgb, var(--fg) 8%, transparent)" }}
      >
        {/* Mode toggle */}
        <div className="flex rounded-3xl rounded-b-none p-1.5 gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
          {(["signin", "create"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setMsg(null); }}
              className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold transition-all duration-150 ${
                mode === m
                  ? "bg-bg text-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-5">
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email" required
                    className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password" autoComplete="current-password" required
                    className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-10 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                    aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={stay} onChange={(e) => setStay(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--accent)]" />
                <span className="text-sm text-muted">Stay signed in on this device</span>
              </label>

              <button
                type="submit" disabled={loading || !email || !password}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)" }}
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>

              <button type="button" onClick={() => { setMode("create"); setMsg(null); }}
                className="w-full pt-0.5 text-center text-sm text-muted hover:text-fg transition-colors">
                New to Slubstack? Create a free account
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="rounded-xl border border-border bg-bg/50 px-4 py-3 text-xs text-muted leading-relaxed">
                We&apos;ll email you a magic link. No password needed to get started — you can set one later.
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Your email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email" required
                    className="w-full rounded-xl border border-border bg-bg py-3 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading || !email}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)" }}
              >
                {loading ? "Sending…" : "Send magic link →"}
              </button>

              <button type="button" onClick={() => { setMode("signin"); setMsg(null); }}
                className="w-full pt-0.5 text-center text-sm text-muted hover:text-fg transition-colors">
                Already have an account? Sign in
              </button>
            </form>
          )}

          {msg && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-sm"
              style={{
                background: msg.ok
                  ? "color-mix(in srgb, #10b981 10%, transparent)"
                  : "color-mix(in srgb, #e11d48 10%, transparent)",
                color: msg.ok ? "#059669" : "#e11d48",
              }}
            >
              {msg.text}
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div className="rounded-b-3xl border-t border-border px-6 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Lock size={11} /> Your data is encrypted and never shared.
          </p>
        </div>
      </div>

      {/* Feature list */}
      <ul className="mt-8 w-full max-w-xs space-y-2.5">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── ProfileTab ─────────────────────────────────────────────────────────────

function ProfileTab({ user, avatar, username, status }: {
  user: SupaUser; avatar: string | null; username: string; status: string | null;
}) {
  const hydrated = useHydrated();
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const seen = useGameStore((s) => s.seenCardIds);
  const completed = useGameStore((s) => s.completedUnits);
  const srs = useGameStore((s) => s.srs);
  const now = useNow(hydrated);

  if (!hydrated) return null;

  const level = levelFromXp(xp);
  const { current, next, progress } = xpToNextLevel(xp);
  const due = Object.values(srs).filter((s) => isDue(s, now)).length;
  const totalCards = ALL_CARDS.length;

  const stats = [
    { icon: <Flame size={15} className="text-orange-400" />, value: `${streak}d`, label: "streak" },
    { icon: <Zap size={15} className="text-amber-400" />, value: String(xp), label: "xp" },
    { icon: <BookOpen size={15} className="text-sky-400" />, value: String(seen.length), label: `of ${totalCards}` },
    { icon: <Target size={15} className="text-emerald-400" />, value: String(completed.length), label: "units" },
  ];

  return (
    <div className="space-y-3">
      {/* Profile card */}
      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden">
        {/* Header section */}
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="flex justify-center mb-4">
            <AvatarDisplay avatar={avatar} size="xl" />
          </div>

          {/* Name + level badge */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold leading-none">{username || "Learner"}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white leading-none"
              style={{ background: "var(--accent)" }}
            >
              Lv. {level}
            </span>
          </div>

          {/* Status */}
          {status ? (
            <p className="mt-1.5 text-sm text-muted italic">&ldquo;{status}&rdquo;</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted/50">No status set</p>
          )}

          {/* XP bar */}
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, background: "var(--accent)" }}
              />
            </div>
            <div className="mt-1.5 text-xs text-muted tabular-nums">
              {xp - current} <span className="opacity-50">/</span> {next - current} XP to level {level + 1}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 border-t border-border divide-x divide-border">
          {stats.map(({ icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-3.5 px-1">
              {icon}
              <span className="text-sm font-bold tabular-nums leading-none">{value}</span>
              <span className="text-[10px] text-muted leading-none">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {due > 0 && (
        <Link href="/review"
          className="flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-colors duration-150"
          style={{ borderColor: "color-mix(in srgb, var(--accent) 30%, var(--border))", background: "color-mix(in srgb, var(--accent) 4%, var(--surface))" }}>
          <div className="text-sm">
            <span className="font-semibold">{due}</span> flashcard{due === 1 ? "" : "s"} ready to review
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>Review</span>
        </Link>
      )}
    </div>
  );
}

// ── SettingsTab ────────────────────────────────────────────────────────────

function SettingsTab({
  user,
  avatar,
  username,
  status,
  onAvatarChange,
  onUsernameChange,
  onStatusChange,
  onSignOut,
}: {
  user: SupaUser;
  avatar: string | null;
  username: string;
  status: string | null;
  onAvatarChange: (a: string) => void;
  onUsernameChange: (u: string) => void;
  onStatusChange: (s: string | null) => void;
  onSignOut: () => void;
}) {
  const [localUsername, setLocalUsername] = useState(username);
  const [localStatus, setLocalStatus] = useState(status ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reset = useGameStore((s) => s.reset);

  useEffect(() => { setLocalUsername(username); }, [username]);
  useEffect(() => { setLocalStatus(status ?? ""); }, [status]);

  async function uploadPhoto(file: File) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    setUploading(true);
    setSaveMsg(null);

    const ext = file.type.includes("png") ? "png" : "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      setUploading(false);
      setSaveMsg(error.message.includes("Bucket") || error.message.includes("bucket")
        ? "Photo upload is not configured. Ask the admin to create an 'avatars' storage bucket in Supabase."
        : error.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: localUsername || username, avatar: publicUrl }),
    });

    if (res.ok) {
      onAvatarChange(publicUrl);
      localStorage.setItem("slubstack_avatar", publicUrl);
      setSaveMsg("Photo updated!");
    } else {
      setSaveMsg("Failed to save photo.");
    }
    setUploading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: localUsername, avatar, status: localStatus }),
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

    onUsernameChange(localUsername);
    onStatusChange(localStatus.trim() || null);
    localStorage.setItem("slubstack_avatar", avatar ?? "");
    setSaving(false);
    setSaveMsg("Saved!");
    setNewPassword("");
  }

  async function setEmojiAvatar(emoji: string) {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: localUsername || username, avatar: emoji }),
    });
    if (res.ok) {
      onAvatarChange(emoji);
      localStorage.setItem("slubstack_avatar", emoji);
      setShowEmojiPicker(false);
      setSaveMsg("Avatar updated!");
    }
  }

  return (
    <div className="space-y-5">
      {/* Avatar section */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Profile photo</h3>
          <p className="text-xs text-muted mt-0.5">Upload a photo or choose an avatar</p>
        </div>
        <div className="px-4 py-4 flex items-center gap-4">
          <div className="relative group">
            <AvatarDisplay avatar={avatar} size="xl" />
            <div
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {uploading
                ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={20} className="text-white" />
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="rounded-xl border border-border bg-bg px-4 py-2 text-sm font-medium transition-colors hover:bg-border/50 disabled:opacity-50">
              {uploading ? "Uploading…" : "Upload photo"}
            </button>
            <button onClick={() => setShowEmojiPicker((v) => !v)}
              className="rounded-xl border border-border bg-bg px-4 py-2 text-sm font-medium transition-colors hover:bg-border/50">
              Choose emoji
            </button>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="px-4 pb-4 border-t border-border pt-3">
            <div className="grid grid-cols-10 gap-1.5">
              {ANIMALS.map((animal) => (
                <button key={animal} type="button" onClick={() => setEmojiAvatar(animal)}
                  className={`flex h-9 w-full items-center justify-center rounded-xl text-xl transition-all ${
                    avatar === animal
                      ? "ring-2 ring-[var(--accent)]"
                      : "bg-border/40 hover:bg-border/70"
                  }`}
                  style={avatar === animal ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)" } : {}}>
                  {animal}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Profile form */}
      <form onSubmit={saveProfile} className="space-y-5">
        <section className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Account details</h3>
          </div>
          <div className="px-4 py-4 space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Email</label>
              <div className="w-full rounded-xl border border-border bg-border/20 px-4 py-3 text-sm text-muted select-all">
                {user.email}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="s-username">
                Username
              </label>
              <input id="s-username" value={localUsername}
                onChange={(e) => setLocalUsername(e.target.value)}
                placeholder="your-name" maxLength={20}
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="s-status">
                Status <span className="normal-case font-normal text-muted/60">— shown on your profile</span>
              </label>
              <div className="relative">
                <textarea id="s-status" value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value.slice(0, 100))}
                  placeholder="What are you learning today?"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted/50 tabular-nums pointer-events-none">
                  {localStatus.length}/100
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="s-password">
                New password
              </label>
              <div className="relative">
                <input id="s-password" type={showPw ? "text" : "password"}
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current" minLength={6}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 pr-10 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {saveMsg && (
          <p className="text-sm rounded-xl px-3 py-2"
            style={{
              background: saveMsg === "Saved!" || saveMsg === "Photo updated!" || saveMsg === "Avatar updated!"
                ? "color-mix(in srgb, #10b981 10%, transparent)"
                : "color-mix(in srgb, #e11d48 10%, transparent)",
              color: saveMsg === "Saved!" || saveMsg === "Photo updated!" || saveMsg === "Avatar updated!"
                ? "#059669" : "#e11d48",
            }}>
            {saveMsg}
          </p>
        )}

        <button type="submit" disabled={saving || localUsername.trim().length < 3}
          className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "var(--accent)" }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Account actions */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Account</h3>
        </div>
        <div className="px-4 py-3 space-y-2">
          <button onClick={onSignOut}
            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-border/30">
            <span>Sign out</span>
            <span className="text-xs text-muted">{user.email}</span>
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border overflow-hidden" style={{ borderColor: "color-mix(in srgb, var(--danger) 25%, var(--border))" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "color-mix(in srgb, var(--danger) 25%, var(--border))" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--danger)" }}>Danger zone</h3>
        </div>
        <div className="px-4 py-3">
          <button type="button"
            onClick={() => { if (confirm("Reset all progress? This cannot be undone.")) reset(); }}
            className="text-sm text-muted hover:text-[var(--danger)] transition-colors">
            Reset all progress
          </button>
        </div>
      </section>
    </div>
  );
}

// ── Leaderboard ────────────────────────────────────────────────────────────

const LB_FILTERS: { id: LBFilter; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "mandarin", label: "Mandarin" },
  { id: "german", label: "German" },
  { id: "spanish", label: "Spanish" },
  { id: "actor-blitz", label: "Actor Blitz" },
];

function LeaderboardTab({
  entries, loading, filter, onFilter, actorBest,
}: {
  entries: LeaderboardEntry[]; loading: boolean; filter: LBFilter;
  onFilter: (f: LBFilter) => void; actorBest: ActorBest | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {LB_FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => onFilter(id)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
            style={filter === id
              ? { background: "var(--accent)", color: "var(--accent-fg)" }
              : { background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: "var(--muted)" }}>
            {label}
          </button>
        ))}
      </div>

      {filter === "overall" && (
        loading
          ? <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">Loading…</div>
          : entries.length === 0
            ? <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">No entries yet — finish a session to appear here.</div>
            : <XPLeaderboard entries={entries} />
      )}
      {(filter === "mandarin" || filter === "german" || filter === "spanish") && (
        <LanguagePlaceholder language={filter} />
      )}
      {filter === "actor-blitz" && <ActorBlitzSection best={actorBest} />}
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
        <div key={entry.userId}
          className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
          style={{
            borderColor: index === 0 ? "color-mix(in srgb, #f59e0b 30%, var(--border))" : "color-mix(in srgb, var(--fg) 8%, transparent)",
            background: index === 0 ? "color-mix(in srgb, #f59e0b 4%, var(--surface))" : "var(--surface)",
          }}>
          <div className="w-7 shrink-0 flex justify-center">
            {index < 3 ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: RANK_COLORS[index] }}>{index + 1}</span>
            ) : (
              <span className="text-xs font-semibold text-muted tabular-nums">#{index + 1}</span>
            )}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase"
            style={{ background: "color-mix(in srgb, var(--fg) 10%, transparent)", color: "var(--fg)" }}>
            {entry.username.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{entry.username}</div>
            <div className="mt-0.5 flex gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Zap size={10} className="text-amber-400" />{entry.xp} XP</span>
              <span className="inline-flex items-center gap-1"><Flame size={10} className="text-orange-400" />{entry.streak}d streak</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LanguagePlaceholder({ language }: { language: "mandarin" | "german" | "spanish" }) {
  const labels = {
    mandarin: { code: "中", name: "Mandarin", accent: "#e11d48" },
    german: { code: "DE", name: "German", accent: "#f97316" },
    spanish: { code: "ES", name: "Spanish", accent: "#c2410c" },
  };
  const { code, name, accent } = labels[language];
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: accent }}>{code}</div>
      <div className="text-sm font-semibold">{name} leaderboard</div>
      <div className="mt-1 text-xs text-muted leading-relaxed">Per-language rankings are coming soon.<br />Keep learning to build your score!</div>
    </div>
  );
}

function ActorBlitzSection({ best }: { best: ActorBest | null }) {
  if (!best) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.5" /><line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
          </svg>
        </div>
        <div className="text-sm font-semibold">No score yet</div>
        <div className="mt-1 text-xs text-muted">Play Actor Blitz to set a personal best</div>
        <Link href="/trivia/actors"
          className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--game)" }}>Play now</Link>
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
      <Link href="/trivia/actors"
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-colors active:scale-[0.98]"
        style={{ background: "var(--game)" }}>Beat your score →</Link>
      <p className="text-center text-xs text-muted">Global Actor Blitz rankings — coming soon</p>
    </div>
  );
}

// ── TabBtn ─────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold transition-all duration-150 ${
        active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
      }`}>
      <span className={active ? "opacity-100" : "opacity-50"}>{icon}</span>
      {children}
    </button>
  );
}

// ── ProfileClient (main) ───────────────────────────────────────────────────

export function ProfileClient() {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<SupaUser | null>(null);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [lbFilter, setLbFilter] = useState<LBFilter>("overall");
  const [actorBest, setActorBest] = useState<ActorBest | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      if (u && shouldSignOut()) { supabase.auth.signOut(); setUser(null); return; }
      setUser(u);
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
        setAvatar(data.profile.avatar ?? null);
        setStatus(data.profile.status ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  function openLeaderboard() {
    setTab("leaderboard");
    if (!leaderboardLoaded) {
      setLeaderboardLoaded(true);
      fetch("/api/leaderboard").then((r) => r.json()).then((d) => setEntries(d.entries ?? [])).catch(() => {});
      try {
        const s = localStorage.getItem("slubstack_actorblitz_best");
        if (s) setActorBest(JSON.parse(s));
      } catch {}
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    localStorage.removeItem(STAY_KEY);
    sessionStorage.removeItem(STAY_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setTab("profile");
  }

  if (!user) return <AuthPage />;

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-2xl bg-border/30 p-1">
        <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} icon={<User size={14} />}>
          Profile
        </TabBtn>
        <TabBtn active={tab === "leaderboard"} onClick={openLeaderboard} icon={<BarChart3 size={14} />}>
          Leaderboard
        </TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings size={14} />}>
          Settings
        </TabBtn>
      </div>

      {tab === "profile" && <ProfileTab user={user} avatar={avatar} username={username} status={status} />}
      {tab === "leaderboard" && (
        <LeaderboardTab entries={entries} loading={!leaderboardLoaded} filter={lbFilter}
          onFilter={setLbFilter} actorBest={actorBest} />
      )}
      {tab === "settings" && (
        <SettingsTab user={user} avatar={avatar} username={username} status={status}
          onAvatarChange={setAvatar} onUsernameChange={setUsername}
          onStatusChange={setStatus} onSignOut={handleSignOut} />
      )}
    </div>
  );
}
