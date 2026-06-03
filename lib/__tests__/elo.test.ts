import { describe, it, expect } from "vitest";
import {
  updateRatings,
  updateRatingsVsBots,
  botRatingForLevel,
  type EloPlayer,
} from "@/lib/multiplayer/elo";

const human = (over: Partial<EloPlayer>): EloPlayer => ({
  userId: "u",
  rating: 1200,
  matches: 0,
  score: 0,
  isBot: false,
  ...over,
});

describe("updateRatings", () => {
  it("returns no updates when fewer than two humans are present", () => {
    expect(updateRatings([human({ userId: "a" })])).toEqual([]);
    expect(updateRatings([])).toEqual([]);
  });

  it("ignores bots — a lone human against bots gets no rating change here", () => {
    const out = updateRatings([
      human({ userId: "a", score: 10 }),
      human({ userId: "z", isBot: true, score: 99 }),
    ]);
    expect(out).toEqual([]);
  });

  it("moves two equal-rated players by ±16 with the K=32 (matches<30) factor", () => {
    const out = updateRatings([
      human({ userId: "a", rating: 1200, matches: 0, score: 10 }),
      human({ userId: "b", rating: 1200, matches: 0, score: 5 }),
    ]);
    expect(out).toEqual([
      { userId: "a", before: 1200, after: 1216, delta: 16 },
      { userId: "b", before: 1200, after: 1184, delta: -16 },
    ]);
  });

  it("uses K=16 once a player has 30+ matches and scores ties as 0.5", () => {
    const out = updateRatings([
      human({ userId: "a", rating: 1300, matches: 40, score: 30 }),
      human({ userId: "b", rating: 1100, matches: 5, score: 20 }),
      human({ userId: "c", rating: 1200, matches: 0, score: 20 }),
      human({ userId: "z", rating: 1400, matches: 0, score: 99, isBot: true }),
    ]);
    expect(out).toEqual([
      { userId: "a", before: 1300, after: 1310, delta: 10 },
      { userId: "b", before: 1100, after: 1097, delta: -3 },
      { userId: "c", before: 1200, after: 1184, delta: -16 },
    ]);
  });
});

describe("updateRatingsVsBots", () => {
  it("rates a lone human against the replay bots (K halved)", () => {
    const out = updateRatingsVsBots(
      human({ userId: "h", rating: 1200, matches: 0, score: 100 }),
      [
        human({ userId: "b1", rating: 1100, score: 50, isBot: true }),
        human({ userId: "b2", rating: 1400, score: 120, isBot: true }),
      ],
    );
    expect(out).toEqual({ userId: "h", before: 1200, after: 1202, delta: 2 });
  });

  it("self-limits: beating a much lower-rated bot yields ~0 gain", () => {
    const out = updateRatingsVsBots(
      human({ userId: "h", rating: 1600, matches: 50, score: 100 }),
      [human({ userId: "b1", rating: 1100, score: 50, isBot: true })],
    );
    expect(out).toEqual({ userId: "h", before: 1600, after: 1600, delta: 0 });
  });

  it("still costs rating on a loss to a lower-rated bot", () => {
    const out = updateRatingsVsBots(
      human({ userId: "h", rating: 1600, matches: 50, score: 10 }),
      [human({ userId: "b1", rating: 1100, score: 50, isBot: true })],
    );
    expect(out).toEqual({ userId: "h", before: 1600, after: 1592, delta: -8 });
  });
});

describe("botRatingForLevel", () => {
  it("maps known ladder levels and falls back to 1200", () => {
    expect(botRatingForLevel(1)).toBe(1100);
    expect(botRatingForLevel(2)).toBe(1250);
    expect(botRatingForLevel(3)).toBe(1400);
    expect(botRatingForLevel(7)).toBe(1200);
  });
});
