"use client";

import { createStore, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { daysBetween, todayKey } from "@/lib/utils";

export type MedalCounts = { gold: number; silver: number; bronze: number };

type GlobalState = {
  streak: number;
  lastActiveDate: string | null;
  medals: MedalCounts;
};

type GlobalActions = {
  touchStreak: () => { streakIncremented: boolean; newStreak: number };
  awardMedal: (type: keyof MedalCounts) => void;
};

export const globalStore = createStore<GlobalState & GlobalActions>()(
  persist(
    (set, get) => ({
      streak: 0,
      lastActiveDate: null,
      medals: { gold: 0, silver: 0, bronze: 0 },

      touchStreak() {
        const today = todayKey();
        const { lastActiveDate, streak } = get();
        if (lastActiveDate === today) return { streakIncremented: false, newStreak: streak };
        const gap = lastActiveDate ? daysBetween(lastActiveDate, today) : null;
        const newStreak = gap === null ? 1 : gap === 1 ? streak + 1 : 1;
        set({ streak: newStreak, lastActiveDate: today });
        return { streakIncremented: newStreak > streak, newStreak };
      },

      awardMedal(type) {
        set((s) => ({ medals: { ...s.medals, [type]: s.medals[type] + 1 } }));
      },
    }),
    { name: "slubstack-global-v1", storage: createJSONStorage(() => localStorage), version: 1 }
  )
);

export function useGlobalStore<T>(selector: (s: GlobalState & GlobalActions) => T): T {
  return useStore(globalStore, selector);
}
