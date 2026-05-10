import type { SprintAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { PlayBoard, type YearQuestion } from "@/components/games/year-guesser/PlayBoard";
import { generateYearQuestions } from "./questions";

const POINTS_PER_CORRECT = 12;

const scoring: ScoringRule<YearQuestion, number> = (answer, question) => {
  const correct = answer === question.answerIndex;
  return { correct, points: correct ? POINTS_PER_CORRECT : 0 };
};

export const yearGuesserAdapter: SprintAdapter<YearQuestion, number> = {
  kind: "sprint",
  gameKind: "year_guesser",
  displayName: "Year Guesser",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 2000, maxGapMs: 3500, minDelta: 6, maxDelta: 10 } },
  ],
  PlayBoard,
  generateQuestions: generateYearQuestions,
  scoring,
  xpFor: (correct) => correct * 7,
};
