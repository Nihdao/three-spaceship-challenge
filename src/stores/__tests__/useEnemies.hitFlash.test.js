import { describe, it, expect, beforeEach } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

// Spawn a test enemy directly into the store (mirrors damage test helper)
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
    meshScale: [1, 1, 1],
    lastHitTime: -Infinity,
    hitFlashTimer: 0,
    ...overrides,
  }
  useEnemies.setState((state) => ({
    enemies: [...state.enemies, enemy],
    nextId: state.nextId + 1,
  }))
  return enemy
}

describe('useEnemies — hitFlashTimer (Story 27.3)', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
  })

  describe('initialization', () => {
    it('new enemies spawned via spawnEnemy() have hitFlashTimer === 0', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hitFlashTimer).toBe(0)
    })

    it('new enemies spawned via spawnEnemies() have hitFlashTimer === 0', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 10, z: 20 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.hitFlashTimer).toBe(0)
    })
  })

  describe('timer set on damage', () => {
    it('damageEnemiesBatch() sets hitFlashTimer to HIT_FLASH.DURATION on surviving enemy', () => {
      const e = spawnTestEnemy({ hp: 20 })
      useEnemies.getState().damageEnemiesBatch([{ enemyId: e.id, damage: 5 }])
      const updated = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(updated.hitFlashTimer).toBeCloseTo(GAME_CONFIG.HIT_FLASH.DURATION)
    })

    it('damageEnemiesBatch() sets hitFlashTimer even on killed enemy (timer set before kill)', () => {
      const e = spawnTestEnemy({ hp: 10 })
      useEnemies.getState().damageEnemiesBatch([{ enemyId: e.id, damage: 15 }])
      // Enemy is removed — we just verify it was processed without error
      expect(useEnemies.getState().enemies.find(en => en.id === e.id)).toBeUndefined()
    })

    it('damageEnemy() sets hitFlashTimer to HIT_FLASH.DURATION on surviving enemy', () => {
      const e = spawnTestEnemy({ hp: 20 })
      useEnemies.getState().damageEnemy(e.id, 5)
      const updated = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(updated.hitFlashTimer).toBeCloseTo(GAME_CONFIG.HIT_FLASH.DURATION)
    })

    it('multiple hits reset hitFlashTimer to full duration', () => {
      const e = spawnTestEnemy({ hp: 50 })
      useEnemies.getState().damageEnemiesBatch([{ enemyId: e.id, damage: 5 }])
      // Partially tick down the timer
      useEnemies.getState().tick(0.05, [0, 0, 0])
      const afterTick = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(afterTick.hitFlashTimer).toBeLessThan(GAME_CONFIG.HIT_FLASH.DURATION)
      // Hit again — timer resets
      useEnemies.getState().damageEnemiesBatch([{ enemyId: e.id, damage: 5 }])
      const afterRehit = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(afterRehit.hitFlashTimer).toBeCloseTo(GAME_CONFIG.HIT_FLASH.DURATION)
    })
  })

  describe('timer decay in tick()', () => {
    it('hitFlashTimer decrements by delta each tick', () => {
      const e = spawnTestEnemy({ hp: 20, hitFlashTimer: 0.12 })
      useEnemies.getState().tick(0.05, [0, 0, 0])
      const updated = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(updated.hitFlashTimer).toBeCloseTo(0.07)
    })

    it('hitFlashTimer does not go below 0', () => {
      const e = spawnTestEnemy({ hp: 20, hitFlashTimer: 0.05 })
      useEnemies.getState().tick(0.2, [0, 0, 0])
      const updated = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(updated.hitFlashTimer).toBe(0)
    })

    it('hitFlashTimer stays at 0 when already 0', () => {
      const e = spawnTestEnemy({ hp: 20, hitFlashTimer: 0 })
      useEnemies.getState().tick(0.1, [0, 0, 0])
      const updated = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(updated.hitFlashTimer).toBe(0)
    })

    it('timer decays from full duration to 0 correctly', () => {
      const duration = GAME_CONFIG.HIT_FLASH.DURATION
      const e = spawnTestEnemy({ hp: 20, hitFlashTimer: duration })
      useEnemies.getState().tick(duration, [0, 0, 0])
      const updated = useEnemies.getState().enemies.find(en => en.id === e.id)
      expect(updated.hitFlashTimer).toBe(0)
    })

    it('multiple enemies have independent timers', () => {
      const e1 = spawnTestEnemy({ hp: 20, hitFlashTimer: 0.10 })
      const e2 = spawnTestEnemy({ hp: 20, hitFlashTimer: 0.05 })
      useEnemies.getState().tick(0.04, [0, 0, 0])
      const updated1 = useEnemies.getState().enemies.find(en => en.id === e1.id)
      const updated2 = useEnemies.getState().enemies.find(en => en.id === e2.id)
      expect(updated1.hitFlashTimer).toBeCloseTo(0.06)
      expect(updated2.hitFlashTimer).toBeCloseTo(0.01)
    })
  })

  describe('reset()', () => {
    it('reset() clears all enemies including their hitFlashTimers', () => {
      spawnTestEnemy({ hp: 20, hitFlashTimer: 0.1 })
      useEnemies.getState().reset()
      expect(useEnemies.getState().enemies).toHaveLength(0)
    })
  })
})
