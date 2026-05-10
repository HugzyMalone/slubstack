import type { GameAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { PlayBoard, type BatShakeQuestion, type BatShakeSource } from "@/components/games/batman-shakespeare/PlayBoard";
import { generateBatmanShakespeareQuestions } from "./questions";

const POINTS_PER_CORRECT = 8;

const scoring: ScoringRule<BatShakeQuestion, BatShakeSource> = (answer, question) => {
  const correct = answer === question.answer;
  return { correct, points: correct ? POINTS_PER_CORRECT : 0 };
};

export const batmanShakespeareAdapter: GameAdapter<BatShakeQuestion, BatShakeSource> = {
  kind: "batman_shakespeare",
  displayName: "Batman or Shakespeare?",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 2500, maxGapMs: 4500, minDelta: 6, maxDelta: 10 } },
  ],
  PlayBoard,
  generateQuestions: generateBatmanShakespeareQuestions,
  scoring,
  xpFor: (correct) => correct * 7,
};
