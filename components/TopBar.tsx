"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Sparkles, User } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { levelFromXp } from "@/lib/xp";
import { useHydrated } from "@/lib/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PandaImage } from "@/components/Panda";

export function TopBar() {
  const hydrated = useHydrated();
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const level = hydrated ? levelFromXp(xp) : 0;
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Read cached avatar instantly — no network call on every navigation
    const cached = localStorage.getItem("slubstack_avatar");
    if (cached) setAvatar(cached);

    // getSession reads from localStorage — instant, no network
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
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-xl lg:max-w-none items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold tracking-tight lg:hidden">
          <PandaImage size={28} />
          slubstack
        </Link>

        <div className="flex items-center gap-1.5">
          <Chip icon={<Flame size={13} className="text-orange-500" />} label={hydrated ? streak : 0} title="Streak" />
          <Chip icon={<Sparkles size={13} className="text-amber-500" />} label={hydrated ? xp : 0} title="XP" />
          <Link
            href="/stats"
            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            title="Level"
          >
            Lv {level}
          </Link>
          <Link
            href="/stats"
            className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border transition hover:border-[var(--accent)]"
            aria-label="Profile"
          >
            {avatar ? (
              <span className="text-base leading-none">{avatar}</span>
            ) : (
              <User size={13} className="text-muted" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Chip({ icon, label, title }: { icon: React.ReactNode; label: number; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-1 text-[11px] tabular-nums"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </span>
  );
}
