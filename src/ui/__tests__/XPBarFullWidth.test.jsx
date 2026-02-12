import { describe, it, expect } from 'vitest'
import { calculateXPProgress, shouldPulseXPBar } from '../XPBarFullWidth.jsx'

describe('XPBarFullWidth logic', () => {
  describe('calculateXPProgress', () => {
    it('returns 50 when half XP collected', () => {
      expect(calculateXPProgress(250, 500)).toBe(50)
    })

    it('returns 0 when no XP collected', () => {
      expect(calculateXPProgress(0, 500)).toBe(0)
    })

    it('returns 100 when XP equals threshold', () => {
      expect(calculateXPProgress(500, 500)).toBe(100)
    })

    it('clamps to 100 when XP exceeds threshold', () => {
      expect(calculateXPProgress(600, 500)).toBe(100)
    })

    it('returns 0 when xpToNextLevel is 0 (guard division by zero)', () => {
      expect(calculateXPProgress(100, 0)).toBe(0)
    })

    it('returns 0 for negative XP', () => {
      expect(calculateXPProgress(-10, 500)).toBe(0)
    })
  })

  describe('shouldPulseXPBar', () => {
    it('returns true when progress exceeds 80', () => {
      expect(shouldPulseXPBar(85)).toBe(true)
    })

    it('returns false when progress is at exactly 80', () => {
      expect(shouldPulseXPBar(80)).toBe(false)
    })

    it('returns false when progress is below 80', () => {
      expect(shouldPulseXPBar(50)).toBe(false)
    })

    it('returns true at 100', () => {
      expect(shouldPulseXPBar(100)).toBe(true)
    })

    it('returns false at 0', () => {
      expect(shouldPulseXPBar(0)).toBe(false)
    })
  })
})
