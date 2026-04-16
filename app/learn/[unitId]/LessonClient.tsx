"use client";

import { useMemo, useState, useEffect } from "react";
import { buildUnitSession } from "@/lib/session";
import { useGameStore } from "@/lib/store";
import { SessionRunner } from "@/components/SessionRunner";

export function LessonClient({ unitId }: { unitId: string }) {
  const srs = useGameStore((s) => s.srs);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Build the session exactly once per mount so card ordering is stable.
  const items = useMemo(() => {
    if (!hydrated) return [];
    return buildUnitSession(unitId, srs, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, unitId]);

  if (!hydrated) return null;

  return <SessionRunner items={items} unitId={unitId} exitHref="/" />;
}
