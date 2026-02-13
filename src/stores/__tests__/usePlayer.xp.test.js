import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — XP & level system', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('initial state', () => {
    it('starts at level 1 with 0 XP', () => {
      const state = usePlayer.getState()
      expect(state.currentXP).toBe(0)
      expect(state.currentLevel).toBe(1)
    })

    it('has xpToNextLevel matching first entry of XP_LEVEL_CURVE', () => {
      expect(usePlayer.getState().xpToNextLevel).toBe(GAME_CONFIG.XP_LEVEL_CURVE[0])
    })

    it('pendingLevelUp is false initially', () => {
      expect(usePlayer.getState().pendingLevelUp).toBe(false)
    })
  })

  describe('addXP', () => {
    it('accumulates XP', () => {
      usePlayer.getState().addXP(25)
      expect(usePlayer.getState().currentXP).toBe(25)

      usePlayer.getState().addXP(30)
      expect(usePlayer.getState().currentXP).toBe(55)
    })

    it('triggers level-up when XP reaches threshold', () => {
      const threshold = GAME_CONFIG.XP_LEVEL_CURVE[0] // 100
      usePlayer.getState().addXP(threshold)
      const state = usePlayer.getState()
      expect(state.currentLevel).toBe(2)
      expect(state.currentXP).toBe(0) // exact threshold, no overflow
      expect(state.pendingLevelUp).toBe(true)
      expect(state.xpToNextLevel).toBe(GAME_CONFIG.XP_LEVEL_CURVE[1])
    })

    it('carries over overflow XP on level-up', () => {
      const threshold = GAME_CONFIG.XP_LEVEL_CURVE[0] // 100
      usePlayer.getState().addXP(threshold + 20) // 120 → level 2, 20 overflow
      const state = usePlayer.getState()
      expect(state.currentLevel).toBe(2)
      expect(state.currentXP).toBe(20)
    })

    it('handles multi-level skip from single large XP gain', () => {
      // Total to reach level 3 = curve[0] + curve[1]
      const totalToLevel3 = GAME_CONFIG.XP_LEVEL_CURVE[0] + GAME_CONFIG.XP_LEVEL_CURVE[1]
      usePlayer.getState().addXP(totalToLevel3 + 10) // should reach level 3 with 10 overflow
      const state = usePlayer.getState()
      expect(state.currentLevel).toBe(3)
      expect(state.currentXP).toBe(10)
      expect(state.xpToNextLevel).toBe(GAME_CONFIG.XP_LEVEL_CURVE[2])
      expect(state.pendingLevelUp).toBe(true)
    })

    it('does not level past the max level (curve length + 1)', () => {
      const curve = GAME_CONFIG.XP_LEVEL_CURVE
      const totalXP = curve.reduce((sum, val) => sum + val, 0)
      usePlayer.getState().addXP(totalXP + 9999) // way past max
      const state = usePlayer.getState()
      expect(state.currentLevel).toBe(curve.length + 1) // max level
    })
  })

  describe('consumeLevelUp', () => {
    it('returns true once after level-up and clears the flag', () => {
      usePlayer.getState().addXP(GAME_CONFIG.XP_LEVEL_CURVE[0])
      expect(usePlayer.getState().pendingLevelUp).toBe(true)

      const result = usePlayer.getState().consumeLevelUp()
      expect(result).toBe(true)
      expect(usePlayer.getState().pendingLevelUp).toBe(false)
    })

    it('returns false when no level-up is pending', () => {
      const result = usePlayer.getState().consumeLevelUp()
      expect(result).toBe(false)
    })
  })

  describe('reset', () => {
    it('clears XP and level state', () => {
      usePlayer.getState().addXP(200) // should level up
      usePlayer.getState().reset()

      const state = usePlayer.getState()
      expect(state.currentXP).toBe(0)
      expect(state.currentLevel).toBe(1)
      expect(state.xpToNextLevel).toBe(GAME_CONFIG.XP_LEVEL_CURVE[0])
      expect(state.pendingLevelUp).toBe(false)
    })
  })
})
