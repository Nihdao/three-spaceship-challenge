import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { getGalaxyById } from '../../entities/galaxyDefs.js'

describe('useLevel — Chaos System Timer (Story 52.4)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  // --- AC 4: Fallback to GAME_CONFIG.SYSTEM_TIMER when no timerBase ---

  describe('initializeSystemDuration — no timerBase (AC 4 regression)', () => {
    it('defaults to GAME_CONFIG.SYSTEM_TIMER when timerBase is undefined', () => {
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER)
    })

    it('defaults to GAME_CONFIG.SYSTEM_TIMER when timerBase is null', () => {
      useLevel.getState().initializeSystemDuration(null)
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER)
    })

    it('still consumes carriedTime with no timerBase', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration()
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER + 120)
      expect(useLevel.getState().carriedTime).toBe(0)
    })
  })

  // --- AC 1, 2, 3: Chaos per-system timer formula ---

  describe('initializeSystemDuration — chaos timerBase (AC 1, 2, 3)', () => {
    it('system 1: timerBase=300 → actualSystemDuration=300', () => {
      // andromeda_inferno system 1: base + increment×0 = 300
      useLevel.getState().initializeSystemDuration(300)
      expect(useLevel.getState().actualSystemDuration).toBe(300)
    })

    it('system 2: timerBase=600 → actualSystemDuration=600', () => {
      // andromeda_inferno system 2: base + increment×1 = 600
      useLevel.getState().initializeSystemDuration(600)
      expect(useLevel.getState().actualSystemDuration).toBe(600)
    })

    it('system 3: timerBase=900 → actualSystemDuration=900', () => {
      // andromeda_inferno system 3: base + increment×2 = 900
      useLevel.getState().initializeSystemDuration(900)
      expect(useLevel.getState().actualSystemDuration).toBe(900)
    })

    it('clears carriedTime after consuming it', () => {
      useLevel.getState().setCarriedTime(60)
      useLevel.getState().initializeSystemDuration(300)
      expect(useLevel.getState().carriedTime).toBe(0)
    })
  })

  // --- AC 6: carriedTime applies on top of chaos base ---

  describe('initializeSystemDuration — chaos base + carriedTime (AC 6)', () => {
    it('chaos system 1 (300) + carriedTime=120 → 420', () => {
      useLevel.getState().setCarriedTime(120)
      useLevel.getState().initializeSystemDuration(300)
      expect(useLevel.getState().actualSystemDuration).toBe(420)
      expect(useLevel.getState().carriedTime).toBe(0)
    })

    it('chaos system 2 (600) + carriedTime=90 → 690', () => {
      useLevel.getState().setCarriedTime(90)
      useLevel.getState().initializeSystemDuration(600)
      expect(useLevel.getState().actualSystemDuration).toBe(690)
      expect(useLevel.getState().carriedTime).toBe(0)
    })

    it('chaos system 3 (900) + carriedTime=0 → 900 (no carry)', () => {
      useLevel.getState().initializeSystemDuration(900)
      expect(useLevel.getState().actualSystemDuration).toBe(900)
    })

    it('full chaos run: systems 1→2→3 with carryover accumulates correctly', () => {
      // System 1: chaos base=300, no carry → 300s total, boss at 240s → 60s carried
      useLevel.getState().initializeSystemDuration(300)
      expect(useLevel.getState().actualSystemDuration).toBe(300)
      useLevel.getState().setCarriedTime(Math.max(0, 300 - 240)) // 60s carried
      expect(useLevel.getState().carriedTime).toBe(60)

      // System 2: chaos base=600, carry=60 → 660s total
      useLevel.getState().initializeSystemDuration(600)
      expect(useLevel.getState().actualSystemDuration).toBe(660)
      expect(useLevel.getState().carriedTime).toBe(0)

      // System 3: chaos base=900, no carry → 900s total
      useLevel.getState().initializeSystemDuration(900)
      expect(useLevel.getState().actualSystemDuration).toBe(900)
    })
  })

  // --- Integration: GameLoop formula chain from galaxyDefs → store (H1) ---

  describe('GameLoop chaosTimerBase formula — integration with real galaxyDefs', () => {
    // Replicate the exact formula used in GameLoop.jsx both call sites:
    // galaxyConfig?.systemTimerBase != null
    //   ? galaxyConfig.systemTimerBase + (galaxyConfig.systemTimerIncrement ?? 0) * (currentSystem - 1)
    //   : null
    const computeChaosTimerBase = (galaxyConfig, currentSystem) =>
      galaxyConfig?.systemTimerBase != null
        ? galaxyConfig.systemTimerBase + (galaxyConfig.systemTimerIncrement ?? 0) * (currentSystem - 1)
        : null

    it('andromeda_inferno system 1 → chaosTimerBase=300, actualSystemDuration=300', () => {
      const config = getGalaxyById('andromeda_inferno')
      const base = computeChaosTimerBase(config, 1)
      expect(base).toBe(300)
      useLevel.getState().initializeSystemDuration(base)
      expect(useLevel.getState().actualSystemDuration).toBe(300)
    })

    it('andromeda_inferno system 2 → chaosTimerBase=600, actualSystemDuration=600', () => {
      const config = getGalaxyById('andromeda_inferno')
      const base = computeChaosTimerBase(config, 2)
      expect(base).toBe(600)
      useLevel.getState().initializeSystemDuration(base)
      expect(useLevel.getState().actualSystemDuration).toBe(600)
    })

    it('andromeda_inferno system 3 → chaosTimerBase=900, actualSystemDuration=900', () => {
      const config = getGalaxyById('andromeda_inferno')
      const base = computeChaosTimerBase(config, 3)
      expect(base).toBe(900)
      useLevel.getState().initializeSystemDuration(base)
      expect(useLevel.getState().actualSystemDuration).toBe(900)
    })

    it('andromeda_reach (no systemTimerBase) → chaosTimerBase=null → fallback to GAME_CONFIG.SYSTEM_TIMER (AC 4)', () => {
      const config = getGalaxyById('andromeda_reach')
      const base = computeChaosTimerBase(config, 1)
      expect(base).toBeNull()
      useLevel.getState().initializeSystemDuration(base)
      expect(useLevel.getState().actualSystemDuration).toBe(GAME_CONFIG.SYSTEM_TIMER)
    })

    it('galaxy with systemTimerBase but no systemTimerIncrement → ?? 0 fallback, same timer each system (M2)', () => {
      // Simulates a hypothetical galaxy with base=450 but no increment field
      const partialConfig = { systemTimerBase: 450 } // no systemTimerIncrement
      const base1 = computeChaosTimerBase(partialConfig, 1)
      const base2 = computeChaosTimerBase(partialConfig, 2)
      const base3 = computeChaosTimerBase(partialConfig, 3)
      // increment defaults to 0 → all systems get the same base duration
      expect(base1).toBe(450)
      expect(base2).toBe(450)
      expect(base3).toBe(450)
      useLevel.getState().initializeSystemDuration(base2)
      expect(useLevel.getState().actualSystemDuration).toBe(450)
    })
  })
})
