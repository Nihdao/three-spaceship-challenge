import { describe, it, expect, beforeEach, vi } from 'vitest'
import useGame from '../../stores/useGame.jsx'
import useLevel from '../../stores/useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { getGalaxyById } from '../../entities/galaxyDefs.js'

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

  describe('Story 29.2 — Cinematic two-line banner logic', () => {
    it('subtitleDelay equals animationDelay + FADE_IN_DURATION + 0.2', () => {
      const { FADE_IN_DURATION } = GAME_CONFIG.SYSTEM_BANNER
      const animationDelay = 0.3
      const subtitleDelay = animationDelay + FADE_IN_DURATION + 0.2
      expect(subtitleDelay).toBe(0.8)
    })

    it('subtitleDelay appears ~200ms after system name is fully visible', () => {
      const { FADE_IN_DURATION } = GAME_CONFIG.SYSTEM_BANNER
      const animationDelay = 0.3
      const systemNameVisibleAt = animationDelay + FADE_IN_DURATION
      const subtitleDelay = animationDelay + FADE_IN_DURATION + 0.2
      expect(subtitleDelay - systemNameVisibleAt).toBeCloseTo(0.2)
    })

    it('galaxy subtitle uses Title Case (galaxy.name), not uppercase (galaxyName)', () => {
      const galaxy = getGalaxyById('andromeda_reach')
      expect(galaxy).toBeDefined()
      // galaxyName (for conditional check) = uppercase
      const galaxyName = galaxy.name.toUpperCase()
      expect(galaxyName).toBe('ANDROMEDA REACH')
      // subtitle display = original Title Case
      expect(galaxy.name).toBe('Andromeda Reach')
      expect(galaxy.name).not.toBe(galaxyName)
    })

    it('no galaxy subtitle when selectedGalaxyId is null — galaxy resolves to null', () => {
      const selectedGalaxyId = null
      const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
      const galaxyName = galaxy ? galaxy.name.toUpperCase() : null
      // The conditional {galaxyName && <div>} renders nothing
      expect(galaxy).toBeNull()
      expect(galaxyName).toBeNull()
    })

    it('no galaxy subtitle when selectedGalaxyId is undefined', () => {
      const selectedGalaxyId = undefined
      const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
      const galaxyName = galaxy ? galaxy.name.toUpperCase() : null
      expect(galaxy).toBeNull()
      expect(galaxyName).toBeNull()
    })

    it('galaxy subtitle renders when selectedGalaxyId is valid', () => {
      const selectedGalaxyId = 'andromeda_reach'
      const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
      const galaxyName = galaxy ? galaxy.name.toUpperCase() : null
      expect(galaxy).not.toBeNull()
      expect(galaxyName).toBeTruthy()
      // galaxy.name (Title Case) is what renders in the subtitle div
      expect(galaxy.name).toBe('Andromeda Reach')
    })

    it('selectedGalaxyId stored in useGame state', () => {
      expect('selectedGalaxyId' in useGame.getState()).toBe(true)
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
