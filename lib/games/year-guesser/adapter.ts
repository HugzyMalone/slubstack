import type { SprintAdapter } from "@/lib/multiplayer/types";
import { closeness } from "@/lib/multiplayer/scoring";
import { PlayBoard, type YearQuestion } from "@/components/games/year-guesser/PlayBoard";
import { generateYearQuestions } from "./questions";

export const yearGuesserAdapter: SprintAdapter<YearQuestion, number> = {
  kind: "sprint",
  gameKind: "year_guesser",
  displayName: "Year Guesser",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 3500, maxGapMs: 5500, minDelta: 30, maxDelta: 70 } },
  ],
  PlayBoard,
  generateQuestions: generateYearQuestions,
  scoring: closeness(
    (q) => (q as YearQuestion).actualYear,
    { maxPoints: 100, perUnit: 5, correctWithin: 0 },
  ) as SprintAdapter<YearQuestion, number>["scoring"],
  xpFor: (_correct, points) => Math.round(points / 10),
};
