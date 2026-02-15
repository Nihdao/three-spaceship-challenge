import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('SHIP_TRAIL config', () => {
  const cfg = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.SHIP_TRAIL

  it('exists under ENVIRONMENT_VISUAL_EFFECTS', () => {
    expect(cfg).toBeDefined()
  })

  it('has MAX_PARTICLES as positive integer <= 100', () => {
    expect(Number.isInteger(cfg.MAX_PARTICLES)).toBe(true)
    expect(cfg.MAX_PARTICLES).toBeGreaterThan(0)
    expect(cfg.MAX_PARTICLES).toBeLessThanOrEqual(100)
  })

  it('has PARTICLE_LIFETIME as positive number', () => {
    expect(cfg.PARTICLE_LIFETIME).toBeGreaterThan(0)
  })

  it('has EMISSION_RATE as positive number', () => {
    expect(cfg.EMISSION_RATE).toBeGreaterThan(0)
  })

  it('has PARTICLE_SIZE as positive number', () => {
    expect(cfg.PARTICLE_SIZE).toBeGreaterThan(0)
  })

  it('has PARTICLE_ELONGATION as number > 1', () => {
    expect(cfg.PARTICLE_ELONGATION).toBeGreaterThan(1)
  })

  it('has COLOR as hex string', () => {
    expect(cfg.COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('has DASH_EMISSION_MULTIPLIER > 1', () => {
    expect(cfg.DASH_EMISSION_MULTIPLIER).toBeGreaterThan(1)
  })

  it('has DASH_BRIGHTNESS_MULTIPLIER > 1', () => {
    expect(cfg.DASH_BRIGHTNESS_MULTIPLIER).toBeGreaterThan(1)
  })

  it('has MIN_SPEED_THRESHOLD as positive number', () => {
    expect(cfg.MIN_SPEED_THRESHOLD).toBeGreaterThan(0)
  })

  it('has SPAWN_OFFSET_BEHIND as positive number', () => {
    expect(cfg.SPAWN_OFFSET_BEHIND).toBeGreaterThan(0)
  })

  it('has SPAWN_SCATTER as positive number', () => {
    expect(cfg.SPAWN_SCATTER).toBeGreaterThan(0)
  })

})
