export type AnswerClass = "exact" | "near" | "wrong";

export type ClassifyOpts = {
  strict?: boolean;
};

export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const dp: number[][] = Array.from({ length: al + 1 }, () =>
    new Array<number>(bl + 1).fill(0),
  );

  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[al][bl];
}

function maxAllowedDistance(len: number, strict = false): number {
  if (strict) {
    if (len <= 6) return 0;
    if (len <= 10) return 1;
    return Math.min(2, Math.floor(len * 0.12));
  }
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 10) return 2;
  return Math.min(3, Math.floor(len * 0.18));
}

function tokenSumDistance(input: string, target: string): number {
  const a = input.split(/\s+/).filter(Boolean);
  const b = target.split(/\s+/).filter(Boolean);
  if (a.length !== b.length || a.length < 2) {
    return damerauLevenshtein(input, target);
  }
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    total += damerauLevenshtein(a[i], b[i]);
  }
  return total;
}

export function classifyAnswer(
  input: string,
  accepted: string[],
  opts: ClassifyOpts = {},
): AnswerClass {
  if (!input || accepted.length === 0) return "wrong";
  if (accepted.includes(input)) return "exact";

  let bestDistance = Infinity;
  let bestTarget = "";
  for (const target of accepted) {
    const d = tokenSumDistance(input, target);
    if (d < bestDistance) {
      bestDistance = d;
      bestTarget = target;
    }
  }

  const allowed = maxAllowedDistance(bestTarget.length, opts.strict);
  return bestDistance <= allowed ? "near" : "wrong";
}

export function closestTarget(input: string, accepted: string[]): string | undefined {
  if (accepted.length === 0) return undefined;
  let best = accepted[0];
  let bestDistance = damerauLevenshtein(input, best);
  for (let i = 1; i < accepted.length; i++) {
    const d = damerauLevenshtein(input, accepted[i]);
    if (d < bestDistance) {
      bestDistance = d;
      best = accepted[i];
    }
  }
  return best;
}
