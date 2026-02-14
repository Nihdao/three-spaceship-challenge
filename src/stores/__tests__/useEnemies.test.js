import { describe, it, expect, beforeEach } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

describe('useEnemies store', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
  })

  it('should have correct initial state', () => {
    const state = useEnemies.getState()
    expect(state.enemies).toEqual([])
    expect(state.nextId).toBe(0)
  })

  it('should spawn an enemy with correct stats from enemyDefs', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    const state = useEnemies.getState()

    expect(state.enemies.length).toBe(1)

    const e = state.enemies[0]
    expect(e.id).toBe('enemy_0')
    expect(e.typeId).toBe('FODDER_BASIC')
    expect(e.x).toBe(10)
    expect(e.z).toBe(20)
    expect(e.hp).toBe(ENEMIES.FODDER_BASIC.hp)
    expect(e.maxHp).toBe(ENEMIES.FODDER_BASIC.hp)
    expect(e.speed).toBe(ENEMIES.FODDER_BASIC.speed)
    expect(e.damage).toBe(ENEMIES.FODDER_BASIC.damage)
    expect(e.radius).toBe(ENEMIES.FODDER_BASIC.radius)
    expect(e.behavior).toBe('chase')
    expect(e.color).toBe(ENEMIES.FODDER_BASIC.color)
    expect(e.meshScale).toEqual(ENEMIES.FODDER_BASIC.meshScale)
  })

  it('should spawn FODDER_TANK with correct stats', () => {
    useEnemies.getState().spawnEnemy('FODDER_TANK', -5, 15)
    const e = useEnemies.getState().enemies[0]

    expect(e.typeId).toBe('FODDER_TANK')
    expect(e.hp).toBe(ENEMIES.FODDER_TANK.hp)
    expect(e.speed).toBe(ENEMIES.FODDER_TANK.speed)
    expect(e.color).toBe(ENEMIES.FODDER_TANK.color)
    expect(e.meshScale).toEqual(ENEMIES.FODDER_TANK.meshScale)
  })

  it('should generate unique IDs across spawns', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 0, 0)
    useEnemies.getState().spawnEnemy('FODDER_TANK', 10, 10)
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 20, 20)

    const enemies = useEnemies.getState().enemies
    const ids = enemies.map((e) => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should respect MAX_ENEMIES_ON_SCREEN cap', () => {
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN + 10; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, i)
    }

    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
  })

  it('should silently skip spawn when at cap', () => {
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, i)
    }

    // Attempt to spawn one more
    useEnemies.getState().spawnEnemy('FODDER_TANK', 999, 999)

    const enemies = useEnemies.getState().enemies
    expect(enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    expect(enemies.find((e) => e.x === 999)).toBeUndefined()
  })

  it('should batch spawn enemies in a single set() call', () => {
    const instructions = [
      { typeId: 'FODDER_BASIC', x: 10, z: 20 },
      { typeId: 'FODDER_TANK', x: 30, z: 40 },
      { typeId: 'FODDER_BASIC', x: 50, z: 60 },
    ]

    useEnemies.getState().spawnEnemies(instructions)

    const state = useEnemies.getState()
    expect(state.enemies.length).toBe(3)
    expect(state.enemies[0].typeId).toBe('FODDER_BASIC')
    expect(state.enemies[1].typeId).toBe('FODDER_TANK')
    expect(state.enemies[2].typeId).toBe('FODDER_BASIC')
    expect(state.nextId).toBe(3)
  })

  it('should respect MAX cap in batch spawn', () => {
    // Fill to near cap
    for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN - 1; i++) {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', i, i)
    }

    const instructions = [
      { typeId: 'FODDER_TANK', x: 100, z: 100 },
      { typeId: 'FODDER_TANK', x: 200, z: 200 },
      { typeId: 'FODDER_TANK', x: 300, z: 300 },
    ]

    useEnemies.getState().spawnEnemies(instructions)

    // Only 1 slot was available
    expect(useEnemies.getState().enemies.length).toBe(GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
  })

  it('should move enemies toward player position on tick (chase behavior)', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 100, 0)
    const playerPosition = [0, 0, 0]

    useEnemies.getState().tick(1.0, playerPosition)

    const e = useEnemies.getState().enemies[0]
    // Enemy should have moved toward player (x=0), so x should be less than 100
    expect(e.x).toBeLessThan(100)
    // Enemy at (100,0) chasing (0,0) should only move on x axis
    expect(e.z).toBeCloseTo(0, 5)
  })

  it('should move enemies at correct speed', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 100, 0)
    const playerPosition = [0, 0, 0]
    const delta = 0.5

    useEnemies.getState().tick(delta, playerPosition)

    const e = useEnemies.getState().enemies[0]
    const expectedX = 100 - ENEMIES.FODDER_BASIC.speed * delta
    expect(e.x).toBeCloseTo(expectedX, 1)
  })

  it('should clamp enemy positions to play area', () => {
    const bound = GAME_CONFIG.PLAY_AREA_SIZE
    // Spawn enemy far away with massive delta to push beyond bounds
    useEnemies.getState().spawnEnemy('FODDER_BASIC', bound - 1, 0)
    const playerPosition = [bound + 1000, 0, 0]

    useEnemies.getState().tick(100, playerPosition)

    const e = useEnemies.getState().enemies[0]
    expect(e.x).toBeLessThanOrEqual(bound)
    expect(e.z).toBeGreaterThanOrEqual(-bound)
  })

  it('should kill enemy and remove from array', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    useEnemies.getState().spawnEnemy('FODDER_TANK', 30, 40)

    const id = useEnemies.getState().enemies[0].id
    useEnemies.getState().killEnemy(id)

    const state = useEnemies.getState()
    expect(state.enemies.length).toBe(1)
    expect(state.enemies[0].typeId).toBe('FODDER_TANK')
  })

  it('should handle killEnemy with non-existent id gracefully', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    useEnemies.getState().killEnemy('nonexistent_id')
    expect(useEnemies.getState().enemies.length).toBe(1)
  })

  it('should reset all enemies and state', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
    useEnemies.getState().spawnEnemy('FODDER_TANK', 30, 40)

    useEnemies.getState().reset()

    const state = useEnemies.getState()
    expect(state.enemies).toEqual([])
    expect(state.nextId).toBe(0)
  })

  it('should not tick when no enemies exist', () => {
    // Should not throw
    useEnemies.getState().tick(1.0, [0, 0, 0])
    expect(useEnemies.getState().enemies).toEqual([])
  })

  it('should ignore invalid typeId on spawn', () => {
    useEnemies.getState().spawnEnemy('INVALID_TYPE', 10, 20)
    expect(useEnemies.getState().enemies.length).toBe(0)
  })

  // --- Sweep behavior (Story 16.2, Task 1) ---
  describe('sweep behavior', () => {
    const sweepDir = { x: 1, z: 0 }

    it('should initialize sweep-specific properties on spawn via spawnEnemies', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'FODDER_SWARM', x: 0, z: 0, sweepDirection: sweepDir },
      ])
      const e = useEnemies.getState().enemies[0]
      expect(e.behavior).toBe('sweep')
      expect(e.sweepDirection).toEqual(sweepDir)
      expect(e.despawnTimer).toBeGreaterThanOrEqual(10)
      expect(e.despawnTimer).toBeLessThanOrEqual(15)
    })

    it('should move sweep enemies along sweepDirection, ignoring player position', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'FODDER_SWARM', x: 0, z: 0, sweepDirection: sweepDir },
      ])
      const playerPos = [500, 0, 500] // Player is far away in a different direction

      useEnemies.getState().tick(1.0, playerPos)

      const e = useEnemies.getState().enemies[0]
      // Should move along x direction (sweepDir.x=1), NOT toward player
      expect(e.x).toBeCloseTo(ENEMIES.FODDER_SWARM.speed * 1.0, 1)
      expect(e.z).toBeCloseTo(0, 5)
    })

    it('should not clamp sweep enemies to play area bounds', () => {
      const bound = GAME_CONFIG.PLAY_AREA_SIZE
      useEnemies.getState().spawnEnemies([
        { typeId: 'FODDER_SWARM', x: bound - 1, z: 0, sweepDirection: sweepDir },
      ])
      // Override despawnTimer to prevent early despawn
      useEnemies.getState().enemies[0].despawnTimer = 100

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      // Sweep enemies should be allowed to go past the play area
      expect(e.x).toBeGreaterThan(bound)
    })

    it('should despawn sweep enemies when despawnTimer expires', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'FODDER_SWARM', x: 0, z: 0, sweepDirection: sweepDir },
      ])
      // Set despawnTimer to expire in this tick
      useEnemies.getState().enemies[0].despawnTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      expect(useEnemies.getState().enemies.length).toBe(0)
    })

    it('should despawn sweep enemies when crossing extended bounds', () => {
      const farOut = GAME_CONFIG.PLAY_AREA_SIZE + 51
      useEnemies.getState().spawnEnemies([
        { typeId: 'FODDER_SWARM', x: farOut, z: 0, sweepDirection: sweepDir },
      ])
      useEnemies.getState().enemies[0].despawnTimer = 100 // No timeout

      useEnemies.getState().tick(0.016, [0, 0, 0])

      expect(useEnemies.getState().enemies.length).toBe(0)
    })

    it('should not despawn other enemy types based on sweep logic', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)

      useEnemies.getState().tick(100, [0, 0, 0]) // Large delta

      // Chase enemy should still exist (clamped, not despawned)
      expect(useEnemies.getState().enemies.length).toBe(1)
    })
  })

  // --- Shockwave behavior (Story 16.2, Task 2) ---
  describe('shockwave behavior', () => {
    it('should initialize shockwaveTimer on spawn', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SHOCKWAVE_BLOB', x: 0, z: 0 },
      ])
      const e = useEnemies.getState().enemies[0]
      expect(e.behavior).toBe('shockwave')
      expect(e.shockwaveTimer).toBe(ENEMIES.SHOCKWAVE_BLOB.shockwaveInterval)
    })

    it('should move shockwave enemies toward player (chase logic)', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SHOCKWAVE_BLOB', x: 100, z: 0 },
      ])

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.x).toBeLessThan(100)
    })

    it('should decrement shockwaveTimer each tick', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SHOCKWAVE_BLOB', x: 100, z: 0 },
      ])

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.shockwaveTimer).toBeCloseTo(ENEMIES.SHOCKWAVE_BLOB.shockwaveInterval - 1.0, 5)
    })

    it('should spawn shockwave entity when timer reaches zero', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SHOCKWAVE_BLOB', x: 50, z: 0 },
      ])
      // Set timer to expire this tick
      useEnemies.getState().enemies[0].shockwaveTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const shockwaves = useEnemies.getState().shockwaves
      expect(shockwaves.length).toBe(1)
      expect(shockwaves[0].active).toBe(true)
      expect(shockwaves[0].radius).toBe(0)
      expect(shockwaves[0].maxRadius).toBe(ENEMIES.SHOCKWAVE_BLOB.shockwaveRadius)
      expect(shockwaves[0].damage).toBe(ENEMIES.SHOCKWAVE_BLOB.shockwaveDamage)
    })

    it('should reset shockwaveTimer after emission', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SHOCKWAVE_BLOB', x: 50, z: 0 },
      ])
      useEnemies.getState().enemies[0].shockwaveTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.shockwaveTimer).toBeCloseTo(ENEMIES.SHOCKWAVE_BLOB.shockwaveInterval, 1)
    })
  })

  // --- Shockwave entities (Story 16.2, Task 2) ---
  describe('shockwave entities', () => {
    it('should have shockwaves array in initial state', () => {
      expect(useEnemies.getState().shockwaves).toEqual([])
    })

    it('should expand shockwave radius over lifetime', () => {
      useEnemies.getState().spawnShockwave(10, 20, 15, 8)
      useEnemies.getState().tickShockwaves(0.25)

      const sw = useEnemies.getState().shockwaves[0]
      expect(sw.radius).toBeGreaterThan(0)
      expect(sw.active).toBe(true)
    })

    it('should deactivate shockwave after lifetime expires', () => {
      useEnemies.getState().spawnShockwave(10, 20, 15, 8)
      useEnemies.getState().tickShockwaves(1.0) // lifetime is 0.5s

      const sw = useEnemies.getState().shockwaves[0]
      expect(sw.active).toBe(false)
    })

    it('should reset shockwaves on store reset', () => {
      useEnemies.getState().spawnShockwave(10, 20, 15, 8)
      useEnemies.getState().reset()
      expect(useEnemies.getState().shockwaves).toEqual([])
    })
  })

  // --- Sniper mobile behavior (Story 16.2, Task 3) ---
  describe('sniper_mobile behavior', () => {
    it('should initialize attackTimer on spawn', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_MOBILE', x: 0, z: 0 },
      ])
      const e = useEnemies.getState().enemies[0]
      expect(e.behavior).toBe('sniper_mobile')
      expect(e.attackTimer).toBe(ENEMIES.SNIPER_MOBILE.attackCooldown)
    })

    it('should move away from player when too close', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_MOBILE', x: 20, z: 0 },
      ])

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      // Distance < 30 (minRange), should move AWAY from player
      expect(e.x).toBeGreaterThan(20)
    })

    it('should move toward player when too far', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_MOBILE', x: 100, z: 0 },
      ])

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      // Distance > 40 (maxRange), should move TOWARD player
      expect(e.x).toBeLessThan(100)
    })

    it('should fire enemy projectile when attackTimer expires', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_MOBILE', x: 35, z: 0 },
      ])
      useEnemies.getState().enemies[0].attackTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const projs = useEnemies.getState().enemyProjectiles
      expect(projs.length).toBe(1)
      expect(projs[0].active).toBe(true)
      expect(projs[0].damage).toBe(ENEMIES.SNIPER_MOBILE.projectileDamage)
    })

    it('should reset attackTimer after firing', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_MOBILE', x: 35, z: 0 },
      ])
      useEnemies.getState().enemies[0].attackTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.attackTimer).toBeCloseTo(ENEMIES.SNIPER_MOBILE.attackCooldown, 1)
    })
  })

  // --- Enemy projectiles (Story 16.2, Task 3) ---
  describe('enemy projectiles', () => {
    it('should have enemyProjectiles array in initial state', () => {
      expect(useEnemies.getState().enemyProjectiles).toEqual([])
    })

    it('should move enemy projectiles along velocity each tick', () => {
      useEnemies.getState().spawnEnemyProjectile(0, 0, 10, 0, 80, 10, '#ff3333')

      useEnemies.getState().tickEnemyProjectiles(0.5)

      const p = useEnemies.getState().enemyProjectiles[0]
      expect(p.x).toBeGreaterThan(0)
      expect(p.active).toBe(true)
    })

    it('should deactivate enemy projectiles after lifetime expires', () => {
      useEnemies.getState().spawnEnemyProjectile(0, 0, 10, 0, 80, 10, '#ff3333')

      useEnemies.getState().tickEnemyProjectiles(6.0) // lifetime is 5s

      const p = useEnemies.getState().enemyProjectiles[0]
      expect(p.active).toBe(false)
    })

    it('should reset enemy projectiles on store reset', () => {
      useEnemies.getState().spawnEnemyProjectile(0, 0, 10, 0, 80, 10, '#ff3333')
      useEnemies.getState().reset()
      expect(useEnemies.getState().enemyProjectiles).toEqual([])
    })
  })

  // --- Sniper fixed behavior (Story 16.2, Task 4) ---
  describe('sniper_fixed behavior', () => {
    it('should initialize attack state on spawn', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_FIXED', x: 200, z: 0 },
      ])
      const e = useEnemies.getState().enemies[0]
      expect(e.behavior).toBe('sniper_fixed')
      expect(e.attackTimer).toBe(ENEMIES.SNIPER_FIXED.attackCooldown)
      expect(e.telegraphTimer).toBe(0)
      expect(e.attackState).toBe('idle')
    })

    it('should not move (speed=0)', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_FIXED', x: 200, z: 0 },
      ])

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.x).toBe(200)
      expect(e.z).toBe(0)
    })

    it('should transition to telegraph state when attackTimer expires', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_FIXED', x: 200, z: 0 },
      ])
      useEnemies.getState().enemies[0].attackTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.attackState).toBe('telegraph')
    })

    it('should fire projectile after telegraph duration and return to idle', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'SNIPER_FIXED', x: 200, z: 0 },
      ])
      const e = useEnemies.getState().enemies[0]
      e.attackState = 'telegraph'
      e.telegraphTimer = 0.9

      useEnemies.getState().tick(0.2, [0, 0, 0]) // telegraphTimer reaches 1.1 >= telegraphDuration(1.0)

      const eAfter = useEnemies.getState().enemies[0]
      expect(eAfter.attackState).toBe('idle')
      expect(useEnemies.getState().enemyProjectiles.length).toBe(1)
    })
  })

  // --- Teleport behavior (Story 16.2, Task 5) ---
  describe('teleport behavior', () => {
    it('should initialize teleportTimer on spawn', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'TELEPORTER', x: 50, z: 0 },
      ])
      const e = useEnemies.getState().enemies[0]
      expect(e.behavior).toBe('teleport')
      expect(e.teleportTimer).toBe(ENEMIES.TELEPORTER.teleportCooldown)
    })

    it('should chase player before teleport timer expires', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'TELEPORTER', x: 100, z: 0 },
      ])

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.x).toBeLessThan(100) // Moving toward player
    })

    it('should teleport to new position when timer expires', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'TELEPORTER', x: 50, z: 0 },
      ])
      useEnemies.getState().enemies[0].teleportTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      // After teleport, position should have changed (though it also chased first)
      // The teleportTimer should be reset
      expect(e.teleportTimer).toBeCloseTo(ENEMIES.TELEPORTER.teleportCooldown, 1)
    })

    it('should fire burst of 3 projectiles after teleporting', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'TELEPORTER', x: 50, z: 0 },
      ])
      useEnemies.getState().enemies[0].teleportTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const projs = useEnemies.getState().enemyProjectiles
      expect(projs.length).toBe(ENEMIES.TELEPORTER.burstProjectileCount)
    })

    it('should reset teleportTimer after teleporting', () => {
      useEnemies.getState().spawnEnemies([
        { typeId: 'TELEPORTER', x: 50, z: 0 },
      ])
      useEnemies.getState().enemies[0].teleportTimer = 0.5

      useEnemies.getState().tick(1.0, [0, 0, 0])

      const e = useEnemies.getState().enemies[0]
      expect(e.teleportTimer).toBeCloseTo(ENEMIES.TELEPORTER.teleportCooldown, 1)
    })
  })
})
