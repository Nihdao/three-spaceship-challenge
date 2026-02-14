import { describe, it, expect, beforeEach } from 'vitest'
import useBoss from '../useBoss.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useBoss store', () => {
  beforeEach(() => {
    useBoss.getState().reset()
  })

  describe('initial state', () => {
    it('starts with no boss and inactive', () => {
      const state = useBoss.getState()
      expect(state.boss).toBeNull()
      expect(state.isActive).toBe(false)
      expect(state.bossDefeated).toBe(false)
      expect(state.bossProjectiles).toEqual([])
      expect(state.nextProjectileId).toBe(0)
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
      expect(state.boss.hp).toBe(GAME_CONFIG.BOSS_HP)
      expect(state.boss.maxHp).toBe(GAME_CONFIG.BOSS_HP)
      expect(state.boss.phase).toBe(0)
      expect(state.boss.attackCooldown).toBe(GAME_CONFIG.BOSS_ATTACK_COOLDOWN)
      expect(state.boss.telegraphTimer).toBe(0)
    })

    it('clears boss projectiles on spawn', () => {
      useBoss.getState().spawnBoss()
      expect(useBoss.getState().bossProjectiles).toEqual([])
      expect(useBoss.getState().bossDefeated).toBe(false)
    })
  })

  describe('damageBoss(amount)', () => {
    it('reduces boss HP by damage amount', () => {
      useBoss.getState().spawnBoss()
      const result = useBoss.getState().damageBoss(50)
      expect(useBoss.getState().boss.hp).toBe(GAME_CONFIG.BOSS_HP - 50)
      expect(result.killed).toBe(false)
    })

    it('returns killed: true when HP reaches 0', () => {
      useBoss.getState().spawnBoss()
      const result = useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      expect(useBoss.getState().boss.hp).toBe(0)
      expect(result.killed).toBe(true)
      expect(useBoss.getState().bossDefeated).toBe(true)
    })

    it('does not reduce HP below 0', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP + 100)
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
      // Player at (5, 0, 5) — within 15 units
      useBoss.getState().tick(1, [5, 0, 5])
      const boss = useBoss.getState().boss
      // Boss should not move toward player (dist ~7.07 < 15)
      expect(boss.x).toBe(0)
      expect(boss.z).toBe(0)
    })

    it('decrements attack cooldown each tick', () => {
      useBoss.getState().spawnBoss()
      const initialCooldown = useBoss.getState().boss.attackCooldown
      useBoss.getState().tick(0.5, [100, 0, 100])
      expect(useBoss.getState().boss.attackCooldown).toBeLessThan(initialCooldown)
    })

    it('starts telegraph when cooldown reaches 0', () => {
      useBoss.getState().spawnBoss()
      // Tick enough to exhaust cooldown
      useBoss.getState().tick(GAME_CONFIG.BOSS_ATTACK_COOLDOWN, [100, 0, 100])
      const boss = useBoss.getState().boss
      expect(boss.telegraphTimer).toBe(GAME_CONFIG.BOSS_TELEGRAPH_DURATION)
    })

    it('fires projectiles when telegraph timer reaches 0', () => {
      useBoss.getState().spawnBoss()
      // Exhaust cooldown to start telegraph
      useBoss.getState().tick(GAME_CONFIG.BOSS_ATTACK_COOLDOWN, [100, 0, 100])
      expect(useBoss.getState().boss.telegraphTimer).toBeGreaterThan(0)
      // Exhaust telegraph to fire
      useBoss.getState().tick(GAME_CONFIG.BOSS_TELEGRAPH_DURATION, [100, 0, 100])
      expect(useBoss.getState().bossProjectiles.length).toBeGreaterThan(0)
    })

    it('updates boss phase at HP thresholds', () => {
      useBoss.getState().spawnBoss()
      // Damage to below 75%
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP * 0.26)
      useBoss.getState().tick(0.016, [100, 0, 100])
      expect(useBoss.getState().boss.phase).toBe(1)

      // Damage to below 50%
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP * 0.25)
      useBoss.getState().tick(0.016, [100, 0, 100])
      expect(useBoss.getState().boss.phase).toBe(2)

      // Damage to below 25%
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP * 0.25)
      useBoss.getState().tick(0.016, [100, 0, 100])
      expect(useBoss.getState().boss.phase).toBe(3)
    })

    it('moves boss projectiles and removes expired ones', () => {
      useBoss.getState().spawnBoss()
      // Exhaust cooldown + telegraph to get projectiles
      useBoss.getState().tick(GAME_CONFIG.BOSS_ATTACK_COOLDOWN, [100, 0, 100])
      useBoss.getState().tick(GAME_CONFIG.BOSS_TELEGRAPH_DURATION, [100, 0, 100])
      const countBefore = useBoss.getState().bossProjectiles.length
      expect(countBefore).toBeGreaterThan(0)

      // Tick with large delta to expire projectiles (lifetime-based removal)
      useBoss.getState().tick(20, [100, 0, 100])
      expect(useBoss.getState().bossProjectiles.length).toBeLessThan(countBefore)
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
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      const state = useBoss.getState()
      expect(state.bossDefeated).toBe(true)
      expect(state.defeatAnimationTimer).toBe(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY)
      expect(state.defeatExplosionCount).toBe(0)
    })

    it('clears boss projectiles when boss is killed', () => {
      useBoss.getState().spawnBoss()
      // Generate some projectiles first
      useBoss.getState().tick(GAME_CONFIG.BOSS_ATTACK_COOLDOWN, [100, 0, 100])
      useBoss.getState().tick(GAME_CONFIG.BOSS_TELEGRAPH_DURATION, [100, 0, 100])
      expect(useBoss.getState().bossProjectiles.length).toBeGreaterThan(0)
      // Kill boss
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      expect(useBoss.getState().bossProjectiles).toEqual([])
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
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      useBoss.getState().defeatTick(0.5)
      expect(useBoss.getState().defeatAnimationTimer).toBe(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY - 0.5)
    })

    it('triggers first explosion immediately', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      const result = useBoss.getState().defeatTick(0.01)
      expect(result.explosions.length).toBe(1)
      expect(result.explosions[0].isFinal).toBe(false)
      expect(useBoss.getState().defeatExplosionCount).toBe(1)
    })

    it('triggers explosions at intervals', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
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
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      // Tick past all explosion intervals
      const totalExplosionTime = GAME_CONFIG.BOSS_DEATH_EXPLOSION_COUNT * GAME_CONFIG.BOSS_DEATH_EXPLOSION_INTERVAL
      useBoss.getState().defeatTick(totalExplosionTime + 1)
      expect(useBoss.getState().defeatExplosionCount).toBe(GAME_CONFIG.BOSS_DEATH_EXPLOSION_COUNT)
    })

    it('returns animationComplete when timer reaches 0', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      const result = useBoss.getState().defeatTick(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY)
      expect(result.animationComplete).toBe(true)
      expect(useBoss.getState().defeatAnimationTimer).toBe(0)
    })

    it('returns explosion coordinates near boss position', () => {
      useBoss.getState().spawnBoss()
      // Move boss to a known position
      useBoss.getState().tick(0.5, [100, 0, 100])
      const bossPos = useBoss.getState().boss
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      const result = useBoss.getState().defeatTick(0.01)
      expect(result.explosions.length).toBe(1)
      // Explosion should be within 5 units of boss position
      expect(Math.abs(result.explosions[0].x - bossPos.x)).toBeLessThanOrEqual(5)
      expect(Math.abs(result.explosions[0].z - bossPos.z)).toBeLessThanOrEqual(5)
    })

    it('returns no explosion after animation is already complete', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      useBoss.getState().defeatTick(GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY)
      const result = useBoss.getState().defeatTick(1)
      expect(result.explosions).toEqual([])
      expect(result.animationComplete).toBe(true)
    })

    it('returns multiple explosions when large delta skips intervals', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
      // Large delta that covers multiple explosion intervals
      const bigDelta = GAME_CONFIG.BOSS_DEATH_EXPLOSION_INTERVAL * 3
      const result = useBoss.getState().defeatTick(bigDelta)
      // Should return multiple explosions in one tick (at least 3)
      expect(result.explosions.length).toBeGreaterThanOrEqual(3)
      expect(useBoss.getState().defeatExplosionCount).toBeGreaterThanOrEqual(3)
    })

    it('marks the last explosion as isFinal', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
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
      // This test simulates the bug where animationComplete stays true after timer reaches 0
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)

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

  describe('reset()', () => {
    it('clears all boss state', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(50)
      useBoss.getState().tick(GAME_CONFIG.BOSS_ATTACK_COOLDOWN, [100, 0, 100])
      useBoss.getState().tick(GAME_CONFIG.BOSS_TELEGRAPH_DURATION, [100, 0, 100])

      useBoss.getState().reset()
      const state = useBoss.getState()
      expect(state.boss).toBeNull()
      expect(state.isActive).toBe(false)
      expect(state.bossDefeated).toBe(false)
      expect(state.bossProjectiles).toEqual([])
      expect(state.nextProjectileId).toBe(0)
    })

    it('clears defeat animation state', () => {
      useBoss.getState().spawnBoss()
      useBoss.getState().damageBoss(GAME_CONFIG.BOSS_HP)
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
