import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

// Temporary ELITE enemy type for eviction protection tests
const ELITE_TYPE = '_TEST_ELITE_GUARD'
ENEMIES[ELITE_TYPE] = { ...ENEMIES.FODDER_BASIC, tier: 'ELITE' }
afterAll(() => { delete ENEMIES[ELITE_TYPE] })

// Fill the pool to capacity with regular FODDER_BASIC enemies.
// After this: enemies[0].id === 'enemy_0' (oldest), enemies[99].id === 'enemy_99' (newest).
function fillPool() {
  for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN; i++) {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', i, 0)
  }
}

describe('useEnemies pool eviction on overflow (Story 36.2)', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
  })

  // AC #1 — pool full + 1 new instruction → 1 oldest evicted, 1 new spawned, total = 100
  it('evicts 1 oldest enemy when pool full and 1 new instruction given', () => {
    fillPool()
    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)

    useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 999, z: 999 }])

    const enemies = useEnemies.getState().enemies
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    expect(enemies.find(e => e.x === 999 && e.z === 999)).toBeDefined()
  })

  // AC #1 — "oldest" = lowest numeric ID suffix
  it('removes the enemy with the lowest numeric ID suffix (enemy_0) first', () => {
    fillPool()
    expect(useEnemies.getState().enemies[0].id).toBe('enemy_0')

    useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 999, z: 999 }])

    const enemies = useEnemies.getState().enemies
    expect(enemies.find(e => e.id === 'enemy_0')).toBeUndefined()
    // enemy_1 through enemy_99 should still be present
    expect(enemies.find(e => e.id === 'enemy_1')).toBeDefined()
    expect(enemies.find(e => e.id === 'enemy_99')).toBeDefined()
  })

  // AC #1/#3 — pool full + 5 new instructions → 5 oldest evicted, 5 new spawned, total = 100
  it('evicts 5 oldest enemies when pool full and 5 new instructions given', () => {
    fillPool()

    const instructions = Array.from({ length: 5 }, (_, i) => ({
      typeId: 'FODDER_BASIC', x: 500 + i, z: 500,
    }))
    useEnemies.getState().spawnEnemies(instructions)

    const enemies = useEnemies.getState().enemies
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    // enemy_0 through enemy_4 should be evicted
    for (let i = 0; i < 5; i++) {
      expect(enemies.find(e => e.id === `enemy_${i}`)).toBeUndefined()
    }
    // enemy_5 through enemy_99 should still be present
    expect(enemies.find(e => e.id === 'enemy_5')).toBeDefined()
    expect(enemies.find(e => e.id === 'enemy_99')).toBeDefined()
    // All 5 new enemies should be present
    expect(enemies.filter(e => e.z === 500 && e.x >= 500 && e.x <= 504)).toHaveLength(5)
  })

  // AC #5 — boss enemies are never evicted
  it('does NOT evict enemies with behavior === boss', () => {
    // Fill 99 slots with regular enemies
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN - 1; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, 0)
    }
    // Prepend a fake boss enemy (lowest numeric ID concept → "oldest")
    // using setState to inject directly
    const existingEnemies = useEnemies.getState().enemies
    useEnemies.setState({
      enemies: [
        {
          id: 'enemy_fake_boss',
          typeId: 'FODDER_BASIC',
          x: -999, z: -999,
          hp: 9999, maxHp: 9999,
          speed: 0, damage: 0, radius: 1,
          behavior: 'boss',
          color: '#ff0000', meshScale: 1,
          xpReward: 0,
          lastHitTime: -Infinity, hitFlashTimer: 0,
        },
        ...existingEnemies,
      ],
    })
    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)

    // Spawn 1 more — boss must NOT be evicted; enemy_0 should be evicted instead
    useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 777, z: 777 }])

    const enemies = useEnemies.getState().enemies
    expect(enemies.find(e => e.id === 'enemy_fake_boss')).toBeDefined()
    expect(enemies.find(e => e.x === 777 && e.z === 777)).toBeDefined()
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
  })

  // AC #5/#6 — when all enemies are protected, new batch is not spawned at all
  it('spawns no new enemies when pool full and all enemies are boss-protected', () => {
    const bossEnemies = Array.from({ length: GAME_CONFIG.MAX_ENEMIES_ON_SCREEN }, (_, i) => ({
      id: `enemy_${i}`,
      typeId: 'FODDER_BASIC',
      x: i, z: 0,
      hp: 10, maxHp: 10,
      speed: 0, damage: 0, radius: 1,
      behavior: 'boss',
      color: '#ff0000', meshScale: 1,
      xpReward: 0,
      lastHitTime: -Infinity, hitFlashTimer: 0,
    }))
    useEnemies.setState({ enemies: bossEnemies })

    useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 888, z: 888 }])

    const enemies = useEnemies.getState().enemies
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    expect(enemies.find(e => e.x === 888 && e.z === 888)).toBeUndefined()
  })

  // AC #2 — evicted enemies produce NO _teleportEvents
  it('does not push _teleportEvents when evicting enemies', () => {
    fillPool()

    useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 999, z: 999 }])

    const events = useEnemies.getState().consumeTeleportEvents()
    expect(events.length).toBe(0)
  })

  // AC #1/#2 — enemies.length stays exactly at MAX after eviction+spawn
  it('enemies.length stays at MAX_ENEMIES_ON_SCREEN after eviction and spawn', () => {
    fillPool()

    const instructions = Array.from({ length: 10 }, (_, i) => ({
      typeId: 'FODDER_BASIC', x: 600 + i, z: 600,
    }))
    useEnemies.getState().spawnEnemies(instructions)

    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
  })

  // AC #6 — partial batch: fewer evictable than instructions.length → only evictable count spawned
  it('spawns only as many new enemies as evictable slots when fewer evictable exist than instructions', () => {
    // Fill 95 slots with boss-protected enemies
    const bossEnemies = Array.from({ length: 95 }, (_, i) => ({
      id: `enemy_${i}`,
      typeId: 'FODDER_BASIC',
      x: i, z: 0,
      hp: 10, maxHp: 10,
      speed: 0, damage: 0, radius: 1,
      behavior: 'boss',
      color: '#ff0000', meshScale: 1,
      xpReward: 0,
      lastHitTime: -Infinity, hitFlashTimer: 0,
    }))
    useEnemies.setState({ enemies: bossEnemies, nextId: 95 })
    // Fill remaining 5 slots with regular (evictable) enemies
    for (let i = 0; i < 5; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 200 + i, 0)
    }
    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)

    // Send 10 instructions — only 5 slots can be freed (5 evictable)
    const instructions = Array.from({ length: 10 }, (_, i) => ({
      typeId: 'FODDER_BASIC', x: 400 + i, z: 400,
    }))
    useEnemies.getState().spawnEnemies(instructions)

    const enemies = useEnemies.getState().enemies
    // Total stays at MAX (95 boss + 5 new, not 95 boss + 5 regular + 5 new)
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    // All 5 new enemies at z=400 should be present
    expect(enemies.filter(e => e.z === 400)).toHaveLength(5)
    // The 5 regular evictable enemies (x=200..204) should be gone
    for (let i = 0; i < 5; i++) {
      expect(enemies.find(e => e.x === 200 + i && e.z === 0)).toBeUndefined()
    }
    // All 95 boss enemies should still be present
    expect(enemies.filter(e => e.behavior === 'boss')).toHaveLength(95)
  })

  // AC #1 — ELITE-tier enemies are never evicted
  it('does NOT evict enemies with tier === ELITE', () => {
    // Fill 95 slots with regular enemies
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN - 5; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, 0)
    }
    // Prepend 5 ELITE enemies (oldest by position in array)
    const nextId = useEnemies.getState().nextId
    const eliteEnemies = Array.from({ length: 5 }, (_, i) => ({
      id: `enemy_elite_${i}`,
      numericId: nextId + i,
      typeId: ELITE_TYPE,
      x: -500 - i, z: -500,
      hp: 10, maxHp: 10,
      speed: 17, damage: 5, radius: 1,
      behavior: 'chase',
      color: '#ff0000', meshScale: 1,
      xpReward: 12,
      lastHitTime: -Infinity, hitFlashTimer: 0,
    }))
    useEnemies.setState((state) => ({
      enemies: [...eliteEnemies, ...state.enemies],
      nextId: nextId + 5,
    }))
    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)

    // Spawn 5 more — ELITE must NOT be evicted; oldest regular enemies should be evicted
    const instructions = Array.from({ length: 5 }, (_, i) => ({
      typeId: 'FODDER_BASIC', x: 900 + i, z: 900,
    }))
    useEnemies.getState().spawnEnemies(instructions)

    const enemies = useEnemies.getState().enemies
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    // All 5 ELITE enemies should still be present
    expect(enemies.filter(e => e.typeId === ELITE_TYPE)).toHaveLength(5)
    // 5 new enemies should be present
    expect(enemies.filter(e => e.z === 900)).toHaveLength(5)
  })

  // Regression: no-overflow path is unchanged (pool not full → no eviction)
  it('does NOT evict when pool has room (no-overflow path unchanged)', () => {
    // Only 90 enemies — pool not full
    for (let i = 0; i < 90; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, 0)
    }
    expect(useEnemies.getState().enemies.length).toBe(90)

    useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 999, z: 999 }])

    const enemies = useEnemies.getState().enemies
    expect(enemies.length).toBe(91)
    // enemy_0 through enemy_89 should still be present (nothing evicted)
    expect(enemies.find(e => e.id === 'enemy_0')).toBeDefined()
  })
})
