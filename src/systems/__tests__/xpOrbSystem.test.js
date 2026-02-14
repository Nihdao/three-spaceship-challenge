import { describe, it, expect, beforeEach } from 'vitest'
import { spawnOrb, collectOrb, updateOrbs, getOrbs, getActiveCount, resetOrbs, updateMagnetization } from '../xpOrbSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('XP Magnetization Config (Story 11.1)', () => {
  it('XP_MAGNET_RADIUS exists and is larger than XP_ORB_PICKUP_RADIUS', () => {
    expect(GAME_CONFIG.XP_MAGNET_RADIUS).toBeGreaterThan(GAME_CONFIG.XP_ORB_PICKUP_RADIUS)
  })

  it('XP_MAGNET_SPEED is a positive number', () => {
    expect(GAME_CONFIG.XP_MAGNET_SPEED).toBeGreaterThan(0)
  })

  it('XP_MAGNET_ACCELERATION_CURVE is a positive number', () => {
    expect(GAME_CONFIG.XP_MAGNET_ACCELERATION_CURVE).toBeGreaterThan(0)
  })
})

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

  describe('magnetization fields (Story 11.1)', () => {
    it('spawned orbs have isMagnetized=false', () => {
      spawnOrb(10, 20, 15)
      const orb = getOrbs()[0]
      expect(orb.isMagnetized).toBe(false)
    })

    it('recycled orbs reset magnetization fields', () => {
      // Fill pool
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
        spawnOrb(i, i, 10)
      }
      // Manually magnetize the oldest orb
      updateOrbs(5.0)
      getOrbs()[0].elapsedTime = 0.1 // make index 0 not the oldest
      const oldestOrb = getOrbs()[1]
      oldestOrb.isMagnetized = true

      // Spawn new orb — should recycle oldest (index 1)
      spawnOrb(999, 888, 77)
      // Find the recycled orb
      const orbs = getOrbs()
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
        if (orbs[i].x === 999) {
          expect(orbs[i].isMagnetized).toBe(false)
          break
        }
      }
    })

    describe('updateMagnetization', () => {
      it('magnetizes orbs within MAGNET_RADIUS', () => {
        spawnOrb(5, 0, 10) // orb at (5, 0)
        updateMagnetization(0, 0, 1/60) // player at origin, within radius 8
        const orb = getOrbs()[0]
        expect(orb.isMagnetized).toBe(true)
      })

      it('does not magnetize orbs outside MAGNET_RADIUS', () => {
        spawnOrb(100, 100, 10) // orb far away
        updateMagnetization(0, 0, 1/60)
        const orb = getOrbs()[0]
        expect(orb.isMagnetized).toBe(false)
      })

      it('de-magnetizes orbs that leave MAGNET_RADIUS', () => {
        spawnOrb(5, 0, 10)
        updateMagnetization(0, 0, 1/60) // magnetize
        expect(getOrbs()[0].isMagnetized).toBe(true)
        // Move orb far away manually
        getOrbs()[0].x = 100
        updateMagnetization(0, 0, 1/60)
        expect(getOrbs()[0].isMagnetized).toBe(false)
      })

      it('moves magnetized orbs toward player', () => {
        spawnOrb(5, 0, 10) // orb at (5, 0)
        const orbBefore = getOrbs()[0].x
        updateMagnetization(0, 0, 1/60) // player at origin
        // After magnetization + movement, orb should have moved closer to player (x decreased)
        expect(getOrbs()[0].x).toBeLessThan(orbBefore)
      })

      it('orbs accelerate as they get closer (ease-in)', () => {
        // Spawn two orbs at different distances within magnet radius
        spawnOrb(7, 0, 10) // far orb
        spawnOrb(2, 0, 10) // close orb
        updateMagnetization(0, 0, 1/60)
        const farOrb = getOrbs()[0]
        const closeOrb = getOrbs()[1]
        // Close orb should have moved more (higher speed factor)
        const farDelta = 7 - farOrb.x
        const closeDelta = 2 - closeOrb.x
        expect(closeDelta).toBeGreaterThan(farDelta)
      })

      it('non-magnetized orbs remain stationary', () => {
        spawnOrb(100, 100, 10) // outside magnet radius
        const xBefore = getOrbs()[0].x
        const zBefore = getOrbs()[0].z
        updateMagnetization(0, 0, 1/60)
        expect(getOrbs()[0].x).toBe(xBefore)
        expect(getOrbs()[0].z).toBe(zBefore)
      })

      it('handles multiple orbs simultaneously', () => {
        spawnOrb(3, 0, 10)
        spawnOrb(0, 4, 10)
        spawnOrb(100, 100, 10) // outside radius
        updateMagnetization(0, 0, 1/60)
        expect(getOrbs()[0].isMagnetized).toBe(true)
        expect(getOrbs()[1].isMagnetized).toBe(true)
        expect(getOrbs()[2].isMagnetized).toBe(false)
      })
    })

    it('resetOrbs clears magnetization state on all orbs', () => {
      spawnOrb(5, 5, 10)
      const orb = getOrbs()[0]
      orb.isMagnetized = true
      resetOrbs()
      // After reset, spawn a new orb and verify the pool slot is clean
      spawnOrb(1, 1, 5)
      const freshOrb = getOrbs()[0]
      expect(freshOrb.isMagnetized).toBe(false)
    })

    it('resetOrbs clears all base fields (x, z, xpValue, elapsedTime)', () => {
      spawnOrb(42, 99, 777)
      updateOrbs(3.5)
      resetOrbs()
      const orb = getOrbs()[0]
      expect(orb.x).toBe(0)
      expect(orb.z).toBe(0)
      expect(orb.xpValue).toBe(0)
      expect(orb.elapsedTime).toBe(0)
    })

    it('orb at boundary of MAGNET_RADIUS is magnetized', () => {
      const radius = GAME_CONFIG.XP_MAGNET_RADIUS
      spawnOrb(radius, 0, 10) // exactly at magnet radius
      updateMagnetization(0, 0, 1/60)
      expect(getOrbs()[0].isMagnetized).toBe(true)
    })

    it('orb just beyond MAGNET_RADIUS is not magnetized', () => {
      const radius = GAME_CONFIG.XP_MAGNET_RADIUS
      spawnOrb(radius + 0.01, 0, 10)
      updateMagnetization(0, 0, 1/60)
      expect(getOrbs()[0].isMagnetized).toBe(false)
    })

    it('orb very close to player does not divide by zero', () => {
      spawnOrb(0.001, 0, 10) // very close to player
      // Should not throw
      updateMagnetization(0, 0, 1/60)
      expect(getOrbs()[0].isMagnetized).toBe(true)
    })

    it('orb exactly at player position is safe', () => {
      spawnOrb(0, 0, 10) // at player position
      updateMagnetization(0, 0, 1/60)
      // Should not throw, orb remains at player position
      expect(getOrbs()[0].isMagnetized).toBe(true)
    })

    it('magnetized orb reaches pickup radius after repeated updates', () => {
      const pickupRadius = GAME_CONFIG.XP_ORB_PICKUP_RADIUS
      // Spawn orb just inside magnet radius but outside pickup radius
      spawnOrb(pickupRadius + 2, 0, 10)
      // Run magnetization for several frames to pull orb toward player at origin
      for (let i = 0; i < 120; i++) {
        updateMagnetization(0, 0, 1/60)
      }
      const orb = getOrbs()[0]
      const dist = Math.sqrt(orb.x * orb.x + orb.z * orb.z)
      expect(dist).toBeLessThanOrEqual(pickupRadius)
    })

    it('performance: 50 orbs magnetized in reasonable time', () => {
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
        spawnOrb(i % 8, (i * 0.1) % 8, 10)
      }
      const start = performance.now()
      for (let frame = 0; frame < 60; frame++) {
        updateMagnetization(0, 0, 1/60)
      }
      const elapsed = performance.now() - start
      // 60 frames of 50 orbs should complete in under 50ms (generous threshold)
      expect(elapsed).toBeLessThan(50)
    })
  })

  describe('Rare XP Gem Support (Story 19.1)', () => {
    beforeEach(() => {
      resetOrbs()
    })

    it('spawnOrb with isRare=true stores isRare field correctly', () => {
      spawnOrb(10, 20, 36, true) // rare gem worth 36 XP
      const orb = getOrbs()[0]
      expect(orb.isRare).toBe(true)
      expect(orb.xpValue).toBe(36)
    })

    it('spawnOrb with isRare=false stores isRare=false', () => {
      spawnOrb(10, 20, 12, false) // standard orb
      const orb = getOrbs()[0]
      expect(orb.isRare).toBe(false)
      expect(orb.xpValue).toBe(12)
    })

    it('spawnOrb with no isRare parameter defaults to false (backward compatibility)', () => {
      spawnOrb(10, 20, 12) // existing code without isRare param
      const orb = getOrbs()[0]
      expect(orb.isRare).toBe(false)
    })

    it('collectOrb returns correct xpValue for rare orbs (pre-multiplied)', () => {
      spawnOrb(5, 5, 36, true) // rare gem worth 36 XP (12 * 3)
      const val = collectOrb(0)
      expect(val).toBe(36) // returns the pre-multiplied value
      expect(getActiveCount()).toBe(0)
    })

    it('magnetization works identically for rare and standard orbs', () => {
      spawnOrb(5, 0, 12, false) // standard orb
      spawnOrb(0, 5, 36, true)  // rare orb
      updateMagnetization(0, 0, 1/60) // player at origin
      const standardOrb = getOrbs()[0]
      const rareOrb = getOrbs()[1]
      // Both should be magnetized
      expect(standardOrb.isMagnetized).toBe(true)
      expect(rareOrb.isMagnetized).toBe(true)
    })

    it('resetOrbs clears isRare field on all orbs', () => {
      spawnOrb(5, 5, 36, true) // rare orb
      const orb = getOrbs()[0]
      expect(orb.isRare).toBe(true)
      resetOrbs()
      // After reset, spawn a new orb and verify the pool slot is clean
      spawnOrb(1, 1, 5) // standard orb, no isRare param
      const freshOrb = getOrbs()[0]
      expect(freshOrb.isRare).toBe(false)
    })

    it('recycled rare orbs reset isRare field to false', () => {
      // Fill pool with rare orbs
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
        spawnOrb(i, i, 30, true)
      }
      // Age all orbs
      updateOrbs(5.0)
      // Make index 0 not the oldest
      getOrbs()[0].elapsedTime = 0.1
      // Spawn a standard orb (no isRare) — should recycle oldest (index 1)
      spawnOrb(999, 888, 12) // standard orb, isRare should default to false
      // Find the recycled orb
      const orbs = getOrbs()
      for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
        if (orbs[i].x === 999) {
          expect(orbs[i].isRare).toBe(false)
          break
        }
      }
    })
  })
})
