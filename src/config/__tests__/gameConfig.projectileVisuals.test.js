import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('GAME_CONFIG.PROJECTILE_VISUALS (Story 12.2)', () => {
  const visuals = GAME_CONFIG.PROJECTILE_VISUALS

  it('PROJECTILE_VISUALS section exists', () => {
    expect(visuals).toBeDefined()
  })

  it('EMISSIVE_INTENSITY is in range 2.0-4.0', () => {
    expect(visuals.EMISSIVE_INTENSITY).toBeGreaterThanOrEqual(2.0)
    expect(visuals.EMISSIVE_INTENSITY).toBeLessThanOrEqual(4.0)
  })

  it('EMISSIVE_BASE_COLOR is a valid hex color', () => {
    expect(visuals.EMISSIVE_BASE_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('MOTION_BLUR_ENABLED is a boolean', () => {
    expect(typeof visuals.MOTION_BLUR_ENABLED).toBe('boolean')
  })

  it('SPEED_SCALE_MULT is a positive number', () => {
    expect(visuals.SPEED_SCALE_MULT).toBeGreaterThan(0)
    expect(visuals.SPEED_SCALE_MULT).toBeLessThan(0.1)
  })
})
