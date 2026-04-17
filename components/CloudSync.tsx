"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGameStore } from "@/lib/store";

export function CloudSync() {
  const store = useGameStore();
  const mergeFromServer = useGameStore((s) => s.mergeFromServer);
  const hasPulled = useRef(false);

  // Pull state from server on sign-in (once per session)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isSupabaseConfigured()) return;

    async function pull() {
      if (hasPulled.current) return;
      hasPulled.current = true;
      try {
        const res = await fetch("/api/stats/sync");
        const { state } = (await res.json()) as { state: Record<string, unknown> | null };
        if (state && typeof state === "object") {
          mergeFromServer(state as Parameters<typeof mergeFromServer>[0]);
        }
      } catch {}
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
  }, [mergeFromServer]);

  // Push full state to server whenever it changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const timeout = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      fetch("/api/stats/sync", {
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
        }),
      }).catch(() => {});
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [store.xp, store.streak, store.seenCardIds, store.completedUnits, store.srs, store.lastActiveDate]);

  return null;
}
