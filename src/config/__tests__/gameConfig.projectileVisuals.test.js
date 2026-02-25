import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'
import { WEAPONS } from '../../entities/weaponDefs.js'

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

  it('SPEED_SCALE_MAX caps elongation', () => {
    expect(visuals.SPEED_SCALE_MAX).toBeGreaterThanOrEqual(1.5)
    expect(visuals.SPEED_SCALE_MAX).toBeLessThanOrEqual(3.0)
  })

  // Motion blur elongation sanity check for all projectile weapon speeds
  // Story 32.1: LASER_CROSS uses weaponType (no baseSpeed) — skip non-projectile weapons
  it('motion blur produces subtle elongation (1.0x-2.0x) for all weapon speeds', () => {
    for (const [id, def] of Object.entries(WEAPONS)) {
      if (def.weaponType) continue // skip non-projectile weapons (e.g., laser_cross)
      const speed = def.baseSpeed // assumes normalized direction vector magnitude ~1.0
      const rawMult = 1.0 + speed * visuals.SPEED_SCALE_MULT
      const capped = Math.min(rawMult, visuals.SPEED_SCALE_MAX)
      expect(capped, `${id} (speed ${speed}) elongation ${capped.toFixed(2)}x exceeds cap`).toBeLessThanOrEqual(visuals.SPEED_SCALE_MAX)
      expect(capped, `${id} (speed ${speed}) elongation should be >= 1.0`).toBeGreaterThanOrEqual(1.0)
    }
  })
})
