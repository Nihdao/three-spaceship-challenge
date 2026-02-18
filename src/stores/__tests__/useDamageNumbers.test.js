import { describe, it, expect, beforeEach } from 'vitest'
import useDamageNumbers from '../useDamageNumbers.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useDamageNumbers store (Story 27.1)', () => {
  beforeEach(() => {
    useDamageNumbers.getState().reset()
  })

  describe('spawnDamageNumber', () => {
    it('adds a damage number to the state', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 50, worldX: 10, worldZ: 5, color: '#ffffff' })
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers).toHaveLength(1)
      expect(damageNumbers[0].damage).toBe(50)
      expect(damageNumbers[0].worldX).toBe(10)
      expect(damageNumbers[0].worldZ).toBe(5)
      expect(damageNumbers[0].color).toBe('#ffffff')
      expect(damageNumbers[0].age).toBe(0)
    })

    it('uses white color by default', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 30, worldX: 0, worldZ: 0 })
      expect(useDamageNumbers.getState().damageNumbers[0].color).toBe('#ffffff')
    })

    it('assigns a worldY value', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 100, worldX: 0, worldZ: 0 })
      const { worldY } = useDamageNumbers.getState().damageNumbers[0]
      expect(typeof worldY).toBe('number')
    })

    it('assigns a random horizontal offsetX within DRIFT_RANGE', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 100, worldX: 0, worldZ: 0 })
      const { offsetX } = useDamageNumbers.getState().damageNumbers[0]
      const driftRange = GAME_CONFIG.DAMAGE_NUMBERS.DRIFT_RANGE
      expect(Math.abs(offsetX)).toBeLessThanOrEqual(driftRange)
    })

    it('assigns a unique id to each number', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 10, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().spawnDamageNumber({ damage: 20, worldX: 1, worldZ: 0 })
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers[0].id).not.toBe(damageNumbers[1].id)
    })

    it('enforces MAX_COUNT limit by removing oldest', () => {
      const max = GAME_CONFIG.DAMAGE_NUMBERS.MAX_COUNT
      for (let i = 0; i < max + 5; i++) {
        useDamageNumbers.getState().spawnDamageNumber({ damage: i, worldX: i, worldZ: 0 })
      }
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers).toHaveLength(max)
      // Newest 50 should remain (oldest 5 removed)
      expect(damageNumbers[0].damage).toBe(5)
    })
  })

  describe('tick', () => {
    it('ages active damage numbers', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 50, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().tick(0.3)
      expect(useDamageNumbers.getState().damageNumbers[0].age).toBeCloseTo(0.3)
    })

    it('removes numbers when age reaches LIFETIME', () => {
      const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
      useDamageNumbers.getState().spawnDamageNumber({ damage: 50, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().tick(lifetime)
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(0)
    })

    it('removes numbers when age exceeds LIFETIME', () => {
      const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
      useDamageNumbers.getState().spawnDamageNumber({ damage: 50, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().tick(lifetime + 0.5)
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(0)
    })

    it('keeps numbers still within lifetime', () => {
      const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
      useDamageNumbers.getState().spawnDamageNumber({ damage: 50, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().tick(lifetime * 0.9)
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(1)
    })

    it('removes expired numbers while keeping active ones', () => {
      const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
      useDamageNumbers.getState().spawnDamageNumber({ damage: 50, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().tick(lifetime * 0.5)
      useDamageNumbers.getState().spawnDamageNumber({ damage: 100, worldX: 1, worldZ: 0 })
      useDamageNumbers.getState().tick(lifetime * 0.6) // first expires, second has 0.1 age
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers).toHaveLength(1)
      expect(damageNumbers[0].damage).toBe(100)
    })

    it('does nothing when no numbers exist', () => {
      expect(() => useDamageNumbers.getState().tick(0.1)).not.toThrow()
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(0)
    })
  })

  describe('spawnDamageNumbers (batch)', () => {
    it('adds all entries in a single call', () => {
      useDamageNumbers.getState().spawnDamageNumbers([
        { damage: 10, worldX: 0, worldZ: 0 },
        { damage: 20, worldX: 1, worldZ: 0 },
        { damage: 30, worldX: 2, worldZ: 0 },
      ])
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(3)
    })

    it('assigns unique ids to each entry', () => {
      useDamageNumbers.getState().spawnDamageNumbers([
        { damage: 10, worldX: 0, worldZ: 0 },
        { damage: 20, worldX: 1, worldZ: 0 },
      ])
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers[0].id).not.toBe(damageNumbers[1].id)
    })

    it('applies default white color when not provided', () => {
      useDamageNumbers.getState().spawnDamageNumbers([{ damage: 50, worldX: 0, worldZ: 0 }])
      expect(useDamageNumbers.getState().damageNumbers[0].color).toBe('#ffffff')
    })

    it('respects per-entry color override', () => {
      useDamageNumbers.getState().spawnDamageNumbers([
        { damage: 50, worldX: 0, worldZ: 0, color: '#ffd700' },
      ])
      expect(useDamageNumbers.getState().damageNumbers[0].color).toBe('#ffd700')
    })

    it('enforces MAX_COUNT across the batch', () => {
      const max = GAME_CONFIG.DAMAGE_NUMBERS.MAX_COUNT
      const entries = Array.from({ length: max + 3 }, (_, i) => ({
        damage: i,
        worldX: i,
        worldZ: 0,
      }))
      useDamageNumbers.getState().spawnDamageNumbers(entries)
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(max)
      // Newest max entries should remain (oldest 3 trimmed)
      expect(useDamageNumbers.getState().damageNumbers[0].damage).toBe(3)
    })

    it('does nothing when entries array is empty', () => {
      useDamageNumbers.getState().spawnDamageNumbers([])
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(0)
    })
  })

  describe('reset', () => {
    it('clears all damage numbers', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 100, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().spawnDamageNumber({ damage: 200, worldX: 1, worldZ: 0 })
      useDamageNumbers.getState().reset()
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(0)
    })

    it('allows spawning again after reset', () => {
      useDamageNumbers.getState().spawnDamageNumber({ damage: 100, worldX: 0, worldZ: 0 })
      useDamageNumbers.getState().reset()
      useDamageNumbers.getState().spawnDamageNumber({ damage: 200, worldX: 5, worldZ: 0 })
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(1)
      expect(useDamageNumbers.getState().damageNumbers[0].damage).toBe(200)
    })
  })
})
