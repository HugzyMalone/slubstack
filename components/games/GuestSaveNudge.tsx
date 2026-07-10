"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { hasActiveSession } from "@/lib/supabase/browser";
import { track } from "@/lib/analytics";

const DISMISS_KEY = "slub_guest_nudge_dismissed";
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function GuestSaveNudge({ game }: { game: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function decide() {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - new Date(dismissedAt).getTime() < DISMISS_WINDOW_MS) return;
      if (await hasActiveSession()) return;
      if (cancelled) return;
      setShow(true);
      track("guest_nudge_shown", { game });
    }
    decide();
    return () => { cancelled = true; };
  }, [game]);

  if (!show) return null;

  return (
    <div
      className="mt-4 rounded-2xl border border-border bg-[var(--accent-soft)] p-4"
    >
      <div className="flex items-center gap-2">
        <Flame size={18} strokeWidth={2.5} className="text-[var(--accent)]" />
        <h3 className="text-sm font-semibold">Save your streak</h3>
      </div>
      <p className="mt-1 text-sm text-muted">
        You&apos;re playing as a guest. Create a free account to keep your streak, XP and stats across devices.
      </p>
      <Link
        href="/stats"
        onClick={() => track("guest_nudge_clicked", { game })}
        className="mt-3 block rounded-xl py-3 text-center text-sm font-semibold text-white shadow-sm"
        style={{ background: "var(--accent)" }}
      >
        Create free account
      </Link>
      <button
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, new Date().toISOString());
          setShow(false);
        }}
        className="mt-2 w-full py-1 text-center text-sm text-muted hover:text-fg"
      >
        Maybe later
      </button>
    </div>
  );
}
