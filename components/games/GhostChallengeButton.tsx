"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import { toast } from "sonner";
import { buildShareCard, shareOrCopy } from "@/lib/share";
import type { BotTickEvent } from "@/lib/multiplayer/bot";
import type { GameKind } from "@/lib/multiplayer/types";

type Props = {
  gameKind: GameKind;
  gameDisplayName: string;
  level: number;
  seed: string;
  score: number;
  correct: number;
  timeline: BotTickEvent[];
};

export function GhostChallengeButton({
  gameKind,
  gameDisplayName,
  level,
  seed,
  score,
  correct,
  timeline,
}: Props) {
  const [runId, setRunId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChallenge() {
    setBusy(true);
    try {
      let id = runId;
      if (!id) {
        const res = await fetch("/api/ghost/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game_kind: gameKind, level, seed, score, correct, timeline }),
        });
        const data = (await res.json()) as { runId?: string; error?: string };
        if (!res.ok || !data.runId) {
          toast.error("Couldn't create the duel — try again");
          return;
        }
        id = data.runId;
        setRunId(id);
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "https://slubstack.com";
      const card = buildShareCard({
        title: `Beat my ${gameDisplayName} run on Slubstack`,
        score,
        correct,
        footerTag: `${origin}/duel/${id}`,
      });
      const result = await shareOrCopy(card);
      if (result === "shared") toast.success("Challenge sent");
      else if (result === "copied") toast.success("Duel link copied");
      else toast.error("Couldn't share — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleChallenge}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-bold transition-colors hover:bg-border/30 disabled:opacity-60"
    >
      <Swords size={15} />
      Challenge a friend
    </button>
  );
}
