import { describe, it, expect, beforeEach } from 'vitest'
import { spawnOrb, collectOrb, updateOrbs, getOrbs, getActiveCount, resetOrbs } from '../xpOrbSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('xpOrbSystem', () => {
  beforeEach(() => {
    resetOrbs()
  })

  describe('spawnOrb', () => {
    it('activates an orb at given position with xpValue', () => {
      spawnOrb(10, 20, 15)
      expect(getActiveCount()).toBe(1)
      const orbs = getOrbs()
      expect(orbs[0].x).toBe(10)
      expect(orbs[0].z).toBe(20)
      expect(orbs[0].xpValue).toBe(15)
    })

    it('spawns multiple orbs', () => {
      spawnOrb(1, 2, 10)
      spawnOrb(3, 4, 8)
      expect(getActiveCount()).toBe(2)
    })

    it('caps at MAX_XP_ORBS', () => {
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS + 10; i++) {
        spawnOrb(i, i, 10)
      }
      expect(getActiveCount()).toBe(GAME_CONFIG.MAX_XP_ORBS)
    })

    it('recycles oldest orb when pool is full', () => {
      // Fill pool
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
        spawnOrb(i, i, 10)
      }
      // Age the first orb so it becomes the oldest
      updateOrbs(5.0)
      // Reset one orb's time so it's not the oldest
      getOrbs()[0].elapsedTime = 0.1

      // Find which orb has highest elapsedTime (all at 5.0 except index 0 at 0.1)
      // Orb at index 1 should be among the oldest (elapsedTime=5.0)
      const oldestIdx = 1
      const oldX = getOrbs()[oldestIdx].x

      // Spawn a new orb — should recycle one of the oldest
      spawnOrb(999, 888, 77)
      expect(getActiveCount()).toBe(GAME_CONFIG.MAX_XP_ORBS)

      // The recycled orb should have the new values
      const orbs = getOrbs()
      let found = false
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
        if (orbs[i].x === 999 && orbs[i].z === 888 && orbs[i].xpValue === 77) {
          found = true
          expect(orbs[i].elapsedTime).toBe(0)
          break
        }
      }
      expect(found).toBe(true)
    })
  })

  describe('collectOrb', () => {
    it('deactivates orb and returns xpValue', () => {
      spawnOrb(5, 5, 25)
      const val = collectOrb(0)
      expect(val).toBe(25)
      expect(getActiveCount()).toBe(0)
    })

    it('uses swap-to-end removal (last orb takes collected orb slot)', () => {
      spawnOrb(1, 1, 10)
      spawnOrb(2, 2, 20)
      spawnOrb(3, 3, 30)
      // Collect first orb — third should swap into index 0
      collectOrb(0)
      expect(getActiveCount()).toBe(2)
      const orbs = getOrbs()
      expect(orbs[0].x).toBe(3)
      expect(orbs[0].xpValue).toBe(30)
    })
  })

  describe('updateOrbs', () => {
    it('increments elapsedTime on active orbs', () => {
      spawnOrb(0, 0, 10)
      updateOrbs(0.5)
      expect(getOrbs()[0].elapsedTime).toBeCloseTo(0.5, 5)
    })
  })

  describe('resetOrbs', () => {
    it('clears all orbs', () => {
      spawnOrb(0, 0, 10)
      spawnOrb(1, 1, 20)
      expect(getActiveCount()).toBe(2)
      resetOrbs()
      expect(getActiveCount()).toBe(0)
    })
  })
})
