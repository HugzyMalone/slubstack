import { useSyncExternalStore, useState, useEffect } from "react";

function subscribeToNothing() {
  return () => {};
}

export function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

export function useNow(enabled = true, intervalMs = 60_000) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    // Seed the real clock after hydration (initial 0 avoids an SSR mismatch);
    // the clock is an external system this effect subscribes to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);

  return now;
}
