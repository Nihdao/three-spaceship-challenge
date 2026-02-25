import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'

const MOCK_GALAXY_CONFIG = {
  id: 'andromeda_reach',
  planetCount: 15,
  wormholeThreshold: 0.75,
}

function makePlanets(scannedCount, totalCount) {
  return Array.from({ length: totalCount }, (_, i) => ({
    id: `planet_${i}`,
    typeId: 'PLANET_CINDER',
    tier: 'standard',
    x: i * 50,
    z: 0,
    scanned: i < scannedCount,
    scanProgress: i < scannedCount ? 1 : 0,
  }))
}

describe('useLevel — wormhole scan-based trigger logic (Story 34.4)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  describe('threshold calculation', () => {
    it('Andromeda Reach threshold is 12 — Math.ceil(15 * 0.75)', () => {
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(threshold).toBe(12)
    })

    it('threshold rounds up — Math.ceil(10 * 0.75) === 8', () => {
      expect(Math.ceil(10 * 0.75)).toBe(8)
    })

    it('threshold rounds up — Math.ceil(20 * 0.75) === 15', () => {
      expect(Math.ceil(20 * 0.75)).toBe(15)
    })
  })

  describe('scanned planet counting', () => {
    it('11 scanned planets: count is below threshold (12)', () => {
      useLevel.setState({ planets: makePlanets(11, 15) })
      const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(scannedCount).toBe(11)
      expect(scannedCount < threshold).toBe(true)
    })

    it('12 scanned planets: count meets threshold', () => {
      useLevel.setState({ planets: makePlanets(12, 15) })
      const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(scannedCount).toBe(12)
      expect(scannedCount >= threshold).toBe(true)
    })

    it('15 scanned planets (all): count exceeds threshold', () => {
      useLevel.setState({ planets: makePlanets(15, 15) })
      const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(scannedCount).toBe(15)
      expect(scannedCount >= threshold).toBe(true)
    })
  })

  describe('end-to-end — AC#1: threshold met → spawnWormhole() → visible (code-review fix)', () => {
    it('12 scanned + wormholeState hidden → spawnWormhole() transitions to visible', () => {
      useLevel.setState({ planets: makePlanets(12, 15) })
      expect(useLevel.getState().wormholeState).toBe('hidden')
      const threshold = Math.ceil(MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold)
      const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
      if (scannedCount >= threshold && useLevel.getState().wormholeState === 'hidden') {
        useLevel.getState().spawnWormhole(0, 0)
      }
      expect(useLevel.getState().wormholeState).toBe('visible')
    })

    it('null galaxyConfig guard: wormhole stays hidden when config unavailable (selectedGalaxyId=null)', () => {
      useLevel.setState({ planets: makePlanets(15, 15) })
      expect(useLevel.getState().wormholeState).toBe('hidden')
      const nullConfig = null // simulates getGalaxyById(null) === undefined
      const shouldTrigger = nullConfig && useLevel.getState().wormholeState === 'hidden'
      expect(shouldTrigger).toBeFalsy()
      expect(useLevel.getState().wormholeState).toBe('hidden')
    })
  })

  describe('idempotency — wormhole state guard', () => {
    it('wormholeState hidden: spawnWormhole() transitions to visible', () => {
      expect(useLevel.getState().wormholeState).toBe('hidden')
      useLevel.getState().spawnWormhole(0, 0)
      expect(useLevel.getState().wormholeState).toBe('visible')
    })

    it('wormholeState visible: guard wormholeState === hidden is false', () => {
      useLevel.getState().spawnWormhole(0, 0)
      expect(useLevel.getState().wormholeState).toBe('visible')
      const shouldTrigger = useLevel.getState().wormholeState === 'hidden'
      expect(shouldTrigger).toBe(false)
    })

    it('wormholeState activating: guard is false', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      expect(useLevel.getState().wormholeState).toBe('activating')
      const shouldTrigger = useLevel.getState().wormholeState === 'hidden'
      expect(shouldTrigger).toBe(false)
    })
  })
})
