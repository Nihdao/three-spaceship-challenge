import { describe, it, expect, beforeEach } from 'vitest'
import { formatTime } from '../StatsScreen.jsx'
import useGlobalStats from '../../stores/useGlobalStats.jsx'

beforeEach(() => {
  useGlobalStats.getState().reset()
})

describe('formatTime utility', () => {
  it('returns "0m" for 0 seconds', () => {
    expect(formatTime(0)).toBe('0m')
  })

  it('returns minutes only when less than one hour', () => {
    expect(formatTime(60)).toBe('1m')
    expect(formatTime(150)).toBe('2m')
    expect(formatTime(3599)).toBe('59m')
  })

  it('returns hours and minutes when >= 3600 seconds', () => {
    expect(formatTime(3600)).toBe('1h 0m')
    expect(formatTime(9234)).toBe('2h 33m')
    expect(formatTime(7384)).toBe('2h 3m')
  })
})

describe('StatsScreen — useGlobalStats store contract', () => {
  it('store exposes totalRuns field', () => {
    expect(useGlobalStats.getState()).toHaveProperty('totalRuns')
    expect(useGlobalStats.getState().totalRuns).toBe(0)
  })

  it('store exposes totalKills field', () => {
    expect(useGlobalStats.getState()).toHaveProperty('totalKills')
  })

  it('store exposes totalTimeSurvived field', () => {
    expect(useGlobalStats.getState()).toHaveProperty('totalTimeSurvived')
  })

  it('store exposes totalFragments field', () => {
    expect(useGlobalStats.getState()).toHaveProperty('totalFragments')
  })

  it('store exposes bestRun with required fields', () => {
    const { bestRun } = useGlobalStats.getState()
    expect(bestRun).toHaveProperty('highestSystem')
    expect(bestRun).toHaveProperty('longestTime')
    expect(bestRun).toHaveProperty('mostKills')
    expect(bestRun).toHaveProperty('highestLevel')
  })

  it('getTopWeapons returns empty array when no runs', () => {
    const top = useGlobalStats.getState().getTopWeapons(3)
    expect(top).toEqual([])
  })

  it('getTopBoons returns empty array when no runs', () => {
    const top = useGlobalStats.getState().getTopBoons(3)
    expect(top).toEqual([])
  })

  it('getTopWeapons returns top N weapons sorted by runCount descending', () => {
    useGlobalStats.getState().recordRunEnd({
      kills: 10, timeSurvived: 60, fragments: 5, systemsReached: 1, level: 5,
      weaponsUsed: ['LASER_FRONT', 'RAILGUN', 'SHOTGUN'],
      boonsUsed: [],
    })
    useGlobalStats.getState().recordRunEnd({
      kills: 20, timeSurvived: 120, fragments: 10, systemsReached: 2, level: 8,
      weaponsUsed: ['LASER_FRONT', 'SHOTGUN'],
      boonsUsed: [],
    })
    const top = useGlobalStats.getState().getTopWeapons(3)
    expect(top[0].weaponId).toBe('LASER_FRONT')
    expect(top[0].runCount).toBe(2)
    expect(top).toHaveLength(3)
  })

  it('getTopBoons returns top N boons sorted by runCount descending', () => {
    useGlobalStats.getState().recordRunEnd({
      kills: 5, timeSurvived: 30, fragments: 2, systemsReached: 1, level: 3,
      weaponsUsed: [],
      boonsUsed: ['DAMAGE_AMP', 'SPEED_BOOST'],
    })
    useGlobalStats.getState().recordRunEnd({
      kills: 5, timeSurvived: 30, fragments: 2, systemsReached: 1, level: 3,
      weaponsUsed: [],
      boonsUsed: ['DAMAGE_AMP'],
    })
    const top = useGlobalStats.getState().getTopBoons(3)
    expect(top[0].boonId).toBe('DAMAGE_AMP')
    expect(top[0].runCount).toBe(2)
  })
})

describe('StatsScreen — MENU_ITEMS includes options', () => {
  it('MENU_ITEMS from MainMenu contains options entry (stats is a corner button)', async () => {
    const { MENU_ITEMS } = await import('../MainMenu.jsx')
    const ids = MENU_ITEMS.map(item => item.id)
    expect(ids).toContain('options')
    expect(ids).not.toContain('stats')
  })
})
