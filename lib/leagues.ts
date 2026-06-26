"use client";

import { globalStore } from "@/lib/globalStore";
import { hasActiveSession } from "@/lib/supabase/browser";

export function pushLeagueXp(amount: number): void {
  if (amount <= 0 || typeof fetch === "undefined") return;
  // Finishing a game is a qualifying activity, so it keeps the streak alive the
  // same way completing a lesson does.
  globalStore.getState().recordActivity();
  // Skip the POST for guests — it would 401 and log a red console error.
  void hasActiveSession().then((ok) => {
    if (!ok) return;
    void fetch("/api/leagues/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
      keepalive: true,
    }).catch(() => {});
  });
}
