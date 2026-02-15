import { describe, it, expect, beforeEach, vi } from 'vitest'
import usePlayer from '../usePlayer.jsx'

describe('usePlayer — revival system (Story 22.1, Task 1)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    vi.clearAllTimers()
  })

  describe('consumeRevival action', () => {
    it('decrements revivalCharges by 1', () => {
      usePlayer.setState({ revivalCharges: 2 })

      usePlayer.getState().consumeRevival()

      expect(usePlayer.getState().revivalCharges).toBe(1)
    })

    it('decrements from 1 to 0', () => {
      usePlayer.setState({ revivalCharges: 1 })

      usePlayer.getState().consumeRevival()

      expect(usePlayer.getState().revivalCharges).toBe(0)
    })

    it('does not go below 0 (defensive)', () => {
      usePlayer.setState({ revivalCharges: 0 })

      usePlayer.getState().consumeRevival()

      expect(usePlayer.getState().revivalCharges).toBe(0)
    })

    it('handles multiple consumptions', () => {
      usePlayer.setState({ revivalCharges: 3 })

      usePlayer.getState().consumeRevival()
      usePlayer.getState().consumeRevival()

      expect(usePlayer.getState().revivalCharges).toBe(1)
    })
  })

  describe('activateRevivalInvincibility action', () => {
    it('sets isInvulnerable to true and timer to provided duration', () => {
      usePlayer.getState().activateRevivalInvincibility(2.5)

      const state = usePlayer.getState()
      expect(state.isInvulnerable).toBe(true)
      expect(state.invulnerabilityTimer).toBe(2.5)
    })

    it('can be called with different durations', () => {
      usePlayer.getState().activateRevivalInvincibility(3.0)

      const state = usePlayer.getState()
      expect(state.isInvulnerable).toBe(true)
      expect(state.invulnerabilityTimer).toBe(3.0)
    })

    it('overwrites existing invulnerability timer', () => {
      usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 1.0 })

      usePlayer.getState().activateRevivalInvincibility(2.5)

      expect(usePlayer.getState().invulnerabilityTimer).toBe(2.5)
    })
  })

  describe('invulnerability timer tick (existing functionality reused for revival)', () => {
    it('tick decrements invulnerabilityTimer when invulnerable', () => {
      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false }
      usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 2.5 })

      usePlayer.getState().tick(1.0, input)

      const state = usePlayer.getState()
      expect(state.invulnerabilityTimer).toBe(1.5)
      expect(state.isInvulnerable).toBe(true)
    })

    it('invulnerability ends when timer reaches 0', () => {
      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false }
      usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 0.5 })

      usePlayer.getState().tick(0.5, input)

      const state = usePlayer.getState()
      expect(state.isInvulnerable).toBe(false)
      expect(state.invulnerabilityTimer).toBe(0)
    })

    it('invulnerability persists when timer > 0 after tick', () => {
      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false }
      usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 3.0 })

      usePlayer.getState().tick(0.5, input)

      const state = usePlayer.getState()
      expect(state.isInvulnerable).toBe(true)
      expect(state.invulnerabilityTimer).toBe(2.5)
    })
  })

  describe('reset and system transition', () => {
    it('reset clears invulnerability state', () => {
      usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 2.0 })

      usePlayer.getState().reset()

      const state = usePlayer.getState()
      expect(state.isInvulnerable).toBe(false)
      expect(state.invulnerabilityTimer).toBe(0)
    })

    it('resetForNewSystem clears invulnerability state', () => {
      usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 2.0 })

      usePlayer.getState().resetForNewSystem()

      const state = usePlayer.getState()
      expect(state.isInvulnerable).toBe(false)
      expect(state.invulnerabilityTimer).toBe(0)
    })
  })
})
