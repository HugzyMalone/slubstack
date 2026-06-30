"use client";

import { useEffect } from "react";
import { initAnalytics, track, identify, resetAnalytics } from "@/lib/analytics";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PostHogProvider() {
  useEffect(() => {
    initAnalytics();
    track("app_open");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) identify(session.user.id, { email: session.user.email });
      else if (event === "SIGNED_OUT") resetAnalytics();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
