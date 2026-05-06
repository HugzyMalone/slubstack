import { simulateBotTimeline as simulateGenericBotTimeline, type BotTuning } from "../multiplayer/bot";
import type { Level } from "./engine";

export type { BotTickEvent } from "../multiplayer/bot";

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
) {
  return simulateGenericBotTimeline(seed, TUNING[level], durationMs, botSlot);
}
