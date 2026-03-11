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
    // Level 15: 2650 * 1.02^1 = 2703 (Story 48.4: new baseXP = 2650)
    expect(getXPForLevel(15)).toBe(2703)
    // Level 16: 2650 * 1.02^2 = 2757
    expect(getXPForLevel(16)).toBe(2757)
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
    // With 1.02 growth, unguarded value exceeds safe integer around level ~1446
    const xp1500 = getXPForLevel(1500)
    expect(xp1500).toBe(Number.MAX_SAFE_INTEGER)
    // Moderate level should still be well below cap
    expect(getXPForLevel(300)).toBeLessThan(Number.MAX_SAFE_INTEGER)
  })

  it('returns first curve value for level 0 or negative levels', () => {
    const firstCurveValue = GAME_CONFIG.XP_LEVEL_CURVE[0]
    expect(getXPForLevel(0)).toBe(firstCurveValue)
    expect(getXPForLevel(-1)).toBe(firstCurveValue)
    expect(getXPForLevel(-100)).toBe(firstCurveValue)
  })

  it('returns positive integers for all levels', () => {
    for (let level = 1; level <= 200; level++) {
      const xp = getXPForLevel(level)
      expect(xp).toBeGreaterThan(0)
      expect(Number.isInteger(xp)).toBe(true)
    }
  })
})
