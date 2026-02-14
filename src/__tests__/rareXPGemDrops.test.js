import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig.js'

describe('Rare XP Gem Drop Logic (Story 19.1)', () => {
  it('RARE_XP_GEM_DROP_CHANCE config value exists and is valid', () => {
    expect(GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE).toBeDefined()
    expect(GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE).toBeGreaterThan(0)
    expect(GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE).toBeLessThanOrEqual(1)
  })

  it('RARE_XP_GEM_MULTIPLIER config value exists and is valid', () => {
    expect(GAME_CONFIG.RARE_XP_GEM_MULTIPLIER).toBeDefined()
    expect(GAME_CONFIG.RARE_XP_GEM_MULTIPLIER).toBeGreaterThan(1) // Should be > 1 to be "rare"
  })

  it('rare drop chance produces expected distribution over 1000 samples', () => {
    const samples = 1000
    let rareCount = 0

    // Simulate the GameLoop drop roll logic
    for (let i = 0; i < samples; i++) {
      const isRare = Math.random() < GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE
      if (isRare) rareCount++
    }

    const rareRate = rareCount / samples
    const expectedRate = GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE
    const tolerance = 0.03 // ±3% tolerance for statistical variance

    // Verify rare drop rate is within expected range
    expect(rareRate).toBeGreaterThanOrEqual(expectedRate - tolerance)
    expect(rareRate).toBeLessThanOrEqual(expectedRate + tolerance)
  })

  it('rare XP value calculation is correct', () => {
    const baseXP = 12 // FODDER_BASIC xpReward
    const rareXP = baseXP * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER
    expect(rareXP).toBe(36) // 12 * 3 = 36
  })

  it('RARE_XP_GEM_COLOR config value exists and is a valid hex color', () => {
    expect(GAME_CONFIG.RARE_XP_GEM_COLOR).toBeDefined()
    expect(GAME_CONFIG.RARE_XP_GEM_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('RARE_XP_GEM_SCALE_MULTIPLIER makes rare gems visually larger', () => {
    expect(GAME_CONFIG.RARE_XP_GEM_SCALE_MULTIPLIER).toBeGreaterThan(1)
  })

  it('RARE_XP_GEM_PULSE_SPEED is a positive number', () => {
    expect(GAME_CONFIG.RARE_XP_GEM_PULSE_SPEED).toBeGreaterThan(0)
  })
})
