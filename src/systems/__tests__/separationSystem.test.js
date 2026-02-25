import { describe, it, expect, beforeEach } from 'vitest'
import { createSeparationSystem } from '../separationSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

// Helper: create a minimal enemy object
function makeEnemy(id, x, z, behavior = 'chase') {
  return { id, numericId: parseInt(id.replace(/\D+/, '')) || 0, x, z, behavior }
}

// Helper: create a minimal boss object
function makeBoss(x, z, hp = 1000) {
  return { x, z, hp }
}

describe('createSeparationSystem', () => {
  let system

  beforeEach(() => {
    system = createSeparationSystem()
  })

  it('exposes applySeparation function', () => {
    expect(system.applySeparation).toBeTypeOf('function')
  })

  // ============================================================
  // Enemy-enemy separation
  // ============================================================
  describe('enemy-enemy separation', () => {
    it('pushes two overlapping enemies apart', () => {
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', 1, 0) // distance = 1 < ENEMY_SEPARATION_RADIUS (3)
      const delta = 0.016

      system.applySeparation([a, b], null, delta)

      // A is left of B — A should move further left (negative X, away from B)
      expect(a.x).toBeLessThan(0)
      // B should move further right (positive X, away from A)
      expect(b.x).toBeGreaterThan(1)
    })

    it('moves both enemies equal distances (symmetric force)', () => {
      const a = makeEnemy('e1', -0.5, 0)
      const b = makeEnemy('e2', 0.5, 0) // distance = 1, symmetric positions
      const delta = 0.016

      const aXBefore = a.x
      const bXBefore = b.x

      system.applySeparation([a, b], null, delta)

      const aDelta = a.x - aXBefore
      const bDelta = b.x - bXBefore

      // A moves left (negative), B moves right (positive) — equal magnitude
      expect(Math.abs(aDelta)).toBeCloseTo(Math.abs(bDelta), 10)
    })

    it('applies stronger force when enemies are closer (larger overlap)', () => {
      // Case 1: small overlap (distance close to ENEMY_SEPARATION_RADIUS)
      const a1 = makeEnemy('e1', 0, 0)
      const b1 = makeEnemy('e2', GAME_CONFIG.ENEMY_SEPARATION_RADIUS - 0.1, 0) // tiny overlap
      system.applySeparation([a1, b1], null, 0.016)
      const displacementSmall = b1.x - (GAME_CONFIG.ENEMY_SEPARATION_RADIUS - 0.1)

      // Case 2: large overlap (enemies almost on top of each other)
      const a2 = makeEnemy('e3', 0, 0)
      const b2 = makeEnemy('e4', 0.5, 0) // large overlap
      system.applySeparation([a2, b2], null, 0.016)
      const displacementLarge = b2.x - 0.5

      // Larger overlap → larger displacement on the second enemy
      expect(Math.abs(displacementLarge)).toBeGreaterThan(Math.abs(displacementSmall))
    })

    it('clamps displacement to MAX_SEPARATION_DISPLACEMENT per frame', () => {
      // Use a very large delta to trigger clamping
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', 0.1, 0) // very close → large force magnitude
      const largeDelta = 10.0 // would produce huge displacement without clamping

      const aXBefore = a.x
      const bXBefore = b.x

      system.applySeparation([a, b], null, largeDelta)

      // Each enemy moves at most MAX_SEPARATION_DISPLACEMENT * 0.5
      const aMove = Math.abs(a.x - aXBefore)
      const bMove = Math.abs(b.x - bXBefore)
      expect(aMove).toBeLessThanOrEqual(GAME_CONFIG.MAX_SEPARATION_DISPLACEMENT * 0.5 + 1e-10)
      expect(bMove).toBeLessThanOrEqual(GAME_CONFIG.MAX_SEPARATION_DISPLACEMENT * 0.5 + 1e-10)
    })

    it('does not move enemies already beyond ENEMY_SEPARATION_RADIUS', () => {
      const farDist = GAME_CONFIG.ENEMY_SEPARATION_RADIUS + 1.0
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', farDist, 0)
      const aXBefore = a.x
      const bXBefore = b.x

      system.applySeparation([a, b], null, 0.016)

      expect(a.x).toBe(aXBefore)
      expect(b.x).toBe(bXBefore)
    })

    it('processes each pair exactly once (no double-displacement)', () => {
      // C is placed far away so it doesn't interact with A or B
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', 1, 0)
      const c = makeEnemy('e3', 1000, 0) // far away — outside ENEMY_SEPARATION_RADIUS
      const delta = 0.016

      // Calculate expected displacement for e1-e2 pair alone
      const aAlone = makeEnemy('e1', 0, 0)
      const bAlone = makeEnemy('e2', 1, 0)
      system.applySeparation([aAlone, bAlone], null, delta)
      const expectedBDisplacement = bAlone.x - 1.0

      // Run with all 3 — C is too far to affect A or B, so result should match 2-enemy case
      system.applySeparation([a, b, c], null, delta)

      // B's displacement should match the 2-enemy case exactly (no double processing)
      expect(b.x - 1.0).toBeCloseTo(expectedBDisplacement, 10)
    })

    it('does not push sniper_fixed enemies', () => {
      const mobile = makeEnemy('e1', 0, 0, 'chase')
      const fixed = makeEnemy('e2', 1, 0, 'sniper_fixed')

      const mobileXBefore = mobile.x
      const fixedXBefore = fixed.x

      system.applySeparation([mobile, fixed], null, 0.016)

      // Mobile enemy should be pushed away
      expect(mobile.x).not.toBe(mobileXBefore)
      // Fixed enemy should NOT move
      expect(fixed.x).toBe(fixedXBefore)
      expect(fixed.z).toBe(0)
    })

    it('handles three enemies stacked at same position without crashing', () => {
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', 0, 0) // identical position
      const c = makeEnemy('e3', 0, 0) // identical position

      // Should not throw — distance === 0 is skipped by > 0.001 guard
      expect(() => system.applySeparation([a, b, c], null, 0.016)).not.toThrow()
    })

    it('separates all pairs when 3 enemies are mutually overlapping', () => {
      // All 3 within ENEMY_SEPARATION_RADIUS of each other
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', 0.5, 0)
      const c = makeEnemy('e3', 0, 0.5)

      const aXBefore = a.x, aZBefore = a.z
      const bXBefore = b.x, bZBefore = b.z
      const cXBefore = c.x, cZBefore = c.z

      system.applySeparation([a, b, c], null, 0.016)

      // All 3 enemies must have moved — all 3 pairs (a-b, a-c, b-c) processed
      // If integer pair key degrades to NaN, only first pair moves and others stay frozen
      expect(a.x !== aXBefore || a.z !== aZBefore).toBe(true)
      expect(b.x !== bXBefore || b.z !== bZBefore).toBe(true)
      expect(c.x !== cXBefore || c.z !== cZBefore).toBe(true)
    })
  })

  // ============================================================
  // Boss separation
  // ============================================================
  describe('boss separation', () => {
    it('pushes nearby enemy away from boss', () => {
      const boss = makeBoss(0, 0)
      const enemy = makeEnemy('e1', 3, 0) // distance = 3 < BOSS_SEPARATION_RADIUS (8)
      const enemyXBefore = enemy.x

      system.applySeparation([enemy], boss, 0.016)

      // Enemy should be pushed away (positive X)
      expect(enemy.x).toBeGreaterThan(enemyXBefore)
    })

    it('uses BOSS_SEPARATION_RADIUS (larger than ENEMY_SEPARATION_RADIUS)', () => {
      // An enemy outside ENEMY_SEPARATION_RADIUS but inside BOSS_SEPARATION_RADIUS
      // Should be pushed by boss but not affected by enemy-enemy separation
      const dist = GAME_CONFIG.ENEMY_SEPARATION_RADIUS + 0.5 // between the two radii
      expect(dist).toBeLessThan(GAME_CONFIG.BOSS_SEPARATION_RADIUS) // sanity check

      const boss = makeBoss(0, 0)
      const enemy = makeEnemy('e1', dist, 0)
      const enemyXBefore = enemy.x

      system.applySeparation([enemy], boss, 0.016)

      // Boss separation should push the enemy
      expect(enemy.x).toBeGreaterThan(enemyXBefore)
    })

    it('boss does not move — separation is one-way', () => {
      const boss = makeBoss(0, 0)
      const enemy = makeEnemy('e1', 1, 0)
      const bossXBefore = boss.x

      system.applySeparation([enemy], boss, 0.016)

      expect(boss.x).toBe(bossXBefore)
    })

    it('does not affect enemies beyond BOSS_SEPARATION_RADIUS', () => {
      const boss = makeBoss(0, 0)
      const farDist = GAME_CONFIG.BOSS_SEPARATION_RADIUS + 1.0
      const enemy = makeEnemy('e1', farDist, 0)
      const enemyXBefore = enemy.x

      system.applySeparation([enemy], boss, 0.016)

      expect(enemy.x).toBe(enemyXBefore)
    })

    it('clamps boss separation displacement per frame', () => {
      const boss = makeBoss(0, 0)
      const enemy = makeEnemy('e1', 0.1, 0) // very close to boss
      const enemyXBefore = enemy.x

      system.applySeparation([enemy], boss, 10.0) // large delta

      const moved = Math.abs(enemy.x - enemyXBefore)
      expect(moved).toBeLessThanOrEqual(GAME_CONFIG.MAX_SEPARATION_DISPLACEMENT + 1e-10)
    })
  })

  // ============================================================
  // Edge cases
  // ============================================================
  describe('edge cases', () => {
    it('handles empty enemies array gracefully', () => {
      expect(() => system.applySeparation([], null, 0.016)).not.toThrow()
    })

    it('handles single enemy (no neighbor processing)', () => {
      const enemy = makeEnemy('e1', 5, 5)
      const xBefore = enemy.x
      const zBefore = enemy.z

      expect(() => system.applySeparation([enemy], null, 0.016)).not.toThrow()
      // No enemy-enemy separation with one enemy
      expect(enemy.x).toBe(xBefore)
      expect(enemy.z).toBe(zBefore)
    })

    it('handles null boss — no boss separation applied', () => {
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', 0.5, 0)

      // Should not throw when boss is null
      expect(() => system.applySeparation([a, b], null, 0.016)).not.toThrow()
    })

    it('handles boss with hp = 0 — dead boss does not push enemies', () => {
      const deadBoss = makeBoss(0, 0, 0) // hp = 0
      const enemy = makeEnemy('e1', 2, 0)
      const enemyXBefore = enemy.x

      system.applySeparation([enemy], deadBoss, 0.016)

      // Dead boss should not push
      expect(enemy.x).toBe(enemyXBefore)
    })

    it('separation system can be called multiple frames in a row', () => {
      const a = makeEnemy('e1', 0, 0)
      const b = makeEnemy('e2', 1, 0)

      // Multiple frames — each call further separates the enemies
      system.applySeparation([a, b], null, 0.016)
      const x1 = b.x
      system.applySeparation([a, b], null, 0.016)
      const x2 = b.x

      // Second frame may have less separation (enemies further apart) but shouldn't crash
      expect(x2).toBeGreaterThanOrEqual(x1)
    })
  })
})
