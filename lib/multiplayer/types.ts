import type { ComponentType } from "react";
import type { ShareCardInput } from "../share";
import type { BotTickEvent, BotTuning } from "./bot";
import type { ScoreResult, ScoringRule } from "./scoring";

export type { BotTuning } from "./bot";
export type { ScoreResult, ScoringRule } from "./scoring";

export type GameKind =
  | "math_blitz"
  | "actor_blitz"
  | "flag_blitz"
  | "albums"
  | "higher_lower"
  | "year_guesser"
  | "geo_clone"
  | "batman_shakespeare"
  | "type_racer";

export type LadderKind = GameKind | "trivia" | "ranked";

// Single cross-game ladder: every sprint game rates into one shared identity so
// a player has one rating across all of them. Splitting back to per-game ladders
// later is a config change — give each adapter its own ratingKind again.
export const RANKED_LADDER = "ranked" satisfies LadderKind;

/** End-of-game result a `shareLine` turns into a share card. */
export type GameResult = {
  score: number;
  correct: number;
  total: number;
  pb?: boolean;
  history?: ("correct" | "wrong")[];
};

export type LevelConfig = {
  id: number;
  label: string;
  botTuning: BotTuning;
  // Race-mode (Type Racer) bots: target words-per-minute range instead of the
  // points-per-tick tuning above.
  botWpm?: { min: number; max: number };
};

/**
 * Continuous live state a race-mode PlayBoard pushes to the shell every frame:
 * `score` is the headline number raced on (WPM), `progress` (0..1) drives the
 * lane position, and `finished` stops the player's clock and ends their race.
 */
export type LiveUpdate = { score: number; progress: number; finished: boolean };

export type PlayBoardProps<Q, A> = {
  question: Q;
  remainingMs: number;
  feedback: ScoreResult | null;
  onAnswerAction: (answer: A) => void;
  // Only supplied in race mode; classic sprint boards ignore it.
  onLiveAction?: (live: LiveUpdate) => void;
};

export type SprintAdapter<Q, A> = {
  kind: "sprint";
  gameKind: GameKind;
  ratingKind?: LadderKind;
  displayName: string;
  routePath: string;
  // Race mode: one shared passage, live-WPM lanes, first-to-finish wins. The
  // shell switches to progress-driven bots and ends a player's clock the moment
  // their board reports `finished`. Defaults off (classic 30s sprint).
  raceMode?: boolean;
  // Match length override. Defaults to 30_000ms.
  gameDurationMs?: number;
  // Unit shown next to the headline number (ticker + podium). Defaults to "pts".
  scoreLabel?: string;
  // Skip the level-select screen and queue straight into the only level. For
  // games where the picker would just be a single button. Defaults off.
  skipLevelSelect?: boolean;
  levels: LevelConfig[];
  PlayBoard: ComponentType<PlayBoardProps<Q, A>>;
  generateQuestions: (level: number, seed: string) => Q[];
  scoring: ScoringRule<Q, A>;
  onFeedback?: (result: ScoreResult) => void;
  onGameEnd?: () => void;
  xpFor: (correct: number, points: number) => number;
  shareLine?: (result: GameResult) => ShareCardInput;
  storeKey: "brainTraining" | "trivia";
};

export type RoundAdapter<Q, A> = {
  kind: "round";
  gameKind: GameKind;
  ratingKind?: LadderKind;
  displayName: string;
  roundCount: number;
  roundDurationMs: number;
  revealDurationMs: number;
  generateLocations: (seed: string, count: number) => Q[];
  scoreFromGuess: (guess: A, target: Q) => { points: number; distanceMeters: number };
  xpFor: (totalPoints: number) => number;
  shareLine?: (result: GameResult) => ShareCardInput;
  storeKey?: "brainTraining" | "trivia";
};

export type GameAdapter<Q, A> = SprintAdapter<Q, A> | RoundAdapter<Q, A>;

/** A recorded sprint run, replayed as a deterministic ghost in a ghost duel. */
export type GhostRun = {
  id: string;
  gameKind: GameKind;
  level: number;
  seed: string;
  score: number;
  correct: number;
  timeline: BotTickEvent[];
  displayName: string;
  avatarUrl: string | null;
};
