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
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);

  return now;
}
