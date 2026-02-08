import { describe, it, expect, beforeEach } from 'vitest'
import useEnemies from '../useEnemies.jsx'

function spawnTestEnemy(overrides = {}) {
  const id = `enemy_${useEnemies.getState().nextId}`
  const enemy = {
    id,
    typeId: 'FODDER_BASIC',
    x: 10,
    z: 20,
    hp: 20,
    maxHp: 20,
    speed: 5,
    damage: 5,
    radius: 1,
    behavior: 'chase',
    color: '#ff5555',
    meshScale: 1,
    lastHitTime: -Infinity,
    ...overrides,
  }
  useEnemies.setState((state) => ({
    enemies: [...state.enemies, enemy],
    nextId: state.nextId + 1,
  }))
  return enemy
}

describe('useEnemies — damage actions', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
  })

  describe('damageEnemy', () => {
    it('reduces enemy HP by damage amount', () => {
      const enemy = spawnTestEnemy({ hp: 20 })
      const result = useEnemies.getState().damageEnemy(enemy.id, 5)

      expect(result.killed).toBe(false)
      const updated = useEnemies.getState().enemies.find((e) => e.id === enemy.id)
      expect(updated.hp).toBe(15)
    })

    it('kills enemy when HP reaches 0', () => {
      const enemy = spawnTestEnemy({ hp: 10 })
      const result = useEnemies.getState().damageEnemy(enemy.id, 10)

      expect(result.killed).toBe(true)
      expect(result.enemy).toBeTruthy()
      expect(result.enemy.id).toBe(enemy.id)
      expect(useEnemies.getState().enemies.find((e) => e.id === enemy.id)).toBeUndefined()
    })

    it('kills enemy when HP goes below 0', () => {
      const enemy = spawnTestEnemy({ hp: 5 })
      const result = useEnemies.getState().damageEnemy(enemy.id, 20)

      expect(result.killed).toBe(true)
      expect(useEnemies.getState().enemies.find((e) => e.id === enemy.id)).toBeUndefined()
    })

    it('returns alive result when HP > 0', () => {
      const enemy = spawnTestEnemy({ hp: 20 })
      const result = useEnemies.getState().damageEnemy(enemy.id, 5)

      expect(result.killed).toBe(false)
      expect(result.enemy).toBeTruthy()
      expect(result.enemy.id).toBe(enemy.id)
    })

    it('sets lastHitTime on non-lethal damage', () => {
      const enemy = spawnTestEnemy({ hp: 20 })
      const before = performance.now()
      useEnemies.getState().damageEnemy(enemy.id, 5)
      const after = performance.now()

      const updated = useEnemies.getState().enemies.find((e) => e.id === enemy.id)
      expect(updated.lastHitTime).toBeGreaterThanOrEqual(before)
      expect(updated.lastHitTime).toBeLessThanOrEqual(after)
    })

    it('does not set lastHitTime on lethal damage', () => {
      const enemy = spawnTestEnemy({ hp: 10 })
      const result = useEnemies.getState().damageEnemy(enemy.id, 10)

      // Enemy is removed from store
      expect(useEnemies.getState().enemies.find((e) => e.id === enemy.id)).toBeUndefined()
      // Dead snapshot should retain the initial sentinel, not a performance.now() value
      expect(result.enemy.lastHitTime).toBe(-Infinity)
    })

    it('returns null result for invalid enemy ID', () => {
      const result = useEnemies.getState().damageEnemy('nonexistent', 10)

      expect(result.killed).toBe(false)
      expect(result.enemy).toBeNull()
    })
  })

  describe('damageEnemiesBatch', () => {
    it('processes multiple hits in single call', () => {
      const e1 = spawnTestEnemy({ hp: 20 })
      const e2 = spawnTestEnemy({ hp: 20 })

      const results = useEnemies.getState().damageEnemiesBatch([
        { enemyId: e1.id, damage: 5 },
        { enemyId: e2.id, damage: 10 },
      ])

      expect(results).toHaveLength(2)
      const enemies = useEnemies.getState().enemies
      expect(enemies.find((e) => e.id === e1.id).hp).toBe(15)
      expect(enemies.find((e) => e.id === e2.id).hp).toBe(10)
    })

    it('handles multiple hits on same enemy (cumulative damage)', () => {
      const enemy = spawnTestEnemy({ hp: 30 })

      const results = useEnemies.getState().damageEnemiesBatch([
        { enemyId: enemy.id, damage: 10 },
        { enemyId: enemy.id, damage: 10 },
      ])

      // Two hits on same enemy, only one result entry expected (cumulative)
      const remaining = useEnemies.getState().enemies.find((e) => e.id === enemy.id)
      expect(remaining.hp).toBe(10)
    })

    it('removes killed enemies and keeps alive ones', () => {
      const e1 = spawnTestEnemy({ hp: 5 })  // will die
      const e2 = spawnTestEnemy({ hp: 50 }) // will survive

      useEnemies.getState().damageEnemiesBatch([
        { enemyId: e1.id, damage: 10 },
        { enemyId: e2.id, damage: 5 },
      ])

      const enemies = useEnemies.getState().enemies
      expect(enemies.find((e) => e.id === e1.id)).toBeUndefined()
      expect(enemies.find((e) => e.id === e2.id)).toBeTruthy()
      expect(enemies.find((e) => e.id === e2.id).hp).toBe(45)
    })

    it('returns correct death events with position/color data', () => {
      const enemy = spawnTestEnemy({ hp: 10, x: 42, z: 99, color: '#ff5555' })

      const results = useEnemies.getState().damageEnemiesBatch([
        { enemyId: enemy.id, damage: 15 },
      ])

      const deathEvent = results.find((r) => r.killed)
      expect(deathEvent).toBeTruthy()
      expect(deathEvent.enemy.x).toBe(42)
      expect(deathEvent.enemy.z).toBe(99)
      expect(deathEvent.enemy.color).toBe('#ff5555')
    })

    it('returns empty array for empty hits', () => {
      const results = useEnemies.getState().damageEnemiesBatch([])
      expect(results).toEqual([])
    })

    it('sets lastHitTime on surviving enemies in batch', () => {
      const e1 = spawnTestEnemy({ hp: 20 })
      const e2 = spawnTestEnemy({ hp: 5 })

      const before = performance.now()
      useEnemies.getState().damageEnemiesBatch([
        { enemyId: e1.id, damage: 5 },
        { enemyId: e2.id, damage: 10 },
      ])
      const after = performance.now()

      // e1 survived — should have lastHitTime set
      const surviving = useEnemies.getState().enemies.find((e) => e.id === e1.id)
      expect(surviving.lastHitTime).toBeGreaterThanOrEqual(before)
      expect(surviving.lastHitTime).toBeLessThanOrEqual(after)

      // e2 died — should be removed
      expect(useEnemies.getState().enemies.find((e) => e.id === e2.id)).toBeUndefined()
    })

    it('kills enemy when cumulative batch damage exceeds HP', () => {
      const enemy = spawnTestEnemy({ hp: 15 })

      const results = useEnemies.getState().damageEnemiesBatch([
        { enemyId: enemy.id, damage: 10 },
        { enemyId: enemy.id, damage: 10 },
      ])

      const deathEvent = results.find((r) => r.killed)
      expect(deathEvent).toBeTruthy()
      expect(deathEvent.enemy.id).toBe(enemy.id)
      expect(useEnemies.getState().enemies.find((e) => e.id === enemy.id)).toBeUndefined()
    })

    it('skips hits with invalid enemy IDs', () => {
      const enemy = spawnTestEnemy({ hp: 20 })
      const results = useEnemies.getState().damageEnemiesBatch([
        { enemyId: 'nonexistent', damage: 10 },
        { enemyId: enemy.id, damage: 5 },
      ])

      expect(useEnemies.getState().enemies.find((e) => e.id === enemy.id).hp).toBe(15)
    })
  })
})
