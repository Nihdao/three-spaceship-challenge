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
})
