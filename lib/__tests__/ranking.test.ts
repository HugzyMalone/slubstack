import { describe, it, expect } from "vitest";
import { denseRanks } from "@/lib/multiplayer/ranking";

describe("denseRanks", () => {
  it("ranks distinct scores highest-first", () => {
    expect(denseRanks([10, 30, 20])).toEqual([3, 1, 2]);
  });

  it("gives tied scores the same rank with no gaps (dense ranking)", () => {
    expect(denseRanks([10, 20, 10])).toEqual([2, 1, 2]);
    expect(denseRanks([5, 5, 5])).toEqual([1, 1, 1]);
    expect(denseRanks([100, 50, 50, 10])).toEqual([1, 2, 2, 3]);
  });

  it("returns an empty array for no scores", () => {
    expect(denseRanks([])).toEqual([]);
  });

  it("preserves input order in the output", () => {
    expect(denseRanks([0, 0, 7])).toEqual([2, 2, 1]);
  });
});
