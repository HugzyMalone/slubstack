"use client";

import { useMemo, useState } from "react";
import { buildReviewSession, buildPracticeSession } from "@/lib/session";
import { getLanguageContent, type Language } from "@/lib/content";
import { useGameStore } from "@/lib/store";
import { SessionRunner } from "@/components/SessionRunner";
import { INITIAL_SRS, isDue } from "@/lib/srs";
import type { Card } from "@/lib/content";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { useHydrated, useNow } from "@/lib/hooks";
import Link from "next/link";

type SortBy = "newest" | "oldest" | "best" | "worst";

const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: "worst",   label: "Worst first" },
  { id: "best",    label: "Best first" },
  { id: "newest",  label: "Newest" },
  { id: "oldest",  label: "Oldest" },
];

export function ReviewClient({ lang = "mandarin" }: { lang?: Language }) {
  const srs = useGameStore((s) => s.srs);
  const seenCardIds = useGameStore((s) => s.seenCardIds);
  const hydrated = useHydrated();
  const now = useNow(hydrated);
  const [running, setRunning] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("worst");

  const content = getLanguageContent(lang);
  const learnHref = lang === "mandarin" ? "/" : `/${lang}`;
  const exitHref = lang === "mandarin" ? "/review" : `/${lang}/review`;

  const dueCount = useMemo(() => {
    if (!hydrated) return 0;
    return Object.values(srs).filter((s) => isDue(s, now)).length;
  }, [hydrated, now, srs]);

  const items = useMemo(() => {
    if (!hydrated || !running) return [];
    const due = buildReviewSession(srs, { cards: content.cards, allowedInteractions: content.allowedInteractions }, 10);
    if (due.length > 0) return due;
    return buildPracticeSession(seenCardIds, { cards: content.cards, allowedInteractions: content.allowedInteractions }, 10);
  }, [srs, hydrated, running, content, seenCardIds]);

  const learnedCards = useMemo(() => {
    if (!hydrated) return [];
    const cards = seenCardIds
      .map((id) => content.cards.find((c) => c.id === id))
      .filter((c): c is Card => !!c);

    if (sortBy === "oldest") return cards;
    if (sortBy === "newest") return [...cards].reverse();
    if (sortBy === "best") {
      return [...cards].sort((a, b) => {
        const ea = srs[a.id]?.ease ?? INITIAL_SRS.ease;
        const eb = srs[b.id]?.ease ?? INITIAL_SRS.ease;
        return eb - ea;
      });
    }
    // worst: lowest ease first
    return [...cards].sort((a, b) => {
      const ea = srs[a.id]?.ease ?? INITIAL_SRS.ease;
      const eb = srs[b.id]?.ease ?? INITIAL_SRS.ease;
      return ea - eb;
    });
  }, [hydrated, seenCardIds, content, sortBy, srs]);

  if (!hydrated) return null;

  const character = lang === "german" ? "bear" : "panda";

  if (running) {
    return <SessionRunner items={items} exitHref={exitHref} reviewHref={exitHref} character={character} lang={lang} />;
  }

  if (learnedCards.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 pb-24 pt-4 text-center">
        <div className="relative mx-auto h-[45vh] w-full">
          {character === "bear" ? <Bear mood="sleeping" fill /> : <Panda mood="sleeping" fill />}
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
      <div className="mb-5 flex items-center justify-between rounded-2xl border px-4 py-3.5"
        style={dueCount > 0
          ? { borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)", background: "color-mix(in srgb, var(--accent) 8%, transparent)" }
          : { borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="text-sm">
          {dueCount > 0 ? (
            <><span className="font-semibold">{dueCount}</span> card{dueCount === 1 ? "" : "s"} due for review</>
          ) : (
            <span className="text-muted">Practice to earn XP</span>
          )}
        </div>
        <button
          onClick={() => setRunning(true)}
          className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          Practice
        </button>
      </div>

      {/* Sort controls */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold tracking-tight">Flashcards</span>
          <span className="ml-2 text-xs text-muted">{learnedCards.length} words</span>
        </div>
        <div className="flex gap-1">
          {SORT_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSortBy(id)}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150"
              style={sortBy === id
                ? { background: "var(--accent)", color: "var(--accent-fg)" }
                : { background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: "var(--muted)" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {learnedCards.map((card) => (
          <FlipCard key={card.id} card={card} ease={srs[card.id]?.ease} />
        ))}
      </div>
    </div>
  );
}

function FlipCard({ card, ease }: { card: Card; ease?: number }) {
  const [flipped, setFlipped] = useState(false);

  // colour-code the dot: green (ease>2.2), amber (1.6–2.2), red (<1.6)
  const dotColor = !ease ? "#94a3b8"
    : ease > 2.2 ? "#10b981"
    : ease > 1.6 ? "#f59e0b"
    : "#e11d48";

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="relative h-28 w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition-all active:scale-[0.97]"
      style={{ perspective: "600px" }}
    >
      {/* ease indicator dot */}
      <span
        className="absolute top-2 right-2 h-2 w-2 rounded-full z-10"
        style={{ background: dotColor }}
      />
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
