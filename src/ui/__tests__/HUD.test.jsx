import { describe, it, expect } from 'vitest'
import { formatTimer, shouldPulseHP, isLowTime } from '../HUD.jsx'

describe('HUD logic', () => {
  describe('formatTimer', () => {
    it('formats 600 seconds as 10:00', () => {
      expect(formatTimer(600)).toBe('10:00')
    })

    it('formats 0 as 00:00', () => {
      expect(formatTimer(0)).toBe('00:00')
    })

    it('formats 62 seconds as 01:02', () => {
      expect(formatTimer(62)).toBe('01:02')
    })

    it('formats 59 seconds as 00:59', () => {
      expect(formatTimer(59)).toBe('00:59')
    })

    it('clamps negative values to 00:00', () => {
      expect(formatTimer(-5)).toBe('00:00')
    })

    it('formats fractional seconds (floors)', () => {
      expect(formatTimer(61.9)).toBe('01:01')
    })
  })

  describe('shouldPulseHP', () => {
    it('returns true when HP ratio is below 0.25', () => {
      expect(shouldPulseHP(20, 100)).toBe(true)
    })

    it('returns false when HP ratio equals exactly 0.25 (strict < comparison)', () => {
      expect(shouldPulseHP(25, 100)).toBe(false)
    })

    it('returns false when HP ratio is above 0.25', () => {
      expect(shouldPulseHP(50, 100)).toBe(false)
    })

    it('returns true when HP is 0', () => {
      expect(shouldPulseHP(0, 100)).toBe(true)
    })

    it('returns true when maxHP is 0 (guard against division by zero)', () => {
      expect(shouldPulseHP(0, 0)).toBe(true)
    })
  })

  describe('isLowTime (Story 10.2)', () => {
    it('returns true when remaining is below 60 seconds and above 0', () => {
      expect(isLowTime(59)).toBe(true)
      expect(isLowTime(30)).toBe(true)
      expect(isLowTime(1)).toBe(true)
    })

    it('returns false when remaining is exactly 60', () => {
      expect(isLowTime(60)).toBe(false)
    })

    it('returns false when remaining is above 60', () => {
      expect(isLowTime(300)).toBe(false)
      expect(isLowTime(61)).toBe(false)
    })

    it('returns false when remaining is 0 (game over)', () => {
      expect(isLowTime(0)).toBe(false)
    })

    it('returns false when remaining is negative', () => {
      expect(isLowTime(-5)).toBe(false)
    })
  })

  // Note: shouldPulseXP tests removed in Story 10.1
  // Old XP bar replaced by XPBarFullWidth with shouldPulseXPBar() (tested in XPBarFullWidth.test.jsx)
})
