import { SECRETS } from "./secrets";
import { getDayIndex } from "@/lib/wordle-words";

export interface NeighbourFile {
  secret: string;
  neighbours: [string, number][];
}

export interface GuessResult {
  similarity: number;
  rank: number | null;
  valid: boolean;
  win: boolean;
}

export function getSecretForDate(dateStr: string): string {
  return SECRETS[getDayIndex(dateStr) % SECRETS.length];
}

let vocabCache: Set<string> | null = null;

async function loadVocab(): Promise<Set<string> | null> {
  if (vocabCache) return vocabCache;
  try {
    const mod = await import("./data/vocab.json");
    vocabCache = new Set((mod.default as string[]).map((w) => w.toLowerCase()));
    return vocabCache;
  } catch {
    return null;
  }
}

const neighbourCache = new Map<string, NeighbourFile | null>();

async function loadNeighbours(secret: string): Promise<NeighbourFile | null> {
  if (neighbourCache.has(secret)) return neighbourCache.get(secret) ?? null;
  try {
    const mod = await import(`./data/${secret}.json`);
    const file = mod.default as NeighbourFile;
    neighbourCache.set(secret, file);
    return file;
  } catch {
    neighbourCache.set(secret, null);
    return null;
  }
}

export async function scoreGuess(dateStr: string, rawGuess: string): Promise<GuessResult> {
  const guess = rawGuess.trim().toLowerCase();
  const secret = getSecretForDate(dateStr);

  if (guess === secret) {
    return { similarity: 100, rank: 1, valid: true, win: true };
  }

  const vocab = await loadVocab();
  const valid = vocab ? vocab.has(guess) : /^[a-z]+$/.test(guess);

  const file = await loadNeighbours(secret);
  if (!file) {
    return { similarity: 0, rank: null, valid, win: false };
  }

  const idx = file.neighbours.findIndex(([w]) => w === guess);
  if (idx === -1) {
    return { similarity: 0, rank: null, valid, win: false };
  }

  const cosine = file.neighbours[idx][1];
  const similarity = Math.round(cosine * 1000) / 10;
  return { similarity, rank: idx + 1, valid: true, win: false };
}
