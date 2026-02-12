import { describe, it, expect } from 'vitest'
import { formatTimer, shouldPulseHP, isLowTime, detectChangedSlots, detectChangedBoons, getBoonLabel } from '../HUD.jsx'

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

  describe('detectChangedSlots (Story 10.4)', () => {
    const laser1 = { weaponId: 'LASER_FRONT', level: 1 }
    const laser2 = { weaponId: 'LASER_FRONT', level: 2 }
    const spread1 = { weaponId: 'SPREAD_SHOT', level: 1 }
    const missile1 = { weaponId: 'MISSILE_HOMING', level: 1 }

    it('returns empty array when no changes', () => {
      expect(detectChangedSlots([laser1], [laser1])).toEqual([])
    })

    it('detects new weapon added to empty slot', () => {
      expect(detectChangedSlots([laser1], [laser1, spread1])).toEqual([1])
    })

    it('detects weapon upgrade (level change)', () => {
      expect(detectChangedSlots([laser1], [laser2])).toEqual([0])
    })

    it('detects weapon swap (different weaponId in same slot)', () => {
      expect(detectChangedSlots([laser1], [spread1])).toEqual([0])
    })

    it('detects multiple simultaneous changes', () => {
      expect(detectChangedSlots(
        [laser1, spread1],
        [laser2, spread1, missile1]
      )).toEqual([0, 2])
    })

    it('handles empty prev array (all weapons are new)', () => {
      expect(detectChangedSlots([], [laser1, spread1])).toEqual([0, 1])
    })

    it('ignores removed weapon (current slot is empty)', () => {
      expect(detectChangedSlots([laser1, spread1], [laser1])).toEqual([])
    })

    it('handles both arrays empty', () => {
      expect(detectChangedSlots([], [])).toEqual([])
    })

    it('handles undefined entries in prev (sparse array)', () => {
      expect(detectChangedSlots(
        [laser1, undefined, undefined, undefined],
        [laser1, spread1, undefined, undefined]
      )).toEqual([1])
    })
  })

  describe('detectChangedBoons (Story 10.5)', () => {
    const dmg1 = { boonId: 'DAMAGE_AMP', level: 1 }
    const dmg2 = { boonId: 'DAMAGE_AMP', level: 2 }
    const spd1 = { boonId: 'SPEED_BOOST', level: 1 }
    const crit1 = { boonId: 'CRIT_CHANCE', level: 1 }

    it('returns empty array when no changes', () => {
      expect(detectChangedBoons([dmg1], [dmg1])).toEqual([])
    })

    it('detects new boon added', () => {
      expect(detectChangedBoons([dmg1], [dmg1, spd1])).toEqual([1])
    })

    it('detects boon upgrade (level change)', () => {
      expect(detectChangedBoons([dmg1], [dmg2])).toEqual([0])
    })

    it('detects multiple changes', () => {
      expect(detectChangedBoons([dmg1], [dmg2, spd1])).toEqual([0, 1])
    })

    it('handles empty prev array (all boons are new)', () => {
      expect(detectChangedBoons([], [dmg1, spd1])).toEqual([0, 1])
    })

    it('handles both arrays empty', () => {
      expect(detectChangedBoons([], [])).toEqual([])
    })

    it('handles 3 slots with one change', () => {
      expect(detectChangedBoons(
        [dmg1, spd1],
        [dmg1, spd1, crit1]
      )).toEqual([2])
    })
  })

  describe('getBoonLabel (Story 10.5)', () => {
    it('returns label for DAMAGE_AMP', () => {
      expect(getBoonLabel('DAMAGE_AMP')).toBe('Dmg')
    })

    it('returns label for SPEED_BOOST', () => {
      expect(getBoonLabel('SPEED_BOOST')).toBe('Speed')
    })

    it('returns label for COOLDOWN_REDUCTION', () => {
      expect(getBoonLabel('COOLDOWN_REDUCTION')).toBe('Rapid')
    })

    it('returns label for CRIT_CHANCE', () => {
      expect(getBoonLabel('CRIT_CHANCE')).toBe('Crit')
    })

    it('returns fallback for unknown boon', () => {
      expect(getBoonLabel('UNKNOWN_BOON')).toBe('?')
    })
  })
})
