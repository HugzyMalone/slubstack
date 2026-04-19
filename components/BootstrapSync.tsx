"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { germanStore, spanishStore, vibeCodingStore } from "@/lib/store";
import type { RemoteState } from "@/lib/store";

// Pulls german, spanish, and vibe-coding states on login from any page.
// Mandarin is handled by the root <CloudSync /> which also owns the push for all languages.
export function BootstrapSync() {
  const hasPulled = useRef(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !isSupabaseConfigured()) return;

    async function pullAll() {
      if (hasPulled.current) return;
      hasPulled.current = true;

      await Promise.all(
        (["german", "spanish", "vibe-coding"] as const).map(async (lang) => {
          const store = lang === "german" ? germanStore : lang === "spanish" ? spanishStore : vibeCodingStore;
          try {
            const res = await fetch(`/api/stats/sync?lang=${lang}`);
            const { state } = (await res.json()) as { state: RemoteState | null };
            if (state && typeof state === "object") {
              store.getState().mergeFromServer(state);
            }
          } catch {}
        })
      );
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) pullAll();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        hasPulled.current = false;
        pullAll();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
