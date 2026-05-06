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
  try {
    return JSON.parse(localStorage.getItem(ACTOR_STATS_KEY) ?? "{}").actors ?? {};
  } catch {
    return {};
  }
}
