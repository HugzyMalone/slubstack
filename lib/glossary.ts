import germanVocab from "@/content/german/vocab.json";
import spanishVocab from "@/content/spanish/vocab.json";
import mandarinVocab from "@/content/mandarin/vocab.json";
import germanGlossary from "@/content/german/glossary.json";
import type { Card, Language } from "@/lib/content";
import { germanFold } from "@/lib/german";

type Gloss = { word: string; meaning: string; pinyin?: string };

const VOCAB: Record<Language, Card[]> = {
  mandarin: mandarinVocab as Card[],
  german: germanVocab as Card[],
  spanish: spanishVocab as Card[],
  "vibe-coding": [],
};

const GERMAN_GLOSSARY = germanGlossary as Record<string, string>;

const STEMS: Record<Language, string[]> = {
  german: ["en", "er", "es", "e", "n", "s"],
  spanish: ["es", "s", "as", "ar", "er", "ir"],
  mandarin: [],
  "vibe-coding": [],
};

function stripArticle(s: string): string {
  return s.replace(/^(der|die|das|el|la|los|las)\s+/i, "");
}

function fold(word: string, lang: Language): string {
  const lower = word.toLowerCase().replace(/[^\p{L}]/gu, "");
  if (lang === "german") return germanFold(lower);
  if (lang === "spanish") {
    return lower.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  return lower;
}

function findCard(word: string, lang: Language): Card | undefined {
  const target = fold(word, lang);
  if (!target) return undefined;
  return VOCAB[lang].find((c) => {
    const head = stripArticle(c.hanzi);
    return fold(head, lang) === target || fold(c.hanzi, lang) === target;
  });
}

function findStemmedCard(word: string, lang: Language): Card | undefined {
  const folded = fold(word, lang);
  if (!folded) return undefined;
  for (const stem of STEMS[lang]) {
    if (folded.endsWith(stem) && folded.length > stem.length + 2) {
      const stemmed = folded.slice(0, -stem.length);
      const card = VOCAB[lang].find((c) => {
        const head = stripArticle(c.hanzi);
        return fold(head, lang) === stemmed;
      });
      if (card) return card;
    }
  }
  return undefined;
}

export function lookupGloss(
  word: string,
  card: Card | null,
  lang: Language,
): Gloss | undefined {
  if (!word.trim()) return undefined;

  if (card?.glosses?.[word]) {
    return { word, meaning: card.glosses[word] };
  }

  if (lang === "german") {
    const direct = GERMAN_GLOSSARY[word.toLowerCase()];
    if (direct) return { word, meaning: direct };
  }

  const exact = findCard(word, lang);
  if (exact) {
    return {
      word: exact.hanzi,
      meaning: exact.english,
      pinyin: lang === "mandarin" ? exact.pinyin : undefined,
    };
  }

  const stemmed = findStemmedCard(word, lang);
  if (stemmed) {
    return {
      word: stemmed.hanzi,
      meaning: stemmed.english,
      pinyin: lang === "mandarin" ? stemmed.pinyin : undefined,
    };
  }

  return undefined;
}
