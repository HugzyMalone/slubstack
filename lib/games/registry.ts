import type { GameKind, SprintAdapter } from "@/lib/multiplayer/types";
import { actorBlitzAdapter } from "./actor-blitz/adapter";
import { albumsAdapter } from "./albums/adapter";
import { batmanShakespeareAdapter } from "./batman-shakespeare/adapter";
import { flagBlitzAdapter } from "./flag-blitz/adapter";
import { higherLowerAdapter } from "./higher-lower/adapter";
import { mathBlitzAdapter } from "./math-blitz/adapter";
import { typeRacerAdapter } from "./type-racer/adapter";
import { yearGuesserAdapter } from "./year-guesser/adapter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySprintAdapter = SprintAdapter<any, any>;

const SPRINT_ADAPTERS: Partial<Record<GameKind, AnySprintAdapter>> = {
  actor_blitz: actorBlitzAdapter,
  albums: albumsAdapter,
  batman_shakespeare: batmanShakespeareAdapter,
  flag_blitz: flagBlitzAdapter,
  higher_lower: higherLowerAdapter,
  math_blitz: mathBlitzAdapter,
  type_racer: typeRacerAdapter,
  year_guesser: yearGuesserAdapter,
};

export function getSprintAdapter(kind: string): AnySprintAdapter | null {
  return SPRINT_ADAPTERS[kind as GameKind] ?? null;
}
