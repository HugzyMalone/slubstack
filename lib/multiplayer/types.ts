import type { ComponentType } from "react";
import type { ShareCardInput } from "../share";
import type { BotTuning } from "./bot";
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
  | "batman_shakespeare";

export type LadderKind = GameKind | "trivia";

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
