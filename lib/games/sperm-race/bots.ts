import { MIN_MS_PER_TRACK, type Track } from "./engine";
import { mulberry32 } from "@/lib/multiplayer/rng";

export type PracticeBot = {
  slot: number;
  displayName: string;
  finishMs: number;
};

const BOT_NAMES = ["Flagellum Phil", "Wiggles", "Dash", "Tadpole Tina", "Squiggle"];

// Sampled in a band anchored to the per-track human floor: the floor is the
// fastest plausible finish, so bots run between 1.0x (championship pace) and
// 1.8x (leisurely) of it. Keeps a solo racer beatable but not trivial.
const FINISH_FLOOR_MULT = 1.0;
const FINISH_CEIL_MULT = 1.8;

export function makePracticeBots(track: Track, seed: string, count: number): PracticeBot[] {
  const rng = mulberry32(seed);
  const floor = MIN_MS_PER_TRACK[track];
  const bots: PracticeBot[] = [];
  for (let i = 0; i < count; i++) {
    const mult = FINISH_FLOOR_MULT + rng() * (FINISH_CEIL_MULT - FINISH_FLOOR_MULT);
    bots.push({
      slot: i + 1,
      displayName: BOT_NAMES[i % BOT_NAMES.length],
      finishMs: Math.round(floor * mult),
    });
  }
  return bots;
}
