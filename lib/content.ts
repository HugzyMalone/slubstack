import vocab from "@/content/mandarin/vocab.json";
import units from "@/content/mandarin/units.json";

export type Category =
  | "greetings"
  | "pronouns-verbs"
  | "numbers"
  | "family"
  | "time"
  | "dates"
  | "food"
  | "places";

export type Card = {
  id: string;
  category: Category;
  hanzi: string;
  pinyin: string;
  english: string;
  /** Optional usage / cultural / authenticity note. */
  note?: string;
};

export type Unit = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  emoji: string;
  category: Category;
  cardIds: string[];
};

export const ALL_CARDS: Card[] = vocab as Card[];
export const ALL_UNITS: Unit[] = units as Unit[];

const CARD_BY_ID = new Map(ALL_CARDS.map((c) => [c.id, c]));

export function getCard(id: string): Card {
  const c = CARD_BY_ID.get(id);
  if (!c) throw new Error(`Card not found: ${id}`);
  return c;
}

export function getCardsForUnit(unitId: string): Card[] {
  const unit = ALL_UNITS.find((u) => u.id === unitId);
  if (!unit) throw new Error(`Unit not found: ${unitId}`);
  return unit.cardIds.map(getCard);
}

export function getUnit(id: string): Unit | undefined {
  return ALL_UNITS.find((u) => u.id === id);
}
