import { describe, it, expect, beforeEach } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

describe('useEnemies store', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
  })

  it('should have correct initial state', () => {
    const state = useEnemies.getState()
    expect(state.enemies).toEqual([])
    expect(state.nextId).toBe(0)
  })

  it('should spawn an enemy with correct stats from enemyDefs', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    const state = useEnemies.getState()

    expect(state.enemies.length).toBe(1)

    const e = state.enemies[0]
    expect(e.id).toBe('enemy_0')
    expect(e.typeId).toBe('FODDER_BASIC')
    expect(e.x).toBe(10)
    expect(e.z).toBe(20)
    expect(e.hp).toBe(ENEMIES.FODDER_BASIC.hp)
    expect(e.maxHp).toBe(ENEMIES.FODDER_BASIC.hp)
    expect(e.speed).toBe(ENEMIES.FODDER_BASIC.speed)
    expect(e.damage).toBe(ENEMIES.FODDER_BASIC.damage)
    expect(e.radius).toBe(ENEMIES.FODDER_BASIC.radius)
    expect(e.behavior).toBe('chase')
    expect(e.color).toBe(ENEMIES.FODDER_BASIC.color)
    expect(e.meshScale).toEqual(ENEMIES.FODDER_BASIC.meshScale)
  })

  it('should spawn FODDER_FAST with correct stats', () => {
    useEnemies.getState().spawnEnemy('FODDER_FAST', -5, 15)
    const e = useEnemies.getState().enemies[0]

    expect(e.typeId).toBe('FODDER_FAST')
    expect(e.hp).toBe(ENEMIES.FODDER_FAST.hp)
    expect(e.speed).toBe(ENEMIES.FODDER_FAST.speed)
    expect(e.color).toBe(ENEMIES.FODDER_FAST.color)
    expect(e.meshScale).toEqual(ENEMIES.FODDER_FAST.meshScale)
  })

  it('should generate unique IDs across spawns', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 0, 0)
    useEnemies.getState().spawnEnemy('FODDER_FAST', 10, 10)
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 20, 20)

    const enemies = useEnemies.getState().enemies
    const ids = enemies.map((e) => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should respect MAX_ENEMIES_ON_SCREEN cap', () => {
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN + 10; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, i)
    }

    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
  })

  it('should silently skip spawn when at cap', () => {
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, i)
    }

    // Attempt to spawn one more
    useEnemies.getState().spawnEnemy('FODDER_FAST', 999, 999)

    const enemies = useEnemies.getState().enemies
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    expect(enemies.find((e) => e.x === 999)).toBeUndefined()
  })

  it('should batch spawn enemies in a single set() call', () => {
    const instructions = [
      { typeId: 'FODDER_BASIC', x: 10, z: 20 },
      { typeId: 'FODDER_FAST', x: 30, z: 40 },
      { typeId: 'FODDER_BASIC', x: 50, z: 60 },
    ]

    useEnemies.getState().spawnEnemies(instructions)

    const state = useEnemies.getState()
    expect(state.enemies.length).toBe(3)
    expect(state.enemies[0].typeId).toBe('FODDER_BASIC')
    expect(state.enemies[1].typeId).toBe('FODDER_FAST')
    expect(state.enemies[2].typeId).toBe('FODDER_BASIC')
    expect(state.nextId).toBe(3)
  })

  it('should respect MAX cap in batch spawn', () => {
    // Fill to near cap
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN - 1; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, i)
    }

    const instructions = [
      { typeId: 'FODDER_FAST', x: 100, z: 100 },
      { typeId: 'FODDER_FAST', x: 200, z: 200 },
      { typeId: 'FODDER_FAST', x: 300, z: 300 },
    ]

    useEnemies.getState().spawnEnemies(instructions)

    // Only 1 slot was available
    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
  })

  it('should move enemies toward player position on tick (chase behavior)', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 100, 0)
    const playerPosition = [0, 0, 0]

    useEnemies.getState().tick(1.0, playerPosition)

    const e = useEnemies.getState().enemies[0]
    // Enemy should have moved toward player (x=0), so x should be less than 100
    expect(e.x).toBeLessThan(100)
    // Enemy at (100,0) chasing (0,0) should only move on x axis
    expect(e.z).toBeCloseTo(0, 5)
  })

  it('should move enemies at correct speed', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 100, 0)
    const playerPosition = [0, 0, 0]
    const delta = 0.5

    useEnemies.getState().tick(delta, playerPosition)

    const e = useEnemies.getState().enemies[0]
    const expectedX = 100 - ENEMIES.FODDER_BASIC.speed * delta
    expect(e.x).toBeCloseTo(expectedX, 1)
  })

  it('should clamp enemy positions to play area', () => {
    const bound = GAME_CONFIG.PLAY_AREA_SIZE
    // Spawn enemy far away with massive delta to push beyond bounds
    useEnemies.getState().spawnEnemy('FODDER_BASIC', bound - 1, 0)
    const playerPosition = [bound + 1000, 0, 0]

    useEnemies.getState().tick(100, playerPosition)

    const e = useEnemies.getState().enemies[0]
    expect(e.x).toBeLessThanOrEqual(bound)
    expect(e.z).toBeGreaterThanOrEqual(-bound)
  })

  it('should kill enemy and remove from array', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    useEnemies.getState().spawnEnemy('FODDER_FAST', 30, 40)

    const id = useEnemies.getState().enemies[0].id
    useEnemies.getState().killEnemy(id)

    const state = useEnemies.getState()
    expect(state.enemies.length).toBe(1)
    expect(state.enemies[0].typeId).toBe('FODDER_FAST')
  })

  it('should handle killEnemy with non-existent id gracefully', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    useEnemies.getState().killEnemy('nonexistent_id')
    expect(useEnemies.getState().enemies.length).toBe(1)
  })

  it('should reset all enemies and state', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    useEnemies.getState().spawnEnemy('FODDER_FAST', 30, 40)

    useEnemies.getState().reset()

    const state = useEnemies.getState()
    expect(state.enemies).toEqual([])
    expect(state.nextId).toBe(0)
  })

  it('should not tick when no enemies exist', () => {
    // Should not throw
    useEnemies.getState().tick(1.0, [0, 0, 0])
    expect(useEnemies.getState().enemies).toEqual([])
  })

  it('should ignore invalid typeId on spawn', () => {
    useEnemies.getState().spawnEnemy('INVALID_TYPE', 10, 20)
    expect(useEnemies.getState().enemies.length).toBe(0)
  })
})
