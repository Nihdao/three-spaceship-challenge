import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCollisionSystem,
  segmentCircleIntersect,
  CATEGORY_PLAYER,
  CATEGORY_ENEMY,
  CATEGORY_PROJECTILE,
  CATEGORY_XP_ORB,
} from '../collisionSystem.js'

describe('collisionSystem', () => {
  let cs

  beforeEach(() => {
    cs = createCollisionSystem(2)
  })

  it('should export collision category constants', () => {
    expect(CATEGORY_PLAYER).toBeDefined()
    expect(CATEGORY_ENEMY).toBeDefined()
    expect(CATEGORY_PROJECTILE).toBeDefined()
    expect(CATEGORY_XP_ORB).toBeDefined()
  })

  it('should create a collision system with required methods', () => {
    expect(cs.clear).toBeTypeOf('function')
    expect(cs.registerEntity).toBeTypeOf('function')
    expect(cs.queryCollisions).toBeTypeOf('function')
    expect(cs.checkPair).toBeTypeOf('function')
  })

  describe('circle-vs-circle collision', () => {
    it('should detect collision between overlapping entities', () => {
      const player = { id: 'player', x: 0, z: 0, radius: 1, category: CATEGORY_PLAYER }
      const enemy = { id: 'enemy1', x: 1, z: 0, radius: 1, category: CATEGORY_ENEMY }
      cs.registerEntity(player)
      cs.registerEntity(enemy)
      const collisions = cs.queryCollisions(player, CATEGORY_ENEMY)
      expect(collisions).toContainEqual(expect.objectContaining({ id: 'enemy1' }))
    })

    it('should not detect collision between non-overlapping entities', () => {
      const player = { id: 'player', x: 0, z: 0, radius: 1, category: CATEGORY_PLAYER }
      const enemy = { id: 'enemy1', x: 10, z: 10, radius: 1, category: CATEGORY_ENEMY }
      cs.registerEntity(player)
      cs.registerEntity(enemy)
      const collisions = cs.queryCollisions(player, CATEGORY_ENEMY)
      expect(collisions).toHaveLength(0)
    })

    it('should detect collision at exact touching distance', () => {
      // Touching but not overlapping — distance == sum of radii, should NOT collide (strict <)
      const player = { id: 'player', x: 0, z: 0, radius: 1, category: CATEGORY_PLAYER }
      const enemy = { id: 'enemy1', x: 2, z: 0, radius: 1, category: CATEGORY_ENEMY }
      cs.registerEntity(player)
      cs.registerEntity(enemy)
      const collisions = cs.queryCollisions(player, CATEGORY_ENEMY)
      expect(collisions).toHaveLength(0)
    })
  })

  describe('collision matrix', () => {
    it('should detect player-enemy collisions', () => {
      const player = { id: 'player', x: 0, z: 0, radius: 1, category: CATEGORY_PLAYER }
      const enemy = { id: 'enemy1', x: 0.5, z: 0, radius: 1, category: CATEGORY_ENEMY }
      cs.registerEntity(player)
      cs.registerEntity(enemy)
      expect(cs.queryCollisions(player, CATEGORY_ENEMY)).toHaveLength(1)
    })

    it('should detect projectile-enemy collisions', () => {
      const projectile = { id: 'proj1', x: 0, z: 0, radius: 0.3, category: CATEGORY_PROJECTILE }
      const enemy = { id: 'enemy1', x: 0.5, z: 0, radius: 0.5, category: CATEGORY_ENEMY }
      cs.registerEntity(projectile)
      cs.registerEntity(enemy)
      expect(cs.queryCollisions(projectile, CATEGORY_ENEMY)).toHaveLength(1)
    })

    it('should detect player-xpOrb collisions', () => {
      const player = { id: 'player', x: 0, z: 0, radius: 1, category: CATEGORY_PLAYER }
      const orb = { id: 'orb1', x: 0.5, z: 0, radius: 0.3, category: CATEGORY_XP_ORB }
      cs.registerEntity(player)
      cs.registerEntity(orb)
      expect(cs.queryCollisions(player, CATEGORY_XP_ORB)).toHaveLength(1)
    })

    it('should NOT detect enemy-enemy collisions', () => {
      const e1 = { id: 'enemy1', x: 0, z: 0, radius: 1, category: CATEGORY_ENEMY }
      const e2 = { id: 'enemy2', x: 0.5, z: 0, radius: 1, category: CATEGORY_ENEMY }
      cs.registerEntity(e1)
      cs.registerEntity(e2)
      expect(cs.queryCollisions(e1, CATEGORY_ENEMY)).toHaveLength(0)
    })

    it('should NOT detect projectile-player collisions (no friendly fire)', () => {
      const projectile = { id: 'proj1', x: 0, z: 0, radius: 0.3, category: CATEGORY_PROJECTILE }
      const player = { id: 'player', x: 0.2, z: 0, radius: 1, category: CATEGORY_PLAYER }
      cs.registerEntity(projectile)
      cs.registerEntity(player)
      expect(cs.queryCollisions(projectile, CATEGORY_PLAYER)).toHaveLength(0)
    })
  })

  describe('checkPair', () => {
    it('should return true for valid collision pair player-enemy', () => {
      expect(cs.checkPair(CATEGORY_PLAYER, CATEGORY_ENEMY)).toBe(true)
    })

    it('should return true for valid collision pair projectile-enemy', () => {
      expect(cs.checkPair(CATEGORY_PROJECTILE, CATEGORY_ENEMY)).toBe(true)
    })

    it('should return true for valid collision pair player-xpOrb', () => {
      expect(cs.checkPair(CATEGORY_PLAYER, CATEGORY_XP_ORB)).toBe(true)
    })

    it('should return false for enemy-enemy', () => {
      expect(cs.checkPair(CATEGORY_ENEMY, CATEGORY_ENEMY)).toBe(false)
    })

    it('should return false for projectile-player', () => {
      expect(cs.checkPair(CATEGORY_PROJECTILE, CATEGORY_PLAYER)).toBe(false)
    })
  })

  describe('clear', () => {
    it('should reset all entities after clear', () => {
      const player = { id: 'player', x: 0, z: 0, radius: 1, category: CATEGORY_PLAYER }
      const enemy = { id: 'enemy1', x: 0.5, z: 0, radius: 1, category: CATEGORY_ENEMY }
      cs.registerEntity(player)
      cs.registerEntity(enemy)
      cs.clear()
      expect(cs.queryCollisions(player, CATEGORY_ENEMY)).toHaveLength(0)
    })
  })

  describe('multiple collisions', () => {
    it('should return multiple colliding entities', () => {
      const player = { id: 'player', x: 0, z: 0, radius: 1, category: CATEGORY_PLAYER }
      const e1 = { id: 'enemy1', x: 0.5, z: 0, radius: 0.5, category: CATEGORY_ENEMY }
      const e2 = { id: 'enemy2', x: 0, z: 0.5, radius: 0.5, category: CATEGORY_ENEMY }
      const e3 = { id: 'enemy3', x: 100, z: 100, radius: 0.5, category: CATEGORY_ENEMY }
      cs.registerEntity(player)
      cs.registerEntity(e1)
      cs.registerEntity(e2)
      cs.registerEntity(e3)
      const collisions = cs.queryCollisions(player, CATEGORY_ENEMY)
      expect(collisions).toHaveLength(2)
      expect(collisions.map(e => e.id)).toContain('enemy1')
      expect(collisions.map(e => e.id)).toContain('enemy2')
    })
  })
})

describe('segmentCircleIntersect (anti-tunneling)', () => {
  it('detects circle at segment midpoint', () => {
    // Segment (0,0)→(10,0), circle center at (5,0), radius 1
    expect(segmentCircleIntersect(0, 0, 10, 0, 5, 0, 1)).toBe(true)
  })

  it('detects circle touching segment from the side', () => {
    // Segment along X axis, circle 1 unit away on Z — radius 1.5 should reach
    expect(segmentCircleIntersect(0, 0, 10, 0, 5, 1, 1.5)).toBe(true)
  })

  it('misses circle too far from segment', () => {
    // Circle center at (5, 3), radius 1 — too far from X-axis segment
    expect(segmentCircleIntersect(0, 0, 10, 0, 5, 3, 1)).toBe(false)
  })

  it('detects circle at segment start point', () => {
    expect(segmentCircleIntersect(0, 0, 10, 0, 0, 0, 0.5)).toBe(true)
  })

  it('detects circle at segment end point', () => {
    expect(segmentCircleIntersect(0, 0, 10, 0, 10, 0, 0.5)).toBe(true)
  })

  it('misses circle beyond segment end', () => {
    // Circle at (12, 0) with radius 1 — nearest segment point is (10,0), dist = 2 > 1
    expect(segmentCircleIntersect(0, 0, 10, 0, 12, 0, 1)).toBe(false)
  })

  it('misses circle before segment start', () => {
    expect(segmentCircleIntersect(0, 0, 10, 0, -2, 0, 1)).toBe(false)
  })

  it('handles degenerate zero-length segment (point-in-circle)', () => {
    expect(segmentCircleIntersect(5, 5, 5, 5, 5, 5, 1)).toBe(true)
    expect(segmentCircleIntersect(5, 5, 5, 5, 8, 8, 1)).toBe(false)
  })

  it('reproduces tunneling scenario — fast laser vs small enemy', () => {
    // LASER_FRONT: speed 300, radius 1.5. At 60fps: moves 5 units/frame.
    // FODDER_SWARM: radius 0.75. Enemy at (0, -2.5) — between prev and current.
    // Prev pos (0,0), current pos (0,-5). Combined radius = 2.25.
    // Circle-vs-circle at current pos: dist = |(-5)-(-2.5)| = 2.5 > 2.25 → MISS
    // Circle-vs-circle at prev pos: dist = |0-(-2.5)| = 2.5 > 2.25 → MISS
    // Swept check: closest point on segment to (-2.5) is (0,-2.5), dist = 0 → HIT
    const prevX = 0, prevZ = 0
    const currX = 0, currZ = -5
    const enemyX = 0, enemyZ = -2.5
    const projRadius = 1.5, enemyRadius = 0.75
    const rSum = projRadius + enemyRadius // 2.25

    // Verify circle-vs-circle would miss at both endpoints
    const distPrev = Math.sqrt((prevX - enemyX) ** 2 + (prevZ - enemyZ) ** 2)
    const distCurr = Math.sqrt((currX - enemyX) ** 2 + (currZ - enemyZ) ** 2)
    expect(distPrev).toBeGreaterThan(rSum) // 2.5 > 2.25 — missed
    expect(distCurr).toBeGreaterThan(rSum) // 2.5 > 2.25 — missed

    // Swept check catches it
    expect(segmentCircleIntersect(prevX, prevZ, currX, currZ, enemyX, enemyZ, rSum)).toBe(true)
  })
})
