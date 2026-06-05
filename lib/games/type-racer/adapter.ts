import type { SprintAdapter, ScoringRule } from "@/lib/multiplayer/types";
import { mulberry32, seedToInt, pickN } from "@/lib/games/geo-clone/seedRng";
import { PlayBoard, type TypePassage } from "@/components/games/type-racer/PlayBoard";
import { PASSAGES } from "./passages";

// Cap a single race at 60s — long enough for a slow typist to finish the
// paragraph, short enough that a stall still resolves.
const RACE_DURATION_MS = 60_000;

// In race mode the live WPM is pushed straight to the shell, so this scoring
// rule is only a back-compat fallback for the answer payload.
const scoring: ScoringRule<TypePassage, string> = (answer) => {
  try {
    const parsed = JSON.parse(answer) as { wpm?: number; accuracy?: number };
    const wpm = Math.max(0, parsed.wpm ?? 0);
    const accuracy = Math.max(0, Math.min(100, parsed.accuracy ?? 0));
    return { correct: accuracy >= 95, points: wpm };
  } catch {
    return { correct: false, points: 0 };
  }
};

export const typeRacerAdapter: SprintAdapter<TypePassage, string> = {
  kind: "sprint",
  gameKind: "type_racer",
  ratingKind: "ranked",
  displayName: "Type Racer",
  routePath: "/games",
  storeKey: "brainTraining",
  raceMode: true,
  gameDurationMs: RACE_DURATION_MS,
  scoreLabel: "WPM",
  skipLevelSelect: true,
  levels: [
    {
      id: 1,
      label: "Race",
      botTuning: { minGapMs: 8000, maxGapMs: 12000, minDelta: 40, maxDelta: 75 },
      botWpm: { min: 20, max: 52 },
    },
  ],
  PlayBoard,
  generateQuestions: (_level, seed) => {
    const rng = mulberry32(seedToInt(seed));
    return pickN(PASSAGES, rng, 1).map((text) => ({ text }));
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
