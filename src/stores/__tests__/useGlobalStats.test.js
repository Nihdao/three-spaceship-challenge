import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage for Node test environment
const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}

beforeEach(() => {
  globalThis.localStorage = mockLocalStorage
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

// Dynamic import after localStorage mock is set up
const { default: useGlobalStats } = await import('../useGlobalStats.jsx')
const { STORAGE_KEY_GLOBAL_STATS } = await import('../../utils/globalStatsStorage.js')

const makeRunData = (overrides = {}) => ({
  kills: 0,
  timeSurvived: 0,
  systemsReached: 1,
  level: 1,
  fragments: 0,
  weaponsUsed: [],
  boonsUsed: [],
  ...overrides,
})

describe('useGlobalStats', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    useGlobalStats.getState().reset()
  })

  describe('initial state', () => {
    it('initializes with default stats', () => {
      const state = useGlobalStats.getState()
      expect(state.version).toBe(1)
      expect(state.totalKills).toBe(0)
      expect(state.totalTimeSurvived).toBe(0)
      expect(state.totalRuns).toBe(0)
      expect(state.totalFragments).toBe(0)
    })

    it('initializes with default best run stats', () => {
      const state = useGlobalStats.getState()
      expect(state.bestRun.highestSystem).toBe(1)
      expect(state.bestRun.longestTime).toBe(0)
      expect(state.bestRun.mostKills).toBe(0)
      expect(state.bestRun.highestLevel).toBe(1)
    })

    it('initializes with empty usage maps', () => {
      const state = useGlobalStats.getState()
      expect(state.weaponUsage).toEqual({})
      expect(state.boonUsage).toEqual({})
    })
  })

  describe('recordRunEnd — career totals', () => {
    it('updates career totals after one run', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 50,
        timeSurvived: 300,
        systemsReached: 2,
        level: 10,
        fragments: 100,
      }))

      const state = useGlobalStats.getState()
      expect(state.totalKills).toBe(50)
      expect(state.totalTimeSurvived).toBe(300)
      expect(state.totalRuns).toBe(1)
      expect(state.totalFragments).toBe(100)
    })

    it('accumulates totals across multiple runs', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({ kills: 30, timeSurvived: 200, fragments: 50 }))
      useGlobalStats.getState().recordRunEnd(makeRunData({ kills: 20, timeSurvived: 100, fragments: 30 }))

      const state = useGlobalStats.getState()
      expect(state.totalKills).toBe(50)
      expect(state.totalTimeSurvived).toBe(300)
      expect(state.totalRuns).toBe(2)
      expect(state.totalFragments).toBe(80)
    })
  })

  describe('recordRunEnd — best run stats', () => {
    it('updates best run stats when beaten', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 50,
        timeSurvived: 300,
        systemsReached: 2,
        level: 10,
      }))
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 100,
        timeSurvived: 500,
        systemsReached: 3,
        level: 15,
      }))

      const best = useGlobalStats.getState().bestRun
      expect(best.mostKills).toBe(100)
      expect(best.longestTime).toBe(500)
      expect(best.highestSystem).toBe(3)
      expect(best.highestLevel).toBe(15)
    })

    it('does NOT update best run stats when not beaten', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 100,
        timeSurvived: 500,
        systemsReached: 3,
        level: 15,
      }))
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 30,
        timeSurvived: 200,
        systemsReached: 1,
        level: 5,
      }))

      const best = useGlobalStats.getState().bestRun
      expect(best.mostKills).toBe(100)
      expect(best.longestTime).toBe(500)
      expect(best.highestSystem).toBe(3)
      expect(best.highestLevel).toBe(15)
    })

    it('each best stat is tracked independently', () => {
      // Run 1: best system + best time
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 10,
        timeSurvived: 500,
        systemsReached: 3,
        level: 5,
      }))
      // Run 2: best kills + best level
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 100,
        timeSurvived: 100,
        systemsReached: 1,
        level: 20,
      }))

      const best = useGlobalStats.getState().bestRun
      expect(best.mostKills).toBe(100)
      expect(best.longestTime).toBe(500)
      expect(best.highestSystem).toBe(3)
      expect(best.highestLevel).toBe(20)
    })
  })

  describe('recordRunEnd — weapon/boon usage', () => {
    it('increments weapon usage count per run', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        weaponsUsed: ['LASER_FRONT', 'SPREAD_SHOT'],
      }))

      const state = useGlobalStats.getState()
      expect(state.weaponUsage['LASER_FRONT']).toBe(1)
      expect(state.weaponUsage['SPREAD_SHOT']).toBe(1)
    })

    it('accumulates weapon usage across multiple runs', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        weaponsUsed: ['LASER_FRONT', 'SPREAD_SHOT'],
      }))
      useGlobalStats.getState().recordRunEnd(makeRunData({
        weaponsUsed: ['LASER_FRONT'],
      }))

      const state = useGlobalStats.getState()
      expect(state.weaponUsage['LASER_FRONT']).toBe(2)
      expect(state.weaponUsage['SPREAD_SHOT']).toBe(1)
    })

    it('increments boon usage count per run', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        boonsUsed: ['DAMAGE_AMP', 'SPEED_BOOST'],
      }))

      const state = useGlobalStats.getState()
      expect(state.boonUsage['DAMAGE_AMP']).toBe(1)
      expect(state.boonUsage['SPEED_BOOST']).toBe(1)
    })

    it('accumulates boon usage across multiple runs', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({ boonsUsed: ['DAMAGE_AMP'] }))
      useGlobalStats.getState().recordRunEnd(makeRunData({ boonsUsed: ['DAMAGE_AMP'] }))

      expect(useGlobalStats.getState().boonUsage['DAMAGE_AMP']).toBe(2)
    })

    it('handles empty weaponsUsed and boonsUsed arrays', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({ weaponsUsed: [], boonsUsed: [] }))

      const state = useGlobalStats.getState()
      expect(state.weaponUsage).toEqual({})
      expect(state.boonUsage).toEqual({})
    })
  })

  describe('computed getters', () => {
    it('getTopWeapons returns weapons sorted by run count descending', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({ weaponsUsed: ['LASER_FRONT', 'SPREAD_SHOT'] }))
      useGlobalStats.getState().recordRunEnd(makeRunData({ weaponsUsed: ['LASER_FRONT'] }))
      useGlobalStats.getState().recordRunEnd(makeRunData({ weaponsUsed: ['MISSILE_HOMING', 'LASER_FRONT'] }))

      const top = useGlobalStats.getState().getTopWeapons(3)
      expect(top.length).toBe(3)
      expect(top[0].weaponId).toBe('LASER_FRONT')
      expect(top[0].runCount).toBe(3)
      expect(top[1].runCount).toBeLessThanOrEqual(top[0].runCount)
      expect(top[2].runCount).toBeLessThanOrEqual(top[1].runCount)
    })

    it('getTopWeapons respects n limit', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        weaponsUsed: ['LASER_FRONT', 'SPREAD_SHOT', 'MISSILE_HOMING'],
      }))

      const top2 = useGlobalStats.getState().getTopWeapons(2)
      expect(top2.length).toBe(2)
    })

    it('getTopWeapons returns empty array if no weapons used', () => {
      const top = useGlobalStats.getState().getTopWeapons()
      expect(top).toEqual([])
    })

    it('getTopBoons returns boons sorted by run count descending', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({ boonsUsed: ['DAMAGE_AMP', 'SPEED_BOOST'] }))
      useGlobalStats.getState().recordRunEnd(makeRunData({ boonsUsed: ['DAMAGE_AMP'] }))

      const top = useGlobalStats.getState().getTopBoons(5)
      expect(top[0].boonId).toBe('DAMAGE_AMP')
      expect(top[0].runCount).toBe(2)
      expect(top[1].boonId).toBe('SPEED_BOOST')
      expect(top[1].runCount).toBe(1)
    })

    it('getTopBoons returns empty array if no boons used', () => {
      const top = useGlobalStats.getState().getTopBoons()
      expect(top).toEqual([])
    })

    it('getBestRun returns the best run object', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 50,
        timeSurvived: 300,
        systemsReached: 2,
        level: 10,
      }))

      const best = useGlobalStats.getState().getBestRun()
      expect(best.mostKills).toBe(50)
      expect(best.longestTime).toBe(300)
      expect(best.highestSystem).toBe(2)
      expect(best.highestLevel).toBe(10)
    })

    it('getCareerStats returns all career totals', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 50,
        timeSurvived: 300,
        fragments: 100,
      }))

      const career = useGlobalStats.getState().getCareerStats()
      expect(career.totalKills).toBe(50)
      expect(career.totalTimeSurvived).toBe(300)
      expect(career.totalRuns).toBe(1)
      expect(career.totalFragments).toBe(100)
    })
  })

  describe('localStorage persistence', () => {
    it('persists stats to localStorage after recordRunEnd', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 50,
        timeSurvived: 300,
        fragments: 100,
        weaponsUsed: ['LASER_FRONT'],
        boonsUsed: ['DAMAGE_AMP'],
      }))

      const stored = mockLocalStorage.getItem(STORAGE_KEY_GLOBAL_STATS)
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored)
      expect(parsed.totalKills).toBe(50)
      expect(parsed.totalRuns).toBe(1)
      expect(parsed.weaponUsage['LASER_FRONT']).toBe(1)
      expect(parsed.boonUsage['DAMAGE_AMP']).toBe(1)
      expect(parsed.version).toBe(1)
    })

    it('persists stats to localStorage after reset', () => {
      useGlobalStats.getState().reset()

      const stored = mockLocalStorage.getItem(STORAGE_KEY_GLOBAL_STATS)
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored)
      expect(parsed.totalRuns).toBe(0)
    })

    it('loads stats from localStorage via loadFromStorage', () => {
      const mockData = {
        version: 1,
        totalKills: 200,
        totalTimeSurvived: 1000,
        totalRuns: 5,
        totalFragments: 500,
        bestRun: { highestSystem: 3, longestTime: 600, mostKills: 100, highestLevel: 20 },
        weaponUsage: { 'LASER_FRONT': 5 },
        boonUsage: { 'DAMAGE_AMP': 3 },
      }
      mockLocalStorage.setItem(STORAGE_KEY_GLOBAL_STATS, JSON.stringify(mockData))

      useGlobalStats.getState().loadFromStorage()

      const state = useGlobalStats.getState()
      expect(state.totalKills).toBe(200)
      expect(state.totalRuns).toBe(5)
      expect(state.totalFragments).toBe(500)
      expect(state.bestRun.highestSystem).toBe(3)
      expect(state.weaponUsage['LASER_FRONT']).toBe(5)
      expect(state.boonUsage['DAMAGE_AMP']).toBe(3)
    })
  })

  describe('version migration', () => {
    it('returns default stats if version is missing', () => {
      const oldData = { totalKills: 100 } // no version field
      mockLocalStorage.setItem(STORAGE_KEY_GLOBAL_STATS, JSON.stringify(oldData))

      useGlobalStats.getState().loadFromStorage()

      // Should get default stats, not the old data
      const state = useGlobalStats.getState()
      expect(state.version).toBe(1)
      expect(state.totalKills).toBe(0)
    })

    it('returns default stats if version is 0', () => {
      const oldData = { version: 0, totalKills: 100 }
      mockLocalStorage.setItem(STORAGE_KEY_GLOBAL_STATS, JSON.stringify(oldData))

      useGlobalStats.getState().loadFromStorage()

      const state = useGlobalStats.getState()
      expect(state.version).toBe(1)
      expect(state.totalKills).toBe(0)
    })

    it('accepts valid version 1 data', () => {
      const validData = {
        version: 1,
        totalKills: 100,
        totalTimeSurvived: 500,
        totalRuns: 3,
        totalFragments: 200,
        bestRun: { highestSystem: 2, longestTime: 400, mostKills: 80, highestLevel: 12 },
        weaponUsage: {},
        boonUsage: {},
      }
      mockLocalStorage.setItem(STORAGE_KEY_GLOBAL_STATS, JSON.stringify(validData))

      useGlobalStats.getState().loadFromStorage()

      expect(useGlobalStats.getState().totalKills).toBe(100)
    })

    it('fills missing fields with defaults for corrupted version 1 data', () => {
      // Partial data — missing weaponUsage, boonUsage, bestRun
      const corruptedData = { version: 1, totalKills: 50 }
      mockLocalStorage.setItem(STORAGE_KEY_GLOBAL_STATS, JSON.stringify(corruptedData))

      useGlobalStats.getState().loadFromStorage()

      const state = useGlobalStats.getState()
      expect(state.totalKills).toBe(50)         // Preserved from stored data
      expect(state.weaponUsage).toEqual({})      // Defaulted
      expect(state.boonUsage).toEqual({})        // Defaulted
      expect(state.bestRun.mostKills).toBe(0)   // Defaulted
    })
  })

  describe('reset', () => {
    it('resets all stats to defaults', () => {
      useGlobalStats.getState().recordRunEnd(makeRunData({
        kills: 50,
        timeSurvived: 300,
        weaponsUsed: ['LASER_FRONT'],
      }))

      useGlobalStats.getState().reset()

      const state = useGlobalStats.getState()
      expect(state.totalKills).toBe(0)
      expect(state.totalRuns).toBe(0)
      expect(state.weaponUsage).toEqual({})
      expect(state.boonUsage).toEqual({})
      expect(state.bestRun.mostKills).toBe(0)
    })
  })
})
