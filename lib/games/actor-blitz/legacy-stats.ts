import { loadJsonField } from "@/lib/local-json";

const ACTOR_STATS_KEY = "slubstack_actorblitz_stats";

export type ActorStatMap = Record<string, { c: number; w: number; img: string }>;

export type ActorBest = {
  score: number;
  correct?: number;
  total: number;
  bestStreak: number;
  accuracy: number;
};

export function loadActorStats(): ActorStatMap {
  return loadJsonField<ActorStatMap>(ACTOR_STATS_KEY, "actors");
}
