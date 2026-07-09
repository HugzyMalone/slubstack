import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export function isAnalyticsEnabled() {
  return Boolean(POSTHOG_KEY);
}

let initialised = false;

export function initAnalytics() {
  if (initialised || !POSTHOG_KEY || typeof window === "undefined") return;
  initialised = true;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
}

export type AnalyticsEvent =
  | "signup"
  | "guest_play_start"
  | "first_game_complete"
  | "daily_start"
  | "daily_complete"
  | "share_clicked"
  | "app_open";

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (!initialised || !POSTHOG_KEY) return;
  posthog.capture(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (!initialised || !POSTHOG_KEY) return;
  posthog.identify(userId, props);
}

export function resetAnalytics() {
  if (!initialised || !POSTHOG_KEY) return;
  posthog.reset();
}
