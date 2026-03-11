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
    expect(galaxy.planetCount).toBe(10)
  })

  it('has correct wormholeThreshold', () => {
    expect(galaxy.wormholeThreshold).toBe(0.7)
  })

  it('has correct planetRarity distribution', () => {
    expect(galaxy.planetRarity).toEqual({ standard: 5, rare: 3, legendary: 2 })
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

// --- Story 52.1: planetRarity sum invariant (H1) ---
describe('galaxyDefs — planetRarity integrity (Story 52.1)', () => {
  it('each galaxy has planetRarity sum equal to planetCount', () => {
    for (const galaxy of GALAXIES) {
      if (galaxy.planetRarity == null || galaxy.planetCount == null) continue
      const sum = galaxy.planetRarity.standard + galaxy.planetRarity.rare + galaxy.planetRarity.legendary
      expect(sum).toBe(galaxy.planetCount)
    }
  })
})

// --- Story 52.1: Andromeda Inferno galaxy profile ---
describe('galaxyDefs — Andromeda Inferno (Story 52.1)', () => {
  const inferno = getGalaxyById('andromeda_inferno')

  it('exists and has correct id/name/description', () => {
    expect(inferno).toBeDefined()
    expect(inferno.id).toBe('andromeda_inferno')
    expect(inferno.name).toBe('Andromeda Inferno')
    expect(inferno.description).toBe("The beating heart of Andromeda — where every fleet is a death sentence.")
  })

  it('has systemCount 3, locked false, colorTheme #ff2244', () => {
    expect(inferno.systemCount).toBe(3)
    expect(inferno.locked).toBe(false)
    expect(inferno.colorTheme).toBe('#ff2244')
  })

  it('has planetCount 7 and wormholeThreshold 0.7', () => {
    expect(inferno.planetCount).toBe(7)
    expect(inferno.wormholeThreshold).toBe(0.7)
  })

  it('has correct chaosEnemyMult', () => {
    expect(inferno.chaosEnemyMult).toEqual({ hp: 1.30, damage: 1.30, speed: 1.30, spawnRate: 1.30 })
  })

  it('has bossTier1Hp 15000', () => {
    expect(inferno.bossTier1Hp).toBe(15000)
  })

  it('has systemTimerBase 300 and systemTimerIncrement 300', () => {
    expect(inferno.systemTimerBase).toBe(300)
    expect(inferno.systemTimerIncrement).toBe(300)
  })

  it('has fragmentMultiplier 3.0 and xpMultiplier 2.0', () => {
    expect(inferno.fragmentMultiplier).toBe(3.0)
    expect(inferno.xpMultiplier).toBe(2.0)
  })

  it('has galaxyRarityBias 0.0', () => {
    expect(inferno.galaxyRarityBias).toBe(0.0)
  })

  it('has backgroundTheme chaos', () => {
    expect(inferno.backgroundTheme).toBe('chaos')
  })

  it('systemNamePool has 16 unique non-empty strings', () => {
    expect(Array.isArray(inferno.systemNamePool)).toBe(true)
    expect(inferno.systemNamePool).toHaveLength(16)
    expect(new Set(inferno.systemNamePool).size).toBe(16)
    for (const name of inferno.systemNamePool) {
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })

  // [M1] Structural compatibility fields required by spawnSystem and difficulty systems
  it('has required structural fields for system compatibility', () => {
    expect(inferno.enemySpeedMult).toBe(1.5)
    expect(inferno.difficultyScalingPerSystem).toEqual({ hp: 1.25, damage: 1.20, speed: 1.10, xpReward: 1.15 })
    expect(inferno.planetRarity).toEqual({ standard: 3, rare: 3, legendary: 1 })
    expect(inferno.luckRarityBias).toEqual({ standard: -0.15, rare: 0.10, legendary: 0.05 })
  })

  it('is at index 1 in GALAXIES[]', () => {
    expect(GALAXIES[1].id).toBe('andromeda_inferno')
  })

  it('is returned at index 1 by getAvailableGalaxies()', () => {
    expect(getAvailableGalaxies()[1].id).toBe('andromeda_inferno')
  })

  // Story 52.8: score multiplier
  it('has scoreMultiplier 2.0', () => {
    expect(inferno.scoreMultiplier).toBe(2.0)
  })

  // Regression: andromeda_reach unchanged
  it('andromeda_reach remains at GALAXIES[0] unchanged', () => {
    expect(GALAXIES[0].id).toBe('andromeda_reach')
    expect(GALAXIES[0].fragmentMultiplier).toBe(1.0)
  })

  it('getDefaultGalaxy() still returns andromeda_reach', () => {
    expect(getDefaultGalaxy().id).toBe('andromeda_reach')
  })
})

// --- Story 52.7: difficulty and estimatedDuration fields ---
describe('galaxyDefs — difficulty and estimatedDuration (Story 52.7)', () => {
  const reach = getGalaxyById('andromeda_reach')
  const inferno = getGalaxyById('andromeda_inferno')

  it('andromeda_reach has difficulty 2', () => {
    expect(reach.difficulty).toBe(2)
  })

  it("andromeda_reach has estimatedDuration '~20 min'", () => {
    expect(reach.estimatedDuration).toBe('~20 min')
  })

  it('andromeda_inferno has difficulty 4', () => {
    expect(inferno.difficulty).toBe(4)
  })

  it("andromeda_inferno has estimatedDuration '~45 min'", () => {
    expect(inferno.estimatedDuration).toBe('~45 min')
  })
})
