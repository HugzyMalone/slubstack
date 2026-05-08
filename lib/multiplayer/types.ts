import type { ComponentType } from "react";
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
  | "batman_shakespeare";

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

export type GameAdapter<Q, A> = {
  kind: GameKind;
  displayName: string;
  routePath: string;
  levels: LevelConfig[];
  PlayBoard: ComponentType<PlayBoardProps<Q, A>>;
  generateQuestions: (level: number, seed: string) => Q[];
  scoring: ScoringRule<Q, A>;
  onFeedback?: (result: ScoreResult) => void;
  onGameEnd?: () => void;
  xpFor: (correct: number, points: number) => number;
  storeKey: "brainTraining" | "trivia";
};
