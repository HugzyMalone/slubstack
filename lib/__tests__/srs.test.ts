import { describe, it, expect } from 'vitest'
import { rate, isDue, INITIAL_SRS, type Quality } from '../srs'

describe('SRS Algorithm', () => {
  describe('rate()', () => {
    it('should initialize with INITIAL_SRS state', () => {
      expect(INITIAL_SRS).toEqual({
        ease: 2.5,
        interval: 0,
        reps: 0,
        due: 0,
        lastReviewed: null,
      })
    })

    it('should reset reps and interval to 1 on quality < 3 (Again/Hard)', () => {
      const state = { ...INITIAL_SRS, ease: 2.5, interval: 7, reps: 5 }
      const result = rate(state, 0 as Quality) // Again
      expect(result.reps).toBe(0)
      expect(result.interval).toBe(1)
    })

    it('should progress interval: 1 day → 3 days → ease * interval', () => {
      let state = INITIAL_SRS
      state = rate(state, 4 as Quality) // First: interval = 1
      expect(state.interval).toBe(1)
      expect(state.reps).toBe(1)

      state = rate(state, 4 as Quality) // Second: interval = 3
      expect(state.interval).toBe(3)
      expect(state.reps).toBe(2)

      state = rate(state, 4 as Quality) // Third: interval = 3 * ease ≈ 7–8
      expect(state.interval).toBeGreaterThan(5)
      expect(state.reps).toBe(3)
    })

    it('should clamp ease to minimum 1.3', () => {
      let state = { ...INITIAL_SRS, ease: 1.5 }
      // Rate "Again" multiple times
      for (let i = 0; i < 10; i++) {
        state = rate(state, 0 as Quality)
      }
      expect(state.ease).toBeGreaterThanOrEqual(1.3)
    })

    it('should increase ease on quality 5 (Easy)', () => {
      const state = INITIAL_SRS
      const result = rate(state, 5 as Quality)
      expect(result.ease).toBeGreaterThan(INITIAL_SRS.ease)
    })

    it('should set lastReviewed and due correctly', () => {
      const now = Date.now()
      const result = rate(INITIAL_SRS, 4 as Quality, now)
      expect(result.lastReviewed).toBe(now)
      expect(result.due).toBe(now + 86_400_000) // 1 day in ms
    })
  })

  describe('isDue()', () => {
    it('should return true when due <= now', () => {
      const pastDue = { ...INITIAL_SRS, due: Date.now() - 1000 }
      expect(isDue(pastDue)).toBe(true)
    })

    it('should return false when due > now', () => {
      const future = { ...INITIAL_SRS, due: Date.now() + 10000 }
      expect(isDue(future)).toBe(false)
    })

    it('should handle exactly due time', () => {
      const now = Date.now()
      const exactlyDue = { ...INITIAL_SRS, due: now }
      expect(isDue(exactlyDue, now)).toBe(true)
    })
  })
})
