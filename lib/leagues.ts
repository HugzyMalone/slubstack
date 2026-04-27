"use client";

export function pushLeagueXp(amount: number): void {
  if (amount <= 0 || typeof fetch === "undefined") return;
  void fetch("/api/leagues/xp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
    keepalive: true,
  }).catch(() => {});
}
