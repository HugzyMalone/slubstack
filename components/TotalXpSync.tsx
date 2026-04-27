"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  mandarinStore,
  germanStore,
  spanishStore,
  vibeCodingStore,
  brainTrainingStore,
  triviaStore,
} from "@/lib/store";

export function TotalXpSync() {
  const mandarinXp = useStore(mandarinStore, (s) => s.xp);
  const germanXp = useStore(germanStore, (s) => s.xp);
  const spanishXp = useStore(spanishStore, (s) => s.xp);
  const vibeXp = useStore(vibeCodingStore, (s) => s.xp);
  const brainXp = useStore(brainTrainingStore, (s) => s.xp);
  const triviaXp = useStore(triviaStore, (s) => s.xp);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const totalXp = mandarinXp + germanXp + spanishXp + vibeXp + brainXp + triviaXp;

    const timeout = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      fetch("/api/stats/total-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalXp }),
      }).catch((err) => console.error("[TotalXpSync] push failed:", err));
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [mandarinXp, germanXp, spanishXp, vibeXp, brainXp, triviaXp]);

  return null;
}
