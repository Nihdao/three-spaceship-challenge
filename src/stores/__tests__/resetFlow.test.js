import { describe, it, expect, beforeEach } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import useLevel from '../useLevel.jsx'
import usePlayer from '../usePlayer.jsx'
import useWeapons from '../useWeapons.jsx'
import useBoons from '../useBoons.jsx'

/**
 * Integration-style test: simulates the game-over → retry reset flow
 * that GameLoop performs when transitioning to gameplay phase.
 * Mirrors the full store-level reset sequence from GameLoop.jsx lines 62-71.
 * (spawnSystem/projectileSystem/particles/orbs are ref-based systems not testable here)
 */

// Helper: runs the same store-level reset sequence as GameLoop.jsx
function simulateGameLoopReset() {
  useWeapons.getState().initializeWeapons()
  useBoons.getState().reset()
  usePlayer.getState().reset()
  useEnemies.getState().reset()
  useLevel.getState().reset()
  useLevel.getState().initializePlanets()
}

describe('Game-over to retry reset flow', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
    useLevel.getState().reset()
    usePlayer.getState().reset()
    useWeapons.getState().initializeWeapons()
    useBoons.getState().reset()
  })

  it('clears all enemies after simulating a game with enemies present', () => {
    // Simulate a game in progress with enemies
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    useEnemies.getState().spawnEnemy('FODDER_FAST', -5, 15)
    expect(useEnemies.getState().enemies.length).toBe(2)
    expect(useEnemies.getState().nextId).toBe(2)

    // Simulate the GameLoop reset sequence (mirrors GameLoop.jsx)
    simulateGameLoopReset()

    // Verify enemies are cleared
    expect(useEnemies.getState().enemies).toEqual([])
    expect(useEnemies.getState().nextId).toBe(0)
  })

  it('clears all level state including scan progress and wormhole', () => {
    // Simulate a game with dirty level state
    useLevel.getState().initializePlanets()
    useLevel.setState({
      systemTimer: 55,
      difficulty: 3,
      wormholeState: 'visible',
      activeScanPlanetId: 'PLANET_SILVER_0',
    })

    // Simulate the GameLoop reset sequence
    simulateGameLoopReset()

    const state = useLevel.getState()
    expect(state.systemTimer).toBe(0)
    expect(state.difficulty).toBe(1)
    expect(state.wormholeState).toBe('hidden')
    expect(state.activeScanPlanetId).toBeNull()
    // Planets should be re-initialized (not empty)
    expect(state.planets.length).toBeGreaterThan(0)
  })

  it('produces a clean state across multiple retries', () => {
    for (let retry = 0; retry < 3; retry++) {
      // Simulate gameplay: spawn enemies, dirty level state
      useEnemies.getState().spawnEnemy('FODDER_BASIC', retry * 10, retry * 10)
      useLevel.setState({ difficulty: retry + 2, systemTimer: retry * 30 })

      // Simulate reset sequence
      simulateGameLoopReset()

      // Verify fresh state after each retry
      expect(useEnemies.getState().enemies).toEqual([])
      expect(useEnemies.getState().nextId).toBe(0)
      expect(useLevel.getState().systemTimer).toBe(0)
      expect(useLevel.getState().difficulty).toBe(1)
      expect(useLevel.getState().wormholeState).toBe('hidden')
      expect(useLevel.getState().activeScanPlanetId).toBeNull()
    }
  })
})
