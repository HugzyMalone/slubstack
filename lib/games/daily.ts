import type { SprintAdapter } from "@/lib/multiplayer/types";
import { getDayIndex, getTodayStr } from "@/lib/wordle-words";
import { mathBlitzAdapter } from "./math-blitz/adapter";
import { actorBlitzAdapter } from "./actor-blitz/adapter";
import { flagBlitzAdapter } from "./flag-blitz/adapter";
import { albumsAdapter } from "./albums/adapter";
import { higherLowerAdapter } from "./higher-lower/adapter";
import { yearGuesserAdapter } from "./year-guesser/adapter";
import { batmanShakespeareAdapter } from "./batman-shakespeare/adapter";

export type AnySprintAdapter = SprintAdapter<unknown, unknown>;

const erase = <Q, A>(adapter: SprintAdapter<Q, A>): AnySprintAdapter =>
  adapter as unknown as AnySprintAdapter;

type DailyRotationEntry = {
  adapter: AnySprintAdapter;
  level: number;
};

export const DAILY_ROTATION: DailyRotationEntry[] = [
  { adapter: erase(mathBlitzAdapter), level: 2 },
  { adapter: erase(actorBlitzAdapter), level: 1 },
  { adapter: erase(flagBlitzAdapter), level: 1 },
  { adapter: erase(yearGuesserAdapter), level: 1 },
  { adapter: erase(albumsAdapter), level: 1 },
  { adapter: erase(higherLowerAdapter), level: 1 },
  { adapter: erase(batmanShakespeareAdapter), level: 1 },
];

const REGISTRY: Record<string, AnySprintAdapter> = Object.fromEntries(
  DAILY_ROTATION.map((entry) => [entry.adapter.gameKind, entry.adapter]),
);

export function getDailyAdapter(gameKind: string): AnySprintAdapter | null {
  return REGISTRY[gameKind] ?? null;
}

export type DailyChallenge = {
  date: string;
  gameKind: string;
  level: number;
  seed: string;
};

export function getDailyChallenge(dateStr: string = getTodayStr()): DailyChallenge {
  const dayIndex = getDayIndex(dateStr);
  const entry = DAILY_ROTATION[dayIndex % DAILY_ROTATION.length];
  return {
    date: dateStr,
    gameKind: entry.adapter.gameKind,
    level: entry.level,
    seed: dateStr,
  };
}
