import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGame from './stores/useGame.jsx'
import { useControlsStore } from './stores/useControlsStore.jsx'
import usePlayer from './stores/usePlayer.jsx'
import useEnemies from './stores/useEnemies.jsx'
import useWeapons from './stores/useWeapons.jsx'
import { createCollisionSystem, CATEGORY_PLAYER, CATEGORY_ENEMY, CATEGORY_PROJECTILE } from './systems/collisionSystem.js'
import { createSpawnSystem } from './systems/spawnSystem.js'
import { createProjectileSystem } from './systems/projectileSystem.js'
import { GAME_CONFIG } from './config/gameConfig.js'
import { addExplosion, resetParticles } from './systems/particleSystem.js'

// Assigns collision entity properties without creating a new object
function assignEntity(e, id, x, z, radius, category) {
  e.id = id; e.x = x; e.z = z; e.radius = radius; e.category = category
}

export default function GameLoop() {
  const collisionSystemRef = useRef(null)
  if (!collisionSystemRef.current) {
    collisionSystemRef.current = createCollisionSystem(GAME_CONFIG.SPATIAL_HASH_CELL_SIZE)
  }

  const spawnSystemRef = useRef(null)
  if (!spawnSystemRef.current) {
    spawnSystemRef.current = createSpawnSystem()
  }

  const projectileSystemRef = useRef(null)
  if (!projectileSystemRef.current) {
    projectileSystemRef.current = createProjectileSystem()
  }

  // Pre-allocated entity descriptor pool — avoids per-frame object allocation
  // during collision registration (150+ entities × 60 FPS = 9000+ allocs/s avoided)
  const entityPoolRef = useRef([])
  const prevPhaseRef = useRef(null)

  // NOTE: Relies on mount order for correct useFrame execution sequence.
  // GameLoop must mount before GameplayScene in Experience.jsx so its
  // useFrame runs first (state computation before rendering reads).
  useFrame((state, delta) => {
    const { phase, isPaused } = useGame.getState()

    // Reset systems when entering gameplay phase
    if (phase === 'gameplay' && prevPhaseRef.current !== 'gameplay') {
      spawnSystemRef.current.reset()
      projectileSystemRef.current.reset()
      useWeapons.getState().initializeWeapons()
      resetParticles()
    }
    prevPhaseRef.current = phase

    // Only tick during active gameplay
    if (phase !== 'gameplay' || isPaused) return

    // Clamp delta to prevent physics explosion after tab-return
    const clampedDelta = Math.min(delta, 0.1)

    // === TICK ORDER (deterministic) ===
    // 1. Input — read from useControlsStore
    const input = useControlsStore.getState()

    // 2. Player movement
    usePlayer.getState().tick(clampedDelta, input)

    // 3. Weapons fire
    const playerState = usePlayer.getState()
    const playerPos = playerState.position
    useWeapons.getState().tick(clampedDelta, playerPos, playerState.rotation)

    // 4. Projectile movement
    projectileSystemRef.current.tick(useWeapons.getState().projectiles, clampedDelta)
    useWeapons.getState().cleanupInactive()

    // 5. Enemy spawning + movement
    const spawnInstructions = spawnSystemRef.current.tick(clampedDelta, playerPos[0], playerPos[2])
    if (spawnInstructions.length > 0) {
      useEnemies.getState().spawnEnemies(spawnInstructions)
    }
    useEnemies.getState().tick(clampedDelta, playerPos)

    // 6. Collision detection
    const cs = collisionSystemRef.current
    cs.clear()

    // Reuse pooled entity descriptors to avoid per-frame GC pressure
    const pool = entityPoolRef.current
    let idx = 0

    // Register player
    if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
    assignEntity(pool[idx], 'player', playerState.position[0], playerState.position[2], GAME_CONFIG.PLAYER_COLLISION_RADIUS, CATEGORY_PLAYER)
    cs.registerEntity(pool[idx++])

    // Register all enemies
    const { enemies } = useEnemies.getState()
    for (let i = 0; i < enemies.length; i++) {
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      const e = enemies[i]
      assignEntity(pool[idx], e.id, e.x, e.z, e.radius, CATEGORY_ENEMY)
      cs.registerEntity(pool[idx++])
    }

    // Register all projectiles
    const { projectiles } = useWeapons.getState()
    for (let i = 0; i < projectiles.length; i++) {
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      const p = projectiles[i]
      assignEntity(pool[idx], p.id, p.x, p.z, p.radius, CATEGORY_PROJECTILE)
      cs.registerEntity(pool[idx++])
    }

    // 7. Damage resolution
    // 7a. Projectile-enemy collisions
    const projectileHits = []
    const projectileStartIdx = 1 + enemies.length

    for (let i = 0; i < projectiles.length; i++) {
      const pEntity = pool[projectileStartIdx + i]
      if (!pEntity) continue
      const hits = cs.queryCollisions(pEntity, CATEGORY_ENEMY)
      if (hits.length > 0) {
        projectiles[i].active = false
        projectileHits.push({ enemyId: hits[0].id, damage: projectiles[i].damage })
      }
    }

    // 7b. Apply enemy damage (batch)
    if (projectileHits.length > 0) {
      const deathEvents = useEnemies.getState().damageEnemiesBatch(projectileHits)

      // 7c. Spawn particles for deaths
      for (let i = 0; i < deathEvents.length; i++) {
        const event = deathEvents[i]
        if (event.killed) {
          addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
        }
      }
    }

    // 7d. Player-enemy contact damage
    const playerHits = cs.queryCollisions(pool[0], CATEGORY_ENEMY)
    if (playerHits.length > 0) {
      const pState = usePlayer.getState()
      if (pState.contactDamageCooldown <= 0 && !pState.isInvulnerable) {
        // Re-read enemies after projectile damage — killed enemies should not deal contact damage
        const aliveEnemies = useEnemies.getState().enemies
        let totalDamage = 0
        for (let i = 0; i < playerHits.length; i++) {
          const enemy = aliveEnemies.find((e) => e.id === playerHits[i].id)
          if (enemy) totalDamage += enemy.damage
        }
        if (totalDamage > 0) {
          usePlayer.getState().takeDamage(totalDamage)
        }
      }
    }

    // 7e. Death check
    if (usePlayer.getState().currentHP <= 0) {
      useGame.getState().triggerGameOver()
    }

    // Cleanup projectiles marked inactive during damage resolution
    useWeapons.getState().cleanupInactive()

    // 8. XP + progression
    // 9. Cleanup dead entities
  })

  return null // GameLoop is a logic-only component, no rendering
}
