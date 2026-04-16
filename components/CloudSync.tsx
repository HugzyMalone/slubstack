"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGameStore } from "@/lib/store";

export function CloudSync() {
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const wordsLearned = useGameStore((s) => s.seenCardIds.length);
  const unitsDone = useGameStore((s) => s.completedUnits.length);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured() || !signedIn) return;

    const timeout = window.setTimeout(() => {
      fetch("/api/stats/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xp, streak, wordsLearned, unitsDone }),
      }).catch(() => {});
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [signedIn, streak, unitsDone, wordsLearned, xp]);

  return null;
}
