export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50));
}

export function xpForLevel(level: number): number {
  return level * level * 50;
}

export function xpToNextLevel(xp: number): { current: number; next: number; progress: number } {
  const level = levelFromXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const progress = (xp - current) / (next - current);
  return { current, next, progress };
}

export const XP_CORRECT_FIRST_TRY = 10;
export const XP_CORRECT_AFTER_RETRY = 5;
export const XP_SESSION_COMPLETE = 25;
