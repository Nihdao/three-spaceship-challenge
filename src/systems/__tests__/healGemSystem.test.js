import { describe, it, expect, beforeEach } from 'vitest'
import { spawnHealGem, collectHealGem, updateHealGemMagnetization, getHealGems, getActiveHealGemCount, resetHealGems } from '../healGemSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('healGemSystem', () => {
  beforeEach(() => {
    resetHealGems()
  })

  describe('spawnHealGem', () => {
    it('spawns heal gem at given position with healAmount', () => {
      const result = spawnHealGem(10, 20, 20)
      expect(result).toBe(true)
      expect(getActiveHealGemCount()).toBe(1)
      const gems = getHealGems()
      expect(gems[0].x).toBe(10)
      expect(gems[0].z).toBe(20)
      expect(gems[0].healAmount).toBe(20)
      expect(gems[0].elapsedTime).toBe(0)
      expect(gems[0].isMagnetized).toBe(false)
    })

    it('spawns multiple heal gems', () => {
      spawnHealGem(1, 2, 20)
      spawnHealGem(3, 4, 20)
      expect(getActiveHealGemCount()).toBe(2)
    })

    it('caps at MAX_HEAL_GEMS', () => {
      for (let i = 0; i < GAME_CONFIG.MAX_HEAL_GEMS + 5; i++) {
        spawnHealGem(i, i, 20)
      }
      expect(getActiveHealGemCount()).toBe(GAME_CONFIG.MAX_HEAL_GEMS)
    })

    it('returns false when pool is full', () => {
      // Fill pool
      for (let i = 0; i < GAME_CONFIG.MAX_HEAL_GEMS; i++) {
        spawnHealGem(i, i, 20)
      }
      // Attempt to spawn when full
      const result = spawnHealGem(999, 888, 20)
      expect(result).toBe(false)
      expect(getActiveHealGemCount()).toBe(GAME_CONFIG.MAX_HEAL_GEMS)
    })
  })

  describe('collectHealGem', () => {
    it('deactivates heal gem and returns healAmount', () => {
      spawnHealGem(5, 5, 20)
      const healAmount = collectHealGem(0)
      expect(healAmount).toBe(20)
      expect(getActiveHealGemCount()).toBe(0)
    })

    it('uses swap-to-end removal', () => {
      spawnHealGem(1, 1, 20)
      spawnHealGem(2, 2, 20)
      spawnHealGem(3, 3, 20)
      // Collect first gem — third should swap into index 0
      collectHealGem(0)
      expect(getActiveHealGemCount()).toBe(2)
      const gems = getHealGems()
      expect(gems[0].x).toBe(3)
      expect(gems[0].z).toBe(3)
    })
  })

  describe('updateHealGemMagnetization', () => {
    it('magnetizes gems within XP_MAGNET_RADIUS', () => {
      spawnHealGem(5, 0, 20)
      updateHealGemMagnetization(0, 0, 1/60, 1.0)
      const gem = getHealGems()[0]
      expect(gem.isMagnetized).toBe(true)
    })

    it('does not magnetize gems outside XP_MAGNET_RADIUS', () => {
      spawnHealGem(100, 100, 20)
      updateHealGemMagnetization(0, 0, 1/60, 1.0)
      const gem = getHealGems()[0]
      expect(gem.isMagnetized).toBe(false)
    })

    it('moves magnetized gems toward player', () => {
      spawnHealGem(10, 0, 20)
      const xBefore = getHealGems()[0].x
      updateHealGemMagnetization(0, 0, 1/60, 1.0)
      const gem = getHealGems()[0]
      expect(gem.x).toBeLessThan(xBefore)
    })

    it('applies pickupRadiusMultiplier to magnet radius', () => {
      const baseRadius = GAME_CONFIG.XP_MAGNET_RADIUS
      spawnHealGem(baseRadius * 1.5, 0, 20) // Outside base radius, inside 2x radius

      // Without multiplier, should not be magnetized
      updateHealGemMagnetization(0, 0, 1/60, 1.0)
      expect(getHealGems()[0].isMagnetized).toBe(false)

      // Reset position
      getHealGems()[0].x = baseRadius * 1.5
      getHealGems()[0].isMagnetized = false

      // With 2x multiplier, should be magnetized
      updateHealGemMagnetization(0, 0, 1/60, 2.0)
      expect(getHealGems()[0].isMagnetized).toBe(true)
    })

    it('handles multiple gems simultaneously', () => {
      spawnHealGem(3, 0, 20)
      spawnHealGem(0, 4, 20)
      spawnHealGem(100, 100, 20) // outside radius
      updateHealGemMagnetization(0, 0, 1/60, 1.0)
      expect(getHealGems()[0].isMagnetized).toBe(true)
      expect(getHealGems()[1].isMagnetized).toBe(true)
      expect(getHealGems()[2].isMagnetized).toBe(false)
    })
  })

  describe('resetHealGems', () => {
    it('clears all heal gems', () => {
      spawnHealGem(0, 0, 20)
      spawnHealGem(1, 1, 20)
      expect(getActiveHealGemCount()).toBe(2)
      resetHealGems()
      expect(getActiveHealGemCount()).toBe(0)
    })

    it('clears all fields (x, z, healAmount, elapsedTime, isMagnetized)', () => {
      spawnHealGem(42, 99, 20)
      const gem = getHealGems()[0]
      gem.elapsedTime = 3.5
      gem.isMagnetized = true
      resetHealGems()
      const resetGem = getHealGems()[0]
      expect(resetGem.x).toBe(0)
      expect(resetGem.z).toBe(0)
      expect(resetGem.healAmount).toBe(0)
      expect(resetGem.elapsedTime).toBe(0)
      expect(resetGem.isMagnetized).toBe(false)
    })
  })
})
