export function cardLang(cardId: string): string {
  if (cardId.startsWith("de-")) return "de-DE";
  if (cardId.startsWith("es-")) return "es-ES";
  return "zh-CN";
}

export function speak(text: string, bcp47: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp47;
  window.speechSynthesis.speak(u);
}
