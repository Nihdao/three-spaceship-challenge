import { describe, it, expect } from 'vitest'
import { createCollisionSystem, CATEGORY_PLAYER, CATEGORY_ENEMY, CATEGORY_PROJECTILE } from '../collisionSystem.js'

describe('collision system performance', () => {
  it('should complete collision phase in < 2ms with 150+ entities', () => {
    const cs = createCollisionSystem(2)

    // Register 1 player + 100 enemies + 50 projectiles = 151 entities
    const player = { id: 'player', x: 0, z: 0, radius: 1.5, category: CATEGORY_PLAYER }

    const enemies = []
    for (let i = 0; i < 100; i++) {
      enemies.push({
        id: `enemy-${i}`,
        x: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200,
        radius: 0.5,
        category: CATEGORY_ENEMY,
      })
    }

    const projectiles = []
    for (let i = 0; i < 50; i++) {
      projectiles.push({
        id: `proj-${i}`,
        x: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200,
        radius: 0.2,
        category: CATEGORY_PROJECTILE,
      })
    }

    // Warm up
    cs.clear()
    cs.registerEntity(player)
    enemies.forEach(e => cs.registerEntity(e))
    projectiles.forEach(p => cs.registerEntity(p))
    cs.queryCollisions(player, CATEGORY_ENEMY)

    // Timed run
    const iterations = 10
    const times = []

    for (let iter = 0; iter < iterations; iter++) {
      const start = performance.now()

      cs.clear()
      cs.registerEntity(player)
      for (let i = 0; i < enemies.length; i++) cs.registerEntity(enemies[i])
      for (let i = 0; i < projectiles.length; i++) cs.registerEntity(projectiles[i])

      // Query collisions — player vs enemies
      cs.queryCollisions(player, CATEGORY_ENEMY)

      // Query collisions — each projectile vs enemies
      for (let i = 0; i < projectiles.length; i++) {
        cs.queryCollisions(projectiles[i], CATEGORY_ENEMY)
      }

      const elapsed = performance.now() - start
      times.push(elapsed)
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    // Average should be well under 2ms
    expect(avgTime).toBeLessThan(2)
  })

  it('should reset all entities after clear across 100 simulated frames', () => {
    const cs = createCollisionSystem(2)

    // Simulate 100 frames
    for (let frame = 0; frame < 100; frame++) {
      cs.clear()
      for (let i = 0; i < 50; i++) {
        cs.registerEntity({
          id: `entity-${i}`,
          x: Math.random() * 100,
          z: Math.random() * 100,
          radius: 0.5,
          category: CATEGORY_ENEMY,
        })
      }
    }

    // After clear, should have no entities
    cs.clear()
    const player = { id: 'player', x: 0, z: 0, radius: 10, category: CATEGORY_PLAYER }
    const results = cs.queryCollisions(player, CATEGORY_ENEMY)
    expect(results).toHaveLength(0)
  })
})
