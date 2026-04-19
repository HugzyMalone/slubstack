"use client";

import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGameStore, mandarinStore, germanStore, spanishStore } from "@/lib/store";

type Props = { lang?: "mandarin" | "german" | "spanish" };

export function CloudSync({ lang = "mandarin" }: Props) {
  const store = useGameStore();
  const mergeFromServer = useGameStore((s) => s.mergeFromServer);
  const mandarinXp = useStore(mandarinStore, (s) => s.xp);
  const germanXp = useStore(germanStore, (s) => s.xp);
  const spanishXp = useStore(spanishStore, (s) => s.xp);
  const hasPulled = useRef(false);
  const langParam = lang !== "mandarin" ? `?lang=${lang}` : "";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isSupabaseConfigured()) return;

    async function pull() {
      if (hasPulled.current) return;
      hasPulled.current = true;
      try {
        const res = await fetch(`/api/stats/sync${langParam}`);
        const { state } = (await res.json()) as { state: Record<string, unknown> | null };
        if (state && typeof state === "object") {
          mergeFromServer(state as Parameters<typeof mergeFromServer>[0]);
        }
      } catch (err) {
        console.error("[CloudSync] pull failed:", err);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) pull();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        hasPulled.current = false;
        pull();
      }
    });

    return () => subscription.unsubscribe();
  }, [mergeFromServer, langParam]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const totalXp = mandarinXp + germanXp + spanishXp;
    const timeout = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      fetch(`/api/stats/sync${langParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xp: store.xp,
          streak: store.streak,
          lastActiveDate: store.lastActiveDate,
          wordsLearned: store.seenCardIds.length,
          unitsDone: store.completedUnits.length,
          completedUnits: store.completedUnits,
          seenCardIds: store.seenCardIds,
          srs: store.srs,
          totalXp,
        }),
      }).catch((err) => console.error("[CloudSync] push failed:", err));
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [store.xp, store.streak, store.seenCardIds, store.completedUnits, store.srs, store.lastActiveDate, langParam, mandarinXp, germanXp, spanishXp]);

  return null;
}
