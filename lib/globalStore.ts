"use client";

import { createStore, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { daysBetween, todayKey } from "@/lib/utils";

export type MedalCounts = { gold: number; silver: number; bronze: number };

export type LastUnit = {
  lang: string;
  unitId: string;
  title: string;
  emoji: string;
  href: string;
};

type GlobalState = {
  streak: number;
  lastActiveDate: string | null;
  medals: MedalCounts;
  streakFreezes: number;
  lastUnit: LastUnit | null;
};

type GlobalActions = {
  touchStreak: () => { streakIncremented: boolean; newStreak: number };
  awardMedal: (type: keyof MedalCounts) => void;
  addStreakFreeze: () => void;
  setLastUnit: (unit: LastUnit) => void;
};

export const globalStore = createStore<GlobalState & GlobalActions>()(
  persist(
    (set, get) => ({
      streak: 0,
      lastActiveDate: null,
      medals: { gold: 0, silver: 0, bronze: 0 },
      streakFreezes: 0,
      lastUnit: null,

      touchStreak() {
        const today = todayKey();
        const { lastActiveDate, streak, streakFreezes } = get();
        if (lastActiveDate === today) return { streakIncremented: false, newStreak: streak };
        const gap = lastActiveDate ? daysBetween(lastActiveDate, today) : null;
        if (gap !== null && gap > 1 && streakFreezes > 0) {
          set((s) => ({ streakFreezes: s.streakFreezes - 1, lastActiveDate: today }));
          return { streakIncremented: false, newStreak: streak };
        }
        const newStreak = gap === null ? 1 : gap === 1 ? streak + 1 : 1;
        set({ streak: newStreak, lastActiveDate: today });
        return { streakIncremented: newStreak > streak, newStreak };
      },

      awardMedal(type) {
        set((s) => ({ medals: { ...s.medals, [type]: s.medals[type] + 1 } }));
      },

      addStreakFreeze() {
        set((s) => ({ streakFreezes: Math.min(5, s.streakFreezes + 1) }));
      },

      setLastUnit(unit) {
        set({ lastUnit: unit });
      },
    }),
    { name: "slubstack-global-v1", storage: createJSONStorage(() => localStorage), version: 2 }
  )
);

export function useGlobalStore<T>(selector: (s: GlobalState & GlobalActions) => T): T {
  return useStore(globalStore, selector);
}
