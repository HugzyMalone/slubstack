"use client";

import { useEffect, useState, useRef } from "react";
import {
  Flame, Zap, Trophy, Lock, Mail, Eye, EyeOff, Camera,
  User, Settings, BarChart3, Users, Volume2, Vibrate, Target,
} from "lucide-react";
import { isMuted as isSoundMuted, setMuted as setSoundMuted } from "@/lib/sound";
import { isHapticMuted, setHapticMuted } from "@/lib/haptics";
import { useStore } from "zustand";
import { mandarinStore, germanStore, spanishStore, vibeCodingStore, brainTrainingStore, triviaStore } from "@/lib/store";
import type { User as SupaUser } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGlobalStore } from "@/lib/globalStore";
import { levelFromXp, xpToNextLevel } from "@/lib/xp";

const TIERS = [
  { min: 50, name: "Obsidian",  color: "#8b5cf6" },
  { min: 40, name: "Emerald",   color: "#10b981" },
  { min: 30, name: "Diamond",   color: "#60d5fa" },
  { min: 20, name: "Platinum",  color: "#b0bec5" },
  { min: 10, name: "Gold",      color: "#f59e0b" },
  { min: 5,  name: "Silver",    color: "#94a3b8" },
  { min: 0,  name: "Bronze",    color: "#cd7c54" },
];
function getTier(level: number) {
  return TIERS.find((t) => level >= t.min) ?? TIERS[TIERS.length - 1];
}
import { useHydrated } from "@/lib/hooks";
import { readNativeLanguage, writeNativeLanguage, type NativeLanguage } from "@/lib/native";
import type { LeaderboardEntry } from "@/lib/supabase/queries";
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

type LBFilter = "overall" | "mandarin" | "german" | "spanish" | "actor-blitz" | "math-blitz";
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

  async function handleGoogle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    markStaySignedIn(stay);
    setLoading(true); setMsg(null);
    const redirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}/auth/callback?next=/onboarding`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setLoading(false);
      setMsg({ text: error.message, ok: false });
    }
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
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-4 lg:static lg:min-h-dvh lg:overflow-visible lg:px-6 lg:py-10">
      <div className="mb-5 text-center select-none lg:mb-8">
        <img src="/slubstack-logo.png" alt="Slubstack" className="mx-auto h-12 w-auto lg:h-20" />
        <h1 className="hidden lg:mt-4 lg:block lg:text-3xl lg:font-bold lg:tracking-tight">slubstack</h1>
        <p className="hidden lg:mt-1.5 lg:block lg:text-sm lg:text-muted">Learn languages. Track progress. Compete.</p>
      </div>

      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-surface lg:max-w-md"
        style={{ boxShadow: "0 8px 40px color-mix(in srgb, var(--fg) 8%, transparent)" }}
      >
        <div className="flex gap-1 border-b border-border p-1.5 lg:p-2">
          {(["signin", "create"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setMsg(null); }}
              className={`flex-1 rounded-2xl py-2 text-sm font-semibold transition-colors lg:py-3 lg:text-[15px] ${
                mode === m ? "bg-bg text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {m === "signin" ? "Log in" : "Create account"}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5 pt-4 lg:px-8 lg:pb-8 lg:pt-6">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="mb-3 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-bg py-2.5 text-sm font-semibold transition-colors hover:bg-surface disabled:opacity-50 lg:mb-4 lg:py-3.5 lg:text-[15px]"
          >
            <svg className="lg:h-5 lg:w-5" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c6.9 0 9.5-4.8 9.5-7.3 0-.5-.05-.9-.12-1.3H12z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mb-3 flex items-center gap-3 lg:mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3 lg:space-y-4">
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email" autoComplete="email" required
                  className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 lg:py-3.5 lg:text-[15px]"
                />
              </div>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" autoComplete="current-password" required
                  className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-10 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 lg:py-3.5 lg:text-[15px]"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                  aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button
                type="submit" disabled={loading || !email || !password}
                className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 lg:py-4 lg:text-[15px]"
                style={{ background: "var(--accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)" }}
              >
                {loading ? "Signing in…" : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3 lg:space-y-4">
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email" autoComplete="email" required
                  className="w-full rounded-xl border border-border bg-bg py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 lg:py-3.5 lg:text-[15px]"
                />
              </div>
              <button
                type="submit" disabled={loading || !email}
                className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 lg:py-4 lg:text-[15px]"
                style={{ background: "var(--accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)" }}
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}

          {msg && (
            <div
              className="mt-3 rounded-xl px-3 py-2 text-xs lg:mt-4 lg:text-sm"
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
      </div>

      <p className="mt-6 hidden text-xs text-muted lg:block">
        Your data is encrypted and never shared.
      </p>
    </div>
  );
}

// ── ProfileTab ─────────────────────────────────────────────────────────────

type LevelCategory = "languages" | "skills" | "brain" | "trivia";

interface MathBests { easy: number; medium: number; hard: number }
interface ActorBestData { score: number; correct?: number; total: number; bestStreak: number; accuracy: number }
interface WordleToday { phase: string; attempts: number }

function ProfileTab({ user, avatar, username, status }: {
  user: SupaUser; avatar: string | null; username: string; status: string | null;
}) {
  const hydrated = useHydrated();
  const streak = useGlobalStore((s) => s.streak);
  const mandarinXp = useStore(mandarinStore, (s) => s.xp);
  const germanXp = useStore(germanStore, (s) => s.xp);
  const spanishXp = useStore(spanishStore, (s) => s.xp);
  const vibeXp = useStore(vibeCodingStore, (s) => s.xp);
  const brainXp = useStore(brainTrainingStore, (s) => s.xp);
  const triviaXp = useStore(triviaStore, (s) => s.xp);

  const [levelTab, setLevelTab] = useState<LevelCategory>("languages");
  const [mathBests, setMathBests] = useState<MathBests>({ easy: 0, medium: 0, hard: 0 });
  const [actorBest, setActorBest] = useState<ActorBestData | null>(null);
  const [wordleToday, setWordleToday] = useState<WordleToday | null>(null);

  useEffect(() => {
    try { setMathBests({ easy: 0, medium: 0, hard: 0, ...JSON.parse(localStorage.getItem("slubstack_mathblitz_best") ?? "{}") }); } catch {}
    try { const s = localStorage.getItem("slubstack_actorblitz_best"); if (s) setActorBest(JSON.parse(s)); } catch {}
    try {
      const raw = localStorage.getItem("slubstack_wordle");
      if (raw) { const p = JSON.parse(raw); setWordleToday({ phase: p.phase, attempts: p.guesses?.length ?? 0 }); }
    } catch {}
  }, []);

  if (!hydrated) return null;

  const xp = mandarinXp + germanXp + spanishXp + vibeXp;
  const level = levelFromXp(xp);
  const { current, next, progress } = xpToNextLevel(xp);
  const tier = getTier(level);

  return (
    <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-[minmax(320px,380px)_1fr] lg:gap-6 lg:items-start">
      {/* Profile card (sticky on desktop) */}
      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden lg:sticky lg:top-24">
        {/* Header section */}
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="flex justify-center mb-4">
            <AvatarDisplay avatar={avatar} size="xl" />
          </div>

          {/* Name + level badge */}
          <div className="flex items-center justify-center gap-2">
            <span className="font-display text-xl font-extrabold leading-none">{username || "Learner"}</span>
            <span
              className="font-display rounded-full px-2.5 py-1 text-[12px] font-extrabold leading-none"
              style={{
                background: `color-mix(in srgb, ${tier.color} 16%, var(--surface))`,
                color: tier.color,
                border: `1.5px solid color-mix(in srgb, ${tier.color} 38%, transparent)`,
                boxShadow: `0 2px 0 color-mix(in srgb, ${tier.color} 30%, transparent)`,
              }}
            >
              {tier.name} · Lv. {level}
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
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, var(--surface))" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
                  background: "linear-gradient(90deg, var(--accent) 0%, var(--game) 100%)",
                  boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 50%, transparent)",
                }}
              />
            </div>
            <div className="mt-2 font-display text-[12px] font-bold text-muted tabular-nums">
              {xp - current} <span className="opacity-50">/</span> {next - current} XP to level {level + 1}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
          <div className="flex flex-col items-center gap-1 py-3 px-1">
            <Flame size={16} strokeWidth={2.5} fill="#ff8a4c" className="text-[#ff6a1c]" />
            <span className="font-display text-base font-extrabold tabular-nums leading-none">{streak}d</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted leading-none">streak</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-3 px-1">
            <Zap size={16} strokeWidth={2.5} className="text-[var(--accent)]" />
            <span className="font-display text-base font-extrabold tabular-nums leading-none">{xp}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted leading-none">XP</span>
          </div>
          <Link
            href="/stats/friends"
            className="flex flex-col items-center gap-1 py-3 px-1 transition-colors hover:bg-[var(--accent-soft)]"
          >
            <Users size={16} strokeWidth={2.5} className="text-[var(--game)]" />
            <span className="font-display text-base font-extrabold leading-none">→</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted leading-none">Friends</span>
          </Link>
        </div>
      </div>

      {/* Activity levels — tabbed */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          {(["languages", "skills", "brain", "trivia"] as const).map((tab) => {
            const labels: Record<LevelCategory, string> = { languages: "Languages", skills: "Skills", brain: "Brain", trivia: "Trivia" };
            const active = levelTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setLevelTab(tab)}
                className="flex-1 py-2.5 text-[11px] font-semibold transition-colors duration-150"
                style={{
                  color: active ? "var(--accent)" : "var(--muted)",
                  background: active ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "transparent",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Languages */}
        {levelTab === "languages" && (
          <div className="divide-y divide-border">
            {[
              { label: "Spanish",  xp: spanishXp,  code: "ES",  iconBg: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)" },
              { label: "Mandarin", xp: mandarinXp, code: "中",  iconBg: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)" },
              { label: "German",   xp: germanXp,   code: "DE",  iconBg: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)" },
            ].map(({ label, xp: langXp, code, iconBg }) => {
              const langLevel = levelFromXp(langXp);
              const langTier = getTier(langLevel);
              const { current: lc, next: ln, progress: lp } = xpToNextLevel(langXp);
              return (
                <div key={label} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-[11px] font-bold" style={{ background: iconBg }}>{code}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: langTier.color }}>{langTier.name} · Lv. {langLevel}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, lp)) * 100}%`, background: langTier.color }} />
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted tabular-nums">{langXp - lc} / {ln - lc} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Skills */}
        {levelTab === "skills" && (
          <div className="divide-y divide-border">
            {[
              { label: "Vibe Coding", xp: vibeXp, code: "🪄", iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
            ].map(({ label, xp: langXp, code, iconBg }) => {
              const langLevel = levelFromXp(langXp);
              const langTier = getTier(langLevel);
              const { current: lc, next: ln, progress: lp } = xpToNextLevel(langXp);
              return (
                <div key={label} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: iconBg }}>{code}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: langTier.color }}>{langTier.name} · Lv. {langLevel}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, lp)) * 100}%`, background: langTier.color }} />
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted tabular-nums">{langXp - lc} / {ln - lc} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Brain Training */}
        {levelTab === "brain" && (() => {
          const bLevel = levelFromXp(brainXp);
          const bTier = getTier(bLevel);
          const { current: bc, next: bn, progress: bp } = xpToNextLevel(brainXp);
          return (
            <div className="divide-y divide-border">
              {/* Level bar */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-[13px] font-bold" style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" }}>🧠</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Brain Training</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: bTier.color }}>{bTier.name} · Lv. {bLevel}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, bp)) * 100}%`, background: bTier.color }} />
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted tabular-nums">{brainXp - bc} / {bn - bc} XP</div>
                </div>
              </div>
              {/* Per-game stats */}
              {[
                { label: "Math Blitz · Easy",   score: mathBests.easy,   color: "#10b981" },
                { label: "Math Blitz · Medium", score: mathBests.medium, color: "#f59e0b" },
                { label: "Math Blitz · Hard",   score: mathBests.hard,   color: "#ef4444" },
              ].map(({ label, score, color }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{label}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: score > 0 ? color : undefined }}>
                    {score > 0 ? score : <span className="text-muted">—</span>}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">Wordle · Today</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: wordleToday?.phase === "won" ? "#10b981" : wordleToday?.phase === "lost" ? "#ef4444" : undefined }}>
                  {wordleToday?.phase === "won"
                    ? `${wordleToday.attempts}/6 ✓`
                    : wordleToday?.phase === "lost"
                    ? "X/6"
                    : wordleToday?.phase === "playing"
                    ? `${wordleToday.attempts}/6…`
                    : <span className="text-muted">—</span>}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Trivia */}
        {levelTab === "trivia" && (() => {
          const tLevel = levelFromXp(triviaXp);
          const tTier = getTier(tLevel);
          const { current: tc, next: tn, progress: tp } = xpToNextLevel(triviaXp);
          return (
            <div className="divide-y divide-border">
              {/* Level bar */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-[13px] font-bold" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)" }}>🎬</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Trivia</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: tTier.color }}>{tTier.name} · Lv. {tLevel}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, tp)) * 100}%`, background: tTier.color }} />
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted tabular-nums">{triviaXp - tc} / {tn - tc} XP</div>
                </div>
              </div>
              {/* Per-game stats */}
              {actorBest ? (
                <>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm">Actor Blitz · Best Score</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--game)" }}>{actorBest.score}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm">Best Accuracy</span>
                    <span className="text-sm font-bold tabular-nums">{actorBest.accuracy}%</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm">Best Streak</span>
                    <span className="text-sm font-bold tabular-nums">{actorBest.bestStreak}</span>
                  </div>
                </>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted">No games played yet</div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── CropModal ──────────────────────────────────────────────────────────────

function CropModal({ src, onConfirm, onCancel }: {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const SIZE = 280;
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  // Render state — drives the img transform
  const [renderState, setRenderState] = useState({ ox: 0, oy: 0, scale: 1 });

  // Live refs — always current even inside pointer event handlers
  const liveRef = useRef({ ox: 0, oy: 0, scale: 1, minScale: 1, natW: 1, natH: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);

  function clamp(ox: number, oy: number, s: number) {
    const { natW, natH } = liveRef.current;
    const maxX = Math.max(0, natW * s / 2 - SIZE / 2);
    const maxY = Math.max(0, natH * s / 2 - SIZE / 2);
    return {
      ox: Math.max(-maxX, Math.min(maxX, ox)),
      oy: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }

  function commit(ox: number, oy: number, scale: number) {
    const clamped = clamp(ox, oy, scale);
    liveRef.current.ox = clamped.ox;
    liveRef.current.oy = clamped.oy;
    liveRef.current.scale = scale;
    setRenderState({ ox: clamped.ox, oy: clamped.oy, scale });
  }

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const minScale = Math.max(SIZE / natW, SIZE / natH);
    liveRef.current = { ox: 0, oy: 0, scale: minScale, minScale, natW, natH };
    setRenderState({ ox: 0, oy: 0, scale: minScale });
    setLoaded(true);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragStart.current = { px: e.clientX, py: e.clientY, ox: liveRef.current.ox, oy: liveRef.current.oy };
      lastPinchDist.current = null;
    } else {
      dragStart.current = null;
      const pts = [...pointers.current.values()];
      lastPinchDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    e.preventDefault();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = [...pointers.current.values()];

    if (pts.length >= 2) {
      // Pinch zoom
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (lastPinchDist.current !== null && lastPinchDist.current > 0) {
        const ratio = dist / lastPinchDist.current;
        const newScale = Math.max(liveRef.current.minScale, liveRef.current.scale * ratio);
        commit(liveRef.current.ox, liveRef.current.oy, newScale);
      }
      lastPinchDist.current = dist;
    } else if (dragStart.current) {
      // Single-finger drag
      const rawOx = dragStart.current.ox + e.clientX - dragStart.current.px;
      const rawOy = dragStart.current.oy + e.clientY - dragStart.current.py;
      commit(rawOx, rawOy, liveRef.current.scale);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    lastPinchDist.current = null;
    if (pointers.current.size === 0) {
      dragStart.current = null;
    } else if (pointers.current.size === 1) {
      // Lift one finger during pinch → resume drag from current position
      const [ptr] = [...pointers.current.values()];
      dragStart.current = { px: ptr.x, py: ptr.y, ox: liveRef.current.ox, oy: liveRef.current.oy };
    }
  }

  function confirm() {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    const img = imgRef.current!;
    const { natW, natH, ox, oy, scale } = liveRef.current;
    ctx.drawImage(img, SIZE / 2 + ox - natW * scale / 2, SIZE / 2 + oy - natH * scale / 2, natW * scale, natH * scale);
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 p-4"
      style={{ backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-3xl bg-surface p-6 space-y-5 shadow-2xl">
        <div>
          <h3 className="text-base font-semibold">Crop photo</h3>
          <p className="text-xs text-muted mt-0.5">Drag to reposition · pinch to zoom</p>
        </div>

        <div className="flex justify-center">
          <div
            className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
            style={{
              width: SIZE, height: SIZE, borderRadius: "50%", touchAction: "none",
              background: "var(--border)",
              boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                // translate centres the image, then we apply offset + scale
                transform: `translate(calc(-50% + ${renderState.ox}px), calc(-50% + ${renderState.oy}px)) scale(${renderState.scale})`,
                transformOrigin: "center",
                maxWidth: "none",
                pointerEvents: "none",
                userSelect: "none",
                opacity: loaded ? 1 : 0,
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-border/40">
            Cancel
          </button>
          <button type="button" onClick={confirm}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}>
            Use photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FeedbackSection (sound + haptics toggles) ─────────────────────────────

function FeedbackToggle({
  icon, label, hint, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors hover:bg-border/30"
    >
      <span className="text-muted shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ background: value ? "var(--accent)" : "var(--border)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
          style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}

function FeedbackSection() {
  const hydrated = useHydrated();
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);

  useEffect(() => {
    setSound(!isSoundMuted());
    setHaptics(!isHapticMuted());
  }, []);

  if (!hydrated) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Audio &amp; feedback</h3>
      </div>
      <div className="divide-y divide-border">
        <FeedbackToggle
          icon={<Volume2 size={16} />}
          label="Sound effects"
          hint="Chimes on correct/wrong, fanfares on milestones"
          value={sound}
          onChange={(v) => { setSound(v); setSoundMuted(!v); }}
        />
        <FeedbackToggle
          icon={<Vibrate size={16} />}
          label="Haptics"
          hint="Vibration feedback on phone (no effect on desktop)"
          value={haptics}
          onChange={(v) => { setHaptics(v); setHapticMuted(!v); }}
        />
      </div>
    </section>
  );
}

// ── WordleSettingsSection (Hard mode) ──────────────────────────────────────

const WORDLE_HARD_KEY = "slubstack_wordle_hard";

function WordleSettingsSection() {
  const hydrated = useHydrated();
  const [hard, setHard] = useState(false);

  useEffect(() => {
    try { setHard(localStorage.getItem(WORDLE_HARD_KEY) === "1"); } catch {}
  }, []);

  if (!hydrated) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Wordle</h3>
      </div>
      <div className="divide-y divide-border">
        <FeedbackToggle
          icon={<Target size={16} />}
          label="Hard mode"
          hint="Revealed hints must be reused in subsequent guesses"
          value={hard}
          onChange={(v) => {
            setHard(v);
            try { localStorage.setItem(WORDLE_HARD_KEY, v ? "1" : "0"); } catch {}
          }}
        />
      </div>
    </section>
  );
}

// ── SettingsTab ────────────────────────────────────────────────────────────

function SettingsTab({
  user,
  avatar,
  username,
  status,
  nativeLanguage,
  onAvatarChange,
  onUsernameChange,
  onStatusChange,
  onNativeLanguageChange,
  onSignOut,
}: {
  user: SupaUser;
  avatar: string | null;
  username: string;
  status: string | null;
  nativeLanguage: NativeLanguage;
  onAvatarChange: (a: string) => void;
  onUsernameChange: (u: string) => void;
  onStatusChange: (s: string | null) => void;
  onNativeLanguageChange: (n: NativeLanguage) => void;
  onSignOut: () => void;
}) {
  const [localUsername, setLocalUsername] = useState(username);
  const [localStatus, setLocalStatus] = useState(status ?? "");
  const [localNative, setLocalNative] = useState<NativeLanguage>(nativeLanguage);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pwResetSending, setPwResetSending] = useState(false);
  const [pwResetMsg, setPwResetMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalUsername(username); }, [username]);
  useEffect(() => { setLocalStatus(status ?? ""); }, [status]);
  useEffect(() => { setLocalNative(nativeLanguage); }, [nativeLanguage]);

  function onFileSelected(file: File) {
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  }

  async function uploadCroppedBlob(blob: Blob) {
    setCropSrc(null);
    setUploading(true);
    setSaveMsg(null);

    const form = new FormData();
    form.append("file", blob, "avatar.jpg");

    const res = await fetch("/api/avatar", { method: "POST", body: form });
    const data = (await res.json()) as { url?: string; error?: string };

    if (!res.ok || data.error) {
      setUploading(false);
      setSaveMsg(data.error ?? "Upload failed");
      return;
    }

    onAvatarChange(data.url!);
    localStorage.setItem("slubstack_avatar", data.url!);
    window.dispatchEvent(new CustomEvent("slubstack_avatar_changed", { detail: data.url }));
    setSaveMsg("Photo updated!");
    setUploading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: localUsername,
        avatar,
        status: localStatus,
        nativeLanguage: localNative,
      }),
    });
    const payload = (await res.json()) as { error?: string; ok?: boolean };

    if (payload.error) { setSaving(false); setSaveMsg(payload.error); return; }

    onUsernameChange(localUsername);
    onStatusChange(localStatus.trim() || null);
    onNativeLanguageChange(localNative);
    writeNativeLanguage(localNative);
    localStorage.setItem("slubstack_username", localUsername);
    localStorage.setItem("slubstack_avatar", avatar ?? "");
    setSaving(false);
    setSaveMsg("Saved!");
  }

  async function sendPasswordReset() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user.email) return;
    setPwResetSending(true);
    setPwResetMsg(null);
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/stats`
      : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
    setPwResetSending(false);
    setPwResetMsg(error
      ? { text: error.message, ok: false }
      : { text: `Password reset link sent to ${user.email}`, ok: true }
    );
  }

  return (
    <div className="space-y-5 lg:max-w-2xl">
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={(blob) => { URL.revokeObjectURL(cropSrc); uploadCroppedBlob(blob); }}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
        />
      )}
      {/* Avatar section */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Profile photo</h3>
          <p className="text-xs text-muted mt-0.5">Upload a photo to personalise your profile</p>
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
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelected(f); e.target.value = ""; }} />
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="rounded-xl border border-border bg-bg px-4 py-2 text-sm font-medium transition-colors hover:bg-border/50 disabled:opacity-50">
              {uploading ? "Uploading…" : "Upload photo"}
            </button>
          </div>
        </div>
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

            {/* Native language */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Answer language <span className="normal-case font-normal text-muted/60">— shown for card meanings</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "en", label: "English" },
                  { v: "de", label: "Deutsch" },
                ] as const).map(({ v, label }) => {
                  const active = localNative === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLocalNative(v)}
                      className="rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
                      style={active
                        ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
                        : { borderColor: "var(--border)", background: "var(--bg)", color: "var(--fg)" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                Answer in {localNative === "de" ? "German (where available, otherwise English)" : "English"}.
              </p>
            </div>

          </div>
        </section>

        {saveMsg && (
          <p className="text-sm rounded-xl px-3 py-2"
            style={{
              background: saveMsg === "Saved!" || saveMsg === "Photo updated!"
                ? "color-mix(in srgb, #10b981 10%, transparent)"
                : "color-mix(in srgb, #e11d48 10%, transparent)",
              color: saveMsg === "Saved!" || saveMsg === "Photo updated!"
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

      {/* Audio & feedback */}
      <FeedbackSection />

      {/* Wordle settings */}
      <WordleSettingsSection />

      {/* Account actions */}
      <section className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Account</h3>
        </div>
        <div className="divide-y divide-border">
          {/* Signed in as */}
          <div className="px-4 py-3.5 flex items-center gap-3">
            <Mail size={14} className="text-muted shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted">Signed in as</p>
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          </div>

          {/* Forgot password */}
          <div className="px-4 py-3.5">
            <button
              type="button"
              onClick={sendPasswordReset}
              disabled={pwResetSending}
              className="text-sm font-medium transition-colors hover:text-[var(--accent)] disabled:opacity-50"
            >
              {pwResetSending ? "Sending reset link…" : "Forgot password"}
            </button>
            {pwResetMsg && (
              <p className="mt-2 text-xs rounded-lg px-3 py-2"
                style={{
                  background: pwResetMsg.ok
                    ? "color-mix(in srgb, #10b981 10%, transparent)"
                    : "color-mix(in srgb, #e11d48 10%, transparent)",
                  color: pwResetMsg.ok ? "#059669" : "#e11d48",
                }}>
                {pwResetMsg.text}
              </p>
            )}
          </div>

          {/* Sign out */}
          <div className="px-4 py-3.5">
            <button
              onClick={onSignOut}
              className="text-sm font-medium text-[var(--danger)] transition-colors hover:opacity-80"
            >
              Sign out
            </button>
          </div>
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
  { id: "math-blitz", label: "Math Blitz" },
];

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7c54"];

type GameLBEntry = { username: string; avatar: string | null; score: number; correct: number; total?: number };

function LanguageLeaderboard({ language }: { language: "mandarin" | "german" | "spanish" }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const labels = {
    mandarin: { code: "中", name: "Mandarin", accent: "#e11d48" },
    german: { code: "DE", name: "German", accent: "#f97316" },
    spanish: { code: "ES", name: "Spanish", accent: "#c2410c" },
  };
  const { name, accent } = labels[language];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?lang=${language}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [language]);

  if (loading) return <LeaderboardSkeleton />;
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted text-center">
        No {name} scores yet — complete a lesson to appear here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={14} className="text-muted" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">{name} — Ranked by XP</span>
      </div>
      {entries.map((entry, index) => (
        <Link key={entry.userId} href={`/stats/user/${entry.userId}`}
          className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors active:scale-[0.99]"
          style={{
            borderColor: index === 0 ? `color-mix(in srgb, ${accent} 30%, var(--border))` : "color-mix(in srgb, var(--fg) 8%, transparent)",
            background: index === 0 ? `color-mix(in srgb, ${accent} 4%, var(--surface))` : "var(--surface)",
          }}>
          <div className="w-7 shrink-0 flex justify-center">
            {index < 3 ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: RANK_COLORS[index] }}>{index + 1}</span>
            ) : (
              <span className="text-xs font-semibold text-muted tabular-nums">#{index + 1}</span>
            )}
          </div>
          <AvatarDisplay avatar={entry.avatar} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{entry.username}</div>
            <div className="mt-0.5 flex gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Zap size={10} className="text-amber-400" />{entry.xp} XP</span>
              <span className="inline-flex items-center gap-1"><Flame size={10} className="text-orange-400" />{entry.streak}d streak</span>
            </div>
          </div>
          <span className="text-muted text-xs shrink-0">→</span>
        </Link>
      ))}
    </div>
  );
}

function MathBlitzLeaderboard() {
  const [diff, setDiff] = useState<"easy" | "medium" | "hard">("medium");
  const [entries, setEntries] = useState<GameLBEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === diff) return;
    fetchedRef.current = diff;
    setLoading(true);
    fetch(`/api/scores/math-blitz?difficulty=${diff}`)
      .then((r) => r.json())
      .then(({ leaderboard }) => setEntries(leaderboard ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [diff]);

  const DIFF_COLORS: Record<string, string> = { easy: "#10b981", medium: "#f59e0b", hard: "#e11d48" };
  const DIFF_LABEL: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-muted" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Math Blitz Rankings</span>
        </div>
        <div className="flex gap-1">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button key={d} onClick={() => { setEntries(null); setDiff(d); }}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: diff === d ? DIFF_COLORS[d] : "var(--border)",
                color: diff === d ? "#fff" : "var(--muted)",
              }}>
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>
      </div>
      {loading || entries === null ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted text-center">
          No scores yet for {DIFF_LABEL[diff]} — be the first!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
              style={{
                borderColor: i === 0 ? "color-mix(in srgb, #f59e0b 30%, var(--border))" : "color-mix(in srgb, var(--fg) 8%, transparent)",
                background: i === 0 ? "color-mix(in srgb, #f59e0b 4%, var(--surface))" : "var(--surface)",
              }}>
              <div className="w-7 shrink-0 flex justify-center">
                {i < 3 ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: RANK_COLORS[i] }}>{i + 1}</span>
                ) : (
                  <span className="text-xs font-semibold text-muted tabular-nums">#{i + 1}</span>
                )}
              </div>
              <AvatarDisplay avatar={entry.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{entry.username}</div>
                <div className="mt-0.5 text-xs text-muted">{entry.correct} correct</div>
              </div>
              <div className="text-lg font-black tabular-nums" style={{ color: DIFF_COLORS[diff] }}>
                {entry.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActorBlitzLeaderboard() {
  const [entries, setEntries] = useState<GameLBEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scores/actor-blitz")
      .then((r) => r.json())
      .then(({ leaderboard }) => setEntries(leaderboard ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || entries === null) return <LeaderboardSkeleton />;

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted text-center">
        No scores yet — play Actor Blitz to appear here!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={14} className="text-muted" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Actor Blitz Rankings</span>
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
          style={{
            borderColor: i === 0 ? "color-mix(in srgb, #a21caf 30%, var(--border))" : "color-mix(in srgb, var(--fg) 8%, transparent)",
            background: i === 0 ? "color-mix(in srgb, #a21caf 4%, var(--surface))" : "var(--surface)",
          }}>
          <div className="w-7 shrink-0 flex justify-center">
            {i < 3 ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: RANK_COLORS[i] }}>{i + 1}</span>
            ) : (
              <span className="text-xs font-semibold text-muted tabular-nums">#{i + 1}</span>
            )}
          </div>
          <AvatarDisplay avatar={entry.avatar} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{entry.username}</div>
            <div className="mt-0.5 text-xs text-muted">{entry.correct}/{entry.total ?? "?"} correct</div>
          </div>
          <div className="text-lg font-black tabular-nums" style={{ color: "var(--game)" }}>
            {entry.score}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardTab({
  entries, loading, filter, onFilter,
}: {
  entries: LeaderboardEntry[]; loading: boolean; filter: LBFilter;
  onFilter: (f: LBFilter) => void;
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
          ? <LeaderboardSkeleton />
          : entries.length === 0
            ? <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">No entries yet — finish a session to appear here.</div>
            : <XPLeaderboard entries={entries} />
      )}
      {(filter === "mandarin" || filter === "german" || filter === "spanish") && (
        <LanguageLeaderboard key={filter} language={filter} />
      )}
      {filter === "actor-blitz" && <ActorBlitzLeaderboard />}
      {filter === "math-blitz" && <MathBlitzLeaderboard />}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 animate-pulse">
          <div className="w-7 shrink-0 flex justify-center">
            <div className="h-6 w-6 rounded-full bg-border" />
          </div>
          <div className="h-8 w-8 shrink-0 rounded-full bg-border" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-border" />
            <div className="h-2.5 w-36 rounded bg-border" />
          </div>
        </div>
      ))}
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
        <Link key={entry.userId} href={`/stats/user/${entry.userId}`}
          className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors active:scale-[0.99]"
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
          <AvatarDisplay avatar={entry.avatar} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{entry.username}</div>
            <div className="mt-0.5 flex gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Zap size={10} className="text-amber-400" />{entry.xp} XP</span>
              <span className="inline-flex items-center gap-1"><Flame size={10} className="text-orange-400" />{entry.streak}d streak</span>
            </div>
          </div>
          <span className="text-muted text-xs shrink-0">→</span>
        </Link>
      ))}
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
  const [authChecked, setAuthChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage>("en");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [lbFilter, setLbFilter] = useState<LBFilter>("overall");
  const lbFetchedRef = useRef(false);

  // Eagerly load avatar + username from cache so they appear instantly
  useEffect(() => {
    const cachedAvatar = localStorage.getItem("slubstack_avatar");
    if (cachedAvatar) setAvatar(cachedAvatar);
    const cachedUsername = localStorage.getItem("slubstack_username");
    if (cachedUsername) setUsername(cachedUsername);
    setNativeLanguage(readNativeLanguage());
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setAuthChecked(true); return; }

    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      if (u && shouldSignOut()) { supabase.auth.signOut(); setUser(null); setAuthChecked(true); return; }
      setUser(u);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
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
        const uname = data.profile.username ?? "";
        setUsername(uname);
        const av = data.profile.avatar ?? null;
        setAvatar(av);
        setStatus(data.profile.status ?? null);
        const nl: NativeLanguage = data.profile.nativeLanguage === "de" ? "de" : "en";
        setNativeLanguage(nl);
        writeNativeLanguage(nl);
        if (uname) localStorage.setItem("slubstack_username", uname);
        if (av) localStorage.setItem("slubstack_avatar", av);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  // Prefetch leaderboard in background once user is authenticated
  useEffect(() => {
    if (!user || lbFetchedRef.current) return;
    lbFetchedRef.current = true;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries ?? []); setLeaderboardLoaded(true); })
      .catch(() => {});
  }, [user]);

  function openLeaderboard() {
    setTab("leaderboard");
    // Fallback fetch if prefetch didn't succeed
    if (!leaderboardLoaded) {
      setLeaderboardLoaded(true);
      fetch("/api/leaderboard").then((r) => r.json()).then((d) => setEntries(d.entries ?? [])).catch(() => {});
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

  if (!authChecked) return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4 animate-pulse space-y-3">
      <div className="h-10 rounded-2xl bg-border/30" />
      <div className="rounded-3xl border border-border bg-surface p-6 space-y-4">
        <div className="flex justify-center"><div className="h-24 w-24 rounded-full bg-border" /></div>
        <div className="mx-auto h-5 w-32 rounded bg-border" />
        <div className="mx-auto h-3 w-24 rounded bg-border" />
        <div className="h-1.5 w-full rounded-full bg-border" />
      </div>
    </div>
  );
  if (!user) return <AuthPage />;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-4 lg:max-w-[1100px] lg:px-8 lg:pt-10 lg:pb-16">
      {/* Tabs — constrained width on desktop so they don't stretch */}
      <div className="mb-5 flex gap-1 rounded-2xl bg-border/30 p-1 lg:max-w-md lg:mb-8">
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
          onFilter={setLbFilter} />
      )}
      {tab === "settings" && (
        <SettingsTab user={user} avatar={avatar} username={username} status={status}
          nativeLanguage={nativeLanguage}
          onAvatarChange={setAvatar} onUsernameChange={setUsername}
          onStatusChange={setStatus} onNativeLanguageChange={setNativeLanguage}
          onSignOut={handleSignOut} />
      )}
    </div>
  );
}
