import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('gameConfig — spawn constants (Story 2.2, Story 28.4, Story 45.4: enemy pressure nerf)', () => {
  it('MAX_ENEMIES_ON_SCREEN is 40 (nerfed from 60)', () => {
    expect(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN).toBe(40)
  })

  it('SPAWN_INTERVAL_BASE is 5.5s (nerfed from 4.0)', () => {
    expect(GAME_CONFIG.SPAWN_INTERVAL_BASE).toBe(5.5)
  })

  it('SPAWN_INTERVAL_MIN is 2.8s (nerfed from 2.0)', () => {
    expect(GAME_CONFIG.SPAWN_INTERVAL_MIN).toBe(2.8)
  })

  it('SPAWN_RAMP_RATE is 0.018 (nerfed from 0.025, slower pressure ramp)', () => {
    expect(GAME_CONFIG.SPAWN_RAMP_RATE).toBe(0.018)
  })

  it('SPAWN_INTERVAL_MIN is less than SPAWN_INTERVAL_BASE (valid floor/ceiling relationship)', () => {
    expect(GAME_CONFIG.SPAWN_INTERVAL_MIN).toBeLessThan(GAME_CONFIG.SPAWN_INTERVAL_BASE)
  })

  it('SPAWN_RAMP_RATE is positive (interval always decreasing over time)', () => {
    expect(GAME_CONFIG.SPAWN_RAMP_RATE).toBeGreaterThan(0)
  })
})
