import type { GameAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { PlayBoard, type ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { generatePostersQuestions } from "./questions";

const POINTS_PER_CORRECT = 8;

const scoring: ScoringRule<ImageMCQuestion, number> = (answer, question) => {
  const correct = answer === question.answerIndex;
  return { correct, points: correct ? POINTS_PER_CORRECT : 0 };
};

export const postersAdapter: GameAdapter<ImageMCQuestion, number> = {
  kind: "posters",
  displayName: "Poster Blitz",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 2000, maxGapMs: 3500, minDelta: 6, maxDelta: 10 } },
  ],
  PlayBoard,
  generateQuestions: generatePostersQuestions,
  scoring,
  xpFor: (correct) => correct * 7,
};
