import { describe, it, expect, beforeEach } from 'vitest'
import { createProjectileSystem } from '../projectileSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

function makeProjectile(overrides = {}) {
  return {
    id: 'proj_0',
    x: 0,
    z: 0,
    dirX: 0,
    dirZ: -1,
    speed: 300,
    lifetime: 3.0,
    elapsedTime: 0,
    active: true,
    ...overrides,
  }
}

describe('projectileSystem', () => {
  let ps

  beforeEach(() => {
    ps = createProjectileSystem()
  })

  it('should create a system with tick and reset methods', () => {
    expect(ps.tick).toBeTypeOf('function')
    expect(ps.reset).toBeTypeOf('function')
  })

  it('should update projectile position correctly', () => {
    const p = makeProjectile({ x: 10, z: 20, dirX: 1, dirZ: 0, speed: 100 })
    const projectiles = [p]

    ps.tick(projectiles, 0.5)

    expect(p.x).toBeCloseTo(60, 5) // 10 + 1 * 100 * 0.5
    expect(p.z).toBeCloseTo(20, 5) // 20 + 0 * 100 * 0.5
  })

  it('should update position with diagonal direction', () => {
    const p = makeProjectile({ x: 0, z: 0, dirX: 0.707, dirZ: -0.707, speed: 200 })
    const projectiles = [p]

    ps.tick(projectiles, 1.0)

    expect(p.x).toBeCloseTo(141.4, 0) // 0.707 * 200
    expect(p.z).toBeCloseTo(-141.4, 0) // -0.707 * 200
  })

  it('should increment elapsedTime by delta', () => {
    const p = makeProjectile({ elapsedTime: 1.0 })
    ps.tick([p], 0.5)
    expect(p.elapsedTime).toBeCloseTo(1.5, 5)
  })

  it('should mark projectile inactive when lifetime expires', () => {
    const p = makeProjectile({ elapsedTime: 2.9, lifetime: 3.0 })
    ps.tick([p], 0.2) // elapsedTime becomes 3.1 >= 3.0
    expect(p.active).toBe(false)
  })

  it('should mark projectile inactive exactly at lifetime', () => {
    const p = makeProjectile({ elapsedTime: 2.5, lifetime: 3.0 })
    ps.tick([p], 0.5) // elapsedTime becomes 3.0 >= 3.0
    expect(p.active).toBe(false)
  })

  it('should keep projectile active before lifetime', () => {
    const p = makeProjectile({ elapsedTime: 0, lifetime: 3.0 })
    ps.tick([p], 1.0)
    expect(p.active).toBe(true)
  })

  it('should mark projectile inactive when exceeding +X boundary', () => {
    const p = makeProjectile({ x: GAME_CONFIG.PLAY_AREA_SIZE - 1, dirX: 1, dirZ: 0, speed: 100 })
    ps.tick([p], 0.1) // moves past boundary
    expect(p.active).toBe(false)
  })

  it('should mark projectile inactive when exceeding -X boundary', () => {
    const p = makeProjectile({ x: -(GAME_CONFIG.PLAY_AREA_SIZE - 1), dirX: -1, dirZ: 0, speed: 100 })
    ps.tick([p], 0.1)
    expect(p.active).toBe(false)
  })

  it('should mark projectile inactive when exceeding +Z boundary', () => {
    const p = makeProjectile({ z: GAME_CONFIG.PLAY_AREA_SIZE - 1, dirX: 0, dirZ: 1, speed: 100 })
    ps.tick([p], 0.1)
    expect(p.active).toBe(false)
  })

  it('should mark projectile inactive when exceeding -Z boundary', () => {
    const p = makeProjectile({ z: -(GAME_CONFIG.PLAY_AREA_SIZE - 1), dirX: 0, dirZ: -1, speed: 100 })
    ps.tick([p], 0.1)
    expect(p.active).toBe(false)
  })

  it('should skip inactive projectiles', () => {
    const p1 = makeProjectile({ id: 'p1', x: 0, active: false })
    const p2 = makeProjectile({ id: 'p2', x: 10, dirX: 1, dirZ: 0, speed: 100 })
    ps.tick([p1, p2], 1.0)

    expect(p1.x).toBe(0) // unchanged
    expect(p2.x).toBeCloseTo(110, 5) // moved
  })

  it('should mutate projectiles in-place (no new objects)', () => {
    const p = makeProjectile()
    const projectiles = [p]
    const ref = projectiles[0]

    ps.tick(projectiles, 0.1)

    expect(projectiles[0]).toBe(ref) // same reference
    expect(projectiles.length).toBe(1) // no elements added/removed
  })

  it('should handle multiple projectiles in single call', () => {
    const p1 = makeProjectile({ id: 'p1', x: 0, z: 0, dirX: 1, dirZ: 0, speed: 100 })
    const p2 = makeProjectile({ id: 'p2', x: 50, z: 50, dirX: 0, dirZ: -1, speed: 200 })
    ps.tick([p1, p2], 0.5)

    expect(p1.x).toBeCloseTo(50, 5)
    expect(p2.z).toBeCloseTo(-50, 5)
  })

  it('should handle empty projectiles array', () => {
    // Should not throw
    ps.tick([], 1.0)
  })

  it('should call reset without error', () => {
    expect(() => ps.reset()).not.toThrow()
  })

  // --- Story 3.3: Homing missile tests ---

  it('should steer homing projectile toward nearest enemy', () => {
    // Projectile moving forward (-Z), enemy is to the right (+X)
    const p = makeProjectile({ x: 0, z: 0, dirX: 0, dirZ: -1, speed: 120, homing: true })
    const enemies = [{ x: 50, z: 0 }]

    ps.tick([p], 0.1, enemies)

    // dirX should have increased (steering toward +X enemy)
    expect(p.dirX).toBeGreaterThan(0)
  })

  it('should not steer non-homing projectile', () => {
    const p = makeProjectile({ x: 0, z: 0, dirX: 0, dirZ: -1, speed: 300 })
    const enemies = [{ x: 50, z: 0 }]

    ps.tick([p], 0.1, enemies)

    // dirX should remain 0 (no homing)
    expect(p.dirX).toBeCloseTo(0, 5)
  })

  it('should not steer homing projectile when no enemies', () => {
    const p = makeProjectile({ x: 0, z: 0, dirX: 0, dirZ: -1, speed: 120, homing: true })

    ps.tick([p], 0.1, [])

    // Direction should remain unchanged
    expect(p.dirX).toBeCloseTo(0, 5)
    expect(p.dirZ).toBeCloseTo(-1, 5)
  })

  it('should maintain normalized direction after homing steering', () => {
    const p = makeProjectile({ x: 0, z: 0, dirX: 0, dirZ: -1, speed: 120, homing: true })
    const enemies = [{ x: 50, z: -50 }]

    ps.tick([p], 0.5, enemies)

    const mag = Math.sqrt(p.dirX * p.dirX + p.dirZ * p.dirZ)
    expect(mag).toBeCloseTo(1, 2)
  })

  it('should work without enemies parameter (backward compatible)', () => {
    const p = makeProjectile({ x: 0, z: 0, dirX: 0, dirZ: -1, speed: 300 })
    // Call without enemies param — should not throw
    ps.tick([p], 0.1)
    expect(p.z).toBeCloseTo(-30, 0)
  })

  // --- Anti-tunneling: prevX/prevZ tracking ---

  it('should store prevX/prevZ before moving', () => {
    const p = makeProjectile({ x: 10, z: 20, dirX: 1, dirZ: 0, speed: 100 })
    ps.tick([p], 0.5)
    expect(p.prevX).toBe(10)
    expect(p.prevZ).toBe(20)
    expect(p.x).toBeCloseTo(60, 5)
  })

  it('should update prevX/prevZ each tick', () => {
    const p = makeProjectile({ x: 0, z: 0, dirX: 0, dirZ: -1, speed: 300 })
    ps.tick([p], 1 / 60)
    const afterFirstX = p.x
    const afterFirstZ = p.z
    ps.tick([p], 1 / 60)
    expect(p.prevX).toBeCloseTo(afterFirstX, 5)
    expect(p.prevZ).toBeCloseTo(afterFirstZ, 5)
  })

  it('should not set prevX/prevZ on inactive projectiles', () => {
    const p = makeProjectile({ x: 5, z: 5, active: false })
    ps.tick([p], 0.1)
    expect(p.prevX).toBeUndefined()
    expect(p.prevZ).toBeUndefined()
  })
})
