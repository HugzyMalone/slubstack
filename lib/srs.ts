/**
 * SM-2 spaced-repetition (Anki-flavoured). Intervals in days.
 * Quality: 0 Again, 2 Hard, 4 Good, 5 Easy.
 */

export type Quality = 0 | 2 | 4 | 5;

export type SrsState = {
  ease: number;
  interval: number;
  reps: number;
  due: number;
  lastReviewed: number | null;
};

export const INITIAL_SRS: SrsState = {
  ease: 2.5,
  interval: 0,
  reps: 0,
  due: 0,
  lastReviewed: null,
};

const DAY_MS = 86_400_000;

export function rate(state: SrsState, quality: Quality, now = Date.now()): SrsState {
  let { ease, interval, reps } = state;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
  }

  ease = Math.max(
    1.3,
    ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  return {
    ease,
    interval,
    reps,
    lastReviewed: now,
    due: now + interval * DAY_MS,
  };
}

export function isDue(state: SrsState, now = Date.now()): boolean {
  return state.due <= now;
}
