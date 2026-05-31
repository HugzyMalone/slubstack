"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { getSprintAdapter } from "@/lib/games/registry";
import type { GhostRun } from "@/lib/multiplayer/types";

type LoadState = "loading" | "ready" | "notfound" | "unsupported";

export default function DuelPage() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId;
  const router = useRouter();
  const [run, setRun] = useState<GhostRun | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let active = true;
    fetch(`/api/ghost/run/${runId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (!d || !d.gameKind) {
          setState("notfound");
          return;
        }
        if (!getSprintAdapter(d.gameKind)) {
          setState("unsupported");
          return;
        }
        setRun({
          id: d.id,
          gameKind: d.gameKind,
          level: d.level,
          seed: d.seed,
          score: d.score,
          correct: d.correct,
          timeline: d.timeline,
          displayName: d.displayName ?? "A friend",
          avatarUrl: d.avatarUrl ?? null,
        });
        setState("ready");
      })
      .catch(() => {
        if (active) setState("notfound");
      });
    return () => {
      active = false;
    };
  }, [runId]);

  if (state === "loading") {
    return <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Loading duel…</div>;
  }

  if (state === "notfound" || state === "unsupported") {
    return (
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <h1 className="text-2xl font-bold tracking-tight">Ghost duel</h1>
        <p className="mt-2 text-sm text-muted">
          {state === "unsupported"
            ? "This game can't be duelled yet."
            : "This duel link is invalid or has expired."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Back to Slubstack
        </button>
      </div>
    );
  }

  const adapter = getSprintAdapter(run!.gameKind)!;
  return <MultiplayerShell adapter={adapter} mode="ghost" ghostRun={run!} />;
}
