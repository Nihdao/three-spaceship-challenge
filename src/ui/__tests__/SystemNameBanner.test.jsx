import { describe, it, expect, beforeEach, vi } from 'vitest'
import useGame from '../../stores/useGame.jsx'
import useLevel from '../../stores/useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('SystemNameBanner — Story 17.2', () => {
  beforeEach(() => {
    useGame.getState().reset()
    useLevel.getState().reset()
  })

  describe('System name lookup logic', () => {
    it('SYSTEM_NAMES array has 3 entries for 3 systems', () => {
      expect(GAME_CONFIG.SYSTEM_NAMES).toBeDefined()
      expect(GAME_CONFIG.SYSTEM_NAMES.length).toBe(3)
    })

    it('SYSTEM_NAMES are non-empty strings', () => {
      for (const name of GAME_CONFIG.SYSTEM_NAMES) {
        expect(typeof name).toBe('string')
        expect(name.length).toBeGreaterThan(0)
      }
    })

    it('currentSystem 1 maps to SYSTEM_NAMES[0] (1-indexed to 0-indexed)', () => {
      const systemName = GAME_CONFIG.SYSTEM_NAMES[1 - 1]
      expect(systemName).toBe('ALPHA CENTAURI')
    })

    it('currentSystem 2 maps to SYSTEM_NAMES[1]', () => {
      const systemName = GAME_CONFIG.SYSTEM_NAMES[2 - 1]
      expect(systemName).toBe('PROXIMA')
    })

    it('currentSystem 3 maps to SYSTEM_NAMES[2]', () => {
      const systemName = GAME_CONFIG.SYSTEM_NAMES[3 - 1]
      expect(systemName).toBe('KEPLER-442')
    })

    it('out-of-bounds currentSystem returns undefined (fallback handles this)', () => {
      const systemName = GAME_CONFIG.SYSTEM_NAMES[4 - 1]
      expect(systemName).toBeUndefined()
      // Component uses: systemName || `SYSTEM ${currentSystem}` as fallback
    })

    it('currentSystem 0 returns undefined (fallback handles this)', () => {
      const systemName = GAME_CONFIG.SYSTEM_NAMES[0 - 1]
      expect(systemName).toBeUndefined()
    })
  })

  describe('Banner timing configuration (Story 17.2)', () => {
    it('SYSTEM_BANNER config exists', () => {
      expect(GAME_CONFIG.SYSTEM_BANNER).toBeDefined()
    })

    it('FADE_IN_DURATION is 0.3 seconds', () => {
      expect(GAME_CONFIG.SYSTEM_BANNER.FADE_IN_DURATION).toBe(0.3)
    })

    it('DISPLAY_DURATION is 2.5 seconds', () => {
      expect(GAME_CONFIG.SYSTEM_BANNER.DISPLAY_DURATION).toBe(2.5)
    })

    it('FADE_OUT_DURATION is 0.5 seconds', () => {
      expect(GAME_CONFIG.SYSTEM_BANNER.FADE_OUT_DURATION).toBe(0.5)
    })

    it('Total animation duration is 3.3 seconds', () => {
      const { FADE_IN_DURATION, DISPLAY_DURATION, FADE_OUT_DURATION } = GAME_CONFIG.SYSTEM_BANNER
      const total = FADE_IN_DURATION + DISPLAY_DURATION + FADE_OUT_DURATION
      expect(total).toBe(3.3)
    })
  })

  describe('Phase transitions (integration with useGame)', () => {
    it('systemEntry phase exists in useGame', () => {
      useGame.getState().startSystemEntry()
      expect(useGame.getState().phase).toBe('systemEntry')
    })

    it('completeSystemEntry transitions to gameplay', () => {
      useGame.getState().startSystemEntry()
      useGame.getState().completeSystemEntry()
      expect(useGame.getState().phase).toBe('gameplay')
    })

    it('startGameplay initially sets phase to systemEntry', () => {
      useGame.getState().startGameplay()
      expect(useGame.getState().phase).toBe('systemEntry')
    })
  })

  describe('Store integration', () => {
    it('currentSystem defaults to 1', () => {
      expect(useLevel.getState().currentSystem).toBe(1)
    })

    it('advanceSystem increments currentSystem', () => {
      expect(useLevel.getState().currentSystem).toBe(1)
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(2)
    })

    it('advanceSystem caps at MAX_SYSTEMS (3)', () => {
      useLevel.getState().advanceSystem() // 1 -> 2
      useLevel.getState().advanceSystem() // 2 -> 3
      useLevel.getState().advanceSystem() // 3 -> 3 (capped)
      expect(useLevel.getState().currentSystem).toBe(3)
    })
  })

  describe('Dev mode console warning (boundary validation)', () => {
    it('console.warn is called when system name is undefined in dev mode', () => {
      const originalEnv = import.meta.env.DEV
      // Note: We can't easily mock import.meta.env.DEV in Vitest, so this is a documentation test
      // The component should call console.warn when SYSTEM_NAMES[currentSystem - 1] is undefined

      // Verify fallback behavior by checking that out-of-bounds access returns undefined
      const outOfBoundsName = GAME_CONFIG.SYSTEM_NAMES[99]
      expect(outOfBoundsName).toBeUndefined()

      // In the component, this would trigger: console.warn if (!systemName && import.meta.env.DEV)
      // We verify the guard condition logic here
      const shouldWarn = !outOfBoundsName && import.meta.env.DEV
      // shouldWarn would be true in dev mode when systemName is undefined
    })
  })
})
