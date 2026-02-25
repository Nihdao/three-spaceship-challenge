import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

// Andromeda Reach fixture
const MOCK_GALAXY_CONFIG = {
  planetCount: 15,
  planetRarity: { standard: 8, rare: 5, legendary: 2 },
  luckRarityBias: { standard: -0.15, rare: 0.10, legendary: 0.05 },
}

describe('useLevel — initializePlanets (Story 34.2)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  it('generates exactly planetCount planets from galaxyConfig', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    expect(useLevel.getState().planets).toHaveLength(15)
  })

  it('all planet typeIds are valid Redshift types', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    const validTypes = new Set(['PLANET_CINDER', 'PLANET_PULSE', 'PLANET_VOID'])
    for (const p of useLevel.getState().planets) {
      expect(validTypes.has(p.typeId)).toBe(true)
    }
  })

  it('each planet has required state fields', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    for (const p of useLevel.getState().planets) {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('typeId')
      expect(p).toHaveProperty('tier')
      expect(typeof p.x).toBe('number')
      expect(typeof p.z).toBe('number')
      expect(p.scanned).toBe(false)
      expect(p.scanProgress).toBe(0)
    }
  })

  it('all planets within play area bounds minus margin', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    const range = GAME_CONFIG.PLAY_AREA_SIZE - GAME_CONFIG.PLANET_PLACEMENT_MARGIN
    for (const p of useLevel.getState().planets) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(range)
      expect(Math.abs(p.z)).toBeLessThanOrEqual(range)
    }
  })

  it('no planet closer than MIN_DISTANCE_FROM_CENTER to world center', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    for (const p of useLevel.getState().planets) {
      const dist = Math.sqrt(p.x * p.x + p.z * p.z)
      expect(dist).toBeGreaterThanOrEqual(GAME_CONFIG.PLANET_MIN_DISTANCE_FROM_CENTER)
    }
  })

  it('each planet has a unique id', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    const ids = useLevel.getState().planets.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no two planets closer than PLANET_MIN_DISTANCE_BETWEEN', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    const planets = useLevel.getState().planets
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const dx = planets[i].x - planets[j].x
        const dz = planets[i].z - planets[j].z
        const dist = Math.sqrt(dx * dx + dz * dz)
        expect(dist).toBeGreaterThanOrEqual(GAME_CONFIG.PLANET_MIN_DISTANCE_BETWEEN)
      }
    }
  })

  it('luck=8 produces measurably more PULSE+VOID than luck=0 over 200 runs', () => {
    let sumRareLuck0 = 0
    let sumRareLuck8 = 0
    const RUNS = 200

    for (let r = 0; r < RUNS; r++) {
      useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
      const planets = useLevel.getState().planets
      sumRareLuck0 += planets.filter(p => p.typeId !== 'PLANET_CINDER').length
    }
    for (let r = 0; r < RUNS; r++) {
      useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 8)
      const planets = useLevel.getState().planets
      sumRareLuck8 += planets.filter(p => p.typeId !== 'PLANET_CINDER').length
    }

    // luck=8 should shift distribution toward PULSE+VOID (Z-score ≈ 6.3 over 200 runs, P(fail) < 0.0001%)
    expect(sumRareLuck8 / RUNS).toBeGreaterThan(sumRareLuck0 / RUNS)
  })

  it('reset() clears planets array', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    expect(useLevel.getState().planets.length).toBeGreaterThan(0)
    useLevel.getState().reset()
    expect(useLevel.getState().planets).toEqual([])
  })

  it('reset() clears all level state fields to initial values', () => {
    // Dirty all fields
    useLevel.setState({
      systemTimer: 42,
      difficulty: 5,
      planets: [{ id: 'fake' }],
      wormholeState: 'active',
      activeScanPlanetId: 'PLANET_CINDER_0',
    })
    useLevel.getState().reset()
    const state = useLevel.getState()
    expect(state.systemTimer).toBe(0)
    expect(state.difficulty).toBe(1)
    expect(state.planets).toEqual([])
    expect(state.wormholeState).toBe('hidden')
    expect(state.activeScanPlanetId).toBeNull()
  })
})
