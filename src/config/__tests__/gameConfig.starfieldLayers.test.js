import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('ENVIRONMENT_VISUAL_EFFECTS.STARFIELD_LAYERS', () => {
  const layers = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS?.STARFIELD_LAYERS

  it('should exist in GAME_CONFIG', () => {
    expect(GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS).toBeDefined()
    expect(layers).toBeDefined()
  })

  it('should define exactly 3 layers: DISTANT, MID, NEAR', () => {
    expect(layers.DISTANT).toBeDefined()
    expect(layers.MID).toBeDefined()
    expect(layers.NEAR).toBeDefined()
  })

  it('should have total star count <= 4000 (performance budget)', () => {
    const total = layers.DISTANT.count + layers.MID.count + layers.NEAR.count
    expect(total).toBeLessThanOrEqual(4000)
  })

  describe('DISTANT layer', () => {
    it('should have correct star count and radius', () => {
      expect(layers.DISTANT.count).toBe(1200)
      expect(layers.DISTANT.radius).toBe(5000)
    })

    it('should have small/dim stars (size ~2-4, opacity ~0.4-0.7)', () => {
      expect(layers.DISTANT.sizeRange[0]).toBeGreaterThanOrEqual(1.5)
      expect(layers.DISTANT.sizeRange[1]).toBeLessThanOrEqual(4)
      expect(layers.DISTANT.opacityRange[0]).toBeGreaterThanOrEqual(0.4)
      expect(layers.DISTANT.opacityRange[1]).toBeLessThanOrEqual(0.7)
    })

    it('should have no parallax (static backdrop)', () => {
      expect(layers.DISTANT.parallaxFactor).toBe(0)
    })

    it('should not use sizeAttenuation', () => {
      expect(layers.DISTANT.sizeAttenuation).toBe(false)
    })
  })

  describe('MID layer', () => {
    it('should have correct star count and radius', () => {
      expect(layers.MID.count).toBe(1200)
      expect(layers.MID.radius).toBe(3000)
    })

    it('should have medium stars (size ~3-6, opacity ~0.6-0.9)', () => {
      expect(layers.MID.sizeRange[0]).toBeGreaterThanOrEqual(3)
      expect(layers.MID.sizeRange[1]).toBeLessThanOrEqual(6.5)
      expect(layers.MID.opacityRange[0]).toBeGreaterThanOrEqual(0.6)
      expect(layers.MID.opacityRange[1]).toBeLessThanOrEqual(0.9)
    })

    it('should have slow parallax (5-8% range)', () => {
      expect(layers.MID.parallaxFactor).toBeGreaterThanOrEqual(0.05)
      expect(layers.MID.parallaxFactor).toBeLessThanOrEqual(0.08)
    })

    it('should not use sizeAttenuation', () => {
      expect(layers.MID.sizeAttenuation).toBe(false)
    })
  })

  describe('NEAR layer', () => {
    it('should have correct star count and radius', () => {
      expect(layers.NEAR.count).toBe(800)
      expect(layers.NEAR.radius).toBe(1500)
    })

    it('should have large/bright stars (size ~5-9, opacity ~0.8-1.0)', () => {
      expect(layers.NEAR.sizeRange[0]).toBeGreaterThanOrEqual(5)
      expect(layers.NEAR.sizeRange[1]).toBeLessThanOrEqual(9)
      expect(layers.NEAR.opacityRange[0]).toBeGreaterThanOrEqual(0.8)
      expect(layers.NEAR.opacityRange[1]).toBeLessThanOrEqual(1.0)
    })

    it('should have fast parallax (15-20% range)', () => {
      expect(layers.NEAR.parallaxFactor).toBeGreaterThanOrEqual(0.15)
      expect(layers.NEAR.parallaxFactor).toBeLessThanOrEqual(0.20)
    })

    it('should use sizeAttenuation for depth perception', () => {
      expect(layers.NEAR.sizeAttenuation).toBe(true)
    })
  })

  it('should have increasing radius from near to distant', () => {
    expect(layers.NEAR.radius).toBeLessThan(layers.MID.radius)
    expect(layers.MID.radius).toBeLessThan(layers.DISTANT.radius)
  })

  it('should have decreasing parallax factor from near to distant', () => {
    expect(layers.NEAR.parallaxFactor).toBeGreaterThan(layers.MID.parallaxFactor)
    expect(layers.MID.parallaxFactor).toBeGreaterThan(layers.DISTANT.parallaxFactor)
  })
})

describe('ENVIRONMENT_VISUAL_EFFECTS.BACKGROUND (Story 24.2)', () => {
  const bg = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS?.BACKGROUND

  it('should exist in ENVIRONMENT_VISUAL_EFFECTS', () => {
    expect(bg).toBeDefined()
  })

  describe('DEFAULT config', () => {
    it('should have a dark blue color (not pure black)', () => {
      expect(bg.DEFAULT).toBeDefined()
      expect(bg.DEFAULT.color).toBeDefined()
      expect(bg.DEFAULT.color).not.toBe('#000000')
    })

    it('should have nebula configuration fields', () => {
      expect(typeof bg.DEFAULT.nebulaEnabled).toBe('boolean')
      expect(bg.DEFAULT.nebulaTint).toBeDefined()
      expect(typeof bg.DEFAULT.nebulaOpacity).toBe('number')
      expect(bg.DEFAULT.nebulaOpacity).toBeGreaterThan(0)
      expect(bg.DEFAULT.nebulaOpacity).toBe(0.32)
    })
  })

  describe('BOSS config', () => {
    it('should have a boss-specific background color', () => {
      expect(bg.BOSS).toBeDefined()
      expect(bg.BOSS.color).toBeDefined()
      expect(bg.BOSS.color).not.toBe(bg.DEFAULT.color)
    })

    it('should have nebula configuration fields', () => {
      expect(typeof bg.BOSS.nebulaEnabled).toBe('boolean')
      expect(bg.BOSS.nebulaTint).toBeDefined()
      expect(typeof bg.BOSS.nebulaOpacity).toBe('number')
    })
  })

  it('should have fog colors matching their respective background colors', () => {
    const fog = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.AMBIENT_FOG
    expect(fog.GAMEPLAY.color).toBe(bg.DEFAULT.color)
    expect(fog.BOSS.color).toBe(bg.BOSS.color)
  })
})
