import type { Card, LanguageContent } from "@/lib/content";
import { ALL_CARDS, getCardsForUnit } from "@/lib/content";
import { INITIAL_SRS, isDue, type SrsState } from "@/lib/srs";
import { shuffle } from "@/lib/utils";

export type InteractionKind = "flip" | "multiple-choice" | "build" | "type" | "match";

export type SessionItem = {
  card: Card;
  kind: InteractionKind;
  distractors?: Card[];
};

// Lesson sessions: no flip cards — only interactive games
const LESSON_ORDER: InteractionKind[] = [
  "multiple-choice",
  "type",
  "build",
  "match",
  "multiple-choice",
  "type",
  "multiple-choice",
  "match",
  "type",
  "multiple-choice",
];

// Flashcard review: includes flip for self-rated review
const REVIEW_ORDER: InteractionKind[] = [
  "flip",
  "multiple-choice",
  "type",
  "flip",
  "multiple-choice",
  "flip",
  "type",
  "multiple-choice",
  "flip",
  "type",
];

function pickDistractors(correct: Card, pool: Card[], n = 3): Card[] {
  const candidates = pool.filter((c) => c.id !== correct.id);
  const sameCat = candidates.filter((c) => c.category === correct.category);
  const others = candidates.filter((c) => c.category !== correct.category);
  const chosen: Card[] = [];
  for (const list of [shuffle(sameCat), shuffle(others)]) {
    for (const c of list) {
      if (chosen.length >= n) break;
      if (!chosen.find((x) => x.english === c.english)) chosen.push(c);
    }
  }
  return chosen.slice(0, n);
}

export function buildUnitSession(
  unitId: string,
  srs: Record<string, SrsState>,
  content?: Pick<LanguageContent, "cards" | "getCardsForUnit" | "allowedInteractions">,
  size = 10,
): SessionItem[] {
  const allCards = content?.cards ?? ALL_CARDS;
  const getCards = content?.getCardsForUnit ?? getCardsForUnit;
  const allowed: InteractionKind[] = content?.allowedInteractions ?? ["multiple-choice", "build", "type", "match"];

  const interactionOrder = LESSON_ORDER.filter((k) => allowed.includes(k));

  const unitCards = getCards(unitId);
  const now = Date.now();

  const newCards = unitCards.filter((c) => !srs[c.id] || srs[c.id].reps === 0);
  const dueFromUnit = unitCards.filter(
    (c) => srs[c.id] && isDue(srs[c.id] ?? INITIAL_SRS, now),
  );

  const globalDue = Object.entries(srs)
    .filter(([id, s]) => isDue(s, now) && !unitCards.find((c) => c.id === id))
    .map(([id]) => allCards.find((c) => c.id === id))
    .filter((c): c is Card => !!c);

  const newTarget = Math.min(7, newCards.length);
  const dueTarget = size - newTarget;

  const pool = [
    ...shuffle(newCards).slice(0, newTarget),
    ...shuffle(dueFromUnit).slice(0, dueTarget),
    ...shuffle(globalDue),
  ].slice(0, size);

  while (pool.length < size && unitCards.length > 0) {
    pool.push(shuffle(unitCards)[0]);
  }

  return pool.map((card, i) => {
    const kind = interactionOrder[i % interactionOrder.length];
    return kind === "multiple-choice" || kind === "match"
      ? { card, kind, distractors: pickDistractors(card, allCards) }
      : { card, kind };
  });
}

export function buildReviewSession(
  srs: Record<string, SrsState>,
  content?: Pick<LanguageContent, "cards">,
  size = 10,
): SessionItem[] {
  const allCards = content?.cards ?? ALL_CARDS;
  const now = Date.now();
  const due = Object.entries(srs)
    .filter(([, s]) => isDue(s, now))
    .map(([id]) => allCards.find((c) => c.id === id))
    .filter((c): c is Card => !!c);

  const pool = shuffle(due).slice(0, size);

  return pool.map((card, i) => {
    const kind = REVIEW_ORDER[i % REVIEW_ORDER.length];
    return kind === "multiple-choice"
      ? { card, kind, distractors: pickDistractors(card, allCards) }
      : { card, kind };
  });
}
