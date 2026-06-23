"use client";

import { useEffect } from "react";
import { initAnalytics, track } from "@/lib/analytics";

export function PostHogProvider() {
  useEffect(() => {
    initAnalytics();
    track("app_open");
  }, []);

  return null;
}
