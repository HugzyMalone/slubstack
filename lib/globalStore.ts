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
  beats: number;
  beatsMonthKey: string | null;
};

type GlobalActions = {
  recordActivity: () => { streakIncremented: boolean; newStreak: number; freezeUsed: boolean; freezeGranted: boolean };
  hydrateStreak: (remote: { streak: number; lastActiveDate: string | null }) => void;
  awardMedal: (type: keyof MedalCounts) => void;
  addStreakFreeze: () => void;
  setLastUnit: (unit: LastUnit) => void;
  recordBeat: () => void;
};

// A stored streak is only "alive" if the last qualifying activity was today or
// yesterday. Anything older has lapsed, so the displayed streak is 0 regardless
// of the stale stored number.
export function effectiveStreak(streak: number, lastActiveDate: string | null): number {
  if (!lastActiveDate) return 0;
  const gap = daysBetween(lastActiveDate, todayKey());
  return gap >= 0 && gap <= 1 ? streak : 0;
}

const FREEZE_GRANT_INTERVAL = 7;
const FREEZE_MAX = 5;

export const globalStore = createStore<GlobalState & GlobalActions>()(
  persist(
    (set, get) => ({
      streak: 0,
      lastActiveDate: null,
      medals: { gold: 0, silver: 0, bronze: 0 },
      streakFreezes: 0,
      lastUnit: null,
      beats: 0,
      beatsMonthKey: null,

      recordActivity() {
        const today = todayKey();
        const { lastActiveDate, streak, streakFreezes } = get();
        if (lastActiveDate === today) {
          return { streakIncremented: false, newStreak: streak, freezeUsed: false, freezeGranted: false };
        }
        const gap = lastActiveDate ? daysBetween(lastActiveDate, today) : null;
        if (gap !== null && gap > 1 && streakFreezes > 0) {
          set((s) => ({ streakFreezes: s.streakFreezes - 1, lastActiveDate: today }));
          return { streakIncremented: false, newStreak: streak, freezeUsed: true, freezeGranted: false };
        }
        const newStreak = gap === null ? 1 : gap === 1 ? streak + 1 : 1;
        const crossedMilestone =
          newStreak > streak &&
          newStreak > 0 &&
          newStreak % FREEZE_GRANT_INTERVAL === 0 &&
          streakFreezes < FREEZE_MAX;
        set((s) => ({
          streak: newStreak,
          lastActiveDate: today,
          streakFreezes: crossedMilestone ? Math.min(FREEZE_MAX, s.streakFreezes + 1) : s.streakFreezes,
        }));
        return {
          streakIncremented: newStreak > streak,
          newStreak,
          freezeUsed: false,
          freezeGranted: crossedMilestone,
        };
      },

      hydrateStreak(remote) {
        // Server is authoritative for the streak: adopt the row tied to the most
        // recent activity rather than ratcheting to whichever number is larger.
        const local = get();
        const localDate = local.lastActiveDate;
        const remoteDate = remote.lastActiveDate;
        const remoteIsNewer =
          !localDate ? !!remoteDate :
          !remoteDate ? false :
          daysBetween(localDate, remoteDate) > 0;
        if (remoteIsNewer) {
          set({ streak: remote.streak, lastActiveDate: remoteDate });
        }
      },

      awardMedal(type) {
        set((s) => ({ medals: { ...s.medals, [type]: s.medals[type] + 1 } }));
      },

      addStreakFreeze() {
        set((s) => ({ streakFreezes: Math.min(FREEZE_MAX, s.streakFreezes + 1) }));
      },

      setLastUnit(unit) {
        set({ lastUnit: unit });
      },

      recordBeat() {
        const monthKey = new Date().toISOString().slice(0, 7);
        const { beatsMonthKey, beats } = get();
        if (beatsMonthKey !== monthKey) {
          set({ beats: 1, beatsMonthKey: monthKey });
        } else {
          set({ beats: beats + 1 });
        }
      },
    }),
    {
      name: "slubstack-global-v1",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted) => persisted as GlobalState & GlobalActions,
    }
  )
);

export function useGlobalStore<T>(selector: (s: GlobalState & GlobalActions) => T): T {
  return useStore(globalStore, selector);
}

export function useEffectiveStreak(): number {
  const streak = useStore(globalStore, (s) => s.streak);
  const lastActiveDate = useStore(globalStore, (s) => s.lastActiveDate);
  return effectiveStreak(streak, lastActiveDate);
}
