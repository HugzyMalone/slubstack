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

// Guaranteed floor for finishing any game, so a low/zero-correct run still
// earns something for showing up. Applied as a floor, not a bonus: a strong
// run keeps its performance XP unchanged.
export const XP_GAME_COMPLETE = 10;
