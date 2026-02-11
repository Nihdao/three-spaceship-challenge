import { describe, it, expect } from 'vitest'
import { VICTORY_MESSAGES, resolveWeaponNames, resolveBoonNames } from '../VictoryScreen.jsx'
import { formatTimer } from '../HUD.jsx'

describe('VictoryScreen logic', () => {
  describe('VICTORY_MESSAGES', () => {
    it('contains at least 6 messages', () => {
      expect(VICTORY_MESSAGES.length).toBeGreaterThanOrEqual(6)
    })

    it('all messages are uppercase strings', () => {
      for (const msg of VICTORY_MESSAGES) {
        expect(typeof msg).toBe('string')
        expect(msg).toBe(msg.toUpperCase())
      }
    })

    it('random selection stays within bounds', () => {
      for (let i = 0; i < 100; i++) {
        const idx = Math.floor(Math.random() * VICTORY_MESSAGES.length)
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(VICTORY_MESSAGES.length)
        expect(VICTORY_MESSAGES[idx]).toBeDefined()
      }
    })
  })

  describe('formatTimer reuse for victory stats', () => {
    it('formats systemTimer value correctly', () => {
      expect(formatTimer(125)).toBe('02:05')
    })

    it('formats 0 seconds as 00:00', () => {
      expect(formatTimer(0)).toBe('00:00')
    })

    it('formats full 10 minutes (600s) as 10:00', () => {
      expect(formatTimer(600)).toBe('10:00')
    })
  })

  describe('resolveBoonNames', () => {
    it('resolves boon IDs to display names with levels', () => {
      const result = resolveBoonNames([
        { boonId: 'DAMAGE_AMP', level: 2 },
        { boonId: 'SPEED_BOOST', level: 1 },
      ])
      expect(result).toBe('Damage Amp Lv2, Speed Boost Lv1')
    })

    it('falls back to boonId for unknown boons', () => {
      expect(resolveBoonNames([{ boonId: 'UNKNOWN_BOON', level: 1 }])).toBe('UNKNOWN_BOON')
    })

    it('returns empty string for empty array', () => {
      expect(resolveBoonNames([])).toBe('')
    })
  })

  describe('resolveWeaponNames', () => {
    it('resolves weapon IDs to display names', () => {
      const result = resolveWeaponNames([
        { weaponId: 'LASER_FRONT' },
        { weaponId: 'SPREAD_SHOT' },
      ])
      expect(result).toBe('Front Laser, Spread Shot')
    })

    it('falls back to weaponId for unknown weapons', () => {
      expect(resolveWeaponNames([{ weaponId: 'UNKNOWN_GUN' }])).toBe('UNKNOWN_GUN')
    })

    it('returns empty string for empty array', () => {
      expect(resolveWeaponNames([])).toBe('')
    })
  })
})
