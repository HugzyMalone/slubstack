"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildReviewSession } from "@/lib/session";
import { useGameStore } from "@/lib/store";
import { SessionRunner } from "@/components/SessionRunner";
import { isDue } from "@/lib/srs";
import { Panda } from "@/components/Panda";

export function ReviewClient() {
  const srs = useGameStore((s) => s.srs);
  const [hydrated, setHydrated] = useState(false);
  const [running, setRunning] = useState(false);
  useEffect(() => setHydrated(true), []);

  const dueCount = useMemo(() => {
    if (!hydrated) return 0;
    const now = Date.now();
    return Object.values(srs).filter((s) => isDue(s, now)).length;
  }, [srs, hydrated]);

  const items = useMemo(() => {
    if (!hydrated || !running) return [];
    return buildReviewSession(srs, 10);
  }, [srs, hydrated, running]);

  if (!hydrated) return null;

  if (running) {
    return <SessionRunner items={items} exitHref="/review" />;
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-24 pt-12 text-center">
      <Panda mood={dueCount > 0 ? "idle" : "sleeping"} size={120} />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Review</h1>
      {dueCount > 0 ? (
        <>
          <p className="mt-2 text-muted">
            You have <span className="font-semibold text-fg">{dueCount}</span> card
            {dueCount === 1 ? "" : "s"} due for review.
          </p>
          <button
            onClick={() => setRunning(true)}
            className="mt-8 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] active:scale-[0.98]"
          >
            Start review ({Math.min(10, dueCount)} cards)
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-muted">
            Nothing due right now. Try a new unit or come back tomorrow.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block w-full rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-border/40"
          >
            Back to lessons
          </Link>
        </>
      )}
    </div>
  );
}
