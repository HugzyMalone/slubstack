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

/** Bigger fanfare for personal-best beats — ascending C-major arpeggio */
export function playFanfare() {
  if (isMuted()) return;
  void playTone(523.25, 0,    0.18, 0.34, "triangle"); // C5
  void playTone(659.25, 0.10, 0.20, 0.32, "triangle"); // E5
  void playTone(783.99, 0.20, 0.22, 0.30, "triangle"); // G5
  void playTone(1046.50, 0.32, 0.32, 0.30, "triangle"); // C6
  void playTone(1318.51, 0.44, 0.36, 0.26, "triangle"); // E6
  void playTone(1567.98, 0.56, 0.46, 0.22, "triangle"); // G6 sparkle
}

export function playHeartLoss() {
  if (isMuted()) return;
  void playTone(523.25, 0,    0.18, 0.30, "triangle"); // C5
  void playTone(440.00, 0.09, 0.20, 0.28, "triangle"); // A4
  void playTone(349.23, 0.18, 0.30, 0.32, "triangle"); // F4
  void playNoiseBurst(0.05, 0.12, 0.16);
}

export function playLeaguePromote() {
  if (isMuted()) return;
  void playTone(523.25, 0,    0.16, 0.32, "triangle"); // C5
  void playTone(659.25, 0.08, 0.18, 0.30, "triangle"); // E5
  void playTone(783.99, 0.16, 0.20, 0.30, "triangle"); // G5
  void playTone(1046.50, 0.26, 0.28, 0.30, "triangle"); // C6
  void playTone(1318.51, 0.38, 0.32, 0.26, "triangle"); // E6
  void playTone(1760.00, 0.50, 0.40, 0.22, "triangle"); // A6
  void playTone(2093.00, 0.62, 0.50, 0.18, "triangle"); // C7 sparkle
}

export function playLeagueDemote() {
  if (isMuted()) return;
  void playTone(369.99, 0,    0.22, 0.28, "sawtooth"); // F#4
  void playTone(293.66, 0.16, 0.32, 0.30, "sawtooth"); // D4
}

export function playQuestComplete() {
  if (isMuted()) return;
  void playTone(523.25, 0,    0.14, 0.30, "triangle"); // C5
  void playTone(659.25, 0.08, 0.16, 0.30, "triangle"); // E5
  void playTone(783.99, 0.16, 0.22, 0.30, "triangle"); // G5
}

export function playStreakSave() {
  if (isMuted()) return;
  void playTone(440.00, 0,    0.36, 0.26, "triangle"); // A4
  void playTone(659.25, 0,    0.36, 0.22, "triangle"); // E5
}

export function playWordleTap() {
  if (isMuted()) return;
  void playTone(880.00, 0, 0.03, 0.10, "square");
}

export function playWordleSubmit() {
  if (isMuted()) return;
  void playTone(523.25, 0,    0.18, 0.22, "triangle"); // C5
  void playTone(659.25, 0.06, 0.18, 0.20, "triangle"); // E5
  void playTone(783.99, 0.12, 0.20, 0.20, "triangle"); // G5
}

export function playWordleInvalid() {
  if (isMuted()) return;
  void playTone(220.00, 0, 0.14, 0.30, "sawtooth");
  void playTone(207.65, 0, 0.16, 0.24, "sawtooth");
  void playNoiseBurst(0.02, 0.08, 0.14);
}
