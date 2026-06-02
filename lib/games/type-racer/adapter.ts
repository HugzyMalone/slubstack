import type { SprintAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { mulberry32, seedToInt, pickN } from "@/lib/games/geo-clone/seedRng";
import { PlayBoard, type TypePassage } from "@/components/games/type-racer/PlayBoard";
import { PASSAGES } from "./passages";

const PASSAGES_PER_RUN = 12;

const scoring: ScoringRule<TypePassage, string> = (answer) => {
  let wpm = 0;
  let accuracy = 0;
  try {
    const parsed = JSON.parse(answer) as { wpm?: number; accuracy?: number };
    wpm = Math.max(0, parsed.wpm ?? 0);
    accuracy = Math.max(0, Math.min(100, parsed.accuracy ?? 0));
  } catch {
    return { correct: false, points: 0 };
  }
  const points = Math.round(wpm * (accuracy / 100));
  return { correct: accuracy >= 95, points };
};

export const typeRacerAdapter: SprintAdapter<TypePassage, string> = {
  kind: "sprint",
  gameKind: "type_racer",
  ratingKind: "ranked",
  displayName: "Type Racer",
  routePath: "/games/type-racer",
  storeKey: "brainTraining",
  levels: [
    { id: 1, label: "Race", botTuning: { minGapMs: 8000, maxGapMs: 12000, minDelta: 40, maxDelta: 75 } },
  ],
  PlayBoard,
  generateQuestions: (_level, seed) => {
    const rng = mulberry32(seedToInt(seed));
    return pickN(PASSAGES, rng, PASSAGES_PER_RUN).map((text) => ({ text }));
  },
  scoring,
  xpFor: (_correct, points) => Math.round(points / 4),
  shareLine: (result) => ({
    title: "Slubstack Type Racer ⌨️",
    score: result.score,
    correct: result.correct,
    total: result.total,
    pb: result.pb,
    history: result.history,
  }),
};
