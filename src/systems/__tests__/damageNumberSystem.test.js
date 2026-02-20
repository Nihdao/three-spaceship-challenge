import { describe, it, expect } from 'vitest'
import { updateDamageNumbers, calcDriftOffset, getColorForDamage } from '../damageNumberSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('damageNumberSystem (Story 27.1)', () => {
  describe('updateDamageNumbers', () => {
    it('ages all numbers by delta', () => {
      const numbers = [
        { id: 1, damage: 50, worldX: 0, worldZ: 0, age: 0, color: '#fff', offsetX: 0 },
        { id: 2, damage: 100, worldX: 5, worldZ: 0, age: 0.2, color: '#fff', offsetX: 5 },
      ]
      const result = updateDamageNumbers(numbers, 0.1)
      expect(result[0].age).toBeCloseTo(0.1)
      expect(result[1].age).toBeCloseTo(0.3)
    })

    it('removes numbers whose age reaches LIFETIME', () => {
      const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
      const numbers = [
        { id: 1, damage: 50, age: lifetime - 0.01, color: '#fff', offsetX: 0 },
        { id: 2, damage: 100, age: lifetime - 0.1, color: '#fff', offsetX: 0 },
      ]
      const result = updateDamageNumbers(numbers, 0.05)
      // First number: age = lifetime - 0.01 + 0.05 = lifetime + 0.04 → removed
      // Second: age = lifetime - 0.1 + 0.05 = lifetime - 0.05 → kept
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })

    it('returns empty array when all numbers expire', () => {
      const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
      const numbers = [
        { id: 1, damage: 50, age: lifetime - 0.01, color: '#fff', offsetX: 0 },
      ]
      const result = updateDamageNumbers(numbers, 0.02)
      expect(result).toHaveLength(0)
    })

    it('returns all numbers when none expire', () => {
      const numbers = [
        { id: 1, damage: 50, age: 0, color: '#fff', offsetX: 0 },
        { id: 2, damage: 75, age: 0.1, color: '#fff', offsetX: 0 },
        { id: 3, damage: 100, age: 0.2, color: '#fff', offsetX: 0 },
      ]
      const result = updateDamageNumbers(numbers, 0.05)
      expect(result).toHaveLength(3)
    })

    it('does not mutate the original array', () => {
      const numbers = [{ id: 1, damage: 50, age: 0, color: '#fff', offsetX: 0 }]
      updateDamageNumbers(numbers, 0.1)
      expect(numbers[0].age).toBe(0) // original unchanged
    })

    it('returns new array with updated age in items', () => {
      const numbers = [{ id: 1, damage: 50, age: 0, color: '#fff', offsetX: 0 }]
      const result = updateDamageNumbers(numbers, 0.1)
      expect(result[0].age).toBeCloseTo(0.1)
    })

    it('handles empty input array', () => {
      const result = updateDamageNumbers([], 0.1)
      expect(result).toHaveLength(0)
    })
  })

  describe('calcDriftOffset', () => {
    it('returns a value within the drift range', () => {
      const driftRange = GAME_CONFIG.DAMAGE_NUMBERS.DRIFT_RANGE
      for (let i = 0; i < 100; i++) {
        const offset = calcDriftOffset()
        expect(Math.abs(offset)).toBeLessThanOrEqual(driftRange)
      }
    })

    it('returns both positive and negative values over many calls', () => {
      let hasPositive = false
      let hasNegative = false
      for (let i = 0; i < 200; i++) {
        const offset = calcDriftOffset()
        if (offset > 0) hasPositive = true
        if (offset < 0) hasNegative = true
      }
      expect(hasPositive).toBe(true)
      expect(hasNegative).toBe(true)
    })

    it('returns a number', () => {
      expect(typeof calcDriftOffset()).toBe('number')
    })
  })

  describe('getColorForDamage (Story 27.5)', () => {
    it('returns white for normal enemy damage', () => {
      expect(getColorForDamage(false, false)).toBe('#ffffff')
    })

    it('returns red for player damage', () => {
      expect(getColorForDamage(true, false)).toBe(GAME_CONFIG.DAMAGE_NUMBERS.PLAYER_COLOR)
    })

    it('returns gold for critical hit (enemy)', () => {
      expect(getColorForDamage(false, true)).toBe(GAME_CONFIG.CRIT_HIT_VISUALS.COLOR)
    })

    it('player damage takes priority over crit flag', () => {
      // isPlayerDamage wins — player takes priority
      expect(getColorForDamage(true, true)).toBe(GAME_CONFIG.DAMAGE_NUMBERS.PLAYER_COLOR)
    })

    it('defaults to normal (white) when called with no arguments', () => {
      expect(getColorForDamage()).toBe('#ffffff')
    })
  })
})
