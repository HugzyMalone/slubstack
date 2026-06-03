// Dense ranking: ties share a rank and no rank numbers are skipped.
// Used by the multiplayer shells to rank live scores (highest score = rank 1).
export function denseRanks(scores: number[]): number[] {
  const sorted = [...new Set(scores)].sort((a, b) => b - a);
  const rankFor = new Map<number, number>();
  sorted.forEach((s, i) => rankFor.set(s, i + 1));
  return scores.map((s) => rankFor.get(s)!);
}
