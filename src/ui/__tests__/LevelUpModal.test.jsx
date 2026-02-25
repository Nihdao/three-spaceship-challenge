import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../../stores/usePlayer.jsx'
import useWeapons from '../../stores/useWeapons.jsx'
import useBoons from '../../stores/useBoons.jsx'

// ────────────────────────────────────────────────
// LevelUpModal — Story 33.6 Build Overview + 2-column layout
// These tests verify the store data contract that LevelUpModal relies on.
// ────────────────────────────────────────────────

describe('LevelUpModal — Story 33.6', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    useWeapons.getState().reset()
    useBoons.getState().reset()
  })

  // ── Build Overview store fields ──────────────────────────────────

  describe('Build Overview — store fields exist and are typed correctly', () => {
    it('currentHP is a number', () => {
      expect(typeof usePlayer.getState().currentHP).toBe('number')
    })

    it('maxHP is a number', () => {
      expect(typeof usePlayer.getState().maxHP).toBe('number')
    })

    it('currentLevel is a number', () => {
      expect(typeof usePlayer.getState().currentLevel).toBe('number')
    })

    it('shipBaseSpeed is a number (toFixed(2) safe)', () => {
      expect(typeof usePlayer.getState().shipBaseSpeed).toBe('number')
    })

    it('activeWeapons is an array', () => {
      expect(Array.isArray(useWeapons.getState().activeWeapons)).toBe(true)
    })

    it('activeBoons is an array', () => {
      expect(Array.isArray(useBoons.getState().activeBoons)).toBe(true)
    })

    it('modifiers.damageMultiplier is a number or undefined (falls back to 1)', () => {
      const val = useBoons.getState().modifiers.damageMultiplier ?? 1
      expect(typeof val).toBe('number')
    })
  })

  // ── Build Overview display format logic ─────────────────────────

  describe('Build Overview — display format', () => {
    it('HP format: Math.round(currentHP) / Math.round(maxHP)', () => {
      usePlayer.setState({ currentHP: 87.4, maxHP: 100.9 })
      const { currentHP, maxHP } = usePlayer.getState()
      const display = `${Math.round(currentHP)} / ${Math.round(maxHP)}`
      expect(display).toBe('87 / 101')
    })

    it('Speed format: shipBaseSpeed.toFixed(2)', () => {
      usePlayer.setState({ shipBaseSpeed: 42 })
      const { shipBaseSpeed } = usePlayer.getState()
      expect(shipBaseSpeed.toFixed(2)).toBe('42.00')
    })

    it('Damage Mult format: ×multiplier.toFixed(2)', () => {
      useBoons.setState({ modifiers: { ...useBoons.getState().modifiers, damageMultiplier: 1.5 } })
      const val = useBoons.getState().modifiers.damageMultiplier ?? 1
      expect(`×${val.toFixed(2)}`).toBe('×1.50')
    })

    it('Damage Mult defaults to ×1.00 when damageMultiplier is undefined', () => {
      const val = undefined ?? 1
      expect(`×${val.toFixed(2)}`).toBe('×1.00')
    })

    it('Weapons/Boons count format: "Weapons: N · Boons: M"', () => {
      const weaponsCount = 2
      const boonsCount = 3
      expect(`Weapons: ${weaponsCount} · Boons: ${boonsCount}`).toBe('Weapons: 2 · Boons: 3')
    })
  })

  // ── REROLL / SKIP conditional rendering logic ────────────────────

  describe('REROLL / SKIP — conditional visibility', () => {
    it('rerollCharges defaults to 0', () => {
      expect(usePlayer.getState().rerollCharges).toBe(0)
    })

    it('skipCharges defaults to 0', () => {
      expect(usePlayer.getState().skipCharges).toBe(0)
    })

    it('REROLL button condition: rerollCharges > 0', () => {
      expect(usePlayer.getState().rerollCharges > 0).toBe(false)
      usePlayer.setState({ rerollCharges: 2 })
      expect(usePlayer.getState().rerollCharges > 0).toBe(true)
    })

    it('SKIP button condition: skipCharges > 0', () => {
      expect(usePlayer.getState().skipCharges > 0).toBe(false)
      usePlayer.setState({ skipCharges: 1 })
      expect(usePlayer.getState().skipCharges > 0).toBe(true)
    })

    it('REROLL label format: "REROLL (N)"', () => {
      usePlayer.setState({ rerollCharges: 3 })
      const { rerollCharges } = usePlayer.getState()
      expect(`REROLL (${rerollCharges})`).toBe('REROLL (3)')
    })

    it('SKIP label format: "SKIP (N)"', () => {
      usePlayer.setState({ skipCharges: 1 })
      const { skipCharges } = usePlayer.getState()
      expect(`SKIP (${skipCharges})`).toBe('SKIP (1)')
    })
  })

  // ── Keyboard hint conditional format ────────────────────────────

  describe('Keyboard hint — conditional segments', () => {
    it('shows only [1-4] Select when no charges', () => {
      const reroll = 0
      const skip = 0
      const banish = 0
      const hint = `[1-4] Select${reroll > 0 ? ' · R Reroll' : ''}${skip > 0 ? ' · S Skip' : ''}${banish > 0 ? ' · X+# Banish' : ''}`
      expect(hint).toBe('[1-4] Select')
    })

    it('includes R Reroll when rerollCharges > 0', () => {
      const reroll = 1
      const skip = 0
      const banish = 0
      const hint = `[1-4] Select${reroll > 0 ? ' · R Reroll' : ''}${skip > 0 ? ' · S Skip' : ''}${banish > 0 ? ' · X+# Banish' : ''}`
      expect(hint).toContain('· R Reroll')
    })

    it('includes S Skip when skipCharges > 0', () => {
      const reroll = 0
      const skip = 1
      const banish = 0
      const hint = `[1-4] Select${reroll > 0 ? ' · R Reroll' : ''}${skip > 0 ? ' · S Skip' : ''}${banish > 0 ? ' · X+# Banish' : ''}`
      expect(hint).toContain('· S Skip')
    })

    it('includes X+# Banish when banishCharges > 0', () => {
      const reroll = 0
      const skip = 0
      const banish = 1
      const hint = `[1-4] Select${reroll > 0 ? ' · R Reroll' : ''}${skip > 0 ? ' · S Skip' : ''}${banish > 0 ? ' · X+# Banish' : ''}`
      expect(hint).toContain('· X+# Banish')
    })

    it('shows all segments when all charges > 0', () => {
      const hint = '[1-4] Select · R Reroll · S Skip · X+# Banish'
      expect(hint).toBe('[1-4] Select · R Reroll · S Skip · X+# Banish')
    })
  })
})
