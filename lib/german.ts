import type { Card, Gender, GermanCase } from "@/lib/content";

export const GENDER_COLORS: Record<Gender, string> = {
  der: "#60a5fa",
  die: "#f87171",
  das: "#4ade80",
};

export const CASE_LABELS: Record<GermanCase, string> = {
  nom: "Nominative",
  acc: "Accusative",
  dat: "Dative",
  gen: "Genitive",
};

export function germanFold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

export function normDE(s: string): string {
  return germanFold(s.trim()).replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ");
}

/** Parse a leading article from a noun string. Returns the gender if present. */
export function parseArticle(text: string): Gender | undefined {
  const m = text.trim().match(/^(der|die|das)\s+/i);
  if (!m) return undefined;
  return m[1].toLowerCase() as Gender;
}

export function stripArticle(text: string): string {
  return text.replace(/^(der|die|das)\s+/i, "").trim();
}

export function cardGender(card: Card): Gender | undefined {
  return card.gender ?? parseArticle(card.hanzi);
}

export function cardNoun(card: Card): string {
  return stripArticle(card.hanzi);
}
