import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cardLang, speak } from '../speech'

describe('Speech Synthesis', () => {
  describe('cardLang()', () => {
    it('should return de-DE for German cards', () => {
      expect(cardLang('de-hello')).toBe('de-DE')
      expect(cardLang('de-123')).toBe('de-DE')
      expect(cardLang('de-')).toBe('de-DE')
    })

    it('should return es-ES for Spanish cards', () => {
      expect(cardLang('es-hola')).toBe('es-ES')
      expect(cardLang('es-mundo')).toBe('es-ES')
    })

    it('should return zh-CN for Mandarin cards (default)', () => {
      expect(cardLang('cn-nihao')).toBe('zh-CN')
      expect(cardLang('mandarin-hello')).toBe('zh-CN')
      expect(cardLang('any-other-prefix')).toBe('zh-CN')
      expect(cardLang('hello')).toBe('zh-CN')
    })

    it('should handle empty string (default to zh-CN)', () => {
      expect(cardLang('')).toBe('zh-CN')
    })

    it('should be case-sensitive (lowercase prefix required)', () => {
      expect(cardLang('DE-hello')).toBe('zh-CN') // Not de-DE
      expect(cardLang('ES-hola')).toBe('zh-CN') // Not es-ES
    })
  })

  describe('speak()', () => {
    let mockSpeechSynthesis: any
    let mockUtterance: any

    beforeEach(() => {
      // Mock SpeechSynthesis API
      mockSpeechSynthesis = {
        cancel: vi.fn(),
        speak: vi.fn(),
      }
      mockUtterance = {}

      global.window = {
        speechSynthesis: mockSpeechSynthesis,
      } as any

      global.SpeechSynthesisUtterance = vi.fn(() => mockUtterance) as any
    })

    it('should cancel previous speech before speaking', () => {
      speak('Hello', 'en-US')
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
    })

    it('should create utterance with correct text and language', () => {
      speak('你好', 'zh-CN')
      expect(SpeechSynthesisUtterance).toHaveBeenCalledWith('你好')
      expect(mockUtterance.lang).toBe('zh-CN')
    })

    it('should call speak with utterance', () => {
      speak('Hola', 'es-ES')
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockUtterance)
    })

    it('should handle server-side rendering (no window)', () => {
      global.window = undefined as any
      expect(() => speak('test', 'en-US')).not.toThrow()
    })

    it('should handle browsers without speechSynthesis', () => {
      global.window = {} as any
      expect(() => speak('test', 'en-US')).not.toThrow()
    })

    it('should set language for different locales', () => {
      const testCases = [
        { text: '你好', lang: 'zh-CN' },
        { text: 'Guten Tag', lang: 'de-DE' },
        { text: 'Hola', lang: 'es-ES' },
        { text: 'Hello', lang: 'en-US' },
      ]

      testCases.forEach(({ text, lang }) => {
        const utterance = {}
        global.SpeechSynthesisUtterance = vi.fn(() => utterance) as any
        speak(text, lang)
        expect(utterance).toHaveProperty('lang', lang)
      })
    })
  })

  describe('Integration: cardLang + speak', () => {
    it('should get correct language code for card and speak', () => {
      const mockSpeech = {
        cancel: vi.fn(),
        speak: vi.fn(),
      }
      global.window = { speechSynthesis: mockSpeech } as any
      const utterance = {}
      global.SpeechSynthesisUtterance = vi.fn(() => utterance) as any

      const lang = cardLang('de-hello')
      speak('Hallo', lang)

      expect(utterance).toHaveProperty('lang', 'de-DE')
    })
  })
})
