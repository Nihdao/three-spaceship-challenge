import { describe, it, expect } from 'vitest'
import { SHIP_LEVEL_COSTS, SHIP_LEVEL_SCALING, MAX_SHIP_LEVEL } from '../shipProgressionDefs.js'

describe('shipProgressionDefs', () => {
  describe('SHIP_LEVEL_COSTS', () => {
    it('has exactly 8 entries (one per level-up transition: 1→2 through 8→9)', () => {
      expect(SHIP_LEVEL_COSTS).toHaveLength(8)
    })

    it('all costs are positive numbers', () => {
      for (const cost of SHIP_LEVEL_COSTS) {
        expect(typeof cost).toBe('number')
        expect(cost).toBeGreaterThan(0)
      }
    })

    it('costs are in ascending order', () => {
      for (let i = 1; i < SHIP_LEVEL_COSTS.length; i++) {
        expect(SHIP_LEVEL_COSTS[i]).toBeGreaterThan(SHIP_LEVEL_COSTS[i - 1])
      }
    })

    it('first cost (level 1 → 2) is 100', () => {
      expect(SHIP_LEVEL_COSTS[0]).toBe(100)
    })

    it('cost at index 7 (level 8 → 9) is 3000', () => {
      expect(SHIP_LEVEL_COSTS[7]).toBe(3000)
    })
  })

  describe('SHIP_LEVEL_SCALING', () => {
    it('is a valid percentage (0.0 to 1.0)', () => {
      expect(SHIP_LEVEL_SCALING).toBeGreaterThan(0)
      expect(SHIP_LEVEL_SCALING).toBeLessThan(1)
    })

    it('is 0.03 (3% per level)', () => {
      expect(SHIP_LEVEL_SCALING).toBe(0.03)
    })
  })

  describe('MAX_SHIP_LEVEL', () => {
    it('is 9', () => {
      expect(MAX_SHIP_LEVEL).toBe(9)
    })
  })
})
