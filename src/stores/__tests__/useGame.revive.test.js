import { describe, it, expect, beforeEach } from 'vitest'
import useGame from '../useGame.jsx'

describe('useGame — revive phase (Story 22.1, Task 1)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  describe('enterRevivePhase action', () => {
    it('sets phase to revive', () => {
      useGame.getState().startGameplay()
      useGame.setState({ phase: 'gameplay' })

      useGame.getState().enterRevivePhase()

      expect(useGame.getState().phase).toBe('revive')
    })

    it('pauses the game', () => {
      useGame.getState().startGameplay()

      useGame.getState().enterRevivePhase()

      expect(useGame.getState().isPaused).toBe(true)
    })

    it('can be called from gameplay phase', () => {
      useGame.setState({ phase: 'gameplay', isPaused: false })

      useGame.getState().enterRevivePhase()

      const state = useGame.getState()
      expect(state.phase).toBe('revive')
      expect(state.isPaused).toBe(true)
    })

    it('can be called from boss phase', () => {
      useGame.setState({ phase: 'boss', isPaused: false })

      useGame.getState().enterRevivePhase()

      const state = useGame.getState()
      expect(state.phase).toBe('revive')
      expect(state.isPaused).toBe(true)
    })
  })

  describe('resumeFromRevive action', () => {
    it('returns to gameplay phase', () => {
      useGame.setState({ phase: 'revive', isPaused: true })

      useGame.getState().resumeFromRevive()

      expect(useGame.getState().phase).toBe('gameplay')
    })

    it('unpauses the game', () => {
      useGame.setState({ phase: 'revive', isPaused: true })

      useGame.getState().resumeFromRevive()

      expect(useGame.getState().isPaused).toBe(false)
    })
  })

  describe('revive phase transitions', () => {
    it('full cycle: gameplay → revive → gameplay', () => {
      useGame.setState({ phase: 'gameplay', isPaused: false })

      useGame.getState().enterRevivePhase()
      expect(useGame.getState().phase).toBe('revive')
      expect(useGame.getState().isPaused).toBe(true)

      useGame.getState().resumeFromRevive()
      expect(useGame.getState().phase).toBe('gameplay')
      expect(useGame.getState().isPaused).toBe(false)
    })

    it('can transition to gameover from revive (player declines revive)', () => {
      useGame.setState({ phase: 'revive', isPaused: true })

      useGame.getState().triggerGameOver()

      expect(useGame.getState().phase).toBe('gameOver')
      expect(useGame.getState().isPaused).toBe(true)
    })
  })

  describe('reset and state preservation', () => {
    it('reset clears revive phase back to menu', () => {
      useGame.setState({ phase: 'revive', isPaused: true })

      useGame.getState().reset()

      expect(useGame.getState().phase).toBe('menu')
      expect(useGame.getState().isPaused).toBe(false)
    })

    it('score and systemTimer are preserved during revive', () => {
      useGame.setState({ phase: 'gameplay', score: 5000, systemTimer: 120 })

      useGame.getState().enterRevivePhase()

      const state = useGame.getState()
      expect(state.score).toBe(5000)
      expect(state.systemTimer).toBe(120)
    })

    it('kills are preserved during revive', () => {
      useGame.setState({ kills: 42 })

      useGame.getState().enterRevivePhase()

      expect(useGame.getState().kills).toBe(42)
    })
  })

  describe('returnToMenu from revive phase', () => {
    it('allows returning to menu from revive phase', () => {
      useGame.setState({ phase: 'revive', isPaused: true })

      useGame.getState().returnToMenu()

      expect(useGame.getState().phase).toBe('menu')
      expect(useGame.getState().isPaused).toBe(false)
    })
  })
})
