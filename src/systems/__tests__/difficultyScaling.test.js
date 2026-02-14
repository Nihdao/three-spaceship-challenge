import { describe, it, expect, beforeEach } from 'vitest'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import useEnemies from '../../stores/useEnemies.jsx'
import useBoss from '../../stores/useBoss.jsx'
import useLevel from '../../stores/useLevel.jsx'
import { ENEMIES } from '../../entities/enemyDefs.js'

describe('Difficulty scaling', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
    useBoss.getState().reset()
    useLevel.getState().reset()
  })

  // Story 7.3 — legacy config (kept for boss scaling)
  describe('SYSTEM_DIFFICULTY_MULTIPLIERS config (Story 7.3)', () => {
    it('has multipliers for systems 1-3', () => {
      expect(GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[1]).toBe(1.0)
      expect(GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[2]).toBe(1.3)
      expect(GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[3]).toBe(1.6)
    })
  })

  // Story 18.3 — per-stat enemy scaling config
  describe('ENEMY_SCALING_PER_SYSTEM config (Story 18.3)', () => {
    it('has entries for systems 1, 2, 3 with hp, damage, speed, xpReward keys', () => {
      for (const sys of [1, 2, 3]) {
        const entry = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[sys]
        expect(entry).toBeDefined()
        expect(entry).toHaveProperty('hp')
        expect(entry).toHaveProperty('damage')
        expect(entry).toHaveProperty('speed')
        expect(entry).toHaveProperty('xpReward')
      }
    })

    it('System 1 scaling is all 1.0 (no modification)', () => {
      const s1 = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
      expect(s1.hp).toBe(1.0)
      expect(s1.damage).toBe(1.0)
      expect(s1.speed).toBe(1.0)
      expect(s1.xpReward).toBe(1.0)
    })

    it('System 2 scaling matches AC #1 values', () => {
      const s2 = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      expect(s2.hp).toBe(1.6)
      expect(s2.damage).toBe(1.5)
      expect(s2.speed).toBe(1.3)
      expect(s2.xpReward).toBe(1.4)
    })

    it('System 3 scaling matches AC #1 values', () => {
      const s3 = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      expect(s3.hp).toBe(2.5)
      expect(s3.damage).toBe(2.2)
      expect(s3.speed).toBe(1.6)
      expect(s3.xpReward).toBe(2.0)
    })
  })

  // Story 18.3 — per-stat enemy spawn scaling
  describe('enemy per-stat scaling via spawnEnemies (Story 18.3)', () => {
    it('spawns FODDER_BASIC with System 2 scaling — hp=32, damage=8, speed≈22.1, xpReward=17', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(32)       // 20 * 1.6
      expect(enemy.damage).toBe(8)     // round(5 * 1.5) = 7.5 → 8
      expect(enemy.speed).toBeCloseTo(22.1) // 17 * 1.3
      expect(enemy.xpReward).toBe(17)  // round(12 * 1.4) = 16.8 → 17
    })

    it('spawns FODDER_BASIC with System 3 scaling — hp=50, damage=11, speed≈27.2, xpReward=24', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(50)        // 20 * 2.5
      expect(enemy.damage).toBe(11)    // round(5 * 2.2)
      expect(enemy.speed).toBeCloseTo(27.2) // 17 * 1.6
      expect(enemy.xpReward).toBe(24)  // round(12 * 2.0)
    })

    it('spawns FODDER_BASIC with System 1 scaling — base stats unchanged', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(20)
      expect(enemy.damage).toBe(5)
      expect(enemy.speed).toBe(17)
      expect(enemy.xpReward).toBe(12)
    })

    it('enemy entity has xpReward field after spawn', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy).toHaveProperty('xpReward')
      expect(typeof enemy.xpReward).toBe('number')
    })
  })

  // Backward compatibility — single difficultyMult (number) still works
  describe('backward compatibility — single difficultyMult (Story 18.3 Task 3.4)', () => {
    it('spawns enemies at base stats with difficultyMult 1.0', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.0 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(20)
      expect(enemy.damage).toBe(5)
      expect(enemy.speed).toBe(17)
      expect(enemy.xpReward).toBe(12)
    })

    it('spawns enemies with difficultyMult 1.5 — uniform scaling across all stats', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.5 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(30)        // round(20 * 1.5)
      expect(enemy.damage).toBe(8)     // round(5 * 1.5)
      expect(enemy.speed).toBeCloseTo(25.5) // 17 * 1.5
      expect(enemy.xpReward).toBe(18)  // round(12 * 1.5)
    })

    it('spawns enemies with 1.3x difficulty (legacy)', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.3 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(Math.round(20 * 1.3))
      expect(enemy.damage).toBe(Math.round(5 * 1.3))
      expect(enemy.speed).toBeCloseTo(17 * 1.3)
    })

    it('spawns enemies with 1.6x difficulty (legacy)', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.6 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(Math.round(20 * 1.6))
      expect(enemy.damage).toBe(Math.round(5 * 1.6))
      expect(enemy.speed).toBeCloseTo(17 * 1.6)
    })

    it('defaults to 1.0 when neither scaling nor difficultyMult is provided', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(20)
      expect(enemy.damage).toBe(5)
      expect(enemy.speed).toBe(17)
      expect(enemy.xpReward).toBe(12)
    })
  })

  // Story 18.3 — multi-type scaling verification
  describe('per-stat scaling across enemy types (Story 18.3)', () => {
    it('FODDER_TANK with System 2 scaling — hp=64, damage=8, speed≈15.6, xpReward=21', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_TANK', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(64)        // 40 * 1.6
      expect(enemy.damage).toBe(8)     // round(5 * 1.5)
      expect(enemy.speed).toBeCloseTo(15.6) // 12 * 1.3
      expect(enemy.xpReward).toBe(21)  // round(15 * 1.4)
    })

    it('SNIPER_FIXED with System 2 scaling — zero damage/speed stay zero', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'SNIPER_FIXED', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(16)        // 10 * 1.6
      expect(enemy.damage).toBe(0)     // round(0 * 1.5) = 0
      expect(enemy.speed).toBe(0)      // 0 * 1.3 = 0
      expect(enemy.xpReward).toBe(42)  // round(30 * 1.4)
    })

    it('FODDER_TANK with System 3 scaling — hp=100, damage=11, speed≈19.2, xpReward=30', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_TANK', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(100)       // 40 * 2.5
      expect(enemy.damage).toBe(11)    // round(5 * 2.2)
      expect(enemy.speed).toBeCloseTo(19.2) // 12 * 1.6
      expect(enemy.xpReward).toBe(30)  // round(15 * 2.0)
    })
  })

  // Story 18.3 — death event carries scaled xpReward (AC #5 pipeline)
  describe('death event xpReward pipeline (Story 18.3 AC #5)', () => {
    it('killed enemy death event carries scaled xpReward from entity', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      const scaledXp = enemy.xpReward // 17
      // Kill the enemy
      const result = useEnemies.getState().damageEnemy(enemy.id, 999)
      expect(result.killed).toBe(true)
      expect(result.enemy.xpReward).toBe(scaledXp)
      expect(result.enemy.xpReward).not.toBe(ENEMIES.FODDER_BASIC.xpReward)
    })

    it('batch kill returns death events with scaled xpReward', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      const events = useEnemies.getState().damageEnemiesBatch([{ enemyId: enemy.id, damage: 999 }])
      expect(events[0].killed).toBe(true)
      expect(events[0].enemy.xpReward).toBe(24) // round(12 * 2.0)
    })
  })

  // spawnEnemy (single) also stores xpReward (Task 6)
  describe('spawnEnemy stores xpReward (Story 18.3 Task 6)', () => {
    it('single-spawned enemy has xpReward field from base def', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 0, 0)
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.xpReward).toBe(ENEMIES.FODDER_BASIC.xpReward)
    })
  })

  // Boss scaling still works (untouched by this story)
  describe('boss difficulty scaling (Story 7.3)', () => {
    it('spawns boss at base HP for system 1', () => {
      useBoss.getState().spawnBoss(1)
      const boss = useBoss.getState().boss
      expect(boss.hp).toBe(GAME_CONFIG.BOSS_HP)
      expect(boss.maxHp).toBe(GAME_CONFIG.BOSS_HP)
    })

    it('spawns boss at 1.3x HP for system 2', () => {
      useBoss.getState().spawnBoss(2)
      const boss = useBoss.getState().boss
      const expectedHP = Math.round(GAME_CONFIG.BOSS_HP * 1.3)
      expect(boss.hp).toBe(expectedHP)
      expect(boss.maxHp).toBe(expectedHP)
    })

    it('spawns boss at 1.6x HP for system 3', () => {
      useBoss.getState().spawnBoss(3)
      const boss = useBoss.getState().boss
      const expectedHP = Math.round(GAME_CONFIG.BOSS_HP * 1.6)
      expect(boss.hp).toBe(expectedHP)
      expect(boss.maxHp).toBe(expectedHP)
    })

    it('stores difficultyMult on boss for projectile/contact scaling', () => {
      useBoss.getState().spawnBoss(2)
      expect(useBoss.getState().boss.difficultyMult).toBe(1.3)
    })
  })
})
