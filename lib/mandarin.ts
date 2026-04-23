import type { Tone } from "@/lib/content";

const TONE_VOWEL_MAP: Record<string, Tone> = {
  "ā": 1, "ē": 1, "ī": 1, "ō": 1, "ū": 1, "ǖ": 1,
  "á": 2, "é": 2, "í": 2, "ó": 2, "ú": 2, "ǘ": 2,
  "ǎ": 3, "ě": 3, "ǐ": 3, "ǒ": 3, "ǔ": 3, "ǚ": 3,
  "à": 4, "è": 4, "ì": 4, "ò": 4, "ù": 4, "ǜ": 4,
};

/** Detect tone of a single pinyin syllable via diacritic vowel. Neutral = 5. */
export function toneOf(syllable: string): Tone {
  for (const ch of syllable) {
    const t = TONE_VOWEL_MAP[ch];
    if (t) return t;
  }
  return 5;
}

/** Split a pinyin string into syllables and return tone for each. */
export function tonesOf(pinyin: string): Tone[] {
  const clean = pinyin.trim().replace(/[—–\-]/g, " ");
  if (!clean) return [];
  const parts = clean.split(/\s+|'/).filter(Boolean);
  return parts.map((p) => toneOf(p));
}

const TONE_STRIP: Record<string, string> = {
  "ā": "a", "á": "a", "ǎ": "a", "à": "a",
  "ē": "e", "é": "e", "ě": "e", "è": "e",
  "ī": "i", "í": "i", "ǐ": "i", "ì": "i",
  "ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
  "ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
  "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü",
};

export function stripTones(pinyin: string): string {
  return pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, (c) => TONE_STRIP[c] ?? c);
}

export const TONE_COLORS: Record<Tone, string> = {
  1: "#60a5fa",
  2: "#4ade80",
  3: "#fbbf24",
  4: "#f87171",
  5: "#94a3b8",
};

export const TONE_LABELS: Record<Tone, string> = {
  1: "1st — high flat",
  2: "2nd — rising",
  3: "3rd — dip",
  4: "4th — falling",
  5: "Neutral",
};

export const TONE_CONTOURS: Record<Tone, string> = {
  1: "ˉ",
  2: "ˊ",
  3: "ˇ",
  4: "ˋ",
  5: "·",
};

export const MEASURE_POOL = ["个", "本", "只", "张", "条", "杯", "辆", "部", "口", "位", "件", "瓶"];
