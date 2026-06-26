"use client";

import { useSyncExternalStore } from "react";
import type { Card } from "@/lib/content";

export type NativeLanguage = "en" | "de";

const KEY = "slubstack_native_language";
const EVENT = "slubstack:native-language-change";

export function readNativeLanguage(): NativeLanguage {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(KEY);
  return v === "de" ? "de" : "en";
}

export function writeNativeLanguage(native: NativeLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, native);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: native }));
}

function subscribeNativeLanguage(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useNativeLanguage(): NativeLanguage {
  return useSyncExternalStore(subscribeNativeLanguage, readNativeLanguage, () => "en");
}

export function meaningOf(card: Card, native: NativeLanguage): string {
  if (native === "de" && card.german) return card.german;
  return card.english;
}
