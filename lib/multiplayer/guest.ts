"use client";

import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function guestDisplayName(userId: string) {
  return `Guest-${userId.replace(/-/g, "").slice(0, 6)}`;
}

export function isAnonymousUser(user: Pick<User, "is_anonymous"> | null | undefined) {
  return user?.is_anonymous === true;
}

export function profileFromUser(user: User): { displayName: string; avatarUrl: string | null } {
  const meta = user.user_metadata as { username?: string; avatar_url?: string };
  const cachedName = typeof window !== "undefined" ? localStorage.getItem("slubstack_username") : null;
  const cachedAvatar = typeof window !== "undefined" ? localStorage.getItem("slubstack_avatar") : null;
  return {
    displayName: cachedName ?? meta.username ?? `learner-${user.id.slice(0, 8)}`,
    avatarUrl: cachedAvatar ?? meta.avatar_url ?? null,
  };
}

export async function signInAsGuest(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    toast.error("Guest play is unavailable right now.");
    return null;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    toast.error("Could not start a guest session. Try again, or sign in.");
    return null;
  }

  const user = data.user;
  const username = guestDisplayName(user.id);

  await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  }).catch(() => {});

  if (typeof window !== "undefined") {
    localStorage.setItem("slubstack_username", username);
    localStorage.removeItem("slubstack_avatar");
  }

  return user;
}
