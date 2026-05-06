export { type RNG, mulberry32, randInt } from "../multiplayer/rng";
import { randInt, type RNG } from "../multiplayer/rng";

export type Level = 1 | 2 | 3;

export type Question = { display: string; answer: number };

type LevelConfig = { ops: readonly string[]; maxA: number; maxB: number };

const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  1: { ops: ["+", "−"], maxA: 10, maxB: 10 },
  2: { ops: ["+", "−", "×", "÷"], maxA: 20, maxB: 10 },
  3: { ops: ["+", "−", "×", "÷"], maxA: 50, maxB: 12 },
};

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
