import type { SprintAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { PlayBoard, type HoLQuestion } from "@/components/games/higher-lower/PlayBoard";
import { generateHoLQuestions } from "./questions";

const scoring: ScoringRule<HoLQuestion, 0 | 1> = (answer, question) => {
  const correct = answer === question.answerIndex;
  return { correct, points: correct ? 1 : 0 };
};

export const higherLowerAdapter: SprintAdapter<HoLQuestion, 0 | 1> = {
  kind: "sprint",
  gameKind: "higher_lower",
  displayName: "Higher or Lower",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 2200, maxGapMs: 3800, minDelta: 6, maxDelta: 10 } },
  ],
  PlayBoard,
  generateQuestions: generateHoLQuestions,
  scoring,
  xpFor: (correct) => correct * 6,
};
