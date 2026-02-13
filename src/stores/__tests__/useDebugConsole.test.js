import { describe, it, expect, beforeEach } from 'vitest'
import useDebugConsole from '../useDebugConsole.jsx'
import usePlayer from '../usePlayer.jsx'
import useWeapons from '../useWeapons.jsx'
import useBoons from '../useBoons.jsx'
import useEnemies from '../useEnemies.jsx'

describe('useDebugConsole store', () => {
  beforeEach(() => {
    useDebugConsole.getState().reset()
    usePlayer.getState().reset()
    useWeapons.getState().reset()
    useBoons.getState().reset()
    useEnemies.getState().reset()
  })

  describe('initial state', () => {
    it('starts closed with empty history', () => {
      const state = useDebugConsole.getState()
      expect(state.isOpen).toBe(false)
      expect(state.commandHistory).toEqual([])
    })
  })

  describe('toggleConsole', () => {
    it('toggles isOpen state', () => {
      useDebugConsole.getState().toggleConsole()
      expect(useDebugConsole.getState().isOpen).toBe(true)

      useDebugConsole.getState().toggleConsole()
      expect(useDebugConsole.getState().isOpen).toBe(false)
    })
  })

  describe('runCommand', () => {
    it('executes command and adds to history', () => {
      useDebugConsole.getState().runCommand('help')
      const history = useDebugConsole.getState().commandHistory
      expect(history.length).toBe(1)
      expect(history[0].input).toBe('help')
      expect(history[0].success).toBe(true)
      expect(history[0].output).toContain('Available commands')
    })

    it('records failed commands in history', () => {
      useDebugConsole.getState().runCommand('invalidcmd')
      const history = useDebugConsole.getState().commandHistory
      expect(history.length).toBe(1)
      expect(history[0].success).toBe(false)
    })

    it('keeps max 10 history entries', () => {
      for (let i = 0; i < 15; i++) {
        useDebugConsole.getState().runCommand('help')
      }
      expect(useDebugConsole.getState().commandHistory.length).toBe(10)
    })
  })

  describe('clearHistory', () => {
    it('clears command history', () => {
      useDebugConsole.getState().runCommand('help')
      useDebugConsole.getState().runCommand('help')
      expect(useDebugConsole.getState().commandHistory.length).toBe(2)

      useDebugConsole.getState().clearHistory()
      expect(useDebugConsole.getState().commandHistory).toEqual([])
    })
  })

  describe('reset', () => {
    it('resets all state', () => {
      useDebugConsole.getState().toggleConsole()
      useDebugConsole.getState().runCommand('help')

      useDebugConsole.getState().reset()
      const state = useDebugConsole.getState()
      expect(state.isOpen).toBe(false)
      expect(state.commandHistory).toEqual([])
    })
  })
})
