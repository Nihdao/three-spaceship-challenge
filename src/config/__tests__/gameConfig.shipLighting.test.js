import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('PLAYER_SHIP_LIGHTING config', () => {
  const cfg = GAME_CONFIG.PLAYER_SHIP_LIGHTING

  it('exists in GAME_CONFIG', () => {
    expect(cfg).toBeDefined()
  })

  it('has EMISSIVE_INTENSITY as non-negative number', () => {
    expect(cfg.EMISSIVE_INTENSITY).toBeGreaterThanOrEqual(0)
    expect(cfg.EMISSIVE_INTENSITY).toBeLessThanOrEqual(1.0)
  })

  it('has EMISSIVE_COLOR as hex string', () => {
    expect(cfg.EMISSIVE_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('has ENGINE_EMISSIVE_INTENSITY as non-negative number', () => {
    expect(cfg.ENGINE_EMISSIVE_INTENSITY).toBeGreaterThanOrEqual(0)
    expect(cfg.ENGINE_EMISSIVE_INTENSITY).toBeLessThanOrEqual(3.0)
  })

  it('has ENGINE_EMISSIVE_COLOR as hex string', () => {
    expect(cfg.ENGINE_EMISSIVE_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('has POINT_LIGHT_INTENSITY as positive number', () => {
    expect(cfg.POINT_LIGHT_INTENSITY).toBeGreaterThan(0)
    expect(cfg.POINT_LIGHT_INTENSITY).toBeLessThanOrEqual(10)
  })

  it('has POINT_LIGHT_DISTANCE as positive number', () => {
    expect(cfg.POINT_LIGHT_DISTANCE).toBeGreaterThan(0)
    expect(cfg.POINT_LIGHT_DISTANCE).toBeLessThanOrEqual(30)
  })

  it('has FILL_LIGHT_INTENSITY as positive number', () => {
    expect(cfg.FILL_LIGHT_INTENSITY).toBeGreaterThan(0)
    expect(cfg.FILL_LIGHT_INTENSITY).toBeLessThanOrEqual(5.0)
  })

  it('has FILL_LIGHT_POSITION as [x, y, z] array', () => {
    expect(cfg.FILL_LIGHT_POSITION).toHaveLength(3)
    cfg.FILL_LIGHT_POSITION.forEach(v => expect(typeof v).toBe('number'))
  })

  it('has POINT_LIGHT_Y as number', () => {
    expect(typeof cfg.POINT_LIGHT_Y).toBe('number')
  })

  // Story 15.1: Per-scene fill light intensity overrides
  it('has FILL_LIGHT_INTENSITY_BOSS as null or positive number', () => {
    const val = cfg.FILL_LIGHT_INTENSITY_BOSS
    expect(val === null || (typeof val === 'number' && val > 0)).toBe(true)
  })

  it('has FILL_LIGHT_INTENSITY_TUNNEL as null or positive number', () => {
    const val = cfg.FILL_LIGHT_INTENSITY_TUNNEL
    expect(val === null || (typeof val === 'number' && val > 0)).toBe(true)
  })

  it('falls back to FILL_LIGHT_INTENSITY when per-scene override is null', () => {
    const bossIntensity = cfg.FILL_LIGHT_INTENSITY_BOSS ?? cfg.FILL_LIGHT_INTENSITY
    const tunnelIntensity = cfg.FILL_LIGHT_INTENSITY_TUNNEL ?? cfg.FILL_LIGHT_INTENSITY
    expect(bossIntensity).toBeGreaterThan(0)
    expect(tunnelIntensity).toBeGreaterThan(0)
  })
})
