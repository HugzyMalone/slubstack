import type { SprintAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { PlayBoard, type ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { generateActorQuestions } from "./questions";

const POINTS_PER_CORRECT = 9;

const scoring: ScoringRule<ImageMCQuestion, number> = (answer, question) => {
  const correct = answer === question.answerIndex;
  return { correct, points: correct ? POINTS_PER_CORRECT : 0 };
};

export const actorBlitzAdapter: SprintAdapter<ImageMCQuestion, number> = {
  kind: "sprint",
  gameKind: "actor_blitz",
  displayName: "Actor Blitz",
  routePath: "/trivia",
  storeKey: "trivia",
  levels: [
    { id: 1, label: "Play", botTuning: { minGapMs: 2200, maxGapMs: 3600, minDelta: 7, maxDelta: 11 } },
  ],
  PlayBoard,
  generateQuestions: generateActorQuestions,
  scoring,
  xpFor: (correct) => correct * 8,
};
