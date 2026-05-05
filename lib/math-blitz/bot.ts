import { mulberry32, randInt, type Level } from "./engine";

export type BotTickEvent = { atMs: number; scoreDelta: number };

type BotTuning = { minGapMs: number; maxGapMs: number; minDelta: number; maxDelta: number };

const TUNING: Record<Level, BotTuning> = {
  1: { minGapMs: 1500, maxGapMs: 2500, minDelta: 8, maxDelta: 12 },
  2: { minGapMs: 1200, maxGapMs: 2000, minDelta: 9, maxDelta: 14 },
  3: { minGapMs: 1000, maxGapMs: 1700, minDelta: 10, maxDelta: 16 },
};

export function simulateBotTimeline(
  seed: string,
  level: Level,
  durationMs: number,
  botSlot: number
): BotTickEvent[] {
  const rng = mulberry32(`${seed}::bot::${botSlot}`);
  const tuning = TUNING[level];
  const events: BotTickEvent[] = [];
  let t = 0;

  while (true) {
    const gap = randInt(tuning.minGapMs, tuning.maxGapMs, rng);
    const delta = randInt(tuning.minDelta, tuning.maxDelta, rng);
    t += gap;
    if (t > durationMs) break;
    events.push({ atMs: t, scoreDelta: delta });
  }

  return events;
}
