import { describe, it, expect, beforeEach } from 'vitest'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import useEnemies from '../../stores/useEnemies.jsx'
import useBoss from '../../stores/useBoss.jsx'
import useLevel from '../../stores/useLevel.jsx'

describe('Difficulty scaling (Story 7.3)', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
    useBoss.getState().reset()
    useLevel.getState().reset()
  })

  describe('SYSTEM_DIFFICULTY_MULTIPLIERS config', () => {
    it('has multipliers for systems 1-3', () => {
      expect(GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[1]).toBe(1.0)
      expect(GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[2]).toBe(1.3)
      expect(GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[3]).toBe(1.6)
    })
  })

  describe('enemy difficulty scaling via spawnEnemies', () => {
    it('spawns enemies at base stats with difficultyMult 1.0', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.0 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(20)
      expect(enemy.damage).toBe(5)
      expect(enemy.speed).toBe(17)
    })

    it('spawns enemies with 1.3x difficulty', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.3 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(Math.round(20 * 1.3))
      expect(enemy.damage).toBe(Math.round(5 * 1.3))
      expect(enemy.speed).toBeCloseTo(17 * 1.3)
    })

    it('spawns enemies with 1.6x difficulty', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0, difficultyMult: 1.6 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(Math.round(20 * 1.6))
      expect(enemy.damage).toBe(Math.round(5 * 1.6))
      expect(enemy.speed).toBeCloseTo(17 * 1.6)
    })

    it('defaults to 1.0 when difficultyMult is not provided', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 0, z: 0 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hp).toBe(20)
      expect(enemy.damage).toBe(5)
      expect(enemy.speed).toBe(17)
    })
  })

  describe('boss difficulty scaling', () => {
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
