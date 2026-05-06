import type { GameAdapter } from "@/lib/multiplayer/types";
import { binary } from "@/lib/multiplayer/scoring";
import { makeQuestion, mulberry32, type Level, type Question } from "@/lib/math-blitz/engine";
import { PlayBoard } from "@/components/games/math-blitz/PlayBoard";
import { playMathCorrect, playMathFinish, playMathWrong } from "@/lib/sound";

const ROUND_QUESTIONS = 60;

export const mathBlitzAdapter: GameAdapter<Question, number> = {
  kind: "math_blitz",
  displayName: "Math Blitz",
  routePath: "/brain-training",
  storeKey: "brainTraining",
  levels: [
    { id: 1, label: "Easy",   botTuning: { minGapMs: 1500, maxGapMs: 2500, minDelta: 8,  maxDelta: 12 } },
    { id: 2, label: "Medium", botTuning: { minGapMs: 1200, maxGapMs: 2000, minDelta: 9,  maxDelta: 14 } },
    { id: 3, label: "Hard",   botTuning: { minGapMs: 1000, maxGapMs: 1700, minDelta: 10, maxDelta: 16 } },
  ],
  PlayBoard,
  generateQuestions: (level, seed) => {
    const rng = mulberry32(`${seed}::q`);
    return Array.from({ length: ROUND_QUESTIONS }, () => makeQuestion(level as Level, rng));
  },
  scoring: binary<Question, number>((a, q) => a === q.answer, 1),
  onFeedback: (r) => (r.correct ? playMathCorrect() : playMathWrong()),
  onGameEnd: playMathFinish,
  xpFor: (correct) => correct * 5,
};
