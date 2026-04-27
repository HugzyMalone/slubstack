"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flame, User, ChevronLeft, Snowflake, Target } from "lucide-react";
import { useGameStore, mandarinStore, germanStore, spanishStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { useGlobalStore, globalStore } from "@/lib/globalStore";
import { levelFromXp } from "@/lib/xp";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { QuestDrawer } from "@/components/QuestDrawer";
import { questsStore, useQuestsStore } from "@/lib/questsStore";
import { dailyQuestsFor } from "@/lib/quests";

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

export function TopBar() {
  const hydrated = useHydrated();
  const xp = useGameStore((s) => s.xp);
  const streak = useGlobalStore((s) => s.streak);
  const streakFreezes = useGlobalStore((s) => s.streakFreezes);
  const questDateKey = useQuestsStore((s) => s.dateKey);
  const questCompleted = useQuestsStore((s) => s.completed);
  const [questsOpen, setQuestsOpen] = useState(false);

  useEffect(() => {
    questsStore.getState().rollIfStale();
  }, []);

  const todaysQuests = hydrated ? dailyQuestsFor(questDateKey) : [];
  const hasOutstandingQuest = todaysQuests.some((q) => !questCompleted[q.id]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const hideBack = isHome || pathname === "/stats" || pathname.endsWith("/review");

  useEffect(() => {
    const manState = mandarinStore.getState();
    const deState = germanStore.getState();
    const esState = spanishStore.getState();
    const globalState = globalStore.getState();

    const candidates = [
      { streak: manState.streak, date: manState.lastActiveDate },
      { streak: deState.streak, date: deState.lastActiveDate },
      { streak: esState.streak, date: esState.lastActiveDate },
    ];
    const best = candidates.reduce((a, b) => a.streak >= b.streak ? a : b);

    if (best.streak > globalState.streak) {
      globalStore.setState({ streak: best.streak, lastActiveDate: best.date });
    }
  }, []);

  function isAvatarUrl(v: string | null): v is string {
    return !!v && (v.startsWith("http") || v.startsWith("data:") || v.startsWith("/"));
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const cached = localStorage.getItem("slubstack_avatar");
    if (cached) setAvatar(cached);

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { setAvatar(null); setLoggedIn(false); localStorage.removeItem("slubstack_avatar"); return; }
      setLoggedIn(true);
      if (!cached) {
        fetch("/api/profile", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            const a = d?.profile?.avatar;
            if (a) { setAvatar(a); localStorage.setItem("slubstack_avatar", a); }
          })
          .catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) { setAvatar(null); setLoggedIn(false); localStorage.removeItem("slubstack_avatar"); return; }
      setLoggedIn(true);
      if (event === "SIGNED_IN") {
        fetch("/api/profile", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            const a = d?.profile?.avatar;
            if (a) { setAvatar(a); localStorage.setItem("slubstack_avatar", a); }
          })
          .catch(() => {});
      }
    });

    const onAvatarChanged = (e: Event) => setAvatar((e as CustomEvent<string>).detail);
    window.addEventListener("slubstack_avatar_changed", onAvatarChanged);

    return () => { subscription.unsubscribe(); window.removeEventListener("slubstack_avatar_changed", onAvatarChanged); };
  }, []);

  const level = hydrated ? levelFromXp(xp) : 0;
  const tier = getTier(level);

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "color-mix(in srgb, var(--bg) 78%, transparent)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid color-mix(in srgb, var(--fg) 6%, transparent)",
      }}
    >
      <div style={{ height: "env(safe-area-inset-top)" }} />
      <div className="flex h-14 w-full items-center justify-between px-4 lg:px-8">

        {isHome ? (
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/slubstack-logo.png" alt="" className="h-7 w-7 rounded-lg object-contain" />
            <span
              className="font-display text-[20px] font-extrabold"
              style={{
                letterSpacing: "-0.03em",
                background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              slubstack
            </span>
          </Link>
        ) : !hideBack ? (
          <button
            onClick={() => router.back()}
            className="lg:hidden flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-fg/70 hover:text-fg transition-colors -ml-1"
            style={{
              background: "color-mix(in srgb, var(--fg) 4%, transparent)",
              border: "1px solid color-mix(in srgb, var(--fg) 6%, transparent)",
            }}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
            Back
          </button>
        ) : <div />}

        {loggedIn && (
          <div className="flex items-center gap-2 ml-auto">
            {/* Streak chip */}
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{
                background: "color-mix(in srgb, #ff8a4c 14%, var(--surface))",
                border: "1.5px solid color-mix(in srgb, #ff8a4c 30%, transparent)",
              }}
              title={
                hydrated && streakFreezes > 0
                  ? `${streak}-day streak · ${streakFreezes} shield${streakFreezes === 1 ? "" : "s"}`
                  : "Streak"
              }
            >
              <Flame size={13} strokeWidth={2.5} className="text-[#ff6a1c]" fill="#ff8a4c" />
              <span className="font-display text-[13px] font-extrabold tabular-nums text-[#c2410c]">
                {hydrated ? streak : 0}
              </span>
              {hydrated && streakFreezes > 0 && (
                <span
                  className="ml-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                  style={{ background: "color-mix(in srgb, #60d5fa 22%, transparent)" }}
                >
                  <Snowflake size={10} strokeWidth={2.5} className="text-[#0284c7]" />
                  <span className="font-display text-[10px] font-extrabold tabular-nums text-[#0284c7]">
                    {streakFreezes}
                  </span>
                </span>
              )}
            </div>

            {/* Quests button */}
            <button
              type="button"
              onClick={() => setQuestsOpen(true)}
              className="relative flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-100 active:scale-95"
              style={{
                background: "color-mix(in srgb, var(--accent) 14%, var(--surface))",
                border: "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
              aria-label="Daily quests"
              title="Daily quests"
            >
              <Target size={13} strokeWidth={2.5} className="text-[var(--accent)]" />
              {hydrated && hasOutstandingQuest && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
                  style={{ background: "var(--game)", border: "1.5px solid var(--bg)" }}
                />
              )}
            </button>

            {/* Level chip */}
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{
                background: `color-mix(in srgb, ${tier.color} 14%, var(--surface))`,
                border: `1.5px solid color-mix(in srgb, ${tier.color} 36%, transparent)`,
              }}
              title={`${tier.name} · Level ${level}`}
            >
              <span className="text-[10px] font-bold tabular-nums" style={{ color: tier.color, letterSpacing: "0.04em" }}>
                LV
              </span>
              <span className="font-display text-[13px] font-extrabold tabular-nums" style={{ color: tier.color }}>
                {level}
              </span>
            </div>

            <Link
              href="/stats"
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full overflow-hidden transition-transform duration-150 active:scale-95"
              style={{
                border: "2px solid var(--surface)",
                boxShadow: "0 0 0 2px color-mix(in srgb, var(--accent) 38%, transparent), var(--shadow-bouncy)",
                background: avatar && !isAvatarUrl(avatar)
                  ? "color-mix(in srgb, var(--accent) 15%, var(--surface))"
                  : "color-mix(in srgb, var(--fg) 5%, transparent)",
              }}
              aria-label="Profile"
            >
              {isAvatarUrl(avatar) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="avatar" className="h-full w-full object-cover object-center" />
              ) : avatar ? (
                <span className="text-base leading-none">{avatar}</span>
              ) : (
                <User size={14} strokeWidth={2} className="text-muted" />
              )}
            </Link>
          </div>
        )}
      </div>
      <QuestDrawer open={questsOpen} onClose={() => setQuestsOpen(false)} />
    </header>
  );
}
