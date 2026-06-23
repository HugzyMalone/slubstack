"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { signInAsGuest } from "@/lib/multiplayer/guest";

type GuestGateProps = {
  title: string;
  description: string;
  backPath: string;
  onGuestAction: (user: User) => void;
};

export function GuestGate({ title, description, backPath, onGuestAction }: GuestGateProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleGuest() {
    setBusy(true);
    const user = await signInAsGuest();
    if (user) {
      onGuestAction(user);
    } else {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-10 pb-8">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <p className="mt-2 text-xs text-muted">
        Playing as a guest — sign in to save your stats and challenge back.
      </p>
      <button
        onClick={handleGuest}
        disabled={busy}
        className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {busy ? "Starting…" : "Play as guest"}
      </button>
      <button
        onClick={() => router.push("/stats")}
        className="mt-3 block w-full text-center text-sm font-medium text-muted hover:text-fg transition-colors"
      >
        Sign in to save your stats
      </button>
      <button
        onClick={() => router.push(backPath)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
      >
        <ArrowLeft size={15} /> Back
      </button>
    </div>
  );
}
