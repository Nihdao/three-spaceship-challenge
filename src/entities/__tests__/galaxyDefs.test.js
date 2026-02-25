import { describe, it, expect } from 'vitest'
import { GALAXIES, getAvailableGalaxies, getDefaultGalaxy, getGalaxyById } from '../galaxyDefs.js'

describe('galaxyDefs — Story 25.3', () => {
  describe('GALAXIES array', () => {
    it('has at least 1 galaxy', () => {
      expect(Array.isArray(GALAXIES)).toBe(true)
      expect(GALAXIES.length).toBeGreaterThanOrEqual(1)
    })

    it('each galaxy has required fields', () => {
      for (const galaxy of GALAXIES) {
        expect(typeof galaxy.id).toBe('string')
        expect(typeof galaxy.name).toBe('string')
        expect(typeof galaxy.description).toBe('string')
        expect(typeof galaxy.systemCount).toBe('number')
        expect(typeof galaxy.locked).toBe('boolean')
        expect(typeof galaxy.colorTheme).toBe('string')
        expect(Array.isArray(galaxy.challengeSlots)).toBe(true)
        expect(typeof galaxy.fragmentMultiplier).toBe('number')
      }
    })

    it('first galaxy is Andromeda Reach with id andromeda_reach', () => {
      expect(GALAXIES[0].id).toBe('andromeda_reach')
      expect(GALAXIES[0].name).toBe('Andromeda Reach')
    })

    it('first galaxy has systemCount of 3', () => {
      expect(GALAXIES[0].systemCount).toBe(3)
    })

    it('first galaxy is not locked', () => {
      expect(GALAXIES[0].locked).toBe(false)
    })

    it('first galaxy has empty challengeSlots array', () => {
      expect(GALAXIES[0].challengeSlots).toEqual([])
    })

    it('first galaxy has fragmentMultiplier of 1.0', () => {
      expect(GALAXIES[0].fragmentMultiplier).toBe(1.0)
    })
  })

  describe('getAvailableGalaxies()', () => {
    it('returns only galaxies with locked=false', () => {
      const available = getAvailableGalaxies()
      for (const galaxy of available) {
        expect(galaxy.locked).toBe(false)
      }
    })

    it('returns at least 1 galaxy', () => {
      const available = getAvailableGalaxies()
      expect(available.length).toBeGreaterThanOrEqual(1)
    })

    it('includes andromeda_reach (the unlocked galaxy)', () => {
      const available = getAvailableGalaxies()
      const ids = available.map(g => g.id)
      expect(ids).toContain('andromeda_reach')
    })
  })

  describe('getDefaultGalaxy()', () => {
    it('returns the first unlocked galaxy', () => {
      const defaultGalaxy = getDefaultGalaxy()
      expect(defaultGalaxy).toBeDefined()
      expect(defaultGalaxy.locked).toBe(false)
    })

    it('returns andromeda_reach as the default galaxy', () => {
      const defaultGalaxy = getDefaultGalaxy()
      expect(defaultGalaxy.id).toBe('andromeda_reach')
    })

    it('default galaxy matches first entry from getAvailableGalaxies()', () => {
      const defaultGalaxy = getDefaultGalaxy()
      const firstAvailable = getAvailableGalaxies()[0]
      expect(defaultGalaxy.id).toBe(firstAvailable.id)
    })
  })

  describe('getGalaxyById()', () => {
    it('returns correct galaxy for valid id', () => {
      const galaxy = getGalaxyById('andromeda_reach')
      expect(galaxy).toBeDefined()
      expect(galaxy.id).toBe('andromeda_reach')
      expect(galaxy.name).toBe('Andromeda Reach')
    })

    it('returns undefined for unknown id', () => {
      const galaxy = getGalaxyById('unknown_galaxy')
      expect(galaxy).toBeUndefined()
    })

    it('returns undefined for null id', () => {
      const galaxy = getGalaxyById(null)
      expect(galaxy).toBeUndefined()
    })
  })
})

// --- Story 34.1: Gameplay profile validation (AC #1) ---
describe('galaxyDefs — Andromeda Reach gameplay profile (Story 34.1)', () => {
  const galaxy = getGalaxyById('andromeda_reach')

  it('has correct planetCount', () => {
    expect(galaxy.planetCount).toBe(15)
  })

  it('has correct wormholeThreshold', () => {
    expect(galaxy.wormholeThreshold).toBe(0.666)
  })

  it('has correct planetRarity distribution', () => {
    expect(galaxy.planetRarity).toEqual({ standard: 8, rare: 5, legendary: 2 })
  })

  it('has correct luckRarityBias', () => {
    expect(galaxy.luckRarityBias).toEqual({ standard: -0.15, rare: 0.10, legendary: 0.05 })
  })

  it('has neutral galaxyRarityBias (reference galaxy)', () => {
    expect(galaxy.galaxyRarityBias).toBe(0)
  })

  it('has correct enemySpeedMult', () => {
    expect(galaxy.enemySpeedMult).toBe(1.5)
  })

  it('has correct difficultyScalingPerSystem', () => {
    expect(galaxy.difficultyScalingPerSystem).toEqual({
      hp: 1.25,
      damage: 1.20,
      speed: 1.10,
      xpReward: 1.15,
    })
  })

  it('systemNamePool has at least 12 names', () => {
    expect(Array.isArray(galaxy.systemNamePool)).toBe(true)
    expect(galaxy.systemNamePool.length).toBeGreaterThanOrEqual(12)
  })

  it('systemNamePool contains 16 unique names', () => {
    expect(galaxy.systemNamePool).toHaveLength(16)
    expect(new Set(galaxy.systemNamePool).size).toBe(16)
  })

  it('all systemNamePool entries are non-empty strings', () => {
    for (const name of galaxy.systemNamePool) {
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })
})
