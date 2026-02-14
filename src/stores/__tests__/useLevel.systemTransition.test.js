import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import useEnemies from '../useEnemies.jsx'
import useGame from '../useGame.jsx'
import useWeapons from '../useWeapons.jsx'
import useBoss from '../useBoss.jsx'
import { resetOrbs, spawnOrb, getActiveCount } from '../../systems/xpOrbSystem.js'
import { createSpawnSystem } from '../../systems/spawnSystem.js'
import { createProjectileSystem } from '../../systems/projectileSystem.js'
import { resetParticles, addExplosion, getActiveCount as getParticleActiveCount } from '../../systems/particleSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

/**
 * Story 18.2: System-Specific State Reset
 * Tests that ALL per-system state resets correctly on system transition,
 * while run-persistent state (player build, score, kills) is preserved.
 */

// Simulates the tunnel→gameplay transition block from GameLoop.jsx lines 75-91
function simulateSystemTransition(spawnSystem, projectileSystem) {
  useEnemies.getState().reset()
  useWeapons.getState().clearProjectiles()
  useBoss.getState().reset()
  spawnSystem.reset()
  projectileSystem.reset()
  resetParticles()
  resetOrbs()

  const prevSystemTime = useGame.getState().systemTimer
  if (prevSystemTime > 0) useGame.getState().accumulateTime(prevSystemTime)
  useGame.getState().setSystemTimer(0)

  useLevel.getState().initializePlanets()
}

describe('Story 18.2 — System-Specific State Reset', () => {
  let spawnSystem
  let projectileSystem

  beforeEach(() => {
    useLevel.getState().reset()
    useEnemies.getState().reset()
    useGame.getState().reset()
    useWeapons.getState().initializeWeapons()
    useBoss.getState().reset()
    resetOrbs()
    resetParticles()
    spawnSystem = createSpawnSystem()
    projectileSystem = createProjectileSystem()
  })

  describe('AC #1: System timer resets (useGame.systemTimer)', () => {
    it('resets systemTimer to 0 after transition', () => {
      useGame.getState().setSystemTimer(300)
      simulateSystemTransition(spawnSystem, projectileSystem)
      expect(useGame.getState().systemTimer).toBe(0)
    })

    it('accumulates previous system time into totalElapsedTime before resetting', () => {
      useGame.getState().setSystemTimer(250)
      simulateSystemTransition(spawnSystem, projectileSystem)
      expect(useGame.getState().totalElapsedTime).toBe(250)
      expect(useGame.getState().systemTimer).toBe(0)
    })

    it('timer counts up from 0 after reset', () => {
      useGame.getState().setSystemTimer(400)
      simulateSystemTransition(spawnSystem, projectileSystem)

      // Simulate a few frames of gameplay
      const delta = 1.0
      useGame.getState().setSystemTimer(useGame.getState().systemTimer + delta)
      expect(useGame.getState().systemTimer).toBeCloseTo(1.0)
    })

    it('does not accumulate if previous timer was 0 (first system)', () => {
      expect(useGame.getState().systemTimer).toBe(0)
      simulateSystemTransition(spawnSystem, projectileSystem)
      expect(useGame.getState().totalElapsedTime).toBe(0)
    })
  })

  describe('AC #2: Enemy state reset', () => {
    it('clears all enemies after transition', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      useEnemies.getState().spawnEnemy('FODDER_TANK', 30, 40)
      expect(useEnemies.getState().enemies.length).toBe(2)

      simulateSystemTransition(spawnSystem, projectileSystem)

      expect(useEnemies.getState().enemies).toEqual([])
      expect(useEnemies.getState().nextId).toBe(0)
    })

    it('allows spawning new enemies after reset', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      simulateSystemTransition(spawnSystem, projectileSystem)

      useEnemies.getState().spawnEnemy('FODDER_BASIC', 50, 60)
      expect(useEnemies.getState().enemies.length).toBe(1)
      expect(useEnemies.getState().enemies[0].id).toBe('enemy_0')
    })
  })

  describe('AC #3: XP orb reset', () => {
    it('clears all active orbs after transition', () => {
      spawnOrb(10, 20, 5)
      spawnOrb(30, 40, 10)
      expect(getActiveCount()).toBe(2)

      simulateSystemTransition(spawnSystem, projectileSystem)

      expect(getActiveCount()).toBe(0)
    })
  })

  describe('AC #4: Wormhole state reset (via advanceSystem)', () => {
    it('resets wormhole to hidden after advanceSystem', () => {
      useLevel.setState({
        wormholeState: 'active',
        wormhole: { x: 50, z: 50 },
        wormholeActivationTimer: 1.5,
      })

      useLevel.getState().advanceSystem()

      const state = useLevel.getState()
      expect(state.wormholeState).toBe('hidden')
      expect(state.wormhole).toBeNull()
      expect(state.wormholeActivationTimer).toBe(0)
    })
  })

  describe('AC #5: Planet state reset (via advanceSystem + initializePlanets)', () => {
    it('clears planets and activeScanPlanetId via advanceSystem', () => {
      useLevel.getState().initializePlanets()
      useLevel.setState({ activeScanPlanetId: 'PLANET_GOLD_0' })
      expect(useLevel.getState().planets.length).toBeGreaterThan(0)

      useLevel.getState().advanceSystem()

      expect(useLevel.getState().planets).toEqual([])
      expect(useLevel.getState().activeScanPlanetId).toBeNull()
    })

    it('generates new planets after initializePlanets', () => {
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().planets).toEqual([])

      useLevel.getState().initializePlanets()
      expect(useLevel.getState().planets.length).toBeGreaterThan(0)
    })
  })

  describe('AC #6: Spawn system reset', () => {
    it('resets spawn timer and elapsed time after heavy use', () => {
      // Heavily advance the spawn system so elapsedTime is large and spawn interval has ramped down
      for (let i = 0; i < 20; i++) {
        spawnSystem.tick(10.0, 0, 0, 1.0)
      }
      // After 200s of elapsed time, spawns come much faster due to ramp
      // A tick of SPAWN_INTERVAL_BASE should produce spawns in a ramped system
      const preResetSpawns = spawnSystem.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE, 0, 0, 1.0)
      expect(preResetSpawns.length).toBeGreaterThan(0)

      // After reset, the system should behave like a fresh one
      spawnSystem.reset()

      // A fresh system needs SPAWN_INTERVAL_BASE to elapse before first spawn
      // A small tick should NOT produce spawns
      const postResetSpawns = spawnSystem.tick(0.01, 0, 0, 1.0)
      expect(postResetSpawns).toEqual([])
    })
  })

  describe('AC #7: Projectile and particle reset', () => {
    it('clears all projectiles via clearProjectiles', () => {
      // Fire some projectiles
      useWeapons.getState().tick(10, [0, 0, 0], 0, {})
      expect(useWeapons.getState().projectiles.length).toBeGreaterThan(0)

      useWeapons.getState().clearProjectiles()

      expect(useWeapons.getState().projectiles).toEqual([])
    })

    it('preserves active weapons after clearProjectiles (not initializeWeapons)', () => {
      useWeapons.getState().addWeapon('SPREAD_SHOT')
      expect(useWeapons.getState().activeWeapons.length).toBe(2)

      useWeapons.getState().clearProjectiles()

      // Weapons should still be there
      expect(useWeapons.getState().activeWeapons.length).toBe(2)
    })

    it('clears all active particles via resetParticles', () => {
      addExplosion(10, 20, '#ff0000')
      expect(getParticleActiveCount()).toBeGreaterThan(0)

      resetParticles()

      expect(getParticleActiveCount()).toBe(0)
    })
  })

  describe('AC #8: Boss state reset', () => {
    it('clears all boss state after reset', () => {
      useBoss.getState().spawnBoss(1)
      expect(useBoss.getState().boss).not.toBeNull()
      expect(useBoss.getState().isActive).toBe(true)

      useBoss.getState().reset()

      const state = useBoss.getState()
      expect(state.boss).toBeNull()
      expect(state.bossProjectiles).toEqual([])
      expect(state.isActive).toBe(false)
      expect(state.bossDefeated).toBe(false)
    })
  })

  describe('advanceSystem boundary', () => {
    it('does not exceed MAX_SYSTEMS', () => {
      for (let i = 0; i < 10; i++) {
        useLevel.getState().advanceSystem()
      }
      expect(useLevel.getState().currentSystem).toBe(GAME_CONFIG.MAX_SYSTEMS)
    })
  })

  describe('Full transition flow integration', () => {
    it('resets all per-system state in correct sequence', () => {
      // Dirty all per-system state
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      useEnemies.getState().spawnEnemy('FODDER_TANK', 30, 40)
      spawnOrb(15, 25, 8)
      spawnOrb(35, 45, 12)
      useGame.getState().setSystemTimer(300)
      useGame.getState().addScore(500)
      useGame.getState().incrementKills()
      useLevel.getState().initializePlanets()
      useLevel.setState({
        difficulty: 3,
        wormholeState: 'active',
        wormhole: { x: 50, z: 50 },
        activeScanPlanetId: 'PLANET_SILVER_0',
      })
      useBoss.getState().spawnBoss(1)
      useWeapons.getState().tick(10, [0, 0, 0], 0, {})

      // Simulate TunnelHub calling advanceSystem (before phase change)
      useLevel.getState().advanceSystem()

      // Simulate GameLoop transition block (after phase change)
      simulateSystemTransition(spawnSystem, projectileSystem)

      // Verify all per-system state is clean
      expect(useEnemies.getState().enemies).toEqual([])
      expect(useEnemies.getState().nextId).toBe(0)
      expect(getActiveCount()).toBe(0)
      expect(useGame.getState().systemTimer).toBe(0)
      expect(useGame.getState().totalElapsedTime).toBe(300)
      expect(useLevel.getState().wormholeState).toBe('hidden')
      expect(useLevel.getState().wormhole).toBeNull()
      expect(useLevel.getState().activeScanPlanetId).toBeNull()
      expect(useLevel.getState().difficulty).toBe(1)
      expect(useBoss.getState().boss).toBeNull()
      expect(useWeapons.getState().projectiles).toEqual([])

      // Verify run-persistent state is preserved
      expect(useGame.getState().score).toBe(500)
      expect(useGame.getState().kills).toBe(1)

      // Verify new planets are initialized
      expect(useLevel.getState().planets.length).toBeGreaterThan(0)

      // Verify system incremented
      expect(useLevel.getState().currentSystem).toBe(2)
    })

    it('works correctly for System 2 → System 3 transition', () => {
      // Advance to system 2
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(2)

      // Dirty state again
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      useGame.getState().setSystemTimer(200)

      // Transition to system 3
      useLevel.getState().advanceSystem()
      simulateSystemTransition(spawnSystem, projectileSystem)

      expect(useLevel.getState().currentSystem).toBe(3)
      expect(useEnemies.getState().enemies).toEqual([])
      expect(useGame.getState().systemTimer).toBe(0)
      expect(useGame.getState().totalElapsedTime).toBe(200)
    })
  })
})
