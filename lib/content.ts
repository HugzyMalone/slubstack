import mandarinVocab from "@/content/mandarin/vocab.json";
import mandarinUnits from "@/content/mandarin/units.json";
import germanVocab from "@/content/german/vocab.json";
import germanUnits from "@/content/german/units.json";
import spanishVocab from "@/content/spanish/vocab.json";
import spanishUnits from "@/content/spanish/units.json";
import vibeVocab from "@/content/vibe-coding/vocab.json";
import vibeUnits from "@/content/vibe-coding/units.json";

export type Category = string;

export type Gender = "der" | "die" | "das";
export type GermanCase = "nom" | "acc" | "dat" | "gen";
export type Tone = 1 | 2 | 3 | 4 | 5;

export type InteractionKind =
  | "multiple-choice"
  | "build"
  | "type"
  | "match"
  | "gender-pick"
  | "case-pick"
  | "plural-drill"
  | "conjugate"
  | "tone-pick"
  | "measure-pick"
  | "char-from-pinyin";

export type Card = {
  id: string;
  category: Category;
  hanzi: string;
  pinyin: string;
  english: string;
  german?: string;
  note?: string;
  example?: { de: string; en: string };
  gender?: Gender;
  plural?: string;
  cases?: Partial<Record<GermanCase, string>>;
  conjugations?: {
    ich: string;
    du: string;
    er: string;
    wir: string;
    ihr: string;
    sie: string;
  };
  separable?: { prefix: string; root: string };
  tone?: Tone;
  tones?: Tone[];
  measureWord?: string;
  priority?: boolean;
  recognitionOnly?: boolean;
  glosses?: Record<string, string>;
};

export type Unit = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  emoji: string;
  category: Category;
  cardIds: string[];
  primaryInteraction?: InteractionKind;
};

export type Language = "mandarin" | "german" | "spanish" | "vibe-coding";

export function langFromCardId(id: string): Language {
  if (id.startsWith("de-")) return "german";
  if (id.startsWith("es-")) return "spanish";
  if (id.startsWith("vc-")) return "vibe-coding";
  return "mandarin";
}

export type LanguageContent = {
  cards: Card[];
  units: Unit[];
  getCard: (id: string) => Card;
  getCardsForUnit: (unitId: string) => Card[];
  getUnit: (id: string) => Unit | undefined;
  allowedInteractions: InteractionKind[];
  kindWeights?: Partial<Record<InteractionKind, number>>;
};

function buildContent(
  vocab: unknown[],
  unitList: unknown[],
  allowedInteractions: InteractionKind[],
  kindWeights?: Partial<Record<InteractionKind, number>>,
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
    kindWeights,
  };
}

const MANDARIN_CONTENT = buildContent(
  mandarinVocab,
  mandarinUnits,
  ["multiple-choice", "build", "type", "match", "tone-pick", "measure-pick", "char-from-pinyin"],
);

const GERMAN_CONTENT = buildContent(
  germanVocab,
  germanUnits,
  ["multiple-choice", "type", "match", "gender-pick", "case-pick", "plural-drill", "conjugate"],
  { type: 2, "multiple-choice": 1, match: 1 },
);

const SPANISH_CONTENT = buildContent(
  spanishVocab,
  spanishUnits,
  ["multiple-choice", "type", "match"],
);

const VIBE_CONTENT = buildContent(
  vibeVocab,
  vibeUnits,
  ["multiple-choice", "match"],
);

export function getLanguageContent(lang: Language): LanguageContent {
  if (lang === "german") return GERMAN_CONTENT;
  if (lang === "spanish") return SPANISH_CONTENT;
  if (lang === "vibe-coding") return VIBE_CONTENT;
  return MANDARIN_CONTENT;
}

// Backwards-compat exports for files not yet migrated
export const ALL_CARDS: Card[] = MANDARIN_CONTENT.cards;
export const ALL_UNITS: Unit[] = MANDARIN_CONTENT.units;
export const getCard = MANDARIN_CONTENT.getCard;
export const getCardsForUnit = MANDARIN_CONTENT.getCardsForUnit;
export const getUnit = MANDARIN_CONTENT.getUnit;
