import { describe, it, expect } from 'vitest'

/**
 * Tests for StatLine component bonus display logic (Story 20.7 Task 5).
 * Since this project doesn't use @testing-library/react, we test the logic
 * that StatLine.jsx will implement for showing bonus badges.
 */

/**
 * Determines if a bonus badge should be shown based on bonusValue.
 * Used by StatLine.jsx to conditionally render the green bonus indicator.
 */
function shouldShowBonus(bonusValue) {
  return bonusValue !== undefined && bonusValue > 0
}

/**
 * Formats the bonus value for display in the badge.
 * Example: 20 → "+20", 0.5 → "+0.5"
 */
function formatBonusValue(bonusValue) {
  if (typeof bonusValue === 'number') {
    // Handle decimals vs integers
    const formatted = bonusValue % 1 === 0 ? bonusValue : bonusValue.toFixed(1)
    return `+${formatted}`
  }
  return `+${bonusValue}`
}

describe('StatLine — Bonus Display Logic (Story 20.7 Task 5)', () => {
  describe('shouldShowBonus', () => {
    it('should return true when bonusValue > 0', () => {
      expect(shouldShowBonus(20)).toBe(true)
      expect(shouldShowBonus(0.5)).toBe(true)
      expect(shouldShowBonus(1)).toBe(true)
    })

    it('should return false when bonusValue === 0', () => {
      expect(shouldShowBonus(0)).toBe(false)
    })

    it('should return false when bonusValue is undefined', () => {
      expect(shouldShowBonus(undefined)).toBe(false)
    })

    it('should return false when bonusValue is null', () => {
      expect(shouldShowBonus(null)).toBe(false)
    })

    it('should return false for negative bonusValue (edge case)', () => {
      expect(shouldShowBonus(-5)).toBe(false)
    })
  })

  describe('formatBonusValue', () => {
    it('should format integer bonuses with "+" prefix', () => {
      expect(formatBonusValue(20)).toBe('+20')
      expect(formatBonusValue(5)).toBe('+5')
      expect(formatBonusValue(100)).toBe('+100')
    })

    it('should format decimal bonuses with "+" prefix and 1 decimal place', () => {
      expect(formatBonusValue(0.5)).toBe('+0.5')
      expect(formatBonusValue(1.2)).toBe('+1.2')
      expect(formatBonusValue(3.7)).toBe('+3.7')
    })

    it('should handle integer decimals correctly (e.g., 2.0 → +2)', () => {
      expect(formatBonusValue(2.0)).toBe('+2')
      expect(formatBonusValue(10.0)).toBe('+10')
    })

    it('should handle very small decimals', () => {
      expect(formatBonusValue(0.1)).toBe('+0.1')
      expect(formatBonusValue(0.01)).toBe('+0.0') // Rounds to 1 decimal
    })
  })

  describe('Backward compatibility logic', () => {
    it('should NOT show bonus when bonusValue is not provided (undefined)', () => {
      const bonusValue = undefined
      expect(shouldShowBonus(bonusValue)).toBe(false)
    })

    it('should work with existing usage pattern (no baseValue, no bonusValue)', () => {
      // Existing StatLine usage: <StatLine label="HP" value={100} />
      const bonusValue = undefined
      expect(shouldShowBonus(bonusValue)).toBe(false)
    })
  })

  describe('Bonus display patterns', () => {
    it('should show bonus for flat values (HP, Armor, Revival)', () => {
      expect(shouldShowBonus(20)).toBe(true) // +20 HP
      expect(formatBonusValue(20)).toBe('+20')
    })

    it('should show bonus for decimal values (Regen)', () => {
      expect(shouldShowBonus(0.8)).toBe(true)
      expect(formatBonusValue(0.8)).toBe('+0.8')
    })

    it('should show bonus for percentage bonuses (displayed as value, not percentage string)', () => {
      // UI will show "+15%" but StatLine receives bonusValue as 15
      expect(shouldShowBonus(15)).toBe(true)
      expect(formatBonusValue(15)).toBe('+15')
    })

    it('should show bonus for multiplier bonuses (attackPower, zone)', () => {
      // attackPower bonus: 0.15 (15% increase)
      expect(shouldShowBonus(0.15)).toBe(true)
      expect(formatBonusValue(0.15)).toBe('+0.1') // Rounded to 1 decimal (0.15 → 0.1)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero bonus correctly (no badge)', () => {
      expect(shouldShowBonus(0)).toBe(false)
    })

    it('should handle very large bonuses', () => {
      expect(shouldShowBonus(999)).toBe(true)
      expect(formatBonusValue(999)).toBe('+999')
    })

    it('should handle very small non-zero bonuses', () => {
      expect(shouldShowBonus(0.01)).toBe(true)
      expect(formatBonusValue(0.01)).toBe('+0.0')
    })
  })
})
