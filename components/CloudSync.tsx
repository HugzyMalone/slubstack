"use client";

import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { hasPullCompleted } from "@/lib/syncGate";
import {
  useGameStore,
  mandarinStore,
  germanStore,
  spanishStore,
  italianStore,
  vibeCodingStore,
  githubStore,
  brainTrainingStore,
  triviaStore,
} from "@/lib/store";
import { globalStore } from "@/lib/globalStore";

type Props = { lang?: "mandarin" | "german" | "spanish" | "italian" | "vibe-coding" | "github" };

export function CloudSync({ lang = "mandarin" }: Props) {
  const store = useGameStore();
  const mergeFromServer = useGameStore((s) => s.mergeFromServer);
  const mandarinXp = useStore(mandarinStore, (s) => s.xp);
  const germanXp = useStore(germanStore, (s) => s.xp);
  const spanishXp = useStore(spanishStore, (s) => s.xp);
  const italianXp = useStore(italianStore, (s) => s.xp);
  const vibeXp = useStore(vibeCodingStore, (s) => s.xp);
  const githubXp = useStore(githubStore, (s) => s.xp);
  const brainXp = useStore(brainTrainingStore, (s) => s.xp);
  const triviaXp = useStore(triviaStore, (s) => s.xp);
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
          if (lang === "mandarin") {
            const remote = state as { streak?: number; lastActiveDate?: string | null };
            globalStore.getState().hydrateStreak({
              streak: Math.max(0, Math.floor(remote.streak ?? 0)),
              lastActiveDate: remote.lastActiveDate ?? null,
            });
          }
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

    const totalXp = mandarinXp + germanXp + spanishXp + italianXp + vibeXp + githubXp + brainXp + triviaXp;
    const timeout = window.setTimeout(async () => {
      if (!hasPullCompleted()) return;
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
  }, [store.xp, store.streak, store.seenCardIds, store.completedUnits, store.srs, store.lastActiveDate, langParam, mandarinXp, germanXp, spanishXp, italianXp, vibeXp, githubXp, brainXp, triviaXp]);

  return null;
}
