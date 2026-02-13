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

    it('pendingLevelUps is 0 initially', () => {
      expect(usePlayer.getState().pendingLevelUps).toBe(0)
    })

    it('levelsGainedThisBatch is 0 initially', () => {
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(0)
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
      expect(state.pendingLevelUps).toBe(1)
      expect(state.levelsGainedThisBatch).toBe(1)
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
      expect(state.pendingLevelUps).toBe(2) // gained 2 levels (2 and 3)
      expect(state.levelsGainedThisBatch).toBe(2)
    })

    it('tracks multiple pending level-ups when gaining enough XP for multiple levels', () => {
      // Total to reach level 4 = curve[0] + curve[1] + curve[2]
      const totalToLevel4 = GAME_CONFIG.XP_LEVEL_CURVE[0] + GAME_CONFIG.XP_LEVEL_CURVE[1] + GAME_CONFIG.XP_LEVEL_CURVE[2]
      usePlayer.getState().addXP(totalToLevel4)
      const state = usePlayer.getState()
      expect(state.currentLevel).toBe(4)
      expect(state.pendingLevelUps).toBe(3) // levels 2, 3, 4
      expect(state.levelsGainedThisBatch).toBe(3)
    })

    it('levels past the hardcoded curve into infinite scaling', () => {
      const curve = GAME_CONFIG.XP_LEVEL_CURVE
      const totalXP = curve.reduce((sum, val) => sum + val, 0)
      usePlayer.getState().addXP(totalXP + 9999) // past level 15
      const state = usePlayer.getState()
      expect(state.currentLevel).toBeGreaterThan(curve.length + 1)
      expect(state.currentXP).toBeGreaterThanOrEqual(0)
      expect(state.currentXP).toBeLessThan(state.xpToNextLevel)
    })

    it('correctly transitions from level 14 to 15 to 16 using scaled XP', () => {
      // Reach level 14 first
      const curve = GAME_CONFIG.XP_LEVEL_CURVE
      const xpToLevel14 = curve.slice(0, 13).reduce((sum, val) => sum + val, 0)
      usePlayer.getState().addXP(xpToLevel14)
      expect(usePlayer.getState().currentLevel).toBe(14)

      // Level 14→15 requires curve[13] = 4400
      usePlayer.getState().addXP(4400)
      expect(usePlayer.getState().currentLevel).toBe(15)
      expect(usePlayer.getState().xpToNextLevel).toBe(4488) // 4400 * 1.02

      // Level 15→16 requires 4488
      usePlayer.getState().addXP(4488)
      expect(usePlayer.getState().currentLevel).toBe(16)
      expect(usePlayer.getState().xpToNextLevel).toBe(4577) // 4400 * 1.02^2
    })

    it('handles massive XP gain skipping many levels', () => {
      usePlayer.getState().addXP(500000)
      const state = usePlayer.getState()
      expect(state.currentLevel).toBeGreaterThan(15)
      expect(state.currentXP).toBeGreaterThanOrEqual(0)
      expect(state.currentXP).toBeLessThan(state.xpToNextLevel)
    })

    it('does not change pendingLevelUps when no level is gained', () => {
      usePlayer.getState().addXP(10) // not enough for level 2
      expect(usePlayer.getState().pendingLevelUps).toBe(0)
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(0)
    })

    it('accumulates pendingLevelUps across multiple addXP calls', () => {
      // First call: gain 1 level
      usePlayer.getState().addXP(GAME_CONFIG.XP_LEVEL_CURVE[0])
      expect(usePlayer.getState().pendingLevelUps).toBe(1)
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(1)

      // Second call: gain another level (without consuming the first)
      usePlayer.getState().addXP(GAME_CONFIG.XP_LEVEL_CURVE[1])
      expect(usePlayer.getState().pendingLevelUps).toBe(2)
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(2) // accumulates with existing pending
    })
  })

  describe('consumeLevelUp', () => {
    it('returns true and decrements pendingLevelUps after single level-up', () => {
      usePlayer.getState().addXP(GAME_CONFIG.XP_LEVEL_CURVE[0])
      expect(usePlayer.getState().pendingLevelUps).toBe(1)

      const result = usePlayer.getState().consumeLevelUp()
      expect(result).toBe(true)
      expect(usePlayer.getState().pendingLevelUps).toBe(0)
    })

    it('returns false when no level-up is pending', () => {
      const result = usePlayer.getState().consumeLevelUp()
      expect(result).toBe(false)
    })

    it('decrements pendingLevelUps count sequentially for multi-level gain', () => {
      // Gain 3 levels at once
      const totalToLevel4 = GAME_CONFIG.XP_LEVEL_CURVE[0] + GAME_CONFIG.XP_LEVEL_CURVE[1] + GAME_CONFIG.XP_LEVEL_CURVE[2]
      usePlayer.getState().addXP(totalToLevel4)
      expect(usePlayer.getState().pendingLevelUps).toBe(3)

      // Consume first
      usePlayer.getState().consumeLevelUp()
      expect(usePlayer.getState().pendingLevelUps).toBe(2)

      // Consume second
      usePlayer.getState().consumeLevelUp()
      expect(usePlayer.getState().pendingLevelUps).toBe(1)

      // Consume third
      usePlayer.getState().consumeLevelUp()
      expect(usePlayer.getState().pendingLevelUps).toBe(0)

      // Consume when empty — returns false
      const result = usePlayer.getState().consumeLevelUp()
      expect(result).toBe(false)
      expect(usePlayer.getState().pendingLevelUps).toBe(0)
    })

    it('preserves levelsGainedThisBatch throughout entire sequence including final modal', () => {
      // Gain 3 levels at once
      const totalToLevel4 = GAME_CONFIG.XP_LEVEL_CURVE[0] + GAME_CONFIG.XP_LEVEL_CURVE[1] + GAME_CONFIG.XP_LEVEL_CURVE[2]
      usePlayer.getState().addXP(totalToLevel4)
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(3)

      // After first consume, batch count preserved
      usePlayer.getState().consumeLevelUp()
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(3)
      expect(usePlayer.getState().pendingLevelUps).toBe(2)

      // After second consume, batch count preserved
      usePlayer.getState().consumeLevelUp()
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(3)
      expect(usePlayer.getState().pendingLevelUps).toBe(1)

      // After final consume, batch count STILL preserved (for last modal's progress indicator)
      usePlayer.getState().consumeLevelUp()
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(3)
      expect(usePlayer.getState().pendingLevelUps).toBe(0)
    })

    it('resets levelsGainedThisBatch when next addXP starts a fresh batch', () => {
      // Gain 3 levels, consume all
      const totalToLevel4 = GAME_CONFIG.XP_LEVEL_CURVE[0] + GAME_CONFIG.XP_LEVEL_CURVE[1] + GAME_CONFIG.XP_LEVEL_CURVE[2]
      usePlayer.getState().addXP(totalToLevel4)
      usePlayer.getState().consumeLevelUp()
      usePlayer.getState().consumeLevelUp()
      usePlayer.getState().consumeLevelUp()
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(3) // stale but harmless

      // Next addXP that gains a level starts fresh batch
      usePlayer.getState().addXP(GAME_CONFIG.XP_LEVEL_CURVE[3])
      expect(usePlayer.getState().levelsGainedThisBatch).toBe(1) // fresh batch
      expect(usePlayer.getState().pendingLevelUps).toBe(1)
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
      expect(state.pendingLevelUps).toBe(0)
      expect(state.levelsGainedThisBatch).toBe(0)
    })
  })
})
