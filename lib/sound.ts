"use client";

let ctx: AudioContext | null = null;

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
  return ctx;
}

if (typeof window !== "undefined") {
  const unlock = () => {
    const ac = getCtx();
    if (!ac) return;
    if (ac.state === "suspended") void ac.resume();
    try {
      const o = ac.createOscillator();
      const g = ac.createGain();
      g.gain.value = 0;
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.01);
    } catch {}
  };
  ["pointerdown", "touchstart", "keydown"].forEach((ev) =>
    window.addEventListener(ev, unlock, { once: true, passive: true, capture: true }),
  );
}

async function playTone(
  freq: number,
  startOffset: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = "triangle",
) {
  const ac = getCtx();
  if (!ac) return;
  // Must await resume so scheduled events land in the future, not the past.
  if (ac.state === "suspended") {
    try { await ac.resume(); } catch { return; }
  }
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

async function playNoiseBurst(startOffset: number, duration: number, gainPeak: number) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") {
    try { await ac.resume(); } catch { return; }
  }
  const t0 = ac.currentTime + startOffset;
  const bufferSize = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.8;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(next: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  }
}

export function playCorrect() {
  if (isMuted()) return;
  // C-major triad (C5 + E5 + G5) for a bright, confident chord,
  // then a top-octave C6 sparkle for the "complete" feel.
  void playTone(523.25, 0, 0.28, 0.38, "triangle");
  void playTone(659.25, 0, 0.28, 0.30, "triangle");
  void playTone(783.99, 0, 0.32, 0.32, "triangle");
  void playTone(1046.50, 0.11, 0.34, 0.26, "triangle");
}

export function playWrong() {
  if (isMuted()) return;
  // Low dissonant stab + filtered noise burst for a "rejection" feel.
  void playTone(196.00, 0, 0.26, 0.42, "sawtooth"); // G3
  void playTone(185.00, 0, 0.30, 0.34, "sawtooth"); // detuned F#3 (minor 2nd clash)
  void playTone(146.83, 0.06, 0.36, 0.30, "square"); // D3 drop
  void playNoiseBurst(0, 0.18, 0.22);
}
