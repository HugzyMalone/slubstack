"use client";

import { pickVoice } from "@/lib/voices";

export function cardLang(cardId: string): string {
  if (cardId.startsWith("de-")) return "de-DE";
  if (cardId.startsWith("es-")) return "es-ES";
  return "zh-CN";
}

const LEARN_RATE = 0.85;

// Slight pitch bump for Mandarin sharpens tone contours — most synth voices
// flatten 2nd/3rd tone unless the fundamental is pushed up a touch.
const PITCH_BY_LANG: Record<string, number> = {
  "zh-CN": 1.05,
};

export function speak(text: string, bcp47: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp47;
  const voice = pickVoice(bcp47);
  if (voice) u.voice = voice;
  u.rate = LEARN_RATE;
  u.pitch = PITCH_BY_LANG[bcp47] ?? 1.0;
  window.speechSynthesis.speak(u);
}
