import type { Card, Gender, GermanCase } from "@/lib/content";

export const GENDER_COLORS: Record<Gender, string> = {
  der: "#60a5fa", // blue — masculine
  die: "#f87171", // red — feminine
  das: "#4ade80", // green — neuter
};

export const CASE_LABELS: Record<GermanCase, string> = {
  nom: "Nominative",
  acc: "Accusative",
  dat: "Dative",
  gen: "Genitive",
};

export const GERMAN_FOLD: Array<[RegExp, string]> = [
  [/ä/g, "ae"],
  [/ö/g, "oe"],
  [/ü/g, "ue"],
  [/ß/g, "ss"],
];

export function germanFold(s: string): string {
  let out = s;
  for (const [re, rep] of GERMAN_FOLD) out = out.replace(re, rep);
  return out;
}

/** Parse leading "der/die/das" article from a noun phrase, if present. */
export function genderFromNoun(text: string): Gender | undefined {
  const m = text.trim().match(/^(der|die|das)\s/i);
  if (!m) return undefined;
  const g = m[1].toLowerCase() as Gender;
  return g === "der" || g === "die" || g === "das" ? g : undefined;
}

/** Look up gender from card metadata first, then fall back to parsing the hanzi prefix. */
export function cardGender(card: Card): Gender | undefined {
  return card.gender ?? genderFromNoun(card.hanzi);
}

export function isGerman(cardId: string): boolean {
  return cardId.startsWith("de-");
}

/** Strip leading article ("der ", "die ", "das ") from a noun phrase. */
export function stripArticle(text: string): string {
  return text.replace(/^(der|die|das)\s+/i, "").trim();
}
