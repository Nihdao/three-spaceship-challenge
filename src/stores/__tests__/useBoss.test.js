import { describe, it, expect, beforeEach } from 'vitest'
import useBoss from '../useBoss.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useBoss store', () => {
  beforeEach(() => {
    useBoss.getState().reset()
  })

  describe('config values (Story 49.3)', () => {
    it('BOSS_BASE_HP is 7500', () => {
      expect(GAME_CONFIG.BOSS_BASE_HP).toBe(7500)
    })
  })

  describe('initial state', () => {
    it('starts with no boss and inactive', () => {
      const state = useBoss.getState()
      expect(state.boss).toBeNull()
      expect(state.isActive).toBe(false)
      expect(state.bossDefeated).toBe(false)
    })
  })

  describe('spawnBoss()', () => {
    it('initializes boss at center with full HP', () => {
      useBoss.getState().spawnBoss()
      const state = useBoss.getState()
      expect(state.isActive).toBe(true)
      expect(state.boss).not.toBeNull()
      expect(state.boss.x).toBe(0)
      expect(state.boss.z).toBe(0)
      expect(state.boss.hp).toBe(GAME_CONFIG.BOSS_BASE_HP)
      expect(state.boss.maxHp).toBe(GAME_CONFIG.BOSS_BASE_HP)
      expect(state.boss.phase).toBe(0)
    })

    it('spawns at wormhole position when wormholePos is provided (Story 17.4)', () => {
      useBoss.getState().spawnBoss(1, { x: 500, z: 200 })
      const state = useBoss.getState()
      expect(state.boss.x).toBe(500)
      expect(state.boss.z).toBe(200)
    })

    it('chaos: spawnBoss(1, null, 15000) → boss HP = 15000 (AC #1)', () => {
      useBoss.getState().spawnBoss(1, null, 15000)
      const state = useBoss.getState()
      expect(state.boss.hp).toBe(15000)
      expect(state.boss.maxHp).toBe(15000)
    })

    it('fallback: spawnBoss() with no bossTier1Hp → boss HP = BOSS_BASE_HP (AC #2)', () => {
      useBoss.getState().spawnBoss()
      const state = useBoss.getState()
      expect(state.boss.hp).toBe(GAME_CONFIG.BOSS_BASE_HP)
      expect(state.boss.maxHp).toBe(GAME_CONFIG.BOSS_BASE_HP)
    })

    it('inter-system scaling on chaos base: spawnBoss(2, null, 15000) → HP = 15000 × system2 scaling (AC #3)', () => {
      const system2Scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2]?.hp ?? 1
      useBoss.getState().spawnBoss(2, null, 15000)
      const state = useBoss.getState()
      expect(state.boss.hp).toBe(Math.round(15000 * system2Scaling))
      expect(state.boss.maxHp).toBe(Math.round(15000 * system2Scaling))
    })

    it('boss spawned at wormhole position is not displaced after first tick (Story 51.2 regression)', () => {
      // Bug: BOSS_ARENA_SIZE=400 < PLAY_AREA_SIZE=650 caused boss to clamp from (500,200) to (400,200) on tick 1
      const wormholeX = 500
      const wormholeZ = 200
      useBoss.getState().spawnBoss(1, { x: wormholeX, z: wormholeZ })
      // Player at same position — boss should not move, not be clamped
      useBoss.getState().tick(0.016, [wormholeX, 0, wormholeZ])
      const boss = useBoss.getState().boss
      expect(boss.x).toBe(wormholeX)
      expect(boss.z).toBe(wormholeZ)
    })
  })

  describe('damageBoss(amount)', () => {
    it('reduces boss HP by damage amount', () => {
      useBoss.getState().spawnBoss()
      const result = useBoss.getState().damageBoss(50)
      expect(useBoss.getState().boss.hp).toBe(GAME_CONFIG.BOSS_BASE_HP - 50)
      expect(result.killed).toBe(false)
    })

    it('returns killed: true when HP reaches 0', () => {
      useBoss.getState().spawnBoss()
      const result = useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      expect(useBoss.getState().boss.hp).toBe(0)
      expect(result.killed).toBe(true)
      expect(useBoss.getState().bossDefeated).toBe(true)
    })

    it('does not reduce HP below 0', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP + 100)
      expect(useBoss.getState().boss.hp).toBe(0)
    })

    it('sets hit flash time on damage', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(10)
      expect(useBoss.getState().boss.lastHitTime).toBeGreaterThan(0)
    })
  })

  describe('tick(delta, playerPos)', () => {
    it('moves boss toward player position', () => {
      useBoss.getState().spawnBoss()
      // Player at (100, 0, 100), boss at (0, 0)
      useBoss.getState().tick(1, [100, 0, 100])
      const boss = useBoss.getState().boss
      expect(boss.x).toBeGreaterThan(0)
      expect(boss.z).toBeGreaterThan(0)
    })

    it('does not move boss when close to player (within min distance)', () => {
      useBoss.getState().spawnBoss()
      // Player at (2, 0, 2) — within 5 units
      useBoss.getState().tick(1, [2, 0, 2])
      const boss = useBoss.getState().boss
      // Boss should not move toward player (dist ~2.83 < 5)
      expect(boss.x).toBe(0)
      expect(boss.z).toBe(0)
    })

    it('updates boss phase at HP thresholds', () => {
      useBoss.getState().spawnBoss()
      // Damage to below 75%
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP * 0.26)
      useBoss.getState().tick(0.016, [100, 0, 100])
      expect(useBoss.getState().boss.phase).toBe(1)

      // Damage to below 50%
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP * 0.25)
      useBoss.getState().tick(0.016, [100, 0, 100])
      expect(useBoss.getState().boss.phase).toBe(2)

      // Damage to below 25%
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP * 0.25)
      useBoss.getState().tick(0.016, [100, 0, 100])
      expect(useBoss.getState().boss.phase).toBe(3)
    })

    it('clamps boss position to arena boundaries', () => {
      useBoss.getState().spawnBoss()
      // Move boss toward a far-away player for many ticks
      for (let i = 0; i < 100; i++) {
        useBoss.getState().tick(1, [10000, 0, 10000])
      }
      const boss = useBoss.getState().boss
      expect(boss.x).toBeLessThanOrEqual(GAME_CONFIG.BOSS_ARENA_SIZE)
      expect(boss.z).toBeLessThanOrEqual(GAME_CONFIG.BOSS_ARENA_SIZE)
    })

    it('does nothing when boss is null', () => {
      // No boss spawned
      useBoss.getState().tick(1, [100, 0, 100])
      expect(useBoss.getState().boss).toBeNull()
    })
  })

  describe('damageBoss() defeat flow (Story 6.3)', () => {
    it('starts defeat animation timer when boss is killed', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      const state = useBoss.getState()
      expect(state.bossDefeated).toBe(true)
      expect(state.defeatAnimationTimer).toBe(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY)
      expect(state.defeatExplosionCount).toBe(0)
    })
  })

  describe('defeatTick(delta) (Story 6.3)', () => {
    it('does nothing when bossDefeated is false', () => {
      useBoss.getState().spawnBoss()
      const result = useBoss.getState().defeatTick(1)
      expect(result.explosions).toEqual([])
      expect(result.animationComplete).toBe(false)
    })

    it('decrements defeatAnimationTimer', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      useBoss.getState().defeatTick(0.5)
      expect(useBoss.getState().defeatAnimationTimer).toBe(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY - 0.5)
    })

    it('triggers first explosion immediately', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      const result = useBoss.getState().defeatTick(0.01)
      expect(result.explosions.length).toBe(1)
      expect(result.explosions[0].isFinal).toBe(false)
      expect(useBoss.getState().defeatExplosionCount).toBe(1)
    })

    it('triggers explosions at intervals', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      // First tick triggers explosion 1
      const r1 = useBoss.getState().defeatTick(0.01)
      expect(r1.explosions.length).toBe(1)
      expect(useBoss.getState().defeatExplosionCount).toBe(1)
      // Tick past one interval triggers explosion 2
      const r2 = useBoss.getState().defeatTick(GAME_CONFIG.BOSS_DEATH_EXPLOSION_INTERVAL)
      expect(r2.explosions.length).toBe(1)
      expect(useBoss.getState().defeatExplosionCount).toBe(2)
    })

    it('does not exceed max explosion count', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      // Tick past all explosion intervals
      const totalExplosionTime = GAME_CONFIG.BOSS_DEATH_EXPLOSION_COUNT * GAME_CONFIG.BOSS_DEATH_EXPLOSION_INTERVAL
      useBoss.getState().defeatTick(totalExplosionTime + 1)
      expect(useBoss.getState().defeatExplosionCount).toBe(GAME_CONFIG.BOSS_DEATH_EXPLOSION_COUNT)
    })

    it('returns animationComplete when timer reaches 0', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      const result = useBoss.getState().defeatTick(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY)
      expect(result.animationComplete).toBe(true)
      expect(useBoss.getState().defeatAnimationTimer).toBe(0)
    })

    it('returns explosion coordinates near boss position', () => {
      useBoss.getState().spawnBoss()
      // Move boss to a known position
      useBoss.getState().tick(0.5, [100, 0, 100])
      const bossPos = useBoss.getState().boss
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      const result = useBoss.getState().defeatTick(0.01)
      expect(result.explosions.length).toBe(1)
      // Explosion should be within 5 units of boss position
      expect(Math.abs(result.explosions[0].x - bossPos.x)).toBeLessThanOrEqual(5)
      expect(Math.abs(result.explosions[0].z - bossPos.z)).toBeLessThanOrEqual(5)
    })

    it('returns no explosion after animation is already complete', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      useBoss.getState().defeatTick(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY)
      const result = useBoss.getState().defeatTick(1)
      expect(result.explosions).toEqual([])
      expect(result.animationComplete).toBe(true)
    })

    it('returns multiple explosions when large delta skips intervals', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      // Large delta that covers multiple explosion intervals
      const bigDelta = GAME_CONFIG.BOSS_DEATH_EXPLOSION_INTERVAL * 3
      const result = useBoss.getState().defeatTick(bigDelta)
      // Should return multiple explosions in one tick (at least 3)
      expect(result.explosions.length).toBeGreaterThanOrEqual(3)
      expect(useBoss.getState().defeatExplosionCount).toBeGreaterThanOrEqual(3)
    })

    it('marks the last explosion as isFinal', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      // Tick past all explosion intervals at once
      const totalExplosionTime = GAME_CONFIG.BOSS_DEATH_EXPLOSION_COUNT * GAME_CONFIG.BOSS_DEATH_EXPLOSION_INTERVAL
      const result = useBoss.getState().defeatTick(totalExplosionTime + 1)
      const finalExplosions = result.explosions.filter(e => e.isFinal)
      expect(finalExplosions.length).toBe(1)
    })
  })

  describe('setRewardGiven(value) (Story 19.3 bugfix)', () => {
    it('sets rewardGiven flag to true', () => {
      expect(useBoss.getState().rewardGiven).toBe(false)
      useBoss.getState().setRewardGiven(true)
      expect(useBoss.getState().rewardGiven).toBe(true)
    })

    it('sets rewardGiven flag to false', () => {
      useBoss.getState().setRewardGiven(true)
      expect(useBoss.getState().rewardGiven).toBe(true)
      useBoss.getState().setRewardGiven(false)
      expect(useBoss.getState().rewardGiven).toBe(false)
    })

    it('prevents duplicate boss rewards when animationComplete is true across multiple frames', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)

      // Tick to complete animation
      const result1 = useBoss.getState().defeatTick(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY)
      expect(result1.animationComplete).toBe(true)
      expect(useBoss.getState().rewardGiven).toBe(false)

      // Simulate GameLoop giving reward and setting flag
      useBoss.getState().setRewardGiven(true)

      // Tick again - animationComplete should still be true
      const result2 = useBoss.getState().defeatTick(0.1)
      expect(result2.animationComplete).toBe(true)

      // But rewardGiven flag should prevent duplicate rewards in GameLoop
      expect(useBoss.getState().rewardGiven).toBe(true)
    })
  })

  describe('deactivate() (Story 49.4)', () => {
    it('sets isActive to false without affecting other boss state', () => {
      useBoss.getState().spawnBoss()
      expect(useBoss.getState().isActive).toBe(true)

      useBoss.getState().deactivate()
      const state = useBoss.getState()
      expect(state.isActive).toBe(false)
      expect(state.boss).not.toBeNull()                // boss data preserved
      expect(state.bossDefeated).toBe(false)           // defeat state unchanged
      expect(state.rewardGiven).toBe(false)            // reward flag unchanged
      expect(state.defeatAnimationTimer).toBe(0)       // animation timer unchanged
      expect(state.defeatExplosionCount).toBe(0)       // explosion count unchanged
    })

    it('preserves bossDefeated: true when called after boss kill', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      expect(useBoss.getState().bossDefeated).toBe(true)

      useBoss.getState().deactivate()
      const state = useBoss.getState()
      expect(state.isActive).toBe(false)
      expect(state.bossDefeated).toBe(true)   // not reset by deactivate
      expect(state.boss).not.toBeNull()       // boss data preserved for renderers
    })

    it('does not interfere with reset()', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().deactivate()
      useBoss.getState().reset()
      expect(useBoss.getState().isActive).toBe(false)
      expect(useBoss.getState().boss).toBeNull()
    })
  })

  describe('reset()', () => {
    it('clears all boss state', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(50)
      useBoss.getState().tick(1, [100, 0, 100])

      useBoss.getState().reset()
      const state = useBoss.getState()
      expect(state.boss).toBeNull()
      expect(state.isActive).toBe(false)
      expect(state.bossDefeated).toBe(false)
    })

    it('clears defeat animation state', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_BASE_HP)
      useBoss.getState().defeatTick(0.5)

      useBoss.getState().reset()
      const state = useBoss.getState()
      expect(state.defeatAnimationTimer).toBe(0)
      expect(state.defeatExplosionCount).toBe(0)
    })

    it('resets rewardGiven flag (Story 19.3 bugfix)', () => {
      useBoss.getState().setRewardGiven(true)
      expect(useBoss.getState().rewardGiven).toBe(true)

      useBoss.getState().reset()
      expect(useBoss.getState().rewardGiven).toBe(false)
    })
  })
})
