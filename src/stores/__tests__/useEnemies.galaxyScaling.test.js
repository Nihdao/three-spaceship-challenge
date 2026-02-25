import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

// Galaxy profile for Andromeda Reach (matches galaxyDefs.js post-34.1)
const MOCK_GALAXY_CONFIG = {
  id: 'andromeda_reach',
  enemySpeedMult: 1.5,
  difficultyScalingPerSystem: {
    hp:       1.25,
    damage:   1.20,
    speed:    1.10,
    xpReward: 1.15,
  },
}

// Pure function — mirrors the GameLoop logic (Story 34.5)
function computeSystemScaling(gc, currentSystem) {
  if (gc?.difficultyScalingPerSystem) {
    const si = currentSystem - 1
    const s = gc.difficultyScalingPerSystem
    return {
      hp:       Math.pow(s.hp,       si),
      damage:   Math.pow(s.damage,   si),
      speed:    Math.pow(s.speed,    si) * (gc.enemySpeedMult ?? 1.0),
      xpReward: Math.pow(s.xpReward, si),
    }
  }
  return GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
}

describe('computeSystemScaling — galaxy profile (Story 34.5)', () => {
  describe('Andromeda Reach — System 1 (systemIndex=0)', () => {
    it('hp multiplier is 1.0 (x^0 = 1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).hp).toBeCloseTo(1.0)
    })

    it('damage multiplier is 1.0', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).damage).toBeCloseTo(1.0)
    })

    it('speed multiplier is 1.5 (1.10^0 × 1.5 = 1.5)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).speed).toBeCloseTo(1.5)
    })

    it('xpReward multiplier is 1.0', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).xpReward).toBeCloseTo(1.0)
    })

    it('FODDER_BASIC effective speed ≥ 25 — AC #1 (17 × 1.5 = 25.5)', () => {
      const scaling = computeSystemScaling(MOCK_GALAXY_CONFIG, 1)
      const effectiveSpeed = ENEMIES.FODDER_BASIC.speed * scaling.speed
      expect(effectiveSpeed).toBeGreaterThanOrEqual(25)
    })
  })

  describe('Andromeda Reach — System 2 (systemIndex=1)', () => {
    it('hp multiplier is 1.25 (1.25^1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).hp).toBeCloseTo(1.25)
    })

    it('speed multiplier is 1.65 (1.10^1 × 1.5)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).speed).toBeCloseTo(1.65)
    })

    it('damage multiplier is 1.20 (1.20^1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).damage).toBeCloseTo(1.20)
    })

    it('xpReward multiplier is 1.15 (1.15^1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).xpReward).toBeCloseTo(1.15)
    })
  })

  describe('Andromeda Reach — System 3 (systemIndex=2)', () => {
    it('hp multiplier is 1.5625 (1.25^2)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 3).hp).toBeCloseTo(1.5625)
    })

    it('speed multiplier ≈ 1.815 (1.10^2 × 1.5)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 3).speed).toBeCloseTo(1.815)
    })

    it('damage multiplier is 1.44 (1.20^2)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 3).damage).toBeCloseTo(1.44)
    })

    it('xpReward multiplier is 1.3225 (1.15^2)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 3).xpReward).toBeCloseTo(1.3225)
    })
  })

  describe('Fallback — no galaxy config (AC #3)', () => {
    it('null galaxy → returns GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]', () => {
      expect(computeSystemScaling(null, 1)).toEqual(GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1])
    })

    it('galaxy without difficultyScalingPerSystem → returns hardcoded scaling for system 2', () => {
      const bareGalaxy = { id: 'bare', enemySpeedMult: 1.0 }
      expect(computeSystemScaling(bareGalaxy, 2)).toEqual(GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2])
    })

    it('null galaxy at system 3 → returns hardcoded scaling for system 3', () => {
      expect(computeSystemScaling(null, 3)).toEqual(GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3])
    })
  })
})
