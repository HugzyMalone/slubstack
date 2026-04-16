import { useSyncExternalStore } from "react";

function subscribeToNothing() {
  return () => {};
}

export function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

export function useNow(enabled = true, intervalMs = 60_000) {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (!enabled) return () => {};
      const timer = window.setInterval(onStoreChange, intervalMs);
      return () => window.clearInterval(timer);
    },
    () => Date.now(),
    () => 0,
  );
}
