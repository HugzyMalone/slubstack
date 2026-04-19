"use client";

import { useMemo, useState, useEffect } from "react";
import { buildUnitSession } from "@/lib/session";
import { getLanguageContent, type Language } from "@/lib/content";
import { useGameStore } from "@/lib/store";
import { globalStore } from "@/lib/globalStore";
import { SessionRunner } from "@/components/SessionRunner";

export function LessonClient({
  unitId,
  lang = "mandarin",
  exitHref,
  reviewHref,
}: {
  unitId: string;
  lang?: Language;
  exitHref?: string;
  reviewHref?: string;
}) {
  const srs = useGameStore((s) => s.srs);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const content = getLanguageContent(lang);

  useEffect(() => {
    if (!hydrated) return;
    const unit = content.getUnit(unitId);
    if (unit) {
      const href = lang === "mandarin" ? `/learn/${unitId}` : `/${lang}/learn/${unitId}`;
      globalStore.getState().setLastUnit({ lang, unitId, title: unit.title, emoji: unit.emoji, href });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, unitId, lang]);

  const items = useMemo(() => {
    if (!hydrated) return [];
    return buildUnitSession(unitId, srs, content, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, unitId]);

  if (!hydrated) return null;

  return (
    <SessionRunner
      items={items}
      unitId={unitId}
      exitHref={exitHref ?? (lang === "mandarin" ? "/" : `/${lang}`)}
      reviewHref={reviewHref ?? (lang === "mandarin" ? "/review" : `/${lang}/review`)}
      character={(lang === "german" || lang === "vibe-coding") ? "bear" : "panda"}
      lang={lang}
    />
  );
}
