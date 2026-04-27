"use client";

import { createStore, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const HEART_REGEN_MS = 30 * 60 * 1000;
export const HEART_MAX = 5;

type State = {
  hearts: number;
  lastRegenAt: number;
};

type Actions = {
  loseHeart: () => number;
  refill: () => void;
  hasHearts: () => boolean;
  applyRegen: () => void;
  msUntilNextHeart: () => number;
};

export const heartsStore = createStore<State & Actions>()(
  persist(
    (set, get) => ({
      hearts: HEART_MAX,
      lastRegenAt: Date.now(),

      applyRegen: () => {
        const { hearts, lastRegenAt } = get();
        if (hearts >= HEART_MAX) {
          set({ lastRegenAt: Date.now() });
          return;
        }
        const elapsed = Date.now() - lastRegenAt;
        const earned = Math.floor(elapsed / HEART_REGEN_MS);
        if (earned <= 0) return;
        const next = Math.min(HEART_MAX, hearts + earned);
        set({ hearts: next, lastRegenAt: lastRegenAt + earned * HEART_REGEN_MS });
      },

      loseHeart: () => {
        get().applyRegen();
        const { hearts } = get();
        const next = Math.max(0, hearts - 1);
        const patch: Partial<State> = { hearts: next };
        if (hearts === HEART_MAX) patch.lastRegenAt = Date.now();
        set(patch);
        return next;
      },

      refill: () => set({ hearts: HEART_MAX, lastRegenAt: Date.now() }),

      hasHearts: () => {
        get().applyRegen();
        return get().hearts > 0;
      },

      msUntilNextHeart: () => {
        const { hearts, lastRegenAt } = get();
        if (hearts >= HEART_MAX) return 0;
        return Math.max(0, HEART_REGEN_MS - (Date.now() - lastRegenAt));
      },
    }),
    {
      name: "slubstack-hearts-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

export function useHeartsStore<T>(selector: (s: State & Actions) => T): T {
  return useStore(heartsStore, selector);
}
