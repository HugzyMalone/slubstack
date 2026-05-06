const STATS_KEY = "slubstack_mathblitz_stats";

export type MathOpStats = Record<string, { c: number; w: number }>;

export function loadMathOpStats(): MathOpStats {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}").ops ?? {};
  } catch {
    return {};
  }
}
