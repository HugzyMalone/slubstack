import type { Card, LanguageContent, InteractionKind } from "@/lib/content";
import { ALL_CARDS, getCardsForUnit } from "@/lib/content";
import { INITIAL_SRS, isDue, type SrsState } from "@/lib/srs";
import { shuffle } from "@/lib/utils";

export type { InteractionKind };

export type SessionItem = {
  card: Card;
  kind: InteractionKind;
  distractors?: Card[];
};

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

const REVIEW_ORDER: InteractionKind[] = [
  "multiple-choice",
  "type",
  "multiple-choice",
  "match",
  "type",
  "multiple-choice",
  "type",
  "multiple-choice",
  "match",
  "type",
];

// P = primary (unit's grammar kind). Bias strong toward P, with MC sprinkled in.
const GRAMMAR_ORDER_TEMPLATE = (P: InteractionKind): InteractionKind[] => [
  P, P, "multiple-choice", P, P, "multiple-choice", P, "multiple-choice", P, P,
];

/** Returns true if the card has the metadata needed to render `kind`. */
export function cardSupportsKind(card: Card, kind: InteractionKind): boolean {
  if (card.recognitionOnly && (kind === "build" || kind === "char-from-pinyin")) return false;
  if (kind === "gender-pick") return !!card.gender;
  if (kind === "case-pick") return !!card.cases && Object.keys(card.cases).length > 0;
  if (kind === "plural-drill") return !!card.plural;
  if (kind === "conjugate") return !!card.conjugations;
  if (kind === "measure-pick") return !!card.measureWord;
  return true;
}

function pickKind(card: Card, desired: InteractionKind, fallback: InteractionKind = "multiple-choice"): InteractionKind {
  return cardSupportsKind(card, desired) ? desired : fallback;
}

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

function needsDistractors(kind: InteractionKind): boolean {
  return (
    kind === "multiple-choice" ||
    kind === "match" ||
    kind === "case-pick" ||
    kind === "char-from-pinyin"
  );
}

export function buildUnitSession(
  unitId: string,
  srs: Record<string, SrsState>,
  content?: Pick<LanguageContent, "cards" | "getCardsForUnit" | "allowedInteractions"> & Partial<Pick<LanguageContent, "getUnit">>,
  size = 10,
): SessionItem[] {
  const allCards = content?.cards ?? ALL_CARDS;
  const getCards = content?.getCardsForUnit ?? getCardsForUnit;
  const allowed: InteractionKind[] = content?.allowedInteractions ?? ["multiple-choice", "build", "type", "match"];
  const unit = content?.getUnit?.(unitId);

  const baseOrder: InteractionKind[] = unit?.primaryInteraction
    ? GRAMMAR_ORDER_TEMPLATE(unit.primaryInteraction)
    : LESSON_ORDER;
  const interactionOrder = baseOrder.filter((k) => allowed.includes(k));

  const unitCards = getCards(unitId);
  const now = Date.now();

  const unseenCards = unitCards.filter((c) => !srs[c.id] || srs[c.id].reps === 0);
  const priorityNew = shuffle(unseenCards.filter((c) => c.priority));
  const regularNew = shuffle(unseenCards.filter((c) => !c.priority));
  const newCards = [...priorityNew, ...regularNew];
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
    ...newCards.slice(0, newTarget),
    ...shuffle(dueFromUnit).slice(0, dueTarget),
    ...shuffle(globalDue),
  ].slice(0, size);

  while (pool.length < size && unitCards.length > 0) {
    pool.push(shuffle(unitCards)[0]);
  }

  return pool.map((card, i) => {
    const desired = interactionOrder[i % interactionOrder.length];
    const kind = pickKind(card, desired);
    return needsDistractors(kind)
      ? { card, kind, distractors: pickDistractors(card, allCards) }
      : { card, kind };
  });
}

export function buildPracticeSession(
  seenCardIds: string[],
  content: Pick<LanguageContent, "cards" | "allowedInteractions">,
  size = 10,
): SessionItem[] {
  const allowed: InteractionKind[] = content.allowedInteractions;
  const order = REVIEW_ORDER.filter((k) => allowed.includes(k));
  const seenCards = seenCardIds
    .map((id) => content.cards.find((c) => c.id === id))
    .filter((c): c is Card => !!c);
  const pool = shuffle(seenCards).slice(0, size);
  return pool.map((card, i) => {
    const kind = order[i % order.length];
    return needsDistractors(kind)
      ? { card, kind, distractors: pickDistractors(card, content.cards) }
      : { card, kind };
  });
}

export function buildReviewSession(
  srs: Record<string, SrsState>,
  content?: Pick<LanguageContent, "cards" | "allowedInteractions">,
  size = 10,
): SessionItem[] {
  const allCards = content?.cards ?? ALL_CARDS;
  const allowed: InteractionKind[] = content?.allowedInteractions ?? ["multiple-choice", "type", "match"];
  const order = REVIEW_ORDER.filter((k) => allowed.includes(k));
  const now = Date.now();
  const due = Object.entries(srs)
    .filter(([, s]) => isDue(s, now))
    .map(([id]) => allCards.find((c) => c.id === id))
    .filter((c): c is Card => !!c);

  const pool = shuffle(due).slice(0, size);

  return pool.map((card, i) => {
    const kind = order[i % order.length];
    return needsDistractors(kind)
      ? { card, kind, distractors: pickDistractors(card, allCards) }
      : { card, kind };
  });
}
