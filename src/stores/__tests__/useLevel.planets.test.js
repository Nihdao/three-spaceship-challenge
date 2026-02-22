import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useLevel — initializePlanets', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  it('generates correct total planet count (4 standard + 2 rare + 1 legendary = 7)', () => {
    useLevel.getState().initializePlanets()
    const planets = useLevel.getState().planets
    expect(planets).toHaveLength(7)
  })

  it('generates correct count per tier', () => {
    useLevel.getState().initializePlanets()
    const planets = useLevel.getState().planets
    const standard = planets.filter((p) => p.tier === 'standard')
    const rare = planets.filter((p) => p.tier === 'rare')
    const legendary = planets.filter((p) => p.tier === 'legendary')
    expect(standard).toHaveLength(GAME_CONFIG.PLANET_COUNT_SILVER)
    expect(rare).toHaveLength(GAME_CONFIG.PLANET_COUNT_GOLD)
    expect(legendary).toHaveLength(GAME_CONFIG.PLANET_COUNT_PLATINUM)
  })

  it('each planet has required state fields', () => {
    useLevel.getState().initializePlanets()
    const planets = useLevel.getState().planets
    for (const p of planets) {
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
    useLevel.getState().initializePlanets()
    const planets = useLevel.getState().planets
    const range = GAME_CONFIG.PLAY_AREA_SIZE - GAME_CONFIG.PLANET_PLACEMENT_MARGIN
    for (const p of planets) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(range)
      expect(Math.abs(p.z)).toBeLessThanOrEqual(range)
    }
  })

  it('no planet closer than MIN_DISTANCE_FROM_CENTER to world center', () => {
    useLevel.getState().initializePlanets()
    const planets = useLevel.getState().planets
    for (const p of planets) {
      const dist = Math.sqrt(p.x * p.x + p.z * p.z)
      expect(dist).toBeGreaterThanOrEqual(GAME_CONFIG.PLANET_MIN_DISTANCE_FROM_CENTER)
    }
  })

  it('no two planets closer than MIN_DISTANCE_BETWEEN', () => {
    useLevel.getState().initializePlanets()
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

  it('reset() clears planets array', () => {
    useLevel.getState().initializePlanets()
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

  it('each planet has unique id', () => {
    useLevel.getState().initializePlanets()
    const planets = useLevel.getState().planets
    const ids = planets.map((p) => p.id)
    expect(new Set(ids).size).toBe(planets.length)
  })
})
