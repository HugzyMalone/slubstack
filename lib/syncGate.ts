"use client";

// Until the initial server pull has merged remote state into local stores, an
// empty local state on a fresh/cleared device would push xp:0 upward and wipe
// real server progress. Push effects must wait for this gate to open.

let pulled = false;

export function markPullComplete() {
  pulled = true;
}

export function hasPullCompleted() {
  return pulled;
}

export function resetPullGate() {
  pulled = false;
}
