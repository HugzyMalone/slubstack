import { mulberry32, randInt } from "./rng";

export type BotTuning = {
  minGapMs: number;
  maxGapMs: number;
  minDelta: number;
  maxDelta: number;
};

export type BotTickEvent = { atMs: number; scoreDelta: number };

export function simulateBotTimeline(
  seed: string,
  tuning: BotTuning,
  durationMs: number,
  botSlot: number
): BotTickEvent[] {
  const rng = mulberry32(`${seed}::bot::${botSlot}`);
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
