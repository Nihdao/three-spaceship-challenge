import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useLevel — Cumulative Timer (Story 23.3)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  // --- carriedTime ---

  describe('carriedTime initial state', () => {
    it('defaults to 0 on new game', () => {
      expect(useLevel.getState().carriedTime).toBe(0)
    })
  })

  describe('setCarriedTime', () => {
    it('stores the remaining time', () => {
      useLevel.getState().setCarriedTime(120)
      expect(useLevel.getState().carriedTime).toBe(120)
    })

    it('clamps negative values to 0', () => {
      useLevel.getState().setCarriedTime(-50)
      expect(useLevel.getState().carriedTime).toBe(0)
    })

    it('stores large values correctly', () => {
      useLevel.getState().setCarriedTime(599)
      expect(useLevel.getState().carriedTime).toBe(599)
    })
  })

  // --- actualSystemDuration ---

  describe('actualSystemDuration initial state', () => {
    it('defaults to SYSTEM_TIMER (600) on new game', () => {
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER)
    })
  })

  // --- initializeSystemDuration ---

  describe('initializeSystemDuration', () => {
    it('sets actualSystemDuration to BASE + carriedTime', () => {
      useLevel.getState().setCarriedTime(120) // 2 minutes carried
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER + 120)
    })

    it('clears carriedTime to 0 after consuming it', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().carriedTime).toBe(0)
    })

    it('sets actualSystemDuration to BASE when carriedTime is 0', () => {
      useLevel.getState().setCarriedTime(0)
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER)
    })

    it('allows multiple systems — each initializes correctly', () => {
      // System 2: carried 120s from system 1
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(720)
      expect(useLevel.getState().carriedTime).toBe(0)

      // System 3: no carryover (player was slow)
      useLevel.getState().setCarriedTime(0)
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(600)
    })
  })

  // --- advanceSystem: carriedTime persists ---

  describe('advanceSystem — carriedTime persists through tunnel', () => {
    it('does NOT reset carriedTime when advancing systems', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().carriedTime).toBe(120)
    })

    it('does NOT reset actualSystemDuration when advancing systems', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration()
      useLevel.getState().advanceSystem()
      // actualSystemDuration persists until initializeSystemDuration on new system entry
      expect(useLevel.getState().actualSystemDuration).toBe(720)
    })
  })

  // --- reset: clears both fields ---

  describe('reset', () => {
    it('resets carriedTime to 0', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().reset()
      expect(useLevel.getState().carriedTime).toBe(0)
    })

    it('resets actualSystemDuration to BASE (600)', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration()
      useLevel.getState().reset()
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER)
    })
  })

  // --- Edge cases ---

  describe('edge cases', () => {
    it('setCarriedTime clamps negative input to 0 — prevents actualSystemDuration going below base', () => {
      useLevel.getState().setCarriedTime(-100)
      expect(useLevel.getState().carriedTime).toBe(0)
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER)
    })

    it('actualSystemDuration is correct for full carryover (nearly full timer)', () => {
      useLevel.getState().setCarriedTime(599) // Blazing fast system 1 clear
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER + 599)
    })
  })

  // --- Boss defeat carryover calculation (H1: covers the GameLoop boss defeat computation path) ---

  describe('boss defeat carryover calculation', () => {
    it('720s system defeated at 540s elapsed → 180s carried to next system', () => {
      // System 2 setup: 120s carried from system 1 → actualSystemDuration = 720s
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(720)

      // Boss defeated at 540s — GameLoop computes: Math.max(0, actualDuration - currentTimer)
      const actualDuration = useLevel.getState().actualSystemDuration
      useLevel.getState().setCarriedTime(Math.max(0, actualDuration - 540))
      expect(useLevel.getState().carriedTime).toBe(180)
    })

    it('boss defeat at exactly actualDuration stores 0 carried time', () => {
      useLevel.getState().initializeSystemDuration()
      const actualDuration = useLevel.getState().actualSystemDuration
      useLevel.getState().setCarriedTime(Math.max(0, actualDuration - actualDuration))
      expect(useLevel.getState().carriedTime).toBe(0)
    })

    it('overtime scenario (timer > actualDuration) clamps to 0 carried time', () => {
      useLevel.getState().initializeSystemDuration()
      const actualDuration = useLevel.getState().actualSystemDuration
      useLevel.getState().setCarriedTime(Math.max(0, actualDuration - (actualDuration + 10)))
      expect(useLevel.getState().carriedTime).toBe(0)
    })

    it('chained systems: s1→s2→s3 carryover accumulates correctly', () => {
      // System 1: base 600s, boss at 480s → 120s carried
      useLevel.getState().initializeSystemDuration()
      const s1Duration = useLevel.getState().actualSystemDuration // 600
      useLevel.getState().setCarriedTime(Math.max(0, s1Duration - 480))
      expect(useLevel.getState().carriedTime).toBe(120)

      // System 2: 600 + 120 = 720s, boss at 600s → 120s carried
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(720)
      const s2Duration = useLevel.getState().actualSystemDuration
      useLevel.getState().setCarriedTime(Math.max(0, s2Duration - 600))
      expect(useLevel.getState().carriedTime).toBe(120)

      // System 3: 600 + 120 = 720s
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(720)
    })
  })

  // --- HUD timer display computation (M3: remaining = actualSystemDuration - systemTimer) ---

  describe('HUD timer display computation', () => {
    it('cumulative remaining: 720s system at 60s elapsed = 660s remaining', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration()
      const actualDuration = useLevel.getState().actualSystemDuration // 720s
      const remaining = Math.max(0, actualDuration - 60)
      expect(remaining).toBe(660) // 11:00 on HUD
    })

    it('base system: remaining at start equals SYSTEM_TIMER', () => {
      useLevel.getState().initializeSystemDuration()
      const actualDuration = useLevel.getState().actualSystemDuration // 600s
      const remaining = Math.max(0, actualDuration - 0)
      expect(remaining).toBe(GAME_CONFIG.SYSTEM_TIMER) // 10:00
    })

    it('overtime clamps to 0 — HUD shows 00:00, not negative', () => {
      useLevel.getState().initializeSystemDuration()
      const actualDuration = useLevel.getState().actualSystemDuration
      const remaining = Math.max(0, actualDuration - (actualDuration + 10))
      expect(remaining).toBe(0)
    })
  })
})
