import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('ENVIRONMENT_VISUAL_EFFECTS.GRID_VISIBILITY', () => {
  const grid = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS?.GRID_VISIBILITY

  it('should exist in GAME_CONFIG', () => {
    expect(grid).toBeDefined()
  })

  it('should define GAMEPLAY, BOSS, and DEBUG sections', () => {
    expect(grid.GAMEPLAY).toBeDefined()
    expect(grid.BOSS).toBeDefined()
    expect(grid.DEBUG).toBeDefined()
  })

  describe('GAMEPLAY grid', () => {
    it('should have enabled flag', () => {
      expect(typeof grid.GAMEPLAY.enabled).toBe('boolean')
    })

    it('should have very dark colors (low contrast with base plane #0a0a0f)', () => {
      expect(grid.GAMEPLAY.colorCenterLine).toBe('#0d0d18')
      expect(grid.GAMEPLAY.colorGrid).toBe('#0a0a0f')
    })

    it('should have divisions configured', () => {
      expect(grid.GAMEPLAY.divisions).toBeGreaterThanOrEqual(20)
      expect(grid.GAMEPLAY.divisions).toBeLessThanOrEqual(40)
    })
  })

  describe('BOSS grid', () => {
    it('should have enabled flag', () => {
      expect(typeof grid.BOSS.enabled).toBe('boolean')
    })

    it('should have dark purple-tinted colors', () => {
      expect(grid.BOSS.colorCenterLine).toBe('#1a0828')
      expect(grid.BOSS.colorGrid).toBe('#0d0415')
    })

    it('should have divisions configured', () => {
      expect(grid.BOSS.divisions).toBeGreaterThanOrEqual(15)
      expect(grid.BOSS.divisions).toBeLessThanOrEqual(20)
    })
  })

  describe('DEBUG grid', () => {
    it('should have bright cyan colors for high visibility', () => {
      expect(grid.DEBUG.colorCenterLine).toBe('#00ffcc')
      expect(grid.DEBUG.colorGrid).toBe('#00aaaa')
    })
  })
})

describe('ENVIRONMENT_VISUAL_EFFECTS.AMBIENT_FOG', () => {
  const fog = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS?.AMBIENT_FOG

  it('should exist in GAME_CONFIG', () => {
    expect(fog).toBeDefined()
  })

  it('should define GAMEPLAY and BOSS fog', () => {
    expect(fog.GAMEPLAY).toBeDefined()
    expect(fog.BOSS).toBeDefined()
  })

  describe('GAMEPLAY fog', () => {
    it('should have enabled flag', () => {
      expect(typeof fog.GAMEPLAY.enabled).toBe('boolean')
    })

    it('should have deep blue-black color', () => {
      expect(fog.GAMEPLAY.color).toBe('#050510')
    })

    it('should have very low density (0.0001-0.0005 range)', () => {
      expect(fog.GAMEPLAY.density).toBeGreaterThanOrEqual(0.0001)
      expect(fog.GAMEPLAY.density).toBeLessThanOrEqual(0.0005)
    })
  })

  describe('BOSS fog', () => {
    it('should have enabled flag', () => {
      expect(typeof fog.BOSS.enabled).toBe('boolean')
    })

    it('should have purple-tinted color', () => {
      expect(fog.BOSS.color).toBe('#0a0515')
    })

    it('should have very low density', () => {
      expect(fog.BOSS.density).toBeGreaterThanOrEqual(0.0001)
      expect(fog.BOSS.density).toBeLessThanOrEqual(0.0005)
    })
  })
})
