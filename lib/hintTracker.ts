"use client";

import { createStore, useStore } from "zustand";

type State = { usedForCurrentCard: boolean };

type Actions = {
  markUsed: () => void;
  reset: () => void;
  consume: () => boolean;
};

export const hintTracker = createStore<State & Actions>()((set, get) => ({
  usedForCurrentCard: false,
  markUsed: () => set({ usedForCurrentCard: true }),
  reset: () => set({ usedForCurrentCard: false }),
  consume: () => {
    const used = get().usedForCurrentCard;
    set({ usedForCurrentCard: false });
    return used;
  },
}));

export function useHintTracker<T>(selector: (s: State & Actions) => T): T {
  return useStore(hintTracker, selector);
}
