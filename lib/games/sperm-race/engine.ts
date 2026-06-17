export type Button = "A" | "B";

export type Track = 1 | 2 | 3;

export const TAPS_TO_FINISH: Record<Track, number> = {
  1: 30,
  2: 50,
  3: 75,
};

// Above this sustained alternating rate, a run is treated as bot/macro input.
// Humans top out around here on a two-button rhythm; the gap is the test.
export const MAX_TAPS_PER_SEC = 12;

// Hard ceiling on a single race. Without a finisher no client ever posts the
// finalise, so the match would hang in `waiting` forever; this forces every
// client to the result screen and one of them to finalise standings. Generous
// vs the human floor (the slowest track's floor is ~10.6s) so a genuine slow
// finisher is never cut off mid-run.
export const RACE_MAX_MS = 45_000;

// Per-track minimum plausible finish time. A uniform run at just under the 12/s
// ceiling passes the per-interval check yet implies a superhuman, unbeatable
// time, so we also floor the total. The floor derives from 7 taps/s — a cadence
// a person can sustain over a whole track (well below the 12/s burst ceiling) —
// applied across the (TAPS_TO_FINISH - 1) intervals of each track.
const SUSTAINED_TAPS_PER_SEC = 7;
export const MIN_MS_PER_TRACK: Record<Track, number> = {
  1: Math.round(((TAPS_TO_FINISH[1] - 1) * 1000) / SUSTAINED_TAPS_PER_SEC),
  2: Math.round(((TAPS_TO_FINISH[2] - 1) * 1000) / SUSTAINED_TAPS_PER_SEC),
  3: Math.round(((TAPS_TO_FINISH[3] - 1) * 1000) / SUSTAINED_TAPS_PER_SEC),
};

export type RaceState = {
  track: Track;
  taps: number;
  lastButton: Button | null;
  pos: number;
  finished: boolean;
  // Timestamps (ms, performance.now() / Date.now()) of each VALID alternating
  // tap, in order, for later server-side recompute and rate validation.
  timeline: number[];
};

export function computePosition(taps: number, track: Track): number {
  return Math.min(1, Math.max(0, taps / TAPS_TO_FINISH[track]));
}

export function createRaceState(track: Track): RaceState {
  return { track, taps: 0, lastButton: null, pos: 0, finished: false, timeline: [] };
}

export function registerTap(state: RaceState, button: Button, now: number): RaceState {
  if (state.finished || button === state.lastButton) return state;

  const taps = state.taps + 1;
  const pos = computePosition(taps, state.track);
  return {
    ...state,
    taps,
    lastButton: button,
    pos,
    finished: pos >= 1,
    timeline: [...state.timeline, now],
  };
}

export type ValidationResult = { validMs: number | null };

/**
 * Recompute a submitted run from its valid-tap timestamps. Returns the finish
 * time in ms when the run is plausible, or `null` when the timeline implies an
 * impossible sustained tap rate (> MAX_TAPS_PER_SEC), a finish faster than the
 * per-track human floor (MIN_MS_PER_TRACK), or the wrong tap count.
 * Single source of truth shared by client preflight and server validation.
 */
export function validateTapTimeline(taps: number[], track: Track): ValidationResult {
  if (taps.length !== TAPS_TO_FINISH[track]) return { validMs: null };

  for (let i = 1; i < taps.length; i++) {
    const dt = taps[i] - taps[i - 1];
    if (dt <= 0 || 1000 / dt > MAX_TAPS_PER_SEC) return { validMs: null };
  }

  const validMs = taps[taps.length - 1] - taps[0];
  if (validMs < MIN_MS_PER_TRACK[track]) return { validMs: null };

  return { validMs };
}
