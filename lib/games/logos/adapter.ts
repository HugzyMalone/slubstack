import type { GameAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { PlayBoard, type ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { generateLogosQuestions } from "./questions";

const scoring: ScoringRule<ImageMCQuestion, number> = (answer, question) => {
  const correct = answer === question.answerIndex;
  return { correct, points: correct ? 1 : 0 };
};

export const logosAdapter: GameAdapter<ImageMCQuestion, number> = {
  kind: "logos",
  displayName: "Logo Blitz",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 2000, maxGapMs: 3500, minDelta: 6, maxDelta: 10 } },
  ],
  PlayBoard,
  generateQuestions: generateLogosQuestions,
  scoring,
  xpFor: (correct) => correct * 7,
};
