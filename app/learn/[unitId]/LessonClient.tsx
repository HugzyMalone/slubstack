"use client";

import { useMemo, useState, useEffect } from "react";
import { buildUnitSession } from "@/lib/session";
import { getLanguageContent, type Language } from "@/lib/content";
import { useGameStore } from "@/lib/store";
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
      character={lang === "german" ? "bear" : "panda"}
      lang={lang}
    />
  );
}
