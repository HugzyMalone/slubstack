import { describe, it, expect } from 'vitest'
import { levelFromXp, xpForLevel, xpToNextLevel } from '../xp'

describe('XP System', () => {
  describe('levelFromXp()', () => {
    it('should return 0 for 0 XP', () => {
      expect(levelFromXp(0)).toBe(0)
    })

    it('should return 0 for XP < 50', () => {
      expect(levelFromXp(25)).toBe(0)
      expect(levelFromXp(49)).toBe(0)
    })

    it('should return 1 for XP = 50', () => {
      expect(levelFromXp(50)).toBe(1)
    })

    it('should calculate correct levels for known XP values', () => {
      expect(levelFromXp(200)).toBe(2)  // sqrt(200/50) = 2
      expect(levelFromXp(450)).toBe(3)  // sqrt(450/50) = 3
      expect(levelFromXp(800)).toBe(4)  // sqrt(800/50) = 4
    })

    it('should handle negative XP gracefully (return 0)', () => {
      expect(levelFromXp(-100)).toBe(0)
    })

    it('should handle very large XP values', () => {
      expect(levelFromXp(100000)).toBeGreaterThan(40)
    })
  })

  describe('xpForLevel()', () => {
    it('should return 0 XP for level 0', () => {
      expect(xpForLevel(0)).toBe(0)
    })

    it('should return 50 XP for level 1', () => {
      expect(xpForLevel(1)).toBe(50)
    })

    it('should calculate correct XP for levels 2-5', () => {
      expect(xpForLevel(2)).toBe(200)
      expect(xpForLevel(3)).toBe(450)
      expect(xpForLevel(4)).toBe(800)
      expect(xpForLevel(5)).toBe(1250)
    })

    it('should be inverse of levelFromXp', () => {
      for (let level = 0; level <= 20; level++) {
        const xp = xpForLevel(level)
        expect(levelFromXp(xp)).toBe(level)
      }
    })
  })

  describe('xpToNextLevel()', () => {
    it('should calculate progress correctly at level boundaries', () => {
      const result = xpToNextLevel(50) // exactly level 1
      expect(result.current).toBe(50)
      expect(result.next).toBe(200)
      expect(result.progress).toBe(0)
    })

    it('should calculate 50% progress correctly', () => {
      // Level 1 (50 XP) → Level 2 (200 XP), midpoint = 125 XP
      const result = xpToNextLevel(125)
      expect(result.progress).toBeCloseTo(0.5, 2)
    })

    it('should calculate 100% progress at next level threshold', () => {
      const result = xpToNextLevel(199) // 1 XP before level 2
      expect(result.progress).toBeCloseTo(0.993, 2)
    })

    it('should handle 0 XP', () => {
      const result = xpToNextLevel(0)
      expect(result.current).toBe(0)
      expect(result.next).toBe(50)
      expect(result.progress).toBe(0)
    })
  })
})
