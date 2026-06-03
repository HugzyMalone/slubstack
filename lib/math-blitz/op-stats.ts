import { loadJsonField } from "@/lib/local-json";

const STATS_KEY = "slubstack_mathblitz_stats";

export type MathOpStats = Record<string, { c: number; w: number }>;

export function loadMathOpStats(): MathOpStats {
  return loadJsonField<MathOpStats>(STATS_KEY, "ops");
}
