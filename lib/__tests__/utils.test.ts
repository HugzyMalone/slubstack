import { describe, it, expect } from 'vitest'
import { shuffle, todayKey, daysBetween } from '../utils'

describe('Utility Functions', () => {
  describe('shuffle()', () => {
    it('should return array with same length', () => {
      const input = [1, 2, 3, 4, 5]
      const result = shuffle(input)
      expect(result).toHaveLength(input.length)
    })

    it('should not mutate original array', () => {
      const input = [1, 2, 3]
      const original = [...input]
      shuffle(input)
      expect(input).toEqual(original)
    })

    it('should contain all original elements', () => {
      const input = ['a', 'b', 'c', 'd']
      const result = shuffle(input)
      expect(result.sort()).toEqual(input.sort())
    })

    it('should handle empty array', () => {
      expect(shuffle([])).toEqual([])
    })

    it('should handle single element array', () => {
      expect(shuffle([1])).toEqual([1])
    })

    it('should produce different results (probabilistic)', () => {
      const input = Array.from({ length: 20 }, (_, i) => i)
      const results = new Set()
      for (let i = 0; i < 10; i++) {
        results.add(shuffle(input).join(','))
      }
      // At least some variation (not deterministic, but very likely)
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('todayKey()', () => {
    it('should return YYYY-MM-DD format', () => {
      const result = todayKey()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should pad month and day with leading zeros', () => {
      const date = new Date('2026-01-05')
      expect(todayKey(date)).toBe('2026-01-05')
    })

    it('should handle custom date input', () => {
      const date = new Date('2026-12-25')
      expect(todayKey(date)).toBe('2026-12-25')
    })

    it('should handle end of year', () => {
      const date = new Date('2026-12-31')
      expect(todayKey(date)).toBe('2026-12-31')
    })
  })

  describe('daysBetween()', () => {
    it('should return 0 for same day', () => {
      expect(daysBetween('2026-04-20', '2026-04-20')).toBe(0)
    })

    it('should return 1 for consecutive days', () => {
      expect(daysBetween('2026-04-20', '2026-04-21')).toBe(1)
    })

    it('should return negative for reversed dates', () => {
      expect(daysBetween('2026-04-21', '2026-04-20')).toBe(-1)
    })

    it('should handle month boundaries', () => {
      expect(daysBetween('2026-04-30', '2026-05-01')).toBe(1)
    })

    it('should handle year boundaries', () => {
      expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1)
    })

    it('should handle leap years', () => {
      expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2) // 2024 is leap year
      expect(daysBetween('2025-02-28', '2025-03-01')).toBe(1) // 2025 is not
    })

    it('should calculate large date ranges', () => {
      expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364)
    })
  })
})
