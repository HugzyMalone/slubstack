"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Sparkles, User } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { levelFromXp } from "@/lib/xp";
import { useHydrated } from "@/lib/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function TopBar() {
  const hydrated = useHydrated();
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const level = hydrated ? levelFromXp(xp) : 0;
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      fetch("/api/profile", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.profile?.avatar) setAvatar(d.profile.avatar); })
        .catch(() => {});
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) { setAvatar(null); return; }
      if (event === "SIGNED_IN") {
        fetch("/api/profile", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : null)
          .then((d) => { if (d?.profile?.avatar) setAvatar(d.profile.avatar); })
          .catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            学
          </span>
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
