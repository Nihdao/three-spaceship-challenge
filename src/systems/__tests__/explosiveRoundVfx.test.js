import { describe, it, expect, beforeEach } from 'vitest'
import { addExplosionRing, tickRings, getRings, resetRings } from '../explosiveRoundVfx.js'

describe('explosiveRoundVfx', () => {
  beforeEach(() => {
    resetRings()
  })

  describe('addExplosionRing', () => {
    it('adds a ring with correct properties', () => {
      addExplosionRing(10, 20, 15, 0.5)
      const rings = getRings()
      expect(rings).toHaveLength(1)
      expect(rings[0]).toEqual({
        x: 10,
        z: 20,
        timer: 0.5,
        maxDuration: 0.5,
        maxRadius: 15,
      })
    })

    it('uses default duration of 0.5 when not specified', () => {
      addExplosionRing(0, 0, 10)
      expect(getRings()[0].timer).toBe(0.5)
      expect(getRings()[0].maxDuration).toBe(0.5)
    })

    it('respects POOL_SIZE limit of 10', () => {
      for (let i = 0; i < 12; i++) {
        addExplosionRing(i, i, 10)
      }
      expect(getRings()).toHaveLength(10)
    })
  })

  describe('tickRings', () => {
    it('decrements timer by delta', () => {
      addExplosionRing(0, 0, 10, 1.0)
      tickRings(0.3)
      expect(getRings()[0].timer).toBeCloseTo(0.7)
    })

    it('removes rings when timer reaches 0', () => {
      addExplosionRing(0, 0, 10, 0.5)
      tickRings(0.5)
      expect(getRings()).toHaveLength(0)
    })

    it('removes rings when timer goes below 0', () => {
      addExplosionRing(0, 0, 10, 0.3)
      tickRings(0.5)
      expect(getRings()).toHaveLength(0)
    })

    it('only removes expired rings, keeps active ones', () => {
      addExplosionRing(1, 1, 10, 0.2)
      addExplosionRing(2, 2, 10, 1.0)
      tickRings(0.3)
      const rings = getRings()
      expect(rings).toHaveLength(1)
      expect(rings[0].x).toBe(2)
    })
  })

  describe('resetRings', () => {
    it('clears all rings', () => {
      addExplosionRing(0, 0, 10)
      addExplosionRing(1, 1, 10)
      resetRings()
      expect(getRings()).toHaveLength(0)
    })

    it('allows adding rings again after reset', () => {
      for (let i = 0; i < 10; i++) addExplosionRing(i, i, 10)
      resetRings()
      addExplosionRing(99, 99, 10)
      expect(getRings()).toHaveLength(1)
    })
  })
})
