"use client";

import { useEffect, useState } from "react";
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

export function useNativeLanguage(): NativeLanguage {
  const [native, setNative] = useState<NativeLanguage>("en");

  useEffect(() => {
    setNative(readNativeLanguage());
    const onChange = () => setNative(readNativeLanguage());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return native;
}

export function meaningOf(card: Card, native: NativeLanguage): string {
  if (native === "de" && card.german) return card.german;
  return card.english;
}
