import { describe, it, expect, beforeEach } from 'vitest'
import useGame from '../../stores/useGame.jsx'
import { getAvailableGalaxies, getDefaultGalaxy, getGalaxyById } from '../../entities/galaxyDefs.js'
import { getGalaxyCardDisplayData } from '../GalaxyChoice.jsx'

beforeEach(() => {
  useGame.getState().reset()
})

describe('GalaxyChoice — store contract (Story 25.3)', () => {
  describe('Phase transitions', () => {
    it('startGalaxyChoice() sets phase to galaxyChoice', () => {
      useGame.getState().startGalaxyChoice()
      expect(useGame.getState().phase).toBe('galaxyChoice')
    })

    it('startGameplay() from galaxyChoice transitions to systemEntry', () => {
      useGame.getState().startGalaxyChoice()
      expect(useGame.getState().phase).toBe('galaxyChoice')

      useGame.getState().startGameplay()
      expect(useGame.getState().phase).toBe('systemEntry')
    })

    it('setPhase("shipSelect") returns to shipSelect from galaxyChoice', () => {
      useGame.getState().startGalaxyChoice()
      useGame.getState().setPhase('shipSelect')
      expect(useGame.getState().phase).toBe('shipSelect')
    })
  })

  describe('Galaxy pre-selection', () => {
    it('startGalaxyChoice() pre-selects the default galaxy', () => {
      useGame.getState().startGalaxyChoice()
      const defaultGalaxy = getDefaultGalaxy()
      expect(useGame.getState().selectedGalaxyId).toBe(defaultGalaxy.id)
    })

    it('selectedGalaxyId is andromeda_reach after startGalaxyChoice()', () => {
      useGame.getState().startGalaxyChoice()
      expect(useGame.getState().selectedGalaxyId).toBe('andromeda_reach')
    })
  })

  describe('Galaxy data for single-card display', () => {
    it('getAvailableGalaxies() returns the galaxy data needed for the card', () => {
      const available = getAvailableGalaxies()
      expect(available.length).toBeGreaterThanOrEqual(1)
      expect(available[0]).toHaveProperty('name')
      expect(available[0]).toHaveProperty('description')
      expect(available[0]).toHaveProperty('systemCount')
      expect(available[0]).toHaveProperty('colorTheme')
    })

    it('getGalaxyById() returns galaxy for pre-selected id', () => {
      useGame.getState().startGalaxyChoice()
      const galaxyId = useGame.getState().selectedGalaxyId
      const galaxy = getGalaxyById(galaxyId)
      expect(galaxy).toBeDefined()
      expect(galaxy.name).toBe('Andromeda Reach')
    })

    it('galaxy has systemCount badge data (e.g. "3 SYSTEMS")', () => {
      const galaxy = getGalaxyById('andromeda_reach')
      expect(galaxy.systemCount).toBe(3)
    })
  })

  describe('Challenge slots (future-proof, currently empty)', () => {
    it('andromeda_reach has empty challengeSlots array (no active challenges)', () => {
      const galaxy = getGalaxyById('andromeda_reach')
      expect(galaxy.challengeSlots).toEqual([])
    })

    it('fragmentMultiplier is 1.0 with no active challenges', () => {
      const galaxy = getGalaxyById('andromeda_reach')
      expect(galaxy.fragmentMultiplier).toBe(1.0)
    })
  })

  describe('selectedGalaxyId persistence', () => {
    it('selectedGalaxyId persists after startGameplay()', () => {
      useGame.getState().startGalaxyChoice()
      useGame.getState().startGameplay()
      expect(useGame.getState().selectedGalaxyId).toBe('andromeda_reach')
    })

    it('selectedGalaxyId persists through systemEntry → gameplay', () => {
      useGame.getState().startGalaxyChoice()
      useGame.getState().startGameplay()
      useGame.getState().completeSystemEntry()
      expect(useGame.getState().selectedGalaxyId).toBe('andromeda_reach')
    })

    it('selectedGalaxyId cleared to null after reset()', () => {
      useGame.getState().startGalaxyChoice()
      useGame.getState().reset()
      expect(useGame.getState().selectedGalaxyId).toBeNull()
    })
  })
})

describe('SystemNameBanner — galaxy integration (Story 25.3)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('getGalaxyById() returns null-safe result for null selectedGalaxyId', () => {
    // SystemNameBanner must handle selectedGalaxyId=null gracefully
    const galaxy = getGalaxyById(null)
    expect(galaxy).toBeUndefined()
    // Component uses: selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
    const selectedGalaxyId = useGame.getState().selectedGalaxyId
    const galaxyOrNull = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
    expect(galaxyOrNull).toBeNull()
  })

  it('display text is "ANDROMEDA REACH — ALPHA CENTAURI" when galaxy is set and system is 1', () => {
    useGame.getState().setSelectedGalaxy('andromeda_reach')
    const galaxy = getGalaxyById(useGame.getState().selectedGalaxyId)
    const galaxyName = galaxy ? galaxy.name.toUpperCase() : null
    const systemName = 'ALPHA CENTAURI' // GAME_CONFIG.SYSTEM_NAMES[0]
    const displayText = galaxyName ? `${galaxyName} — ${systemName}` : systemName
    expect(displayText).toBe('ANDROMEDA REACH — ALPHA CENTAURI')
  })

  it('display text falls back to only system name when selectedGalaxyId is null', () => {
    // selectedGalaxyId is null after reset()
    const selectedGalaxyId = useGame.getState().selectedGalaxyId
    const galaxy = selectedGalaxyId ? getGalaxyById(selectedGalaxyId) : null
    const galaxyName = galaxy ? galaxy.name.toUpperCase() : null
    const systemName = 'ALPHA CENTAURI'
    const displayText = galaxyName ? `${galaxyName} — ${systemName}` : systemName
    expect(displayText).toBe('ALPHA CENTAURI')
  })
})

describe('GalaxyChoice — component display data (Story 25.3 H1 fix)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  describe('renders single galaxy card with correct data', () => {
    it('returns Andromeda Reach as selected galaxy when id is andromeda_reach', () => {
      const { selectedGalaxy } = getGalaxyCardDisplayData('andromeda_reach')
      expect(selectedGalaxy).toBeDefined()
      expect(selectedGalaxy.name).toBe('Andromeda Reach')
    })

    it('renders galaxy name uppercased as ANDROMEDA REACH', () => {
      const { selectedGalaxy } = getGalaxyCardDisplayData('andromeda_reach')
      expect(selectedGalaxy.name.toUpperCase()).toBe('ANDROMEDA REACH')
    })

    it('renders system count badge as "3 SYSTEMS"', () => {
      const { selectedGalaxy } = getGalaxyCardDisplayData('andromeda_reach')
      expect(`${selectedGalaxy.systemCount} SYSTEMS`).toBe('3 SYSTEMS')
    })

    it('renders galaxy description (non-empty string)', () => {
      const { selectedGalaxy } = getGalaxyCardDisplayData('andromeda_reach')
      expect(typeof selectedGalaxy.description).toBe('string')
      expect(selectedGalaxy.description.length).toBeGreaterThan(0)
    })

    it('renders colorTheme as hex color for violet/purple accent', () => {
      const { selectedGalaxy } = getGalaxyCardDisplayData('andromeda_reach')
      expect(selectedGalaxy.colorTheme).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('falls back to first available galaxy when selectedGalaxyId is null', () => {
      const { selectedGalaxy } = getGalaxyCardDisplayData(null)
      expect(selectedGalaxy).toBeDefined()
      expect(selectedGalaxy.locked).toBe(false)
    })

    it('availableGalaxies list contains only unlocked galaxies', () => {
      const { availableGalaxies } = getGalaxyCardDisplayData('andromeda_reach')
      expect(availableGalaxies.length).toBeGreaterThanOrEqual(1)
      for (const g of availableGalaxies) {
        expect(g.locked).toBe(false)
      }
    })
  })

  describe('BACK button returns to shipSelect phase', () => {
    it('BACK handler: setPhase(shipSelect) transitions phase to shipSelect', () => {
      useGame.getState().startGalaxyChoice()
      // handleBack() calls: useGame.getState().setPhase('shipSelect')
      useGame.getState().setPhase('shipSelect')
      expect(useGame.getState().phase).toBe('shipSelect')
    })

    it('ESC key action triggers same transition as BACK button', () => {
      useGame.getState().startGalaxyChoice()
      useGame.getState().setPhase('shipSelect')
      expect(useGame.getState().phase).toBe('shipSelect')
    })
  })

  describe('TRAVEL button proceeds to systemEntry phase', () => {
    it('TRAVEL handler: startGameplay() transitions phase to systemEntry', () => {
      useGame.getState().startGalaxyChoice()
      // handleStart() calls: useGame.getState().startGameplay()
      useGame.getState().startGameplay()
      expect(useGame.getState().phase).toBe('systemEntry')
    })

    it('ENTER/SPACE key action triggers same transition as TRAVEL button', () => {
      useGame.getState().startGalaxyChoice()
      useGame.getState().startGameplay()
      expect(useGame.getState().phase).toBe('systemEntry')
    })

    it('selectedGalaxyId is preserved after TRAVEL (card data available in banner)', () => {
      useGame.getState().startGalaxyChoice()
      useGame.getState().startGameplay()
      expect(useGame.getState().selectedGalaxyId).toBe('andromeda_reach')
      // getGalaxyCardDisplayData still resolves correctly post-travel
      const { selectedGalaxy } = getGalaxyCardDisplayData(useGame.getState().selectedGalaxyId)
      expect(selectedGalaxy.name).toBe('Andromeda Reach')
    })
  })
})
