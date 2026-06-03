import { describe, it, expect } from "vitest";
import { binary, closeness } from "@/lib/multiplayer/scoring";

describe("binary", () => {
  it("defaults to strict equality against question.answer for 1 point", () => {
    const rule = binary<{ answer: unknown }, unknown>();
    expect(rule(5, { answer: 5 })).toEqual({ correct: true, points: 1 });
    expect(rule(5, { answer: 6 })).toEqual({ correct: false, points: 0 });
  });

  it("awards a custom point value on a correct answer", () => {
    const rule = binary<{ answer: unknown }, unknown>((a, q) => a === q.answer, 3);
    expect(rule("x", { answer: "x" })).toEqual({ correct: true, points: 3 });
    expect(rule("x", { answer: "y" })).toEqual({ correct: false, points: 0 });
  });
});

describe("closeness", () => {
  const actualOf = (q: { actual: number }) => q.actual;

  it("gives max points for an exact answer and decays by perUnit per unit of error", () => {
    const rule = closeness(actualOf as (q: unknown) => number);
    expect(rule(100, { actual: 100 })).toEqual({ correct: true, points: 100 });
    expect(rule(90, { actual: 100 })).toEqual({ correct: false, points: 50 });
  });

  it("floors points at 0 and never reports correct outside correctWithin", () => {
    const rule = closeness(actualOf as (q: unknown) => number);
    expect(rule(0, { actual: 100 })).toEqual({ correct: false, points: 0 });
    expect(rule(120, { actual: 100 })).toEqual({ correct: false, points: 0 });
  });

  it("honours custom maxPoints, perUnit and correctWithin", () => {
    const rule = closeness(actualOf as (q: unknown) => number, {
      maxPoints: 50,
      perUnit: 2,
      correctWithin: 3,
    });
    expect(rule(98, { actual: 100 })).toEqual({ correct: true, points: 46 });
    expect(rule(80, { actual: 100 })).toEqual({ correct: false, points: 10 });
  });
});
