"use client";

const MUTE_KEY = "slubstack_mute_sounds";

let ctx: AudioContext | null = null;

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

function muted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

function tone(freq: number, at: number, dur: number, peak: number, type: OscillatorType = "triangle", slideTo?: number) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise(at: number, dur: number, peak: number, freq: number, q = 0.9) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + at;
  const n = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function distGain(dist: number): number {
  return Math.max(0.06, 1 - dist / 55);
}

export function sfxShot(weapon: "rifle" | "pistol", local: boolean, dist = 0) {
  if (muted()) return;
  const g = local ? 1 : distGain(dist) * 0.55;
  if (weapon === "rifle") {
    noise(0, 0.09, 0.34 * g, 1400, 0.6);
    tone(150, 0, 0.1, 0.26 * g, "square", 70);
  } else {
    noise(0, 0.07, 0.3 * g, 1900, 0.7);
    tone(200, 0, 0.08, 0.22 * g, "square", 90);
  }
}

export function sfxHitConfirm(hs: boolean) {
  if (muted()) return;
  if (hs) {
    tone(1180, 0, 0.06, 0.3, "square");
    tone(1560, 0.05, 0.08, 0.26, "square");
  } else {
    tone(940, 0, 0.05, 0.24, "square");
  }
}

export function sfxDamageTaken() {
  if (muted()) return;
  tone(110, 0, 0.16, 0.4, "sawtooth", 60);
  noise(0, 0.1, 0.2, 500, 0.7);
}

export function sfxReload() {
  if (muted()) return;
  noise(0, 0.05, 0.22, 2400, 2);
  noise(0.16, 0.05, 0.22, 1800, 2);
  noise(0.42, 0.06, 0.26, 2800, 2);
}

export function sfxDryFire() {
  if (muted()) return;
  noise(0, 0.03, 0.18, 3200, 3);
}

export function sfxKill() {
  if (muted()) return;
  tone(523.25, 0, 0.1, 0.28, "triangle");
  tone(783.99, 0.07, 0.14, 0.26, "triangle");
}

export function sfxDeath() {
  if (muted()) return;
  tone(196, 0, 0.3, 0.34, "sawtooth", 90);
  tone(146.83, 0.12, 0.4, 0.28, "sawtooth", 70);
}

export function sfxRespawn() {
  if (muted()) return;
  tone(330, 0, 0.12, 0.2, "triangle", 660);
  tone(660, 0.1, 0.16, 0.18, "triangle", 990);
}

export function sfxCountBeep(final: boolean) {
  if (muted()) return;
  tone(final ? 880 : 440, 0, final ? 0.3 : 0.12, 0.26, "square");
}

export function sfxEnd(won: boolean) {
  if (muted()) return;
  if (won) {
    tone(523.25, 0, 0.16, 0.3, "triangle");
    tone(659.25, 0.1, 0.18, 0.3, "triangle");
    tone(783.99, 0.2, 0.2, 0.3, "triangle");
    tone(1046.5, 0.32, 0.34, 0.28, "triangle");
  } else {
    tone(392, 0, 0.22, 0.28, "sawtooth");
    tone(311.13, 0.16, 0.34, 0.26, "sawtooth");
  }
}
