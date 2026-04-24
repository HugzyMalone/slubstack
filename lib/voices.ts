"use client";

type VoicePref = { match: RegExp; rank: number };

const PREFERENCES: Record<string, VoicePref[]> = {
  "zh-CN": [
    { match: /google.*(普通话|mandarin|chinese)/i, rank: 1 },
    { match: /microsoft.*(xiaoxiao|xiaochen|yunxi|yunyang).*neural/i, rank: 2 },
    { match: /tingting|ting-ting/i, rank: 3 },
    { match: /sinji/i, rank: 4 },
    { match: /microsoft.*(huihui|yaoyao|kangkang)/i, rank: 5 },
  ],
  "es-ES": [
    { match: /google.*(español|spanish)/i, rank: 1 },
    { match: /microsoft.*(elvira|alvaro|helena|pablo).*neural/i, rank: 2 },
    { match: /monica/i, rank: 3 },
    { match: /paulina/i, rank: 4 },
    { match: /microsoft.*(helena|sabina|pablo|elvira)/i, rank: 5 },
  ],
  "de-DE": [
    { match: /google.*(deutsch|german)/i, rank: 1 },
    { match: /microsoft.*(katja|conrad|amala|florian).*neural/i, rank: 2 },
    { match: /anna(?!.*elisabeth)/i, rank: 3 },
    { match: /petra/i, rank: 4 },
    { match: /microsoft.*(katja|hedda|stefan|conrad)/i, rank: 5 },
  ],
};

let voicesCache: SpeechSynthesisVoice[] = [];
let primed = false;

function prime() {
  if (primed) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  primed = true;
  const read = () => { voicesCache = window.speechSynthesis.getVoices(); };
  read();
  window.speechSynthesis.addEventListener?.("voiceschanged", read);
}

if (typeof window !== "undefined") prime();

export function pickVoice(bcp47: string): SpeechSynthesisVoice | undefined {
  prime();
  if (voicesCache.length === 0) return undefined;

  const prefix = bcp47.split("-")[0].toLowerCase();
  const localeMatches = voicesCache.filter((v) =>
    v.lang.toLowerCase().startsWith(prefix),
  );
  if (localeMatches.length === 0) return undefined;

  const prefs = [...(PREFERENCES[bcp47] ?? [])].sort((a, b) => a.rank - b.rank);
  for (const pref of prefs) {
    const hit = localeMatches.find((v) => pref.match.test(v.name));
    if (hit) return hit;
  }

  const premium = localeMatches.find((v) =>
    /google|neural|premium|enhanced|siri/i.test(v.name),
  );
  return premium ?? localeMatches[0];
}
