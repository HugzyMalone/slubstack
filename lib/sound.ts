"use client";

// Web Audio feedback chimes — synthesised, no audio asset files.
// Correct: a bright two-note arpeggio (C5 → G5), short and tactile.
// Wrong: a soft descending minor third with slight detune (A4 → F4), damped.

let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = "slubstack_mute_sounds";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function playTone(
  freq: number,
  startOffset: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = "sine",
) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return muted;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(next: boolean) {
  muted = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  }
}

export function playCorrect() {
  if (isMuted()) return;
  // C5 → G5, triangle wave feels softer than sine for arpeggio
  playTone(523.25, 0, 0.18, 0.18, "triangle");
  playTone(783.99, 0.1, 0.22, 0.18, "triangle");
}

export function playWrong() {
  if (isMuted()) return;
  // A4 detuned buzz, short and damped
  playTone(440, 0, 0.18, 0.16, "sawtooth");
  playTone(349.23, 0.08, 0.24, 0.14, "sawtooth");
}
