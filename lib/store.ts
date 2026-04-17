"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { INITIAL_SRS, type SrsState, rate, type Quality } from "@/lib/srs";
import { levelFromXp, XP_SESSION_COMPLETE } from "@/lib/xp";
import { daysBetween, todayKey } from "@/lib/utils";

type State = {
  /** srs[cardId] → state (absent ⇒ new card with INITIAL_SRS). */
  srs: Record<string, SrsState>;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  completedUnits: string[];
  /** Count of cards ever seen — used to gate “new” card intake. */
  seenCardIds: string[];
};

type RemoteState = {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  completedUnits: string[];
  seenCardIds: string[];
  srs: Record<string, SrsState>;
};

type Actions = {
  rateCard: (cardId: string, quality: Quality) => void;
  addXp: (amount: number) => void;
  completeSession: (firstTryCorrect: number, totalCorrect: number) => number;
  completeUnit: (unitId: string) => void;
  getSrs: (cardId: string) => SrsState;
  reset: () => void;
  mergeFromServer: (remote: RemoteState) => void;
};

function mergeSrs(
  local: Record<string, SrsState>,
  remote: Record<string, SrsState>,
): Record<string, SrsState> {
  const merged = { ...local };
  for (const [id, r] of Object.entries(remote)) {
    const l = local[id];
    merged[id] = !l || r.reps > l.reps || (r.reps === l.reps && r.due > l.due) ? r : l;
  }
  return merged;
}

export const useGameStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      srs: {},
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      completedUnits: [],
      seenCardIds: [],

      getSrs: (cardId) => get().srs[cardId] ?? INITIAL_SRS,

      rateCard: (cardId, quality) => {
        const prev = get().srs[cardId] ?? INITIAL_SRS;
        const next = rate(prev, quality);
        set((s) => ({
          srs: { ...s.srs, [cardId]: next },
          seenCardIds: s.seenCardIds.includes(cardId)
            ? s.seenCardIds
            : [...s.seenCardIds, cardId],
        }));
      },

      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

      completeSession: (firstTryCorrect, totalCorrect) => {
        const bonus = XP_SESSION_COMPLETE;
        const today = todayKey();
        const { lastActiveDate, streak } = get();
        let newStreak = streak;
        if (lastActiveDate !== today) {
          if (!lastActiveDate) newStreak = 1;
          else {
            const gap = daysBetween(lastActiveDate, today);
            newStreak = gap === 1 ? streak + 1 : gap === 0 ? streak : 1;
          }
        }
        const gained =
          bonus + firstTryCorrect * 10 + (totalCorrect - firstTryCorrect) * 5;
        set((s) => ({
          xp: s.xp + gained,
          streak: newStreak,
          lastActiveDate: today,
        }));
        return gained;
      },

      completeUnit: (unitId) =>
        set((s) =>
          s.completedUnits.includes(unitId)
            ? s
            : { completedUnits: [...s.completedUnits, unitId] },
        ),

      reset: () =>
        set({
          srs: {},
          xp: 0,
          streak: 0,
          lastActiveDate: null,
          completedUnits: [],
          seenCardIds: [],
        }),

      mergeFromServer: (remote) =>
        set((local) => ({
          xp: Math.max(local.xp, remote.xp),
          streak: Math.max(local.streak, remote.streak),
          lastActiveDate:
            !local.lastActiveDate ? remote.lastActiveDate :
            !remote.lastActiveDate ? local.lastActiveDate :
            local.lastActiveDate > remote.lastActiveDate ? local.lastActiveDate : remote.lastActiveDate,
          completedUnits: [...new Set([...local.completedUnits, ...remote.completedUnits])],
          seenCardIds: [...new Set([...local.seenCardIds, ...remote.seenCardIds])],
          srs: mergeSrs(local.srs, remote.srs),
        })),
    }),
    {
      name: "slubstack-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function useLevel() {
  return useGameStore((s) => levelFromXp(s.xp));
}
