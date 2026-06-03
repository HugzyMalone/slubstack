import { describe, it, expect, beforeEach } from 'vitest'
import { createGameStore } from '../store'
import { INITIAL_SRS } from '../srs'
import { XP_SESSION_COMPLETE } from '../xp'
import { todayKey } from '../utils'

// createGameStore persists under its `name` via localStorage; clear between tests
// and use a unique name per test so hydration never leaks across cases.
let counter = 0
function freshStore() {
  return createGameStore(`test-store-${counter++}`)
}

beforeEach(() => {
  localStorage.clear()
})

describe('Game Store', () => {
  describe('rateCard()', () => {
    it('should add card to SRS state when rated', () => {
      const store = freshStore()
      store.getState().rateCard('card-1', 4)
      const srs = store.getState().getSrs('card-1')
      expect(srs).not.toEqual(INITIAL_SRS)
      expect(srs.reps).toBeGreaterThan(0)
    })

    it('should add card to seenCardIds on first rating', () => {
      const store = freshStore()
      expect(store.getState().seenCardIds).not.toContain('card-1')
      store.getState().rateCard('card-1', 4)
      expect(store.getState().seenCardIds).toContain('card-1')
    })

    it('should not duplicate card in seenCardIds', () => {
      const store = freshStore()
      store.getState().rateCard('card-1', 4)
      store.getState().rateCard('card-1', 2)
      const seen = store.getState().seenCardIds.filter((id) => id === 'card-1')
      expect(seen.length).toBe(1)
    })

    it('should update SRS state with quality ratings', () => {
      const store = freshStore()
      store.getState().rateCard('card-1', 5)
      const good = store.getState().getSrs('card-1')
      store.getState().rateCard('card-2', 0)
      const bad = store.getState().getSrs('card-2')
      expect(good).not.toEqual(bad)
    })
  })

  describe('addXp()', () => {
    it('should add XP to total', () => {
      const store = freshStore()
      expect(store.getState().xp).toBe(0)
      store.getState().addXp(100)
      expect(store.getState().xp).toBe(100)
      store.getState().addXp(50)
      expect(store.getState().xp).toBe(150)
    })

    it('should handle negative XP (edge case)', () => {
      const store = freshStore()
      store.setState({ xp: 100 })
      store.getState().addXp(-50)
      expect(store.getState().xp).toBe(50)
    })
  })

  describe('completeSession()', () => {
    it('should award base XP plus bonuses', () => {
      const store = freshStore()
      const result = store.getState().completeSession(3, 5)
      const expected = XP_SESSION_COMPLETE + 3 * 10 + 2 * 5
      expect(result.gained).toBe(expected)
      expect(store.getState().xp).toBe(expected)
    })

    it('should initialize streak on first session', () => {
      const store = freshStore()
      store.getState().completeSession(2, 2)
      expect(store.getState().streak).toBe(1)
      expect(store.getState().lastActiveDate).toBe(todayKey())
    })

    it('should increment streak for consecutive days', () => {
      const yesterday = todayKey(new Date(Date.now() - 86400000))
      const store = freshStore()
      store.setState({ streak: 5, lastActiveDate: yesterday })
      store.getState().completeSession(1, 1)
      expect(store.getState().streak).toBe(6)
    })

    it('should reset streak after gap > 1 day', () => {
      const threeDaysAgo = todayKey(new Date(Date.now() - 3 * 86400000))
      const store = freshStore()
      store.setState({ streak: 10, lastActiveDate: threeDaysAgo })
      store.getState().completeSession(1, 1)
      expect(store.getState().streak).toBe(1)
    })

    it('should not change streak if already completed today', () => {
      const store = freshStore()
      store.setState({ streak: 3, lastActiveDate: todayKey() })
      store.getState().completeSession(1, 1)
      expect(store.getState().streak).toBe(3)
    })

    it('should calculate XP correctly with all perfect answers', () => {
      const store = freshStore()
      // all firstTry: bonus + 5*10 + 0*5
      const result = store.getState().completeSession(5, 5)
      expect(result.gained).toBe(XP_SESSION_COMPLETE + 50)
    })

    it('should calculate XP correctly with retry answers', () => {
      const store = freshStore()
      // 2 firstTry (10 each) + 3 retries (5 each)
      const result = store.getState().completeSession(2, 5)
      expect(result.gained).toBe(XP_SESSION_COMPLETE + 2 * 10 + 3 * 5)
    })
  })

  describe('completeUnit()', () => {
    it('should add unit to completedUnits', () => {
      const store = freshStore()
      expect(store.getState().completedUnits).not.toContain('unit-1')
      store.getState().completeUnit('unit-1')
      expect(store.getState().completedUnits).toContain('unit-1')
    })

    it('should not duplicate units in completedUnits', () => {
      const store = freshStore()
      store.getState().completeUnit('unit-1')
      store.getState().completeUnit('unit-1')
      const completed = store.getState().completedUnits.filter((id) => id === 'unit-1')
      expect(completed.length).toBe(1)
    })

    it('should track multiple completed units', () => {
      const store = freshStore()
      store.getState().completeUnit('unit-1')
      store.getState().completeUnit('unit-2')
      store.getState().completeUnit('unit-3')
      expect(store.getState().completedUnits).toEqual(['unit-1', 'unit-2', 'unit-3'])
    })
  })

  describe('mergeFromServer()', () => {
    const emptyRemote = {
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      completedUnits: [],
      seenCardIds: [],
      srs: {},
    }

    it('should take max XP between local and remote', () => {
      const store = freshStore()
      store.setState({ xp: 100 })
      store.getState().mergeFromServer({ ...emptyRemote, xp: 150 })
      expect(store.getState().xp).toBe(150)
    })

    it('should keep local XP if higher than remote', () => {
      const store = freshStore()
      store.setState({ xp: 200 })
      store.getState().mergeFromServer({ ...emptyRemote, xp: 100 })
      expect(store.getState().xp).toBe(200)
    })

    it('should take max streak between local and remote', () => {
      const store = freshStore()
      store.setState({ streak: 3 })
      store.getState().mergeFromServer({ ...emptyRemote, streak: 7 })
      expect(store.getState().streak).toBe(7)
    })

    it('should merge completedUnits (union)', () => {
      const store = freshStore()
      store.setState({ completedUnits: ['unit-1', 'unit-2'] })
      store.getState().mergeFromServer({ ...emptyRemote, completedUnits: ['unit-2', 'unit-3'] })
      expect(store.getState().completedUnits.sort()).toEqual(['unit-1', 'unit-2', 'unit-3'])
    })

    it('should merge seenCardIds (union)', () => {
      const store = freshStore()
      store.setState({ seenCardIds: ['a', 'b'] })
      store.getState().mergeFromServer({ ...emptyRemote, seenCardIds: ['b', 'c'] })
      expect(store.getState().seenCardIds.sort()).toEqual(['a', 'b', 'c'])
    })

    it('should prefer remote SRS state when more advanced', () => {
      const store = freshStore()
      store.setState({ srs: { 'card-1': { ...INITIAL_SRS, reps: 2 } } })
      store.getState().mergeFromServer({
        ...emptyRemote,
        srs: { 'card-1': { ...INITIAL_SRS, reps: 5 } },
      })
      expect(store.getState().srs['card-1'].reps).toBe(5)
    })

    it('should keep local SRS state when more advanced', () => {
      const store = freshStore()
      store.setState({ srs: { 'card-1': { ...INITIAL_SRS, reps: 9 } } })
      store.getState().mergeFromServer({
        ...emptyRemote,
        srs: { 'card-1': { ...INITIAL_SRS, reps: 3 } },
      })
      expect(store.getState().srs['card-1'].reps).toBe(9)
    })

    it('should prefer most recent lastActiveDate', () => {
      const store = freshStore()
      store.setState({ lastActiveDate: '2026-04-19' })
      store.getState().mergeFromServer({ ...emptyRemote, lastActiveDate: '2026-04-20' })
      expect(store.getState().lastActiveDate).toBe('2026-04-20')
    })
  })

  describe('getSrs()', () => {
    it('should return INITIAL_SRS for unseen card', () => {
      const store = freshStore()
      expect(store.getState().getSrs('new-card')).toEqual(INITIAL_SRS)
    })

    it('should return stored SRS state for seen card', () => {
      const store = freshStore()
      store.getState().rateCard('card-1', 4)
      expect(store.getState().getSrs('card-1').reps).toBeGreaterThan(0)
    })
  })

  describe('reset()', () => {
    it('should clear all state', () => {
      const store = freshStore()
      store.setState({
        xp: 1000,
        streak: 10,
        completedUnits: ['unit-1', 'unit-2'],
        seenCardIds: ['card-1', 'card-2'],
        srs: { 'card-1': { ...INITIAL_SRS, reps: 5 } },
      })
      store.getState().reset()
      const s = store.getState()
      expect(s.srs).toEqual({})
      expect(s.xp).toBe(0)
      expect(s.streak).toBe(0)
      expect(s.lastActiveDate).toBeNull()
      expect(s.completedUnits).toEqual([])
      expect(s.seenCardIds).toEqual([])
    })
  })

  describe('mergeSrs() via mergeFromServer', () => {
    const emptyRemote = {
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      completedUnits: [],
      seenCardIds: [],
      srs: {},
    }

    it('should prefer card with higher reps', () => {
      const store = freshStore()
      store.setState({ srs: { c: { ...INITIAL_SRS, reps: 3 } } })
      store.getState().mergeFromServer({ ...emptyRemote, srs: { c: { ...INITIAL_SRS, reps: 5 } } })
      expect(store.getState().srs.c.reps).toBe(5)
    })

    it('should prefer later due date when reps are equal', () => {
      const store = freshStore()
      store.setState({ srs: { c: { ...INITIAL_SRS, reps: 3, due: 100 } } })
      store.getState().mergeFromServer({
        ...emptyRemote,
        srs: { c: { ...INITIAL_SRS, reps: 3, due: 200 } },
      })
      expect(store.getState().srs.c.due).toBe(200)
    })

    it('should keep local card if not in remote', () => {
      const store = freshStore()
      store.setState({ srs: { local: { ...INITIAL_SRS, reps: 4 } } })
      store.getState().mergeFromServer({ ...emptyRemote })
      expect(store.getState().srs.local.reps).toBe(4)
    })

    it('should add remote card if not in local', () => {
      const store = freshStore()
      store.getState().mergeFromServer({ ...emptyRemote, srs: { remote: { ...INITIAL_SRS, reps: 2 } } })
      expect(store.getState().srs.remote.reps).toBe(2)
    })
  })
})
