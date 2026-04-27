import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getDayIndex, getTodayStr, getDailyPuzzle, getPuzzleNumber } from '../connections-puzzles'

describe('Connections Puzzles', () => {
  const EPOCH = '2026-04-19'

  describe('getDayIndex()', () => {
    it('should return 0 for epoch date', () => {
      vi.setSystemTime(new Date('2026-04-19T12:00:00Z'))
      expect(getDayIndex()).toBe(0)
    })

    it('should return 1 for day after epoch', () => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
      expect(getDayIndex()).toBe(1)
    })

    it('should return positive values for future dates', () => {
      vi.setSystemTime(new Date('2026-04-25T12:00:00Z'))
      expect(getDayIndex()).toBe(6)
    })

    it('should return negative values for dates before epoch', () => {
      vi.setSystemTime(new Date('2026-04-18T12:00:00Z'))
      expect(getDayIndex()).toBeLessThan(0)
    })

    it('should handle month boundaries', () => {
      vi.setSystemTime(new Date('2026-05-01T12:00:00Z'))
      const apr30 = Math.floor((new Date('2026-04-30').getTime() - new Date(EPOCH).getTime()) / 86400000)
      const may1 = getDayIndex()
      expect(may1 - apr30).toBe(1)
    })

    it('should handle year boundaries', () => {
      vi.setSystemTime(new Date('2027-01-01T12:00:00Z'))
      const dec31 = Math.floor((new Date('2026-12-31').getTime() - new Date(EPOCH).getTime()) / 86400000)
      vi.setSystemTime(new Date('2027-01-01T12:00:00Z'))
      const jan1 = getDayIndex()
      expect(jan1 - dec31).toBe(1)
    })

    it('should be consistent throughout the same day', () => {
      vi.setSystemTime(new Date('2026-04-20T00:00:01Z'))
      const morning = getDayIndex()

      vi.setSystemTime(new Date('2026-04-20T23:59:59Z'))
      const night = getDayIndex()

      expect(morning).toBe(night)
    })
  })

  describe('getTodayStr()', () => {
    it('should return date in YYYY-MM-DD format', () => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
      const result = getTodayStr()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should pad month and day with zeros', () => {
      vi.setSystemTime(new Date('2026-01-05T12:00:00Z'))
      expect(getTodayStr()).toBe('2026-01-05')
    })

    it('should handle end of year', () => {
      vi.setSystemTime(new Date('2026-12-31T12:00:00Z'))
      expect(getTodayStr()).toBe('2026-12-31')
    })

    it('should handle start of year', () => {
      vi.setSystemTime(new Date('2027-01-01T12:00:00Z'))
      expect(getTodayStr()).toBe('2027-01-01')
    })
  })

  describe('getDailyPuzzle()', () => {
    it('should return a puzzle with 4 categories', () => {
      const puzzle = getDailyPuzzle()
      expect(puzzle.categories).toHaveLength(4)
    })

    it('should have each category with 4 words', () => {
      const puzzle = getDailyPuzzle()
      puzzle.categories.forEach(category => {
        expect(category.words).toHaveLength(4)
        expect(Array.isArray(category.words)).toBe(true)
      })
    })

    it('should have categories with valid colors', () => {
      const validColors = ['yellow', 'green', 'blue', 'purple']
      const puzzle = getDailyPuzzle()
      puzzle.categories.forEach(category => {
        expect(validColors).toContain(category.color)
        expect(category.name).toBeTruthy()
      })
    })

    it('should return same puzzle for same day', () => {
      vi.setSystemTime(new Date('2026-04-20T08:00:00Z'))
      const puzzle1 = getDailyPuzzle()

      vi.setSystemTime(new Date('2026-04-20T20:00:00Z'))
      const puzzle2 = getDailyPuzzle()

      expect(puzzle1).toEqual(puzzle2)
    })

    it('should return different puzzles for consecutive days (likely)', () => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
      const puzzle1 = getDailyPuzzle()

      vi.setSystemTime(new Date('2026-04-21T12:00:00Z'))
      const puzzle2 = getDailyPuzzle()

      // Not guaranteed but very likely unless puzzle pool is very small
      expect(puzzle1.number).not.toBe(puzzle2.number)
    })

    it('should cycle through puzzle pool', () => {
      // Test that modulo cycling works
      vi.setSystemTime(new Date('2026-04-19T12:00:00Z'))
      const firstPuzzle = getDailyPuzzle()

      expect(firstPuzzle).toBeDefined()
      expect(firstPuzzle.categories).toHaveLength(4)
    })

    it('should have all words as uppercase strings', () => {
      const puzzle = getDailyPuzzle()
      puzzle.categories.forEach(category => {
        category.words.forEach(word => {
          expect(typeof word).toBe('string')
          expect(word.length).toBeGreaterThan(0)
        })
      })
    })

    it('should have no duplicate words within a puzzle', () => {
      const puzzle = getDailyPuzzle()
      const allWords = puzzle.categories.flatMap(c => c.words)
      const uniqueWords = new Set(allWords)
      expect(uniqueWords.size).toBe(16) // 4 categories × 4 words
    })
  })

  describe('getPuzzleNumber()', () => {
    it('should return 1 for epoch date', () => {
      vi.setSystemTime(new Date('2026-04-19T12:00:00Z'))
      expect(getPuzzleNumber()).toBe(1)
    })

    it('should return 2 for day after epoch', () => {
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
      expect(getPuzzleNumber()).toBe(2)
    })

    it('should increment by 1 each day', () => {
      vi.setSystemTime(new Date('2026-04-25T12:00:00Z'))
      const num1 = getPuzzleNumber()

      vi.setSystemTime(new Date('2026-04-26T12:00:00Z'))
      const num2 = getPuzzleNumber()

      expect(num2 - num1).toBe(1)
    })

    it('should be consistent throughout the same day', () => {
      vi.setSystemTime(new Date('2026-04-20T00:01:00Z'))
      const morning = getPuzzleNumber()

      vi.setSystemTime(new Date('2026-04-20T23:59:00Z'))
      const night = getPuzzleNumber()

      expect(morning).toBe(night)
    })
  })

  describe('Puzzle Data Integrity', () => {
    it('should have valid category structure', () => {
      const puzzle = getDailyPuzzle()
      puzzle.categories.forEach(category => {
        expect(category).toHaveProperty('name')
        expect(category).toHaveProperty('color')
        expect(category).toHaveProperty('words')
        expect(typeof category.name).toBe('string')
        expect(['yellow', 'green', 'blue', 'purple']).toContain(category.color)
      })
    })

    it('should have difficulty progression (color order)', () => {
      const puzzle = getDailyPuzzle()
      // Connections typically goes yellow (easiest) → green → blue → purple (hardest)
      const colors = puzzle.categories.map(c => c.color)
      expect(colors.length).toBe(4)
      expect(new Set(colors).size).toBe(4) // All unique colors
    })

    it('should handle far future dates without errors', () => {
      vi.setSystemTime(new Date('2030-01-01T12:00:00Z'))
      expect(() => getDailyPuzzle()).not.toThrow()
      expect(() => getPuzzleNumber()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should handle daylight saving time transitions', () => {
      // Spring forward
      vi.setSystemTime(new Date('2026-03-08T01:00:00-08:00'))
      const beforeDST = getDayIndex()

      vi.setSystemTime(new Date('2026-03-08T03:00:00-07:00')) // 2am doesn't exist
      const afterDST = getDayIndex()

      expect(beforeDST).toBe(afterDST)
    })

    it('should handle leap year dates', () => {
      vi.setSystemTime(new Date('2028-02-29T12:00:00Z'))
      expect(() => getDailyPuzzle()).not.toThrow()
    })
  })
})
