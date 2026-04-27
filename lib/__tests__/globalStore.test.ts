import { describe, it, expect, beforeEach } from 'vitest'
import { globalStore } from '../globalStore'
import { todayKey } from '../utils'

describe('Global Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    globalStore.setState({
      streak: 0,
      lastActiveDate: null,
      medals: { gold: 0, silver: 0, bronze: 0 },
      streakFreezes: 0,
      lastUnit: null,
    })
  })

  describe('touchStreak()', () => {
    it('should initialize streak to 1 on first touch', () => {
      const result = globalStore.getState().touchStreak()
      expect(result.newStreak).toBe(1)
      expect(result.streakIncremented).toBe(true)
      expect(globalStore.getState().streak).toBe(1)
      expect(globalStore.getState().lastActiveDate).toBe(todayKey())
    })

    it('should not increment streak if already touched today', () => {
      globalStore.getState().touchStreak() // First touch
      const result = globalStore.getState().touchStreak() // Second touch same day
      expect(result.streakIncremented).toBe(false)
      expect(result.newStreak).toBe(1)
    })

    it('should increment streak for consecutive days', () => {
      const yesterday = todayKey(new Date(Date.now() - 86400000))
      globalStore.setState({ streak: 5, lastActiveDate: yesterday })

      const result = globalStore.getState().touchStreak()
      expect(result.newStreak).toBe(6)
      expect(result.streakIncremented).toBe(true)
    })

    it('should reset streak to 1 if gap is more than 1 day', () => {
      const threeDaysAgo = todayKey(new Date(Date.now() - 3 * 86400000))
      globalStore.setState({ streak: 10, lastActiveDate: threeDaysAgo })

      const result = globalStore.getState().touchStreak()
      expect(result.newStreak).toBe(1)
      expect(result.streakIncremented).toBe(false)
    })

    it('should use streak freeze when gap > 1 day and freezes available', () => {
      const threeDaysAgo = todayKey(new Date(Date.now() - 3 * 86400000))
      globalStore.setState({
        streak: 10,
        lastActiveDate: threeDaysAgo,
        streakFreezes: 2
      })

      const result = globalStore.getState().touchStreak()
      expect(result.newStreak).toBe(10) // Streak preserved
      expect(result.streakIncremented).toBe(false)
      expect(globalStore.getState().streakFreezes).toBe(1) // One freeze consumed
      expect(globalStore.getState().lastActiveDate).toBe(todayKey())
    })

    it('should not use freeze for 1-day gap (consecutive days)', () => {
      const yesterday = todayKey(new Date(Date.now() - 86400000))
      globalStore.setState({
        streak: 5,
        lastActiveDate: yesterday,
        streakFreezes: 1
      })

      globalStore.getState().touchStreak()
      expect(globalStore.getState().streakFreezes).toBe(1) // Freeze not used
      expect(globalStore.getState().streak).toBe(6)
    })

    it('should not use freeze when gap = 0 (same day)', () => {
      globalStore.setState({
        streak: 3,
        lastActiveDate: todayKey(),
        streakFreezes: 1
      })

      globalStore.getState().touchStreak()
      expect(globalStore.getState().streakFreezes).toBe(1) // Freeze not used
    })
  })

  describe('awardMedal()', () => {
    it('should increment gold medal count', () => {
      globalStore.getState().awardMedal('gold')
      expect(globalStore.getState().medals.gold).toBe(1)

      globalStore.getState().awardMedal('gold')
      expect(globalStore.getState().medals.gold).toBe(2)
    })

    it('should increment silver medal count', () => {
      globalStore.getState().awardMedal('silver')
      expect(globalStore.getState().medals.silver).toBe(1)
    })

    it('should increment bronze medal count', () => {
      globalStore.getState().awardMedal('bronze')
      expect(globalStore.getState().medals.bronze).toBe(1)
    })

    it('should not affect other medal types', () => {
      globalStore.getState().awardMedal('gold')
      expect(globalStore.getState().medals).toEqual({ gold: 1, silver: 0, bronze: 0 })
    })
  })

  describe('addStreakFreeze()', () => {
    it('should increment streak freezes', () => {
      globalStore.getState().addStreakFreeze()
      expect(globalStore.getState().streakFreezes).toBe(1)

      globalStore.getState().addStreakFreeze()
      expect(globalStore.getState().streakFreezes).toBe(2)
    })

    it('should cap at 5 streak freezes', () => {
      globalStore.setState({ streakFreezes: 4 })
      globalStore.getState().addStreakFreeze()
      expect(globalStore.getState().streakFreezes).toBe(5)

      globalStore.getState().addStreakFreeze()
      expect(globalStore.getState().streakFreezes).toBe(5) // Still 5, not 6
    })

    it('should not exceed 5 even with multiple calls', () => {
      for (let i = 0; i < 10; i++) {
        globalStore.getState().addStreakFreeze()
      }
      expect(globalStore.getState().streakFreezes).toBe(5)
    })
  })

  describe('setLastUnit()', () => {
    it('should set last completed unit', () => {
      const unit = {
        lang: 'mandarin',
        unitId: 'unit-1',
        title: 'Greetings',
        emoji: '👋',
        href: '/mandarin/learn/unit-1'
      }

      globalStore.getState().setLastUnit(unit)
      expect(globalStore.getState().lastUnit).toEqual(unit)
    })

    it('should overwrite previous last unit', () => {
      const unit1 = {
        lang: 'german',
        unitId: 'unit-1',
        title: 'Numbers',
        emoji: '🔢',
        href: '/german/learn/unit-1'
      }
      const unit2 = {
        lang: 'spanish',
        unitId: 'unit-2',
        title: 'Colors',
        emoji: '🎨',
        href: '/spanish/learn/unit-2'
      }

      globalStore.getState().setLastUnit(unit1)
      globalStore.getState().setLastUnit(unit2)
      expect(globalStore.getState().lastUnit).toEqual(unit2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid successive touches', () => {
      for (let i = 0; i < 5; i++) {
        globalStore.getState().touchStreak()
      }
      expect(globalStore.getState().streak).toBe(1)
    })

    it('should handle date boundary correctly', () => {
      // Simulate touching just before midnight and just after
      const date1 = new Date('2026-04-19T23:59:00Z')
      const date2 = new Date('2026-04-20T00:01:00Z')

      const day1 = todayKey(date1)
      const day2 = todayKey(date2)

      expect(day1).not.toBe(day2)
    })
  })
})
