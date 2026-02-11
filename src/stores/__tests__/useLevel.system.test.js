import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'

describe('useLevel — System tracking (Story 7.1)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  describe('initial state', () => {
    it('starts at system 1', () => {
      expect(useLevel.getState().currentSystem).toBe(1)
    })
  })

  describe('advanceSystem', () => {
    it('increments currentSystem', () => {
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(2)
    })

    it('increments to 3 after two calls', () => {
      useLevel.getState().advanceSystem()
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(3)
    })

    it('resets systemTimer to 0', () => {
      useLevel.setState({ systemTimer: 300 })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().systemTimer).toBe(0)
    })

    it('resets difficulty to 1', () => {
      useLevel.setState({ difficulty: 5 })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().difficulty).toBe(1)
    })

    it('resets planets to empty', () => {
      useLevel.setState({ planets: [{ id: 'test' }] })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().planets).toEqual([])
    })

    it('resets wormhole state', () => {
      useLevel.setState({ wormholeState: 'active', wormhole: { x: 10, z: 20 }, wormholeActivationTimer: 1 })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().wormholeState).toBe('hidden')
      expect(useLevel.getState().wormhole).toBeNull()
      expect(useLevel.getState().wormholeActivationTimer).toBe(0)
    })

    it('resets activeScanPlanetId', () => {
      useLevel.setState({ activeScanPlanetId: 'planet_1' })
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().activeScanPlanetId).toBeNull()
    })
  })

  describe('reset', () => {
    it('resets currentSystem to 1', () => {
      useLevel.getState().advanceSystem()
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(3)
      useLevel.getState().reset()
      expect(useLevel.getState().currentSystem).toBe(1)
    })
  })
})
