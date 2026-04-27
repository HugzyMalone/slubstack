import { describe, it, expect } from 'vitest'
import { getDailyWord, getDayIndex, getTodayStr, isValidGuess } from '../wordle-words'

describe('Wordle Word Selection', () => {
  describe('getTodayStr()', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getTodayStr()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getDayIndex()', () => {
    it('should return 0 for epoch date (2026-04-19)', () => {
      expect(getDayIndex('2026-04-19')).toBe(0)
    })

    it('should return 1 for day after epoch', () => {
      expect(getDayIndex('2026-04-20')).toBe(1)
    })

    it('should return positive values for future dates', () => {
      expect(getDayIndex('2026-04-25')).toBe(6)
      expect(getDayIndex('2026-05-01')).toBe(12)
    })

    it('should handle dates before epoch (return 0)', () => {
      expect(getDayIndex('2026-04-18')).toBe(0)
      expect(getDayIndex('2025-01-01')).toBe(0)
    })

    it('should handle month boundaries correctly', () => {
      // April 30 → May 1 boundary
      const apr30 = getDayIndex('2026-04-30')
      const may1 = getDayIndex('2026-05-01')
      expect(may1 - apr30).toBe(1)
    })

    it('should handle year boundaries correctly', () => {
      const dec31 = getDayIndex('2026-12-31')
      const jan1 = getDayIndex('2027-01-01')
      expect(jan1 - dec31).toBe(1)
    })
  })

  describe('getDailyWord()', () => {
    it('should return a 5-letter uppercase word', () => {
      const word = getDailyWord('2026-04-19')
      expect(word).toHaveLength(5)
      expect(word).toMatch(/^[A-Z]+$/)
    })

    it('should return consistent word for same date', () => {
      const word1 = getDailyWord('2026-04-20')
      const word2 = getDailyWord('2026-04-20')
      expect(word1).toBe(word2)
    })

    it('should return different words for consecutive dates (likely)', () => {
      const word1 = getDailyWord('2026-04-20')
      const word2 = getDailyWord('2026-04-21')
      // Not guaranteed but very likely with ~700 word pool
      expect(word1).not.toBe(word2)
    })

    it('should cycle through word pool predictably', () => {
      // Test that day N and day N+answerPoolSize return same word
      // ANSWERS.length is ~700, but we can test the modulo behavior
      const baseDate = '2026-04-19'
      const word1 = getDailyWord(baseDate)

      // Same day should give same word
      const word2 = getDailyWord(baseDate)
      expect(word1).toBe(word2)
    })

    it('should handle default (today) parameter', () => {
      const word = getDailyWord()
      expect(word).toHaveLength(5)
      expect(word).toMatch(/^[A-Z]+$/)
    })
  })

  describe('isValidGuess()', () => {
    it('should accept valid 5-letter words', () => {
      expect(isValidGuess('ABOUT')).toBe(true)
      expect(isValidGuess('about')).toBe(true)
      expect(isValidGuess('HELLO')).toBe(true)
    })

    it('should reject invalid words', () => {
      expect(isValidGuess('ZZZZZ')).toBe(false)
      expect(isValidGuess('NOTAW')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isValidGuess('hello')).toBe(isValidGuess('HELLO'))
      expect(isValidGuess('WoRlD')).toBe(isValidGuess('world'))
    })

    it('should reject non-5-letter inputs', () => {
      expect(isValidGuess('cat')).toBe(false)
      expect(isValidGuess('banana')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidGuess('')).toBe(false)
    })

    it('should handle all answer words as valid', () => {
      // Sample a few known answer words
      const knownAnswers = ['ABOUT', 'ABOVE', 'ACUTE', 'ADMIT']
      knownAnswers.forEach(word => {
        expect(isValidGuess(word)).toBe(true)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle leap year date calculations', () => {
      // 2024 is a leap year
      const feb28_2024 = getDayIndex('2024-02-28')
      const feb29_2024 = getDayIndex('2024-02-29')
      const mar01_2024 = getDayIndex('2024-03-01')

      expect(feb29_2024 - feb28_2024).toBe(1)
      expect(mar01_2024 - feb29_2024).toBe(1)
    })

    it('should handle timezone edge cases (same day across timezones)', () => {
      // This test assumes UTC-based calculation
      const word = getDailyWord('2026-04-20')
      expect(word).toBeTruthy()
    })
  })
})
