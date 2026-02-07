import { describe, it, expect, beforeEach } from 'vitest'
import { createSpatialHash } from '../spatialHash.js'

describe('createSpatialHash', () => {
  let hash

  beforeEach(() => {
    hash = createSpatialHash(2)
  })

  it('should create a spatial hash with clear, insert, and queryNearby methods', () => {
    expect(hash.clear).toBeTypeOf('function')
    expect(hash.insert).toBeTypeOf('function')
    expect(hash.queryNearby).toBeTypeOf('function')
  })

  describe('insert and queryNearby', () => {
    it('should return an inserted entity within query range', () => {
      const entity = { id: 1, x: 1, z: 1, radius: 0.5 }
      hash.insert(entity)
      const results = hash.queryNearby(1, 1, 1)
      expect(results).toContain(entity)
    })

    it('should not return entities outside query range', () => {
      const near = { id: 1, x: 1, z: 1, radius: 0.5 }
      const far = { id: 2, x: 100, z: 100, radius: 0.5 }
      hash.insert(near)
      hash.insert(far)
      const results = hash.queryNearby(1, 1, 2)
      expect(results).toContain(near)
      expect(results).not.toContain(far)
    })

    it('should return unique entities even if they span multiple cells', () => {
      // Entity with radius larger than cell size spans multiple cells
      const bigEntity = { id: 1, x: 0, z: 0, radius: 3 }
      hash.insert(bigEntity)
      const results = hash.queryNearby(0, 0, 1)
      const ids = results.map(e => e.id)
      expect(ids.filter(id => id === 1)).toHaveLength(1)
    })

    it('should return multiple entities in the same area', () => {
      const e1 = { id: 1, x: 1, z: 1, radius: 0.5 }
      const e2 = { id: 2, x: 1.5, z: 1.5, radius: 0.5 }
      hash.insert(e1)
      hash.insert(e2)
      const results = hash.queryNearby(1, 1, 2)
      expect(results).toContain(e1)
      expect(results).toContain(e2)
    })
  })

  describe('clear', () => {
    it('should remove all entities after clear', () => {
      const entity = { id: 1, x: 1, z: 1, radius: 0.5 }
      hash.insert(entity)
      hash.clear()
      const results = hash.queryNearby(1, 1, 10)
      expect(results).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle negative coordinates', () => {
      const entity = { id: 1, x: -5, z: -5, radius: 0.5 }
      hash.insert(entity)
      const results = hash.queryNearby(-5, -5, 1)
      expect(results).toContain(entity)
    })

    it('should handle entities at origin', () => {
      const entity = { id: 1, x: 0, z: 0, radius: 0.5 }
      hash.insert(entity)
      const results = hash.queryNearby(0, 0, 1)
      expect(results).toContain(entity)
    })

    it('should handle large coordinate values', () => {
      const entity = { id: 1, x: 2000, z: -2000, radius: 0.5 }
      hash.insert(entity)
      const results = hash.queryNearby(2000, -2000, 1)
      expect(results).toContain(entity)
    })

    it('should handle queryNearby with no entities inserted', () => {
      const results = hash.queryNearby(0, 0, 10)
      expect(results).toHaveLength(0)
    })

    it('should handle different cell sizes', () => {
      const bigCellHash = createSpatialHash(10)
      const e1 = { id: 1, x: 3, z: 3, radius: 0.5 }
      const e2 = { id: 2, x: 7, z: 7, radius: 0.5 }
      bigCellHash.insert(e1)
      bigCellHash.insert(e2)
      // Both should be in the same cell with cell size 10
      const results = bigCellHash.queryNearby(5, 5, 5)
      expect(results).toContain(e1)
      expect(results).toContain(e2)
    })
  })
})
