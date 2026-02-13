import { describe, it, expect } from 'vitest'
import { getXPForLevel } from '../xpScaling.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('getXPForLevel', () => {
  it('returns hardcoded values for levels 1-14', () => {
    const curve = GAME_CONFIG.XP_LEVEL_CURVE
    for (let level = 1; level <= curve.length; level++) {
      expect(getXPForLevel(level)).toBe(curve[level - 1])
    }
  })

  it('calculates scaled values for levels 15+', () => {
    // Level 15: 4400 * 1.02^1 = 4488
    expect(getXPForLevel(15)).toBe(4488)
    // Level 16: 4400 * 1.02^2 = 4577
    expect(getXPForLevel(16)).toBe(4577)
  })

  it('maintains ~2% growth rate between consecutive levels', () => {
    for (let level = 15; level <= 50; level++) {
      const current = getXPForLevel(level)
      const next = getXPForLevel(level + 1)
      const growthRate = next / current
      expect(growthRate).toBeCloseTo(1.02, 1)
    }
  })

  it('does not exceed Number.MAX_SAFE_INTEGER', () => {
    // Level 300 would overflow without safeguard
    expect(getXPForLevel(300)).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)
  })

  it('returns positive integers for all levels', () => {
    for (let level = 1; level <= 200; level++) {
      const xp = getXPForLevel(level)
      expect(xp).toBeGreaterThan(0)
      expect(Number.isInteger(xp)).toBe(true)
    }
  })
})
