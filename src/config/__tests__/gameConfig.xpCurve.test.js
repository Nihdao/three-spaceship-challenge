import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('gameConfig — XP curve rebalancing (Story 11.2)', () => {
  const curve = GAME_CONFIG.XP_LEVEL_CURVE

  it('has at least 14 levels (extended from 10)', () => {
    expect(curve.length).toBeGreaterThanOrEqual(14)
  })

  it('early levels (1-5) are reduced by ~20-30% from original values', () => {
    // Original: [100, 150, 225, 340, 510]
    // Expected reductions: 20-30% each
    expect(curve[0]).toBeLessThanOrEqual(80)   // was 100, target ~75
    expect(curve[1]).toBeLessThanOrEqual(120)  // was 150, target ~110
    expect(curve[2]).toBeLessThanOrEqual(180)  // was 225, target ~165
    expect(curve[3]).toBeLessThanOrEqual(272)  // was 340, target ~250
    expect(curve[4]).toBeLessThanOrEqual(408)  // was 510, target ~375
  })

  it('mid and late levels (6+) grow at ~30% per level for frequent leveling', () => {
    // From level 6 onwards, each level should cost ~30% more than the previous
    for (let i = 6; i < curve.length; i++) {
      const growth = curve[i] / curve[i - 1]
      expect(growth).toBeGreaterThanOrEqual(1.2)
      expect(growth).toBeLessThanOrEqual(1.45)
    }
  })

  it('curve is monotonically increasing (each level costs more XP)', () => {
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThan(curve[i - 1])
    }
  })

  it('cumulative XP to level 5 allows reaching it in ~2-3 minutes', () => {
    // With FODDER_BASIC @12 XP, 1 kill/3s = 4 XP/s
    // 2 min = 480 XP, 3 min = 720 XP
    // Cumulative to level 5 = sum of first 4 entries
    const cumulativeToLevel5 = curve.slice(0, 4).reduce((s, v) => s + v, 0)
    expect(cumulativeToLevel5).toBeLessThanOrEqual(720)
    expect(cumulativeToLevel5).toBeGreaterThanOrEqual(400)
  })

  it('all curve values are positive integers', () => {
    for (const val of curve) {
      expect(val).toBeGreaterThan(0)
      expect(Number.isInteger(val)).toBe(true)
    }
  })
})
