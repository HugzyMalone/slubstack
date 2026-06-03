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
};

export type PlayBoardProps<Q, A> = {
  question: Q;
  remainingMs: number;
  feedback: ScoreResult | null;
  onAnswerAction: (answer: A) => void;
};

export type SprintAdapter<Q, A> = {
  kind: "sprint";
  gameKind: GameKind;
  ratingKind?: LadderKind;
  displayName: string;
  routePath: string;
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
