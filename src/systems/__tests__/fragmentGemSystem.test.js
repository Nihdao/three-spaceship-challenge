import { describe, it, expect, beforeEach } from 'vitest'
import { spawnGem, collectGem, updateMagnetization, getActiveGems, getActiveCount, reset } from '../fragmentGemSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('Fragment Gem Config (Story 19.3)', () => {
  it('FRAGMENT_DROP_CHANCE exists and is a valid probability', () => {
    expect(GAME_CONFIG.FRAGMENT_DROP_CHANCE).toBeGreaterThanOrEqual(0)
    expect(GAME_CONFIG.FRAGMENT_DROP_CHANCE).toBeLessThanOrEqual(1)
  })

  it('FRAGMENT_DROP_AMOUNT is a positive number', () => {
    expect(GAME_CONFIG.FRAGMENT_DROP_AMOUNT).toBeGreaterThan(0)
  })

  it('MAX_FRAGMENT_GEMS is a positive number', () => {
    expect(GAME_CONFIG.MAX_FRAGMENT_GEMS).toBeGreaterThan(0)
  })

  it('FRAGMENT_GEM_PICKUP_RADIUS is a positive number', () => {
    expect(GAME_CONFIG.FRAGMENT_GEM_PICKUP_RADIUS).toBeGreaterThan(0)
  })
})

describe('fragmentGemSystem', () => {
  beforeEach(() => {
    reset()
  })

  describe('spawnGem', () => {
    it('activates a gem at given position with fragmentValue', () => {
      spawnGem(10, 20, 5)
      expect(getActiveCount()).toBe(1)
      const gems = getActiveGems()
      expect(gems[0].x).toBe(10)
      expect(gems[0].z).toBe(20)
      expect(gems[0].fragmentValue).toBe(5)
    })

    it('spawns multiple gems', () => {
      spawnGem(1, 2, 1)
      spawnGem(3, 4, 1)
      expect(getActiveCount()).toBe(2)
    })

    it('caps at MAX_FRAGMENT_GEMS', () => {
      for (let i = 0; i < GAME_CONFIG.MAX_FRAGMENT_GEMS + 10; i++) {
        spawnGem(i, i, 1)
      }
      expect(getActiveCount()).toBe(GAME_CONFIG.MAX_FRAGMENT_GEMS)
    })

    it('recycles oldest gem when pool is full', () => {
      // Fill pool
      for (let i = 0; i < GAME_CONFIG.MAX_FRAGMENT_GEMS; i++) {
        spawnGem(i, i, 1)
      }
      // Age the gems by updating elapsed time (simulate passage of time)
      const gems = getActiveGems()
      for (let i = 0; i < GAME_CONFIG.MAX_FRAGMENT_GEMS; i++) {
        gems[i].elapsedTime = 5.0
      }
      // Make index 0 not the oldest
      gems[0].elapsedTime = 0.1

      // Spawn a new gem — should recycle one of the oldest
      spawnGem(999, 888, 7)
      expect(getActiveCount()).toBe(GAME_CONFIG.MAX_FRAGMENT_GEMS)

      // The recycled gem should have the new values
      const updatedGems = getActiveGems()
      let found = false
      for (let i = 0; i < GAME_CONFIG.MAX_FRAGMENT_GEMS; i++) {
        if (updatedGems[i].x === 999 && updatedGems[i].z === 888 && updatedGems[i].fragmentValue === 7) {
          found = true
          expect(updatedGems[i].elapsedTime).toBe(0)
          break
        }
      }
      expect(found).toBe(true)
    })
  })

  describe('collectGem', () => {
    it('deactivates gem and returns fragmentValue', () => {
      spawnGem(5, 5, 3)
      const val = collectGem(0)
      expect(val).toBe(3)
      expect(getActiveCount()).toBe(0)
    })

    it('uses swap-to-end removal (last gem takes collected gem slot)', () => {
      spawnGem(1, 1, 1)
      spawnGem(2, 2, 2)
      spawnGem(3, 3, 3)
      // Collect first gem — third should swap into index 0
      collectGem(0)
      expect(getActiveCount()).toBe(2)
      const gems = getActiveGems()
      expect(gems[0].x).toBe(3)
      expect(gems[0].fragmentValue).toBe(3)
    })
  })

  describe('magnetization', () => {
    it('spawned gems have isMagnetized=false', () => {
      spawnGem(10, 20, 1)
      const gem = getActiveGems()[0]
      expect(gem.isMagnetized).toBe(false)
    })

    it('magnetizes gems within XP_MAGNET_RADIUS', () => {
      spawnGem(5, 0, 1) // gem at (5, 0)
      updateMagnetization(0, 0, 1/60) // player at origin, within radius
      const gem = getActiveGems()[0]
      expect(gem.isMagnetized).toBe(true)
    })

    it('does not magnetize gems outside XP_MAGNET_RADIUS', () => {
      spawnGem(100, 100, 1) // gem far away
      updateMagnetization(0, 0, 1/60)
      const gem = getActiveGems()[0]
      expect(gem.isMagnetized).toBe(false)
    })

    it('moves magnetized gems toward player', () => {
      spawnGem(5, 0, 1) // gem at (5, 0)
      const gemBefore = getActiveGems()[0].x
      updateMagnetization(0, 0, 1/60) // player at origin
      // After magnetization + movement, gem should have moved closer to player (x decreased)
      expect(getActiveGems()[0].x).toBeLessThan(gemBefore)
    })
  })

  describe('reset', () => {
    it('clears all gems', () => {
      spawnGem(0, 0, 1)
      spawnGem(1, 1, 2)
      expect(getActiveCount()).toBe(2)
      reset()
      expect(getActiveCount()).toBe(0)
    })

    it('clears all fields (x, z, fragmentValue, elapsedTime, isMagnetized)', () => {
      spawnGem(42, 99, 7)
      const gems = getActiveGems()
      gems[0].elapsedTime = 3.5
      gems[0].isMagnetized = true
      reset()
      const gem = getActiveGems()[0]
      expect(gem.x).toBe(0)
      expect(gem.z).toBe(0)
      expect(gem.fragmentValue).toBe(0)
      expect(gem.elapsedTime).toBe(0)
      expect(gem.isMagnetized).toBe(false)
    })
  })
})
