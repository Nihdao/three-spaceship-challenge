import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'

describe('useLevel — scanningTick (Story 5.3)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
    // Set up test planets manually instead of random placement
    useLevel.setState({
      planets: [
        { id: 'PLANET_CINDER_0', typeId: 'PLANET_CINDER', tier: 'standard', x: 0, z: 0, scanned: false, scanProgress: 0 },
        { id: 'PLANET_PULSE_0',  typeId: 'PLANET_PULSE',  tier: 'rare', x: 200, z: 200, scanned: false, scanProgress: 0 },
        { id: 'PLANET_VOID_0',   typeId: 'PLANET_VOID',   tier: 'legendary', x: -300, z: -300, scanned: false, scanProgress: 0 },
      ],
    })
  })

  it('player within scan radius increments scanProgress by delta/scanTime', () => {
    // CINDER planet at (0,0), scanRadius=40, scanTime=5
    // Player at (10,10) => dist ~14.14, within 40
    const result = useLevel.getState().scanningTick(1.0, 10, 10)
    const planet = useLevel.getState().planets.find(p => p.id === 'PLANET_CINDER_0')
    expect(planet.scanProgress).toBeCloseTo(1.0 / 5) // delta=1, scanTime=5
    expect(result.completed).toBe(false)
    expect(result.activeScanPlanetId).toBe('PLANET_CINDER_0')
  })

  it('player outside all zones: activeScanPlanetId is null', () => {
    // Player at (500,500) — far from all planets
    const result = useLevel.getState().scanningTick(1.0, 500, 500)
    expect(result.completed).toBe(false)
    expect(result.activeScanPlanetId).toBeNull()
    expect(useLevel.getState().activeScanPlanetId).toBeNull()
  })

  it('player leaves zone: progress resets to 0 (FR27)', () => {
    // First tick: player in range
    useLevel.getState().scanningTick(1.0, 10, 10)
    expect(useLevel.getState().planets[0].scanProgress).toBeGreaterThan(0)

    // Second tick: player out of range
    useLevel.getState().scanningTick(1.0, 500, 500)
    const planet = useLevel.getState().planets.find(p => p.id === 'PLANET_CINDER_0')
    expect(planet.scanProgress).toBe(0)
  })

  it('scan progress reaching 1.0 returns completed and marks planet scanned', () => {
    // CINDER scanTime=5, so delta=5 should complete it
    const result = useLevel.getState().scanningTick(5.0, 10, 10)
    expect(result.completed).toBe(true)
    expect(result.planetId).toBe('PLANET_CINDER_0')
    expect(result.tier).toBe('standard')

    const planet = useLevel.getState().planets.find(p => p.id === 'PLANET_CINDER_0')
    expect(planet.scanned).toBe(true)
    expect(planet.scanProgress).toBe(1)
  })

  it('scanned planet is ignored in distance checks', () => {
    // Complete scan first
    useLevel.getState().scanningTick(5.0, 10, 10)
    // Now try scanning same planet again
    const result = useLevel.getState().scanningTick(1.0, 10, 10)
    expect(result.completed).toBe(false)
    expect(result.activeScanPlanetId).toBeNull()
  })

  it('overlapping zones: closest planet is scanned', () => {
    // Place two planets close together
    useLevel.setState({
      planets: [
        { id: 'A', typeId: 'PLANET_CINDER', tier: 'standard', x: 10, z: 0, scanned: false, scanProgress: 0 },
        { id: 'B', typeId: 'PLANET_PULSE',  tier: 'rare', x: 20, z: 0, scanned: false, scanProgress: 0 },
      ],
    })
    // Player at (12, 0) — closer to A (dist=2) than B (dist=8), both within scan radius (40 and 50)
    const result = useLevel.getState().scanningTick(1.0, 12, 0)
    expect(result.activeScanPlanetId).toBe('A')
  })

  it('reset clears activeScanPlanetId', () => {
    useLevel.getState().scanningTick(1.0, 10, 10)
    expect(useLevel.getState().activeScanPlanetId).toBe('PLANET_CINDER_0')

    useLevel.getState().reset()
    expect(useLevel.getState().activeScanPlanetId).toBeNull()
  })

  it('progressive scanning: multiple ticks accumulate progress', () => {
    // CINDER scanTime=5, each tick adds delta/5
    useLevel.getState().scanningTick(1.0, 10, 10) // progress = 0.2
    useLevel.getState().scanningTick(1.0, 10, 10) // progress = 0.4
    useLevel.getState().scanningTick(1.0, 10, 10) // progress = 0.6

    const planet = useLevel.getState().planets.find(p => p.id === 'PLANET_CINDER_0')
    expect(planet.scanProgress).toBeCloseTo(0.6)
  })

  it('activeScanPlanetId resets to null on scan completion', () => {
    useLevel.getState().scanningTick(5.0, 10, 10)
    expect(useLevel.getState().activeScanPlanetId).toBeNull()
  })

  it('switching zones resets previous planet scanProgress to 0', () => {
    // Two planets with overlapping zones
    useLevel.setState({
      planets: [
        { id: 'A', typeId: 'PLANET_CINDER', tier: 'standard', x: 0, z: 0, scanned: false, scanProgress: 0 },
        { id: 'B', typeId: 'PLANET_PULSE',  tier: 'rare', x: 30, z: 0, scanned: false, scanProgress: 0 },
      ],
    })
    // Scan A first (player at 5,0 — closer to A)
    useLevel.getState().scanningTick(2.0, 5, 0)
    expect(useLevel.getState().activeScanPlanetId).toBe('A')
    expect(useLevel.getState().planets.find(p => p.id === 'A').scanProgress).toBeGreaterThan(0)

    // Move closer to B (player at 28,0 — closer to B, still in both zones)
    useLevel.getState().scanningTick(1.0, 28, 0)
    expect(useLevel.getState().activeScanPlanetId).toBe('B')
    // A's progress should be reset to 0
    expect(useLevel.getState().planets.find(p => p.id === 'A').scanProgress).toBe(0)
    // B's progress should have started
    expect(useLevel.getState().planets.find(p => p.id === 'B').scanProgress).toBeGreaterThan(0)
  })
})
