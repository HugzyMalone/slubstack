"use client";

import { globalStore } from "@/lib/globalStore";

export function pushLeagueXp(amount: number): void {
  if (amount <= 0 || typeof fetch === "undefined") return;
  // Finishing a game is a qualifying activity, so it keeps the streak alive the
  // same way completing a lesson does.
  globalStore.getState().recordActivity();
  void fetch("/api/leagues/xp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
    keepalive: true,
  }).catch(() => {});
}
