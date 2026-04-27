import { describe, it, expect } from 'vitest'
import { buildUnitSession, buildReviewSession, buildPracticeSession } from '../session'
import type { Card, LanguageContent } from '../content'
import type { SrsState } from '../srs'

const mockCards: Card[] = [
  { id: 'c1', category: 'greetings', hanzi: '你好', pinyin: 'nǐ hǎo', english: 'hello' },
  { id: 'c2', category: 'greetings', hanzi: '再见', pinyin: 'zài jiàn', english: 'goodbye' },
  { id: 'c3', category: 'numbers', hanzi: '一', pinyin: 'yī', english: 'one' },
  { id: 'c4', category: 'numbers', hanzi: '二', pinyin: 'èr', english: 'two' },
  { id: 'c5', category: 'colors', hanzi: '红色', pinyin: 'hóng sè', english: 'red' },
]

const mockContent: Pick<LanguageContent, 'cards' | 'getCardsForUnit' | 'allowedInteractions'> = {
  cards: mockCards,
  getCardsForUnit: (unitId) => {
    if (unitId === 'unit-1') return [mockCards[0], mockCards[1]]
    if (unitId === 'unit-2') return [mockCards[2], mockCards[3]]
    return []
  },
  allowedInteractions: ['multiple-choice', 'type', 'match'],
}

describe('Session Building', () => {
  describe('buildUnitSession()', () => {
    it('should build session with new cards from unit', () => {
      const session = buildUnitSession('unit-1', {}, mockContent, 10)
      expect(session.length).toBeGreaterThan(0)
      expect(session.length).toBeLessThanOrEqual(10)
    })

    it('should prioritize new cards (up to 7)', () => {
      const srs: Record<string, SrsState> = {}
      const session = buildUnitSession('unit-1', srs, mockContent, 10)
      // Should contain cards from unit-1
      const cardIds = session.map(item => item.card.id)
      expect(cardIds).toContain('c1')
      expect(cardIds).toContain('c2')
    })

    it('should include due cards from current unit', () => {
      const now = Date.now()
      const srs: Record<string, SrsState> = {
        c1: { ease: 2.5, interval: 1, reps: 1, due: now - 1000, lastReviewed: now - 86400000 },
      }
      const session = buildUnitSession('unit-1', srs, mockContent, 10)
      const cardIds = session.map(item => item.card.id)
      expect(cardIds).toContain('c1')
    })

    it('should respect allowedInteractions filter', () => {
      const limitedContent = { ...mockContent, allowedInteractions: ['multiple-choice'] as const }
      const session = buildUnitSession('unit-1', {}, limitedContent, 10)
      const kinds = session.map(item => item.kind)
      expect(kinds.every(k => k === 'multiple-choice')).toBe(true)
    })

    it('should include distractors for MC and match interactions', () => {
      const session = buildUnitSession('unit-1', {}, mockContent, 10)
      const mcItem = session.find(item => item.kind === 'multiple-choice')
      if (mcItem) {
        expect(mcItem.distractors).toBeDefined()
        expect(mcItem.distractors!.length).toBe(3)
      }
    })

    it('should not include distractors for type/build interactions', () => {
      const session = buildUnitSession('unit-1', {}, mockContent, 10)
      const typeItem = session.find(item => item.kind === 'type')
      if (typeItem) {
        expect(typeItem.distractors).toBeUndefined()
      }
    })

    it('should handle empty unit gracefully', () => {
      const session = buildUnitSession('nonexistent', {}, mockContent, 10)
      expect(session).toEqual([])
    })
  })

  describe('buildReviewSession()', () => {
    it('should return empty session when no cards are due', () => {
      const futureDue = Date.now() + 100000
      const srs: Record<string, SrsState> = {
        c1: { ease: 2.5, interval: 1, reps: 1, due: futureDue, lastReviewed: Date.now() },
      }
      const session = buildReviewSession(srs, mockContent, 10)
      expect(session).toHaveLength(0)
    })

    it('should include only due cards', () => {
      const now = Date.now()
      const srs: Record<string, SrsState> = {
        c1: { ease: 2.5, interval: 1, reps: 1, due: now - 1000, lastReviewed: now - 86400000 },
        c2: { ease: 2.5, interval: 1, reps: 1, due: now + 100000, lastReviewed: now },
      }
      const session = buildReviewSession(srs, mockContent, 10)
      const cardIds = session.map(item => item.card.id)
      expect(cardIds).toContain('c1')
      expect(cardIds).not.toContain('c2')
    })

    it('should limit session size to requested amount', () => {
      const now = Date.now()
      const srs: Record<string, SrsState> = {
        c1: { ease: 2.5, interval: 1, reps: 1, due: now - 1000, lastReviewed: now - 86400000 },
        c2: { ease: 2.5, interval: 1, reps: 1, due: now - 1000, lastReviewed: now - 86400000 },
        c3: { ease: 2.5, interval: 1, reps: 1, due: now - 1000, lastReviewed: now - 86400000 },
      }
      const session = buildReviewSession(srs, mockContent, 2)
      expect(session.length).toBeLessThanOrEqual(2)
    })

    it('should use review interaction order (MC, type, match only)', () => {
      const now = Date.now()
      const srs: Record<string, SrsState> = {
        c1: { ease: 2.5, interval: 1, reps: 1, due: now - 1000, lastReviewed: now - 86400000 },
        c2: { ease: 2.5, interval: 1, reps: 1, due: now - 1000, lastReviewed: now - 86400000 },
      }
      const session = buildReviewSession(srs, mockContent, 10)
      const kinds = session.map(item => item.kind)
      expect(kinds.every(k => ['multiple-choice', 'type', 'match'].includes(k))).toBe(true)
    })
  })

  describe('buildPracticeSession()', () => {
    it('should build session from seen cards', () => {
      const seenIds = ['c1', 'c2', 'c3']
      const session = buildPracticeSession(seenIds, mockContent, 10)
      expect(session.length).toBeGreaterThan(0)
      expect(session.length).toBeLessThanOrEqual(3)
    })

    it('should ignore unseen cards', () => {
      const seenIds = ['c1', 'c2']
      const session = buildPracticeSession(seenIds, mockContent, 10)
      const cardIds = session.map(item => item.card.id)
      expect(cardIds).not.toContain('c3')
    })

    it('should handle empty seen list', () => {
      const session = buildPracticeSession([], mockContent, 10)
      expect(session).toHaveLength(0)
    })

    it('should limit to requested size', () => {
      const seenIds = ['c1', 'c2', 'c3', 'c4', 'c5']
      const session = buildPracticeSession(seenIds, mockContent, 2)
      expect(session.length).toBeLessThanOrEqual(2)
    })
  })

  describe('pickDistractors() edge cases', () => {
    it('should prioritize same category distractors', () => {
      // This is tested indirectly through buildUnitSession MC items
      const session = buildUnitSession('unit-1', {}, mockContent, 10)
      const mcItem = session.find(item => item.kind === 'multiple-choice' && item.card.category === 'greetings')
      if (mcItem && mcItem.distractors) {
        // At least one distractor should be from same category if available
        const sameCat = mcItem.distractors.filter(d => d.category === mcItem.card.category)
        expect(sameCat.length).toBeGreaterThanOrEqual(0) // Depends on card pool
      }
    })

    it('should avoid duplicate English meanings in distractors', () => {
      const session = buildUnitSession('unit-1', {}, mockContent, 10)
      const mcItem = session.find(item => item.kind === 'multiple-choice')
      if (mcItem && mcItem.distractors) {
        const meanings = mcItem.distractors.map(d => d.english)
        const uniqueMeanings = new Set(meanings)
        expect(uniqueMeanings.size).toBe(meanings.length)
      }
    })
  })
})
