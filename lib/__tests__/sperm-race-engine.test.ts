import { describe, it, expect } from "vitest";
import {
  createRaceState,
  registerTap,
  computePosition,
  validateTapTimeline,
  TAPS_TO_FINISH,
  MIN_MS_PER_TRACK,
} from "@/lib/games/sperm-race/engine";

describe("registerTap", () => {
  it("only advances on alternating buttons", () => {
    let s = createRaceState(1);
    s = registerTap(s, "A", 0);
    s = registerTap(s, "B", 100);
    expect(s.taps).toBe(2);
  });

  it("ignores same-button mashing", () => {
    let s = createRaceState(1);
    s = registerTap(s, "A", 0);
    s = registerTap(s, "A", 10);
    s = registerTap(s, "A", 20);
    expect(s.taps).toBe(1);
    expect(s.timeline).toHaveLength(1);
  });

  it("finishes when position reaches 1 and records every valid tap", () => {
    let s = createRaceState(1);
    for (let i = 0; i < TAPS_TO_FINISH[1]; i++) {
      s = registerTap(s, i % 2 === 0 ? "A" : "B", i * 100);
    }
    expect(s.finished).toBe(true);
    expect(s.pos).toBe(1);
    expect(s.timeline).toHaveLength(TAPS_TO_FINISH[1]);
  });
});

describe("computePosition", () => {
  it("clamps to [0, 1]", () => {
    expect(computePosition(-5, 1)).toBe(0);
    expect(computePosition(TAPS_TO_FINISH[1] * 2, 1)).toBe(1);
  });
});

describe("validateTapTimeline", () => {
  it("returns finish time for a plausible run", () => {
    const taps = Array.from({ length: TAPS_TO_FINISH[1] }, (_, i) => i * 150);
    expect(validateTapTimeline(taps, 1).validMs).toBe((TAPS_TO_FINISH[1] - 1) * 150);
  });

  it("rejects an impossible tap rate", () => {
    const taps = Array.from({ length: TAPS_TO_FINISH[1] }, (_, i) => i * 50);
    expect(validateTapTimeline(taps, 1).validMs).toBeNull();
  });

  it("rejects the wrong tap count", () => {
    expect(validateTapTimeline([0, 100, 200], 1).validMs).toBeNull();
  });

  it("rejects a sub-floor uniform run that clears the per-interval rate check", () => {
    // 90ms intervals = ~11.1 taps/s: under the 12/s ceiling but a superhuman
    // total that falls below the track floor.
    const taps = Array.from({ length: TAPS_TO_FINISH[1] }, (_, i) => i * 90);
    const finish = taps[taps.length - 1] - taps[0];
    expect(finish).toBeLessThan(MIN_MS_PER_TRACK[1]);
    expect(validateTapTimeline(taps, 1).validMs).toBeNull();
  });

  it("accepts a normal human-paced run above the floor", () => {
    const taps = Array.from({ length: TAPS_TO_FINISH[1] }, (_, i) => i * 150);
    const finish = (TAPS_TO_FINISH[1] - 1) * 150;
    expect(finish).toBeGreaterThanOrEqual(MIN_MS_PER_TRACK[1]);
    expect(validateTapTimeline(taps, 1).validMs).toBe(finish);
  });
});
