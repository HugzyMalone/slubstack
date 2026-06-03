import { describe, it, expect } from "vitest";
import { haversineDistanceMeters, pointsFromDistance } from "@/lib/games/geo-clone/scoring";

describe("haversineDistanceMeters", () => {
  it("is zero for identical points", () => {
    expect(haversineDistanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
  });

  it("matches the known London→Paris great-circle distance (~343 km)", () => {
    const d = haversineDistanceMeters({ lat: 51.5, lng: -0.12 }, { lat: 48.85, lng: 2.35 });
    expect(Math.round(d)).toBe(343128);
  });
});

describe("pointsFromDistance", () => {
  it("awards the full 5000 for a perfect guess", () => {
    expect(pointsFromDistance(0)).toBe(5000);
  });

  it("decays exponentially with distance", () => {
    expect(pointsFromDistance(2_000_000)).toBe(1839);
    expect(pointsFromDistance(10_000_000)).toBe(34);
  });
});
