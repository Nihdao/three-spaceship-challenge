import { describe, it, expect, beforeEach, vi } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'
import * as xpOrbSystem from '../../systems/xpOrbSystem.js'
import * as fragmentGemSystem from '../../systems/fragmentGemSystem.js'

/**
 * Story 22.4: Tough Boss Overhaul Tests
 *
 * Tests boss HP configuration, system scaling, wave persistence,
 * loot drops, and wormhole reactivation.
 */
describe('useEnemies - Boss System (Story 22.4)', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
    useLevel.getState().reset()
  })

  describe('Task 1: Boss HP and Scaling Configuration', () => {
    it('should have BOSS_BASE_HP constant defined', () => {
      expect(GAME_CONFIG.BOSS_BASE_HP).toBeDefined()
      expect(GAME_CONFIG.BOSS_BASE_HP).toBe(20000)
    })

    it('should have BOSS_SCALE_MULTIPLIER constant defined', () => {
      expect(GAME_CONFIG.BOSS_SCALE_MULTIPLIER).toBeDefined()
      expect(GAME_CONFIG.BOSS_SCALE_MULTIPLIER).toBeGreaterThanOrEqual(3)
      expect(GAME_CONFIG.BOSS_SCALE_MULTIPLIER).toBeLessThanOrEqual(5)
    })

    it('should have BOSS_LOOT_FRAGMENTS constant defined', () => {
      expect(GAME_CONFIG.BOSS_LOOT_FRAGMENTS).toBeDefined()
      expect(GAME_CONFIG.BOSS_LOOT_FRAGMENTS).toBeGreaterThan(0)
    })

    it('should have BOSS_LOOT_XP_MULTIPLIER constant defined', () => {
      expect(GAME_CONFIG.BOSS_LOOT_XP_MULTIPLIER).toBeDefined()
      expect(GAME_CONFIG.BOSS_LOOT_XP_MULTIPLIER).toBeGreaterThan(1)
    })

    it('should have BOSS_EXPLOSION_SCALE constant defined', () => {
      expect(GAME_CONFIG.BOSS_EXPLOSION_SCALE).toBeDefined()
      expect(GAME_CONFIG.BOSS_EXPLOSION_SCALE).toBeGreaterThan(1)
    })
  })

  describe('Task 2: Boss Spawn Without Enemy Clearing', () => {
    it('should spawn boss without clearing existing enemies', () => {
      // Spawn regular enemies
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 0)
      useEnemies.getState().spawnEnemy('FODDER_TANK', 15, 0)

      const enemyCountBefore = useEnemies.getState().enemies.length
      expect(enemyCountBefore).toBe(2)

      // Spawn boss
      useEnemies.getState().spawnBoss()

      const enemyCountAfter = useEnemies.getState().enemies.length
      expect(enemyCountAfter).toBe(3) // 2 regular + 1 boss

      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()
      expect(boss.typeId).toBe('BOSS_SPACESHIP')
    })

    it('should keep isBoss flag on boss entity', () => {
      useEnemies.getState().spawnBoss()

      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()
      expect(boss.isBoss).toBe(true)
    })
  })

  describe('Task 3: Boss HP Scaling Across Systems', () => {
    it('should spawn boss with base HP in System 1', () => {
      useLevel.getState().setSystemNumber(1)
      useEnemies.getState().spawnBoss()

      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()
      expect(boss.hp).toBe(GAME_CONFIG.BOSS_BASE_HP * 1.0) // No scaling
      expect(boss.maxHp).toBe(GAME_CONFIG.BOSS_BASE_HP * 1.0)
    })

    it('should scale boss HP by 1.5x in System 2', () => {
      useLevel.getState().setSystemNumber(2)
      useEnemies.getState().spawnBoss()

      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()
      expect(boss.hp).toBe(GAME_CONFIG.BOSS_BASE_HP * 1.5) // System 2 scaling
      expect(boss.maxHp).toBe(GAME_CONFIG.BOSS_BASE_HP * 1.5)
    })

    it('should scale boss HP by 2.2x in System 3', () => {
      useLevel.getState().setSystemNumber(3)
      useEnemies.getState().spawnBoss()

      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()
      // Math.round() is used in implementation, so expect rounded value
      expect(boss.hp).toBe(Math.round(GAME_CONFIG.BOSS_BASE_HP * 2.2)) // System 3 scaling
      expect(boss.maxHp).toBe(Math.round(GAME_CONFIG.BOSS_BASE_HP * 2.2))
    })
  })

  describe('Task 4: Boss Defeat Loot Drops', () => {
    it('should drop guaranteed Fragments on boss defeat', () => {
      useEnemies.getState().spawnBoss()
      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()

      // Spy on fragment gem spawn function
      const spawnGemSpy = vi.spyOn(fragmentGemSystem, 'spawnGem')

      // Kill boss
      useEnemies.getState().killEnemy(boss.id)

      // Verify fragment drops were called (50 times for BOSS_LOOT_FRAGMENTS)
      expect(spawnGemSpy).toHaveBeenCalledTimes(GAME_CONFIG.BOSS_LOOT_FRAGMENTS)
    })

    it('should drop large XP reward on boss defeat', () => {
      useEnemies.getState().spawnBoss()
      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()

      // Spy on XP orb spawn function
      const spawnOrbSpy = vi.spyOn(xpOrbSystem, 'spawnOrb')

      // Kill boss
      useEnemies.getState().killEnemy(boss.id)

      // Verify XP orbs were spawned
      expect(spawnOrbSpy).toHaveBeenCalled()
      // Boss spawns 10 XP orbs, each with (xpReward * BOSS_LOOT_XP_MULTIPLIER) / 10
      expect(spawnOrbSpy).toHaveBeenCalledTimes(10)
      // Check that each orb has the correct amount
      const firstCall = spawnOrbSpy.mock.calls[0]
      const xpPerOrb = firstCall[2] // third argument is XP amount
      expect(xpPerOrb).toBe((boss.xpReward * GAME_CONFIG.BOSS_LOOT_XP_MULTIPLIER) / 10)
    })
  })

  describe('Task 5: Wormhole Reactivation After Boss Defeat', () => {
    it('should reactivate wormhole when boss is defeated', () => {
      useEnemies.getState().spawnBoss()
      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()

      // Check initial wormhole state
      const initialState = useLevel.getState().wormholeState

      // Kill boss
      useEnemies.getState().killEnemy(boss.id)

      // Verify wormhole was reactivated
      const newState = useLevel.getState().wormholeState
      expect(newState).toBe('reactivated')
    })
  })

  describe('Task 6: Wave Enemies Persist After Boss Defeat', () => {
    it('should NOT clear enemies after boss defeat', () => {
      // Spawn enemies + boss
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 0)
      useEnemies.getState().spawnEnemy('FODDER_TANK', 15, 0)
      useEnemies.getState().spawnBoss()

      expect(useEnemies.getState().enemies.length).toBe(3)

      const boss = useEnemies.getState().enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()

      // Kill boss
      useEnemies.getState().killEnemy(boss.id)

      // 2 regular enemies should remain
      const remainingEnemies = useEnemies.getState().enemies
      expect(remainingEnemies.length).toBe(2)
      expect(remainingEnemies.some((e) => e.isBoss)).toBe(false)
      expect(remainingEnemies.every((e) => e.typeId !== 'BOSS_SPACESHIP')).toBe(true)
    })
  })

  describe('Task 3: Boss Model and Visual Integration', () => {
    it('should reference SpaceshipBoss enemy definition', () => {
      expect(ENEMIES.BOSS_SPACESHIP).toBeDefined()
      expect(ENEMIES.BOSS_SPACESHIP.id).toBe('BOSS_SPACESHIP')
    })

    it('should have larger meshScale than regular enemies', () => {
      const boss = ENEMIES.BOSS_SPACESHIP
      const regularEnemy = ENEMIES.FODDER_BASIC

      // Boss should be scaled up (configured to be 3-5x)
      const bossScale = boss.meshScale[0]
      const regularScale = regularEnemy.meshScale[0]

      expect(bossScale).toBeGreaterThan(regularScale * 3)
    })

    it('should have isBoss flag in enemy definition', () => {
      expect(ENEMIES.BOSS_SPACESHIP.isBoss).toBe(true)
    })
  })
})
