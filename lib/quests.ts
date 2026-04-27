export type QuestKind = "xp" | "lessons" | "correct";

export type QuestTemplate = {
  id: string;
  kind: QuestKind;
  target: number;
  label: string;
};

const POOL: Record<QuestKind, QuestTemplate[]> = {
  xp: [
    { id: "xp-30",  kind: "xp", target: 30,  label: "Earn 30 XP today" },
    { id: "xp-60",  kind: "xp", target: 60,  label: "Earn 60 XP today" },
    { id: "xp-120", kind: "xp", target: 120, label: "Earn 120 XP today" },
  ],
  lessons: [
    { id: "lessons-1", kind: "lessons", target: 1, label: "Complete a lesson" },
    { id: "lessons-3", kind: "lessons", target: 3, label: "Complete 3 lessons" },
  ],
  correct: [
    { id: "correct-10", kind: "correct", target: 10, label: "Get 10 answers right" },
    { id: "correct-20", kind: "correct", target: 20, label: "Get 20 answers right" },
    { id: "correct-40", kind: "correct", target: 40, label: "Get 40 answers right" },
  ],
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailyQuestsFor(dateKey: string): QuestTemplate[] {
  const seed = hashString(dateKey);
  return [
    POOL.xp[seed % POOL.xp.length],
    POOL.lessons[(seed >>> 8) % POOL.lessons.length],
    POOL.correct[(seed >>> 16) % POOL.correct.length],
  ];
}

export const QUEST_KIND_LABEL: Record<QuestKind, string> = {
  xp: "XP",
  lessons: "Lessons",
  correct: "Correct",
};
