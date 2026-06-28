"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();
  browserClient = createBrowserClient(supabaseUrl, supabasePublishableKey);
  return browserClient;
}

// Guests have no session, so endpoints that require auth would 401 — and the
// browser logs every 401 as a red console error. Call this before such fetches
// so signed-out visitors skip the request entirely instead of cluttering the
// console with expected failures. Uses getUser() rather than getSession() so the
// token is validated against the Auth server: a stale/expired local session
// (which getSession trusts) would otherwise pass the gate and still 401 — the
// same path that auth routes take, so the gate and the route agree.
export async function hasActiveSession(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;
  const { data } = await supabase.auth.getUser();
  return !!data.user;
}
