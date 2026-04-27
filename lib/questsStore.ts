"use client";

import { createStore, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { todayKey } from "@/lib/utils";
import { dailyQuestsFor, type QuestKind, type QuestTemplate } from "@/lib/quests";
import { playQuestComplete } from "@/lib/sound";
import { success as hapticSuccess } from "@/lib/haptics";

type State = {
  dateKey: string;
  progress: Record<string, number>;
  completed: Record<string, boolean>;
};

type Actions = {
  rollIfStale: () => void;
  recordProgress: (kind: QuestKind, amount: number) => string[];
  todaysQuests: () => QuestTemplate[];
};

export const questsStore = createStore<State & Actions>()(
  persist(
    (set, get) => ({
      dateKey: todayKey(),
      progress: {},
      completed: {},

      rollIfStale: () => {
        const today = todayKey();
        if (get().dateKey !== today) {
          set({ dateKey: today, progress: {}, completed: {} });
        }
      },

      todaysQuests: () => {
        get().rollIfStale();
        return dailyQuestsFor(get().dateKey);
      },

      recordProgress: (kind, amount) => {
        if (amount <= 0) return [];
        get().rollIfStale();
        const quests = dailyQuestsFor(get().dateKey);
        const newlyCompleted: string[] = [];
        const nextProgress = { ...get().progress };
        const nextCompleted = { ...get().completed };
        for (const q of quests) {
          if (q.kind !== kind) continue;
          const before = nextProgress[q.id] ?? 0;
          const after = Math.min(q.target, before + amount);
          nextProgress[q.id] = after;
          if (!nextCompleted[q.id] && after >= q.target) {
            nextCompleted[q.id] = true;
            newlyCompleted.push(q.id);
          }
        }
        set({ progress: nextProgress, completed: nextCompleted });
        return newlyCompleted;
      },
    }),
    {
      name: "slubstack-quests-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

export function useQuestsStore<T>(selector: (s: State & Actions) => T): T {
  return useStore(questsStore, selector);
}

export function recordQuestProgress(kind: QuestKind, amount: number): string[] {
  return questsStore.getState().recordProgress(kind, amount);
}

export function awardQuestProgress(kind: QuestKind, amount: number) {
  const completedIds = recordQuestProgress(kind, amount);
  if (completedIds.length === 0) return;
  const quests = dailyQuestsFor(questsStore.getState().dateKey);
  for (const id of completedIds) {
    const q = quests.find((x) => x.id === id);
    if (!q) continue;
    playQuestComplete();
    hapticSuccess();
    toast.success(`Quest done — ${q.label}`);
  }
}
