import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — HP Sacrifice (Story 7.4)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('sacrificeFragmentsForHP', () => {
    it('returns false if fragments < HP_SACRIFICE_FRAGMENT_COST', () => {
      usePlayer.setState({ fragments: GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST - 1, currentHP: 50 })
      const result = usePlayer.getState().sacrificeFragmentsForHP()
      expect(result).toBe(false)
      expect(usePlayer.getState().fragments).toBe(GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST - 1)
      expect(usePlayer.getState().currentHP).toBe(50)
    })

    it('returns false if currentHP >= maxHP (full HP)', () => {
      usePlayer.setState({ fragments: 200, currentHP: GAME_CONFIG.PLAYER_BASE_HP, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      const result = usePlayer.getState().sacrificeFragmentsForHP()
      expect(result).toBe(false)
      expect(usePlayer.getState().fragments).toBe(200)
    })

    it('deducts HP_SACRIFICE_FRAGMENT_COST from fragments on success', () => {
      const initialFragments = 150
      usePlayer.setState({ fragments: initialFragments, currentHP: 50, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().fragments).toBe(initialFragments - GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST)
    })

    it('adds HP_SACRIFICE_HP_RECOVERY to currentHP on success', () => {
      usePlayer.setState({ fragments: 100, currentHP: 50, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().currentHP).toBe(50 + GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY)
    })

    it('returns true on successful transaction', () => {
      usePlayer.setState({ fragments: 100, currentHP: 50, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      const result = usePlayer.getState().sacrificeFragmentsForHP()
      expect(result).toBe(true)
    })

    it('clamps currentHP to maxHP (no overhealing)', () => {
      const maxHP = GAME_CONFIG.PLAYER_BASE_HP
      // currentHP close enough to maxHP that recovery would overshoot
      const currentHP = maxHP - 10
      usePlayer.setState({ fragments: 100, currentHP, maxHP })
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().currentHP).toBe(maxHP)
    })

    it('works correctly with multiple sacrifices in one tunnel visit', () => {
      usePlayer.setState({ fragments: 200, currentHP: 30, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      const cost = GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST
      const recovery = GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY

      // First sacrifice
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().fragments).toBe(200 - cost)
      expect(usePlayer.getState().currentHP).toBe(30 + recovery)

      // Second sacrifice
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().fragments).toBe(200 - cost * 2)
      expect(usePlayer.getState().currentHP).toBe(30 + recovery * 2)
    })

    it('leaves player at 0 fragments when they have exactly the cost', () => {
      usePlayer.setState({ fragments: GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST, currentHP: 50, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().fragments).toBe(0)
    })

    it('returns false when HP is full even with sufficient fragments', () => {
      usePlayer.setState({ fragments: 200, currentHP: 80, maxHP: 80 })
      const result = usePlayer.getState().sacrificeFragmentsForHP()
      expect(result).toBe(false)
      expect(usePlayer.getState().fragments).toBe(200)
      expect(usePlayer.getState().currentHP).toBe(80)
    })

    it('respects dilemma-modified maxHP', () => {
      // Simulate reduced maxHP from a dilemma (e.g., -20% Max HP: 100 → 80)
      const reducedMaxHP = 80
      usePlayer.setState({ fragments: 100, currentHP: 70, maxHP: reducedMaxHP })
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().currentHP).toBe(reducedMaxHP) // clamped to 80, not 95
    })

    it('transaction is atomic (both fragment deduction and HP gain happen together)', () => {
      usePlayer.setState({ fragments: 100, currentHP: 50, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      usePlayer.getState().sacrificeFragmentsForHP()
      const state = usePlayer.getState()
      expect(state.fragments).toBe(100 - GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST)
      expect(state.currentHP).toBe(50 + GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY)
    })
  })

  describe('HP sacrifice persistence across system transitions', () => {
    it('HP recovered from sacrifice persists through resetForNewSystem', () => {
      usePlayer.setState({ fragments: 100, currentHP: 45, maxHP: GAME_CONFIG.PLAYER_BASE_HP })
      usePlayer.getState().sacrificeFragmentsForHP()
      const hpAfterSacrifice = usePlayer.getState().currentHP
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().currentHP).toBe(hpAfterSacrifice)
    })
  })

  describe('gameConfig constants exist', () => {
    it('HP_SACRIFICE_FRAGMENT_COST is defined and positive', () => {
      expect(GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST).toBeDefined()
      expect(GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST).toBeGreaterThan(0)
    })

    it('HP_SACRIFICE_HP_RECOVERY is defined and positive', () => {
      expect(GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY).toBeDefined()
      expect(GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY).toBeGreaterThan(0)
    })
  })
})
