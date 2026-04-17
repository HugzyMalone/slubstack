"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Zap, User } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function TopBar() {
  const hydrated = useHydrated();
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const [_avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const cached = localStorage.getItem("slubstack_avatar");
    if (cached) setAvatar(cached);

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { setAvatar(null); localStorage.removeItem("slubstack_avatar"); return; }
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
      if (!session?.user) { setAvatar(null); localStorage.removeItem("slubstack_avatar"); return; }
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

    return () => subscription.unsubscribe();
  }, []);

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

        {/* Wordmark — mobile only (sidebar shows it on desktop) */}
        <Link
          href="/"
          className="lg:hidden text-[15px] font-semibold tracking-tight select-none"
          style={{ letterSpacing: "-0.02em" }}
        >
          slubstack
        </Link>

        {/* Right: stats + profile */}
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

          {/* XP */}
          <div className="flex items-center gap-1" title="XP">
            <Zap size={12} strokeWidth={2} className="text-amber-400" />
            <span className="text-[12px] font-semibold tabular-nums">{hydrated ? xp : 0}</span>
          </div>

          {/* Profile */}
          <Link
            href="/stats"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150"
            style={{
              border: "1px solid color-mix(in srgb, var(--fg) 12%, transparent)",
              background: "color-mix(in srgb, var(--fg) 5%, transparent)",
            }}
            aria-label="Profile"
          >
            <User size={13} strokeWidth={1.5} className="text-muted" />
          </Link>
        </div>
      </div>
    </header>
  );
}
