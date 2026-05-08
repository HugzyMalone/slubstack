import type { GameAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { PlayBoard, type ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { generateAlbumsQuestions } from "./questions";

const POINTS_PER_CORRECT = 8;

const scoring: ScoringRule<ImageMCQuestion, number> = (answer, question) => {
  const correct = answer === question.answerIndex;
  return { correct, points: correct ? POINTS_PER_CORRECT : 0 };
};

export const albumsAdapter: GameAdapter<ImageMCQuestion, number> = {
  kind: "albums",
  displayName: "Album Blitz",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 2000, maxGapMs: 3500, minDelta: 6, maxDelta: 10 } },
  ],
  PlayBoard,
  generateQuestions: generateAlbumsQuestions,
  scoring,
  xpFor: (correct) => correct * 7,
};
