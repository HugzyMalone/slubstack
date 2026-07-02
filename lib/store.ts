"use client";

import { createContext, useContext, createElement } from "react";
import { createStore, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { INITIAL_SRS, type SrsState, rate, type Quality } from "@/lib/srs";
import { levelFromXp, XP_SESSION_COMPLETE } from "@/lib/xp";
import { daysBetween, todayKey } from "@/lib/utils";
import { globalStore } from "@/lib/globalStore";

type State = {
  srs: Record<string, SrsState>;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  completedUnits: string[];
  seenCardIds: string[];
};

export type RemoteState = {
  xp: number;
  streak: number;
  lastActiveDate?: string | null;
  completedUnits?: string[];
  seenCardIds?: string[];
  srs?: Record<string, SrsState>;
};

type Actions = {
  rateCard: (cardId: string, quality: Quality) => void;
  addXp: (amount: number) => void;
  completeSession: (firstTryCorrect: number, totalCorrect: number) => { gained: number; streakIncremented: boolean; freezeUsed: boolean; freezeGranted: boolean };
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

export function createGameStore(name: string) {
  return createStore<State & Actions>()(
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
          const gained = bonus + firstTryCorrect * 10 + (totalCorrect - firstTryCorrect) * 5;
          set((s) => ({ xp: s.xp + gained, streak: newStreak, lastActiveDate: today }));
          const { streakIncremented, freezeUsed, freezeGranted } = globalStore.getState().recordActivity();
          return { gained, streakIncremented, freezeUsed, freezeGranted };
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
          set((local) => {
            // Streak is not ratcheted: adopt the streak tied to the most recent
            // activity date so a lapsed run resets instead of persisting forever.
            const remoteNewer =
              !local.lastActiveDate ? !!remote.lastActiveDate :
              !remote.lastActiveDate ? false :
              remote.lastActiveDate > local.lastActiveDate;
            return {
              xp: Math.max(local.xp, remote.xp),
              streak: remoteNewer ? remote.streak : local.streak,
              lastActiveDate: remoteNewer ? remote.lastActiveDate : local.lastActiveDate,
              completedUnits: [...new Set([...local.completedUnits, ...(remote.completedUnits ?? [])])],
              seenCardIds: [...new Set([...local.seenCardIds, ...(remote.seenCardIds ?? [])])],
              srs: mergeSrs(local.srs, remote.srs ?? {}),
            };
          }),
      }),
      {
        name,
        storage: createJSONStorage(() => localStorage),
        version: 1,
      },
    ),
  );
}

export const mandarinStore = createGameStore("slubstack-v1");
export const germanStore = createGameStore("slubstack-german-v1");
export const spanishStore = createGameStore("slubstack-spanish-v1");
export const italianStore = createGameStore("slubstack-italian-v1");
export const vibeCodingStore = createGameStore("slubstack-vibe-v1");
export const githubStore = createGameStore("slubstack-github-v1");
export const brainTrainingStore = createGameStore("slubstack-brain-v1");
export const triviaStore = createGameStore("slubstack-trivia-v1");

// Canonical set of XP-bearing stores. Every screen that shows a total XP or a
// derived level MUST sum exactly these, so Home, Profile and sync never diverge.
export const XP_STORES = [
  mandarinStore,
  germanStore,
  spanishStore,
  italianStore,
  vibeCodingStore,
  githubStore,
  brainTrainingStore,
  triviaStore,
] as const;

export function getTotalXp(): number {
  return XP_STORES.reduce((sum, s) => sum + s.getState().xp, 0);
}

export function useTotalXp(): number {
  // XP_STORES is a fixed-length module constant, so useStore is called in the
  // same order on every render; the rule can't prove the array is constant.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return XP_STORES.reduce((sum, s) => sum + useStore(s, (st) => st.xp), 0);
}

type GameStoreInstance = ReturnType<typeof createGameStore>;

const GameStoreContext = createContext<GameStoreInstance>(mandarinStore);

export function GameStoreProvider({
  store,
  children,
}: {
  store: GameStoreInstance;
  children: React.ReactNode;
}) {
  return createElement(GameStoreContext.Provider, { value: store }, children);
}

export function useGameStore<T = State & Actions>(
  selector?: (s: State & Actions) => T,
): T {
  const store = useContext(GameStoreContext);
  return useStore(store, selector ?? ((s) => s as unknown as T));
}

export function useLevel() {
  return useGameStore((s) => levelFromXp(s.xp));
}
