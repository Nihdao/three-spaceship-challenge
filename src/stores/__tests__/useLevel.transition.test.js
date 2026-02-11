import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useLevel — System transition (Story 7.3)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  describe('advanceSystem preserves currentSystem', () => {
    it('increments from 1 to 2', () => {
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(2)
    })

    it('increments from 2 to 3', () => {
      useLevel.getState().advanceSystem()
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(3)
    })
  })

  describe('advanceSystem resets per-system state', () => {
    it('resets systemTimer to 0', () => {
      useLevel.setState({ systemTimer: 450 })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().systemTimer).toBe(0)
    })

    it('resets planets to empty array', () => {
      useLevel.setState({ planets: [{ id: 'p1' }, { id: 'p2' }] })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().planets).toEqual([])
    })

    it('resets wormholeState to hidden', () => {
      useLevel.setState({ wormholeState: 'active', wormhole: { x: 50, z: 50 }, wormholeActivationTimer: 1.5 })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().wormholeState).toBe('hidden')
      expect(useLevel.getState().wormhole).toBeNull()
      expect(useLevel.getState().wormholeActivationTimer).toBe(0)
    })

    it('resets activeScanPlanetId', () => {
      useLevel.setState({ activeScanPlanetId: 'PLANET_GOLD_0' })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().activeScanPlanetId).toBeNull()
    })

    it('resets difficulty to 1', () => {
      useLevel.setState({ difficulty: 3 })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().difficulty).toBe(1)
    })
  })

  describe('full reset resets currentSystem to 1', () => {
    it('resets after multiple advances', () => {
      useLevel.getState().advanceSystem()
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(3)
      useLevel.getState().reset()
      expect(useLevel.getState().currentSystem).toBe(1)
    })
  })
})
