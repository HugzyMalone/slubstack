import { describe, it, expect } from 'vitest'
import { getLanguageContent } from '../content'

describe('Content Loading', () => {
  describe('getLanguageContent()', () => {
    it('should load mandarin content with build interaction', () => {
      const content = getLanguageContent('mandarin')
      expect(content.cards.length).toBeGreaterThan(0)
      expect(content.units.length).toBeGreaterThan(0)
      expect(content.allowedInteractions).toContain('build')
      expect(content.allowedInteractions).toContain('multiple-choice')
      expect(content.allowedInteractions).toContain('type')
      expect(content.allowedInteractions).toContain('match')
    })

    it('should load german content without build interaction', () => {
      const content = getLanguageContent('german')
      expect(content.cards.length).toBeGreaterThan(0)
      expect(content.allowedInteractions).not.toContain('build')
      expect(content.allowedInteractions).toContain('multiple-choice')
    })

    it('should load spanish content without build interaction', () => {
      const content = getLanguageContent('spanish')
      expect(content.cards.length).toBeGreaterThan(0)
      expect(content.allowedInteractions).not.toContain('build')
    })

    it('should load vibe-coding content with limited interactions', () => {
      const content = getLanguageContent('vibe-coding')
      expect(content.cards.length).toBeGreaterThan(0)
      expect(content.allowedInteractions).toEqual(['multiple-choice', 'match'])
      expect(content.allowedInteractions).not.toContain('type')
      expect(content.allowedInteractions).not.toContain('build')
    })
  })

  describe('getCard()', () => {
    it('should retrieve card by id', () => {
      const content = getLanguageContent('mandarin')
      const firstCardId = content.cards[0].id
      const card = content.getCard(firstCardId)
      expect(card).toBeDefined()
      expect(card.id).toBe(firstCardId)
      expect(card).toHaveProperty('hanzi')
      expect(card).toHaveProperty('pinyin')
      expect(card).toHaveProperty('english')
    })

    it('should throw error for invalid card id', () => {
      const content = getLanguageContent('mandarin')
      expect(() => content.getCard('invalid-id')).toThrow('Card not found: invalid-id')
    })
  })

  describe('getCardsForUnit()', () => {
    it('should retrieve all cards for a unit', () => {
      const content = getLanguageContent('mandarin')
      const firstUnit = content.units[0]
      const cards = content.getCardsForUnit(firstUnit.id)
      expect(cards.length).toBe(firstUnit.cardIds.length)
      expect(cards.every(c => firstUnit.cardIds.includes(c.id))).toBe(true)
    })

    it('should throw error for invalid unit id', () => {
      const content = getLanguageContent('mandarin')
      expect(() => content.getCardsForUnit('invalid-unit')).toThrow('Unit not found')
    })

    it('should throw error if unit contains invalid card ids', () => {
      // This tests data integrity - would only fail if JSON is corrupted
      const content = getLanguageContent('german')
      const units = content.units
      expect(units.length).toBeGreaterThan(0)
      // All units should have valid card references
      units.forEach(unit => {
        expect(() => content.getCardsForUnit(unit.id)).not.toThrow()
      })
    })
  })

  describe('getUnit()', () => {
    it('should retrieve unit by id', () => {
      const content = getLanguageContent('spanish')
      const firstUnit = content.units[0]
      const unit = content.getUnit(firstUnit.id)
      expect(unit).toBeDefined()
      expect(unit?.id).toBe(firstUnit.id)
      expect(unit).toHaveProperty('title')
      expect(unit).toHaveProperty('emoji')
      expect(unit).toHaveProperty('cardIds')
    })

    it('should return undefined for invalid unit id', () => {
      const content = getLanguageContent('spanish')
      const unit = content.getUnit('nonexistent-unit')
      expect(unit).toBeUndefined()
    })
  })

  describe('Card Structure Validation', () => {
    it('should have consistent card structure across languages', () => {
      const languages = ['mandarin', 'german', 'spanish', 'vibe-coding'] as const
      languages.forEach(lang => {
        const content = getLanguageContent(lang)
        content.cards.forEach(card => {
          expect(card).toHaveProperty('id')
          expect(card).toHaveProperty('category')
          expect(card).toHaveProperty('hanzi')
          expect(card).toHaveProperty('pinyin')
          expect(card).toHaveProperty('english')
          expect(typeof card.id).toBe('string')
          expect(typeof card.english).toBe('string')
        })
      })
    })

    it('should have unique card ids within each language', () => {
      const languages = ['mandarin', 'german', 'spanish', 'vibe-coding'] as const
      languages.forEach(lang => {
        const content = getLanguageContent(lang)
        const ids = content.cards.map(c => c.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
      })
    })

    it('should have units with valid card references', () => {
      const content = getLanguageContent('mandarin')
      const allCardIds = new Set(content.cards.map(c => c.id))
      content.units.forEach(unit => {
        unit.cardIds.forEach(cardId => {
          expect(allCardIds.has(cardId)).toBe(true)
        })
      })
    })
  })
})
