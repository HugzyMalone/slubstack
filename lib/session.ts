import type { Card, LanguageContent, Unit, InteractionKind } from "@/lib/content";
import { ALL_CARDS, getCardsForUnit } from "@/lib/content";
import { INITIAL_SRS, isDue, type SrsState } from "@/lib/srs";
import { shuffle } from "@/lib/utils";

export type { InteractionKind };

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

// Review sessions: game interactions only — SRS rated by correct/wrong automatically
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

/** Grammar-biased order: heavy primary, light MC. `P` gets replaced by the unit's primaryInteraction. */
const GRAMMAR_ORDER_TEMPLATE: ("P" | InteractionKind)[] = [
  "P", "P", "multiple-choice", "P", "P", "multiple-choice", "P", "multiple-choice", "P", "P",
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

/** Card must have the required metadata for a grammar interaction kind. Fallback = multiple-choice. */
function cardSupportsKind(card: Card, kind: InteractionKind): boolean {
  if (kind === "gender-pick") return !!card.gender;
  if (kind === "case-pick") return !!card.cases && Object.keys(card.cases).length >= 2;
  if (kind === "plural-drill") return !!card.plural;
  if (kind === "conjugate") return !!card.conjugations;
  return true;
}

function needsDistractors(kind: InteractionKind): boolean {
  return kind === "multiple-choice" || kind === "match";
}

function resolveKind(card: Card, desired: InteractionKind): InteractionKind {
  return cardSupportsKind(card, desired) ? desired : "multiple-choice";
}

export function buildUnitSession(
  unitId: string,
  srs: Record<string, SrsState>,
  content?: Pick<LanguageContent, "cards" | "getCardsForUnit" | "getUnit" | "allowedInteractions">,
  size = 10,
): SessionItem[] {
  const allCards = content?.cards ?? ALL_CARDS;
  const getCards = content?.getCardsForUnit ?? getCardsForUnit;
  const allowed: InteractionKind[] = content?.allowedInteractions ?? ["multiple-choice", "build", "type", "match"];
  const unit: Unit | undefined = content?.getUnit?.(unitId);

  const primary = unit?.primaryInteraction;
  const useGrammarOrder = !!primary && allowed.includes(primary);
  const interactionOrder: InteractionKind[] = useGrammarOrder
    ? GRAMMAR_ORDER_TEMPLATE.map((k) => (k === "P" ? primary! : k)).filter((k) => allowed.includes(k))
    : LESSON_ORDER.filter((k) => allowed.includes(k));

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
    const desired = interactionOrder[i % interactionOrder.length];
    const kind = resolveKind(card, desired);
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
    const desired = order[i % order.length];
    const kind = resolveKind(card, desired);
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
    const desired = order[i % order.length];
    const kind = resolveKind(card, desired);
    return needsDistractors(kind)
      ? { card, kind, distractors: pickDistractors(card, allCards) }
      : { card, kind };
  });
}
