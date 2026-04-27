"use client";

const MUTE_KEY = "slubstack_mute_haptics";

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function fire(pattern: number | number[]) {
  if (!canVibrate() || isHapticMuted()) return;
  try { navigator.vibrate(pattern); } catch {}
}

export function isHapticMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setHapticMuted(next: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  }
}

export function tapLight() { fire(10); }
export function tapMedium() { fire(20); }
export function success() { fire([15, 40, 25]); }
export function fail() { fire([40, 60, 40]); }
export function streak() { fire([10, 30, 10, 30, 10]); }
export function levelUp() { fire([20, 40, 20, 40, 60]); }
