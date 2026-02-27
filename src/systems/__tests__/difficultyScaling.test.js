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

  // Story 16.4 — SYSTEM_DIFFICULTY_MULTIPLIERS removed (replaced by ENEMY_SCALING_PER_SYSTEM)
  describe('SYSTEM_DIFFICULTY_MULTIPLIERS removed (Story 16.4)', () => {
    it('SYSTEM_DIFFICULTY_MULTIPLIERS no longer exists in config', () => {
      expect(GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS).toBeUndefined()
    })
  })

  // Story 16.4 — per-stat enemy scaling config
  describe('ENEMY_SCALING_PER_SYSTEM config (Story 16.4)', () => {
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

    it('System 2 scaling matches AC #1 values (hp=1.5x, damage=1.5x, speed=1.25x, xpReward=1.3x)', () => {
      const s2 = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      expect(s2.hp).toBe(1.5)
      expect(s2.damage).toBe(1.5)
      expect(s2.speed).toBe(1.25)
      expect(s2.xpReward).toBe(1.3)
    })

    it('System 3 scaling matches AC #2 values (hp=2.2x, damage=2.2x, speed=1.5x, xpReward=1.8x)', () => {
      const s3 = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      expect(s3.hp).toBe(2.2)
      expect(s3.damage).toBe(2.2)
      expect(s3.speed).toBe(1.5)
      expect(s3.xpReward).toBe(1.8)
    })
  })

  // Story 16.4 — per-stat enemy spawn scaling
  describe('enemy per-stat scaling via spawnEnemies (Story 16.4)', () => {
    it('spawns FODDER_BASIC with System 2 scaling — hp=21, damage=8, speed=21.25, xpReward=16', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(21)       // 14 * 1.5
      expect(enemy.damage).toBe(8)     // round(5 * 1.5) = 7.5 → 8
      expect(enemy.speed).toBeCloseTo(21.25) // 17 * 1.25
      expect(enemy.xpReward).toBe(16)  // round(12 * 1.3) = 15.6 → 16
    })

    it('spawns FODDER_BASIC with System 3 scaling — hp=31, damage=11, speed=25.5, xpReward=22', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(31)        // 14 * 2.2 = 30.8 → 31
      expect(enemy.damage).toBe(11)    // round(5 * 2.2)
      expect(enemy.speed).toBeCloseTo(25.5) // 17 * 1.5
      expect(enemy.xpReward).toBe(22)  // round(12 * 1.8) = 21.6 → 22
    })

    it('spawns FODDER_BASIC with System 1 scaling — base stats unchanged', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(14)
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
      expect(enemy.hp).toBe(14)
      expect(enemy.damage).toBe(5)
      expect(enemy.speed).toBe(17)
      expect(enemy.xpReward).toBe(12)
    })

    it('spawns enemies with difficultyMult 1.5 — uniform scaling across all stats', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.5 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(21)        // round(14 * 1.5)
      expect(enemy.damage).toBe(8)     // round(5 * 1.5)
      expect(enemy.speed).toBeCloseTo(25.5) // 17 * 1.5
      expect(enemy.xpReward).toBe(18)  // round(12 * 1.5)
    })

    it('spawns enemies with 1.3x difficulty (legacy)', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.3 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(Math.round(14 * 1.3))
      expect(enemy.damage).toBe(Math.round(5 * 1.3))
      expect(enemy.speed).toBeCloseTo(17 * 1.3)
    })

    it('spawns enemies with 1.6x difficulty (legacy)', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.6 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(Math.round(14 * 1.6))
      expect(enemy.damage).toBe(Math.round(5 * 1.6))
      expect(enemy.speed).toBeCloseTo(17 * 1.6)
    })

    it('defaults to 1.0 when neither scaling nor difficultyMult is provided', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(14)
      expect(enemy.damage).toBe(5)
      expect(enemy.speed).toBe(17)
      expect(enemy.xpReward).toBe(12)
    })
  })

  // Story 16.4 — multi-type scaling verification
  describe('per-stat scaling across enemy types (Story 16.4)', () => {
    it('FODDER_TANK with System 2 scaling — hp=41, damage=8, speed=15, xpReward=20', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_TANK', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(41)        // round(27 * 1.5) = 40.5 → 41
      expect(enemy.damage).toBe(8)     // round(5 * 1.5)
      expect(enemy.speed).toBeCloseTo(15) // 12 * 1.25
      expect(enemy.xpReward).toBe(20)  // round(15 * 1.3) = 19.5 → 20
    })

    it('SNIPER_FIXED with System 2 scaling — zero damage/speed stay zero', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'SNIPER_FIXED', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(11)        // round(7 * 1.5) = 10.5 → 11
      expect(enemy.damage).toBe(0)     // round(0 * 1.5) = 0
      expect(enemy.speed).toBe(0)      // 0 * 1.25 = 0
      expect(enemy.xpReward).toBe(39)  // round(30 * 1.3)
    })

    it('FODDER_TANK with System 3 scaling — hp=59, damage=11, speed=18, xpReward=27', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_TANK', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(59)       // round(27 * 2.2) = 59.4 → 59
      expect(enemy.damage).toBe(11)    // round(5 * 2.2)
      expect(enemy.speed).toBeCloseTo(18) // 12 * 1.5
      expect(enemy.xpReward).toBe(27)  // round(15 * 1.8)
    })
  })

  // Story 16.4 — death event carries scaled xpReward (AC #5 pipeline)
  describe('death event xpReward pipeline (Story 16.4 AC #5)', () => {
    it('killed enemy death event carries scaled xpReward from entity', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      const scaledXp = enemy.xpReward // 16 (12 * 1.3 rounded)
      // Kill the enemy
      const result = useEnemies.getState().damageEnemy(enemy.id, 999)
      expect(result.killed).toBe(true)
      expect(result.enemy.xpReward).toBe(scaledXp)
      expect(result.enemy.xpReward).not.toBe(ENEMIES.FODDER_BASIC.xpReward)
    })

    it('batch kill returns death event with minimal fields (x, z, typeId, color)', () => {
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3]
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 5, z: 7, scaling }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.xpReward).toBe(22) // round(12 * 1.8) = 21.6 → 22 — on spawned entity
      const events = useEnemies.getState().damageEnemiesBatch([{ enemyId: enemy.id, damage: 999 }])
      expect(events[0].killed).toBe(true)
      expect(events[0].enemy.x).toBe(5)
      expect(events[0].enemy.z).toBe(7)
      expect(events[0].enemy.typeId).toBe('FODDER_BASIC')
      // Minimal capture guard (Story 43.1 AC3) — xpReward must NOT leak into kill event
      expect(events[0].enemy.xpReward).toBeUndefined()
      expect(events[0].enemy.id).toBeUndefined()
      expect(events[0].enemy.hp).toBeUndefined()
    })
  })

  // spawnEnemy (single) also stores xpReward
  describe('spawnEnemy stores xpReward (Story 16.4)', () => {
    it('single-spawned enemy has xpReward field from base def', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 0, 0)
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.xpReward).toBe(ENEMIES.FODDER_BASIC.xpReward)
    })
  })

  // Boss per-stat scaling (Story 16.4 AC #7)
  describe('boss per-stat scaling (Story 16.4)', () => {
    it('spawns boss at base HP for system 1', () => {
      useBoss.getState().spawnBoss(1)
      const boss = useBoss.getState().boss
      expect(boss.hp).toBe(GAME_CONFIG.BOSS_BASE_HP)
      expect(boss.maxHp).toBe(GAME_CONFIG.BOSS_BASE_HP)
    })

    it('spawns boss with System 2 hp scaling (1.5x HP)', () => {
      useBoss.getState().spawnBoss(2)
      const boss = useBoss.getState().boss
      const expectedHP = Math.round(GAME_CONFIG.BOSS_BASE_HP * 1.5)
      expect(boss.hp).toBe(expectedHP)
      expect(boss.maxHp).toBe(expectedHP)
    })

    it('spawns boss with System 3 hp scaling (2.2x HP)', () => {
      useBoss.getState().spawnBoss(3)
      const boss = useBoss.getState().boss
      const expectedHP = Math.round(GAME_CONFIG.BOSS_BASE_HP * 2.2)
      expect(boss.hp).toBe(expectedHP)
      expect(boss.maxHp).toBe(expectedHP)
    })

    it('stores damage multiplier as damageMultiplier on boss for projectile/contact scaling', () => {
      useBoss.getState().spawnBoss(2)
      expect(useBoss.getState().boss.damageMultiplier).toBe(1.5) // damage multiplier from System 2
    })
  })
})
