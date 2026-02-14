import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useLevel — wormhole (Story 6.1)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  describe('initial state', () => {
    it('wormhole is null by default', () => {
      expect(useLevel.getState().wormhole).toBe(null)
    })

    it('wormholeState is hidden by default', () => {
      expect(useLevel.getState().wormholeState).toBe('hidden')
    })

    it('wormholeActivationTimer is 0 by default', () => {
      expect(useLevel.getState().wormholeActivationTimer).toBe(0)
    })
  })

  describe('spawnWormhole()', () => {
    it('sets wormhole position and state to visible', () => {
      useLevel.getState().spawnWormhole(0, 0)
      const { wormhole, wormholeState } = useLevel.getState()
      expect(wormholeState).toBe('visible')
      expect(wormhole).not.toBe(null)
      expect(typeof wormhole.x).toBe('number')
      expect(typeof wormhole.z).toBe('number')
    })

    it('spawns at WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER from player position', () => {
      useLevel.getState().spawnWormhole(0, 0)
      const { wormhole } = useLevel.getState()
      const dist = Math.sqrt(wormhole.x * wormhole.x + wormhole.z * wormhole.z)
      // Distance should be approximately WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER
      // (may be less if clamped to play area bounds)
      expect(dist).toBeLessThanOrEqual(GAME_CONFIG.WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER + 1)
    })

    it('clamps wormhole position to play area bounds', () => {
      // Player at edge of play area — wormhole should be clamped
      const edge = GAME_CONFIG.PLAY_AREA_SIZE - 10
      useLevel.getState().spawnWormhole(edge, edge)
      const { wormhole } = useLevel.getState()
      const bound = GAME_CONFIG.PLAY_AREA_SIZE - 50
      expect(wormhole.x).toBeLessThanOrEqual(bound)
      expect(wormhole.x).toBeGreaterThanOrEqual(-bound)
      expect(wormhole.z).toBeLessThanOrEqual(bound)
      expect(wormhole.z).toBeGreaterThanOrEqual(-bound)
    })
  })

  describe('activateWormhole()', () => {
    it('sets wormholeState to activating and starts timer', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      const { wormholeState, wormholeActivationTimer } = useLevel.getState()
      expect(wormholeState).toBe('activating')
      expect(wormholeActivationTimer).toBe(GAME_CONFIG.WORMHOLE_TRANSITION_DELAY)
    })
  })

  describe('wormholeTick()', () => {
    it('decrements timer during activating state', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      const result = useLevel.getState().wormholeTick(0.5)
      expect(result.transitionReady).toBe(false)
      expect(useLevel.getState().wormholeActivationTimer).toBe(GAME_CONFIG.WORMHOLE_TRANSITION_DELAY - 0.5)
    })

    it('returns transitionReady true when timer reaches 0', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      // Tick with exactly the full duration
      const result = useLevel.getState().wormholeTick(GAME_CONFIG.WORMHOLE_TRANSITION_DELAY)
      expect(result.transitionReady).toBe(true)
      expect(useLevel.getState().wormholeState).toBe('active')
    })

    it('returns transitionReady false while timer > 0', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      const result = useLevel.getState().wormholeTick(0.1)
      expect(result.transitionReady).toBe(false)
      expect(useLevel.getState().wormholeState).toBe('activating')
    })

    it('does nothing when not in activating state', () => {
      const result = useLevel.getState().wormholeTick(1.0)
      expect(result.transitionReady).toBe(false)
    })

    it('handles large delta that exceeds timer', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      const result = useLevel.getState().wormholeTick(999)
      expect(result.transitionReady).toBe(true)
      expect(useLevel.getState().wormholeState).toBe('active')
      expect(useLevel.getState().wormholeActivationTimer).toBe(0)
    })
  })

  describe('reset()', () => {
    it('clears wormhole, wormholeState, and wormholeActivationTimer', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      useLevel.getState().reset()
      const { wormhole, wormholeState, wormholeActivationTimer } = useLevel.getState()
      expect(wormhole).toBe(null)
      expect(wormholeState).toBe('hidden')
      expect(wormholeActivationTimer).toBe(0)
    })
  })

  describe('setWormholeInactive() — Story 17.4', () => {
    it('sets wormholeState to inactive', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      useLevel.getState().setWormholeInactive()
      const { wormholeState } = useLevel.getState()
      expect(wormholeState).toBe('inactive')
    })

    it('does not clear wormhole position', () => {
      useLevel.getState().spawnWormhole(0, 0)
      const wormholeBefore = useLevel.getState().wormhole
      useLevel.getState().setWormholeInactive()
      const wormholeAfter = useLevel.getState().wormhole
      expect(wormholeAfter).toEqual(wormholeBefore)
      expect(wormholeAfter).not.toBe(null)
    })
  })

  describe('reactivateWormhole() — Story 17.4', () => {
    it('sets wormholeState to reactivated', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().setWormholeInactive()
      useLevel.getState().reactivateWormhole()
      const { wormholeState } = useLevel.getState()
      expect(wormholeState).toBe('reactivated')
    })

    it('does not clear wormhole position', () => {
      useLevel.getState().spawnWormhole(0, 0)
      const wormholeBefore = useLevel.getState().wormhole
      useLevel.getState().setWormholeInactive()
      useLevel.getState().reactivateWormhole()
      const wormholeAfter = useLevel.getState().wormhole
      expect(wormholeAfter).toEqual(wormholeBefore)
      expect(wormholeAfter).not.toBe(null)
    })
  })
})
