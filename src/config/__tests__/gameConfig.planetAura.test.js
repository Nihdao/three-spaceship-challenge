import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('PLANET_AURA config', () => {
  const cfg = GAME_CONFIG.PLANET_AURA

  it('exists in GAME_CONFIG', () => {
    expect(cfg).toBeDefined()
  })

  it('has OPACITY_MAX between 0 and 1', () => {
    expect(cfg.OPACITY_MAX).toBeGreaterThan(0)
    expect(cfg.OPACITY_MAX).toBeLessThanOrEqual(1.0)
  })

  it('has PULSE_SPEED as positive number', () => {
    expect(cfg.PULSE_SPEED).toBeGreaterThan(0)
  })

  it('has PULSE_AMPLITUDE as small positive number', () => {
    expect(cfg.PULSE_AMPLITUDE).toBeGreaterThan(0)
    expect(cfg.PULSE_AMPLITUDE).toBeLessThanOrEqual(0.5)
  })

  it('has FADE_IN_DURATION as positive number in seconds', () => {
    expect(cfg.FADE_IN_DURATION).toBeGreaterThan(0)
    expect(cfg.FADE_IN_DURATION).toBeLessThanOrEqual(2.0)
  })

  it('has FADE_OUT_DURATION as positive number in seconds', () => {
    expect(cfg.FADE_OUT_DURATION).toBeGreaterThan(0)
    expect(cfg.FADE_OUT_DURATION).toBeLessThanOrEqual(2.0)
  })

  it('has tier color strings as hex values', () => {
    expect(cfg.SILVER_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(cfg.GOLD_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(cfg.PLATINUM_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('has COMPLETED_OPACITY between 0 and 1', () => {
    expect(cfg.COMPLETED_OPACITY).toBeGreaterThanOrEqual(0)
    expect(cfg.COMPLETED_OPACITY).toBeLessThanOrEqual(1.0)
  })

  it('has COMPLETED_COLOR as hex string', () => {
    expect(cfg.COMPLETED_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('has SHOW_COMPLETED_AURA as boolean', () => {
    expect(typeof cfg.SHOW_COMPLETED_AURA).toBe('boolean')
  })
})
