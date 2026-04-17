import mandarinVocab from "@/content/mandarin/vocab.json";
import mandarinUnits from "@/content/mandarin/units.json";
import germanVocab from "@/content/german/vocab.json";
import germanUnits from "@/content/german/units.json";

export type Category = string;

export type Card = {
  id: string;
  category: Category;
  hanzi: string;
  pinyin: string;
  english: string;
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

export type Language = "mandarin" | "german";

export type LanguageContent = {
  cards: Card[];
  units: Unit[];
  getCard: (id: string) => Card;
  getCardsForUnit: (unitId: string) => Card[];
  getUnit: (id: string) => Unit | undefined;
  /** Interaction types allowed for this language's sessions. */
  allowedInteractions: ("flip" | "multiple-choice" | "build" | "type")[];
};

function buildContent(
  vocab: unknown[],
  unitList: unknown[],
  allowedInteractions: LanguageContent["allowedInteractions"],
): LanguageContent {
  const cards = vocab as Card[];
  const units = unitList as Unit[];
  const cardById = new Map(cards.map((c) => [c.id, c]));

  return {
    cards,
    units,
    getCard: (id) => {
      const c = cardById.get(id);
      if (!c) throw new Error(`Card not found: ${id}`);
      return c;
    },
    getCardsForUnit: (unitId) => {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) throw new Error(`Unit not found: ${unitId}`);
      return unit.cardIds.map((id) => {
        const c = cardById.get(id);
        if (!c) throw new Error(`Card not found: ${id}`);
        return c;
      });
    },
    getUnit: (id) => units.find((u) => u.id === id),
    allowedInteractions,
  };
}

const MANDARIN_CONTENT = buildContent(
  mandarinVocab,
  mandarinUnits,
  ["flip", "multiple-choice", "build", "type"],
);

const GERMAN_CONTENT = buildContent(
  germanVocab,
  germanUnits,
  ["flip", "multiple-choice", "type"],
);

export function getLanguageContent(lang: Language): LanguageContent {
  return lang === "german" ? GERMAN_CONTENT : MANDARIN_CONTENT;
}

// Backwards-compat exports for files not yet migrated
export const ALL_CARDS: Card[] = MANDARIN_CONTENT.cards;
export const ALL_UNITS: Unit[] = MANDARIN_CONTENT.units;
export const getCard = MANDARIN_CONTENT.getCard;
export const getCardsForUnit = MANDARIN_CONTENT.getCardsForUnit;
export const getUnit = MANDARIN_CONTENT.getUnit;
