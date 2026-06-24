import { describe, it, expect } from "vitest";
import { makePracticeBots } from "@/lib/games/sperm-race/bots";
import { MIN_MS_PER_TRACK } from "@/lib/games/sperm-race/engine";

describe("makePracticeBots", () => {
  it("seeds the requested number of bots with distinct slots starting at 1", () => {
    const bots = makePracticeBots(1, "seed", 3);
    expect(bots).toHaveLength(3);
    expect(bots.map((b) => b.slot)).toEqual([1, 2, 3]);
  });

  it("samples finish times within the per-track human band on every track", () => {
    for (const track of [1, 2, 3] as const) {
      const floor = MIN_MS_PER_TRACK[track];
      for (const bot of makePracticeBots(track, `t${track}`, 3)) {
        expect(bot.finishMs).toBeGreaterThanOrEqual(floor);
        expect(bot.finishMs).toBeLessThanOrEqual(Math.ceil(floor * 1.8));
      }
    }
  });

  it("is deterministic for a given seed", () => {
    expect(makePracticeBots(2, "abc", 3)).toEqual(makePracticeBots(2, "abc", 3));
  });
});
