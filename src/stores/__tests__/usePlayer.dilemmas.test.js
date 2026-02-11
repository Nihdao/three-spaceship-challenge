import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — Dilemmas (Story 7.2)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('initial state', () => {
    it('starts with empty acceptedDilemmas', () => {
      expect(usePlayer.getState().acceptedDilemmas).toEqual([])
    })

    it('starts with default dilemmaStats', () => {
      const { dilemmaStats } = usePlayer.getState()
      expect(dilemmaStats.damageMult).toBe(1.0)
      expect(dilemmaStats.speedMult).toBe(1.0)
      expect(dilemmaStats.hpMaxMult).toBe(1.0)
      expect(dilemmaStats.cooldownMult).toBe(1.0)
    })
  })

  describe('acceptDilemma', () => {
    it('accepts HIGH_RISK — +30% DMG / -20% Max HP', () => {
      const result = usePlayer.getState().acceptDilemma('HIGH_RISK')
      const state = usePlayer.getState()
      expect(result).toBe(true)
      expect(state.acceptedDilemmas).toContain('HIGH_RISK')
      expect(state.dilemmaStats.damageMult).toBeCloseTo(1.3)
      expect(state.maxHP).toBe(Math.floor(GAME_CONFIG.PLAYER_BASE_HP * 0.8))
      expect(state.currentHP).toBeLessThanOrEqual(state.maxHP)
    })

    it('clamps currentHP to new maxHP on HP reduction', () => {
      // Player at full HP (100), accept HIGH_RISK (-20% max HP → 80)
      const result = usePlayer.getState().acceptDilemma('HIGH_RISK')
      expect(result).toBe(true)
      const state = usePlayer.getState()
      expect(state.maxHP).toBe(80)
      expect(state.currentHP).toBe(80) // Clamped from 100 to 80
    })

    it('rejects duplicate dilemma acceptance', () => {
      usePlayer.getState().acceptDilemma('HIGH_RISK')
      const result = usePlayer.getState().acceptDilemma('HIGH_RISK')
      expect(result).toBe(false)
      expect(usePlayer.getState().acceptedDilemmas.filter(d => d === 'HIGH_RISK').length).toBe(1)
    })

    it('rejects invalid dilemma ID', () => {
      const result = usePlayer.getState().acceptDilemma('NONEXISTENT')
      expect(result).toBe(false)
    })

    it('accepts SLOW_TANK — +50% Max HP / -20% Speed', () => {
      usePlayer.getState().acceptDilemma('SLOW_TANK')
      const state = usePlayer.getState()
      expect(state.maxHP).toBe(Math.floor(GAME_CONFIG.PLAYER_BASE_HP * 1.5))
      // HP bonus heals proportionally — player gains the extra HP
      expect(state.currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP + (state.maxHP - GAME_CONFIG.PLAYER_BASE_HP))
      expect(state.dilemmaStats.speedMult).toBeCloseTo(0.8)
      expect(state.dilemmaStats.hpMaxMult).toBeCloseTo(1.5)
    })

    it('HP_MAX_MULT bonus heals player, malus clamps currentHP', () => {
      // SLOW_TANK bonus: HP_MAX_MULT 1.5 → maxHP 150, currentHP 150 (healed)
      usePlayer.getState().acceptDilemma('SLOW_TANK')
      expect(usePlayer.getState().currentHP).toBe(150)
      expect(usePlayer.getState().maxHP).toBe(150)

      // HIGH_RISK malus: HP_MAX_MULT 0.8 → maxHP 120, currentHP clamped to 120
      usePlayer.getState().acceptDilemma('HIGH_RISK')
      expect(usePlayer.getState().maxHP).toBe(Math.floor(150 * 0.8))
      expect(usePlayer.getState().currentHP).toBe(Math.floor(150 * 0.8))
    })

    it('stacks multiple dilemma effects multiplicatively', () => {
      usePlayer.getState().acceptDilemma('HIGH_RISK') // damageMult: 1.3
      usePlayer.getState().acceptDilemma('BERSERKER')  // damageMult: 1.4
      const state = usePlayer.getState()
      expect(state.dilemmaStats.damageMult).toBeCloseTo(1.3 * 1.4)
    })

    it('accepts TRIGGER_HAPPY — -30% Cooldown / -15% DMG', () => {
      usePlayer.getState().acceptDilemma('TRIGGER_HAPPY')
      const state = usePlayer.getState()
      expect(state.dilemmaStats.cooldownMult).toBeCloseTo(0.7)
      expect(state.dilemmaStats.damageMult).toBeCloseTo(0.85)
    })
  })

  describe('reset', () => {
    it('clears acceptedDilemmas and dilemmaStats', () => {
      usePlayer.getState().acceptDilemma('HIGH_RISK')
      usePlayer.getState().reset()
      const state = usePlayer.getState()
      expect(state.acceptedDilemmas).toEqual([])
      expect(state.dilemmaStats.damageMult).toBe(1.0)
      expect(state.dilemmaStats.hpMaxMult).toBe(1.0)
      expect(state.maxHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    })
  })

  describe('resetForNewSystem', () => {
    it('preserves acceptedDilemmas and dilemmaStats', () => {
      usePlayer.getState().acceptDilemma('HIGH_RISK')
      usePlayer.getState().resetForNewSystem()
      const state = usePlayer.getState()
      expect(state.acceptedDilemmas).toContain('HIGH_RISK')
      expect(state.dilemmaStats.damageMult).toBeCloseTo(1.3)
    })
  })
})
