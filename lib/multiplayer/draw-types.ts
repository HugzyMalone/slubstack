export type GameKindDraw = "draw_my_thing";

export type Point = { x: number; y: number };

export type StrokeDelta = {
  strokeId: string;
  segIndex: number;
  points: Point[];
  color: string;
  size: number;
  slot: number;
};

export type StrokeEnd = {
  strokeId: string;
  slot: number;
};

export type GuessMessage = {
  slot: number;
  text: string;
  roundIndex: number;
};

export type CorrectMessage = {
  guesserSlot: number;
  msElapsed: number;
  roundIndex: number;
};

export type RoundReady = {
  roundIndex: number;
  drawerSlot: number;
  word?: string;
};

export type DrawBroadcastEvent =
  | { type: "stroke_delta"; payload: StrokeDelta }
  | { type: "stroke_end"; payload: StrokeEnd }
  | { type: "guess"; payload: GuessMessage }
  | { type: "correct"; payload: CorrectMessage }
  | { type: "round_ready"; payload: RoundReady };

export type TurnBasedAdapter = {
  kind: "turn_based";
  gameKind: GameKindDraw;
  displayName: string;
  routePath: string;
  totalRoundsPerPlayer: number;
  roundDurationMs: number;
  betweenRoundsMs: number;
  pointsForDrawerOnCorrect: number;
  guesserPointsFor: (msElapsed: number, roundDurationMs: number) => number;
  xpFor: (totalScore: number) => number;
  storeKey: "brainTraining";
};

export const drawMyThingAdapter: TurnBasedAdapter = {
  kind: "turn_based",
  gameKind: "draw_my_thing",
  displayName: "Draw My Thing",
  routePath: "/brain-training/draw",
  totalRoundsPerPlayer: 2,
  roundDurationMs: 60000,
  betweenRoundsMs: 6000,
  pointsForDrawerOnCorrect: 60,
  guesserPointsFor: (ms, duration) => Math.max(20, Math.round(100 * (1 - ms / duration))),
  xpFor: (total) => Math.round(total / 8),
  storeKey: "brainTraining",
};
