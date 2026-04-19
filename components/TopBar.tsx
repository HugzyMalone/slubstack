"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flame, User, ChevronLeft } from "lucide-react";
import { useGameStore, mandarinStore, germanStore, spanishStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { useGlobalStore, globalStore } from "@/lib/globalStore";
import { levelFromXp } from "@/lib/xp";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// Tier thresholds (level required to reach that tier)
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
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const hideBack = isHome || pathname === "/stats" || pathname.endsWith("/review");

  // One-time sync: push the max streak from any language store into globalStore
  // This fixes any historical divergence between per-language and global streaks
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
        background: "color-mix(in srgb, var(--bg) 72%, transparent)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid color-mix(in srgb, var(--fg) 7%, transparent)",
      }}
    >
      <div style={{ height: "env(safe-area-inset-top)" }} />
      <div className="mx-auto flex h-13 max-w-xl lg:max-w-none items-center justify-between px-4 lg:px-6">

        {/* Wordmark or back button — mobile only */}
        {isHome ? (
          <Link
            href="/"
            className="lg:hidden text-[15px] font-semibold tracking-tight select-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            slubstack
          </Link>
        ) : !hideBack ? (
          <button
            onClick={() => router.back()}
            className="lg:hidden flex items-center gap-0.5 text-xs text-muted/60 hover:text-muted transition-colors -ml-1 px-1 py-1"
          >
            <ChevronLeft size={15} />
            Back
          </button>
        ) : <div />}

        {/* Right: stats + profile (hidden when not logged in) */}
        {loggedIn && (
          <div className="flex items-center gap-3 ml-auto">
            {/* Streak */}
            <div className="flex items-center gap-1" title="Streak">
              <Flame size={12} strokeWidth={2} className="text-orange-400" />
              <span className="text-[12px] font-semibold tabular-nums">{hydrated ? streak : 0}</span>
            </div>

            {/* Divider */}
            <span
              className="h-3 w-px shrink-0"
              style={{ background: "color-mix(in srgb, var(--fg) 12%, transparent)" }}
            />

            {/* Level (tier-coloured) */}
            <div
              className="flex items-center gap-0.5"
              title={`${tier.name} · Level ${level}`}
            >
              <span className="text-[10px] font-bold tabular-nums" style={{ color: tier.color }}>
                Lv.
              </span>
              <span className="text-[12px] font-semibold tabular-nums" style={{ color: tier.color }}>
                {level}
              </span>
            </div>

            {/* Profile */}
            <Link
              href="/stats"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full overflow-hidden transition-opacity duration-150 hover:opacity-80"
              style={{
                border: "1px solid color-mix(in srgb, var(--fg) 12%, transparent)",
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
                <span className="text-sm leading-none">{avatar}</span>
              ) : (
                <User size={13} strokeWidth={1.5} className="text-muted" />
              )}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
