import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — Fragments (Story 7.1)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    // Fragments are permanent cross-run currency; zero them via setState for test isolation
    usePlayer.setState({ fragments: 0, fragmentsEarnedThisRun: 0 })
  })

  describe('initial state', () => {
    it('starts with 0 fragments (no localStorage data)', () => {
      expect(usePlayer.getState().fragments).toBe(0)
    })
  })

  describe('addFragments', () => {
    it('adds fragments from 0', () => {
      usePlayer.getState().addFragments(100)
      expect(usePlayer.getState().fragments).toBe(100)
    })

    it('accumulates fragments across multiple calls', () => {
      usePlayer.getState().addFragments(100)
      usePlayer.getState().addFragments(50)
      expect(usePlayer.getState().fragments).toBe(150)
    })
  })

  describe('reset', () => {
    it('preserves fragments across run resets (permanent cross-run currency)', () => {
      usePlayer.getState().addFragments(200)
      usePlayer.getState().reset()
      expect(usePlayer.getState().fragments).toBe(200)
    })
  })

  describe('resetForNewSystem', () => {
    it('preserves fragments', () => {
      usePlayer.getState().addFragments(150)
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().fragments).toBe(150)
    })

    it('preserves XP and level across system transition (Story 18.1)', () => {
      usePlayer.getState().addXP(200)
      usePlayer.getState().addFragments(100)
      const preState = usePlayer.getState()
      const xpBefore = preState.currentXP
      const levelBefore = preState.currentLevel
      const xpToNextBefore = preState.xpToNextLevel
      usePlayer.getState().resetForNewSystem()
      const state = usePlayer.getState()
      expect(state.currentXP).toBe(xpBefore)
      expect(state.currentLevel).toBe(levelBefore)
      expect(state.xpToNextLevel).toBe(xpToNextBefore)
    })

    it('preserves currentHP and maxHP', () => {
      usePlayer.getState().takeDamage(20) // HP goes to 80
      const hpBefore = usePlayer.getState().currentHP
      const maxHpBefore = usePlayer.getState().maxHP
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().currentHP).toBe(hpBefore)
      expect(usePlayer.getState().maxHP).toBe(maxHpBefore)
    })

    it('resets movement state', () => {
      usePlayer.getState().resetForNewSystem()
      const state = usePlayer.getState()
      // Story 34.2: position is random spawn within [-1200, 1200]
      expect(Math.abs(state.position[0])).toBeLessThanOrEqual(1200)
      expect(Math.abs(state.position[2])).toBeLessThanOrEqual(1200)
      expect(state.velocity).toEqual([0, 0, 0])
      expect(state.rotation).toBe(0)
      expect(state.isDashing).toBe(false)
      expect(state.dashTimer).toBe(0)
      expect(state.dashCooldownTimer).toBe(0)
    })
  })
})
