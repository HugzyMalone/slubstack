export type Level = 1 | 2 | 3;

export type Question = { display: string; answer: number };

export type RNG = () => number;

type LevelConfig = { ops: readonly string[]; maxA: number; maxB: number };

const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  1: { ops: ["+", "−"], maxA: 10, maxB: 10 },
  2: { ops: ["+", "−", "×", "÷"], maxA: 20, maxB: 10 },
  3: { ops: ["+", "−", "×", "÷"], maxA: 50, maxB: 12 },
};

export function mulberry32(seed: string): RNG {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(min: number, max: number, rng: RNG): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function makeQuestion(level: Level, rng: RNG): Question {
  const { ops, maxA, maxB } = LEVEL_CONFIG[level];
  const op = ops[Math.floor(rng() * ops.length)];
  let a: number, b: number, ans: number;

  switch (op) {
    case "+":
      a = randInt(1, maxA, rng); b = randInt(1, maxB, rng); ans = a + b; break;
    case "−":
      a = randInt(1, maxA, rng); b = randInt(1, a, rng); ans = a - b; break;
    case "×":
      a = randInt(2, Math.min(maxA, 12), rng); b = randInt(2, maxB, rng); ans = a * b; break;
    default: {
      b = randInt(2, maxB, rng);
      ans = randInt(1, Math.min(maxB, 12), rng);
      a = b * ans;
      break;
    }
  }
  return { display: `${a} ${op} ${b}`, answer: ans };
}
