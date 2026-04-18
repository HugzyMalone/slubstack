"use client";

import { useMemo, useState } from "react";
import { buildReviewSession } from "@/lib/session";
import { getLanguageContent, type Language } from "@/lib/content";
import { useGameStore } from "@/lib/store";
import { SessionRunner } from "@/components/SessionRunner";
import { isDue } from "@/lib/srs";
import type { Card } from "@/lib/content";
import { Panda } from "@/components/Panda";
import { useHydrated, useNow } from "@/lib/hooks";
import Link from "next/link";

export function ReviewClient({ lang = "mandarin" }: { lang?: Language }) {
  const srs = useGameStore((s) => s.srs);
  const seenCardIds = useGameStore((s) => s.seenCardIds);
  const hydrated = useHydrated();
  const now = useNow(hydrated);
  const [running, setRunning] = useState(false);

  const content = getLanguageContent(lang);
  const learnHref = lang === "mandarin" ? "/" : `/${lang}`;
  const exitHref = lang === "mandarin" ? "/review" : `/${lang}/review`;

  const dueCount = useMemo(() => {
    if (!hydrated) return 0;
    return Object.values(srs).filter((s) => isDue(s, now)).length;
  }, [hydrated, now, srs]);

  const items = useMemo(() => {
    if (!hydrated || !running) return [];
    return buildReviewSession(srs, content, 10);
  }, [srs, hydrated, running, content]);

  const learnedCards = useMemo(() => {
    if (!hydrated) return [];
    return seenCardIds
      .map((id) => content.cards.find((c) => c.id === id))
      .filter((c): c is Card => !!c);
  }, [hydrated, seenCardIds, content]);

  if (!hydrated) return null;

  if (running) {
    return <SessionRunner items={items} exitHref={exitHref} reviewHref={exitHref} />;
  }

  if (learnedCards.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 pb-24 pt-4 text-center">
        <div className="relative mx-auto h-[45vh] w-full">
          <Panda mood="sleeping" fill />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Flashcards</h1>
        <p className="mt-2 text-muted">No words learned yet. Complete a lesson to unlock flashcards.</p>
        <Link
          href={learnHref}
          className="mt-8 inline-block w-full rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-border/40"
        >
          Start learning
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      {dueCount > 0 ? (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/40 px-4 py-3.5">
          <div className="text-sm">
            <span className="font-semibold">{dueCount}</span> card{dueCount === 1 ? "" : "s"} due for review
          </div>
          <button
            onClick={() => setRunning(true)}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Practice
          </button>
        </div>
      ) : null}

      <div className="mb-3 flex items-baseline gap-2">
        <h1 className="text-lg font-bold tracking-tight">Flashcards</h1>
        <span className="text-xs text-muted">{learnedCards.length} words learned</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {learnedCards.map((card) => (
          <FlipCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

function FlipCard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="relative h-28 w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition-all active:scale-[0.97]"
      style={{ perspective: "600px" }}
    >
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="hanzi text-2xl font-medium">{card.hanzi}</span>
          <span className="text-xs text-muted">{card.pinyin}</span>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
          }}
        >
          <span className="text-sm font-semibold">{card.english}</span>
          {card.note && (
            <span className="text-center text-[10px] leading-tight text-muted">{card.note}</span>
          )}
        </div>
      </div>
    </button>
  );
}
