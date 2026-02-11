import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGame from './stores/useGame.jsx'
import { useControlsStore } from './stores/useControlsStore.jsx'
import usePlayer from './stores/usePlayer.jsx'
import useEnemies from './stores/useEnemies.jsx'
import useLevel from './stores/useLevel.jsx'
import useWeapons from './stores/useWeapons.jsx'
import useBoons from './stores/useBoons.jsx'
import { createCollisionSystem, CATEGORY_PLAYER, CATEGORY_ENEMY, CATEGORY_PROJECTILE, CATEGORY_XP_ORB } from './systems/collisionSystem.js'
import { createSpawnSystem } from './systems/spawnSystem.js'
import { createProjectileSystem } from './systems/projectileSystem.js'
import { GAME_CONFIG } from './config/gameConfig.js'
import { addExplosion, resetParticles } from './systems/particleSystem.js'
import { playSFX } from './audio/audioManager.js'
import { spawnOrb, updateOrbs, collectOrb, getOrbs, getActiveCount as getOrbCount, resetOrbs } from './systems/xpOrbSystem.js'
import { ENEMIES } from './entities/enemyDefs.js'

// Pre-allocated orb IDs — avoids template string allocation per frame (50 orbs × 60 FPS)
const _orbIds = []
for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
  _orbIds[i] = `xporb_${i}`
}

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
  const prevDashRef = useRef(false)
  const prevDashCooldownRef = useRef(0)
  const prevScanPlanetRef = useRef(null)

  // NOTE: Relies on mount order for correct useFrame execution sequence.
  // GameLoop must mount before GameplayScene in Experience.jsx so its
  // useFrame runs first (state computation before rendering reads).
  useFrame((state, delta) => {
    const { phase, isPaused } = useGame.getState()

    // Reset systems only when starting a new game (from menu), not when resuming from levelUp or planetReward
    if (phase === 'gameplay' && prevPhaseRef.current !== 'gameplay' && prevPhaseRef.current !== 'levelUp' && prevPhaseRef.current !== 'planetReward') {
      spawnSystemRef.current.reset()
      projectileSystemRef.current.reset()
      useWeapons.getState().initializeWeapons()
      useBoons.getState().reset()
      resetParticles()
      resetOrbs()
      usePlayer.getState().reset()
      useEnemies.getState().reset()
      useLevel.getState().reset()
      useLevel.getState().initializePlanets()
    }
    prevPhaseRef.current = phase

    // Only tick during active gameplay
    if (phase !== 'gameplay' || isPaused) return

    // Clamp delta to prevent physics explosion after tab-return
    const clampedDelta = Math.min(delta, 0.1)

    // === TICK ORDER (deterministic) ===
    // 1. Input — read from useControlsStore
    const input = useControlsStore.getState()

    // 2. Player movement — pass speed modifier from boons
    const boonModifiers = useBoons.getState().modifiers
    usePlayer.getState().tick(clampedDelta, input, boonModifiers.speedMultiplier ?? 1)

    // 2b. Dash input (edge detection: trigger only on press, not hold)
    const prevCooldown = prevDashCooldownRef.current
    if (input.dash && !prevDashRef.current) {
      usePlayer.getState().startDash()
      if (usePlayer.getState().isDashing) {
        playSFX('dash-whoosh')
      }
    }
    prevDashRef.current = input.dash
    // Detect cooldown-just-finished transition → play ready ding
    const currentCooldown = usePlayer.getState().dashCooldownTimer
    if (prevCooldown > 0 && currentCooldown <= 0) {
      playSFX('dash-ready')
    }
    prevDashCooldownRef.current = currentCooldown

    // 3. Weapons fire — pass boon modifiers for damage/cooldown/crit
    const playerState = usePlayer.getState()
    const playerPos = playerState.position
    const projCountBefore = useWeapons.getState().projectiles.length
    useWeapons.getState().tick(clampedDelta, playerPos, playerState.rotation, boonModifiers)
    if (useWeapons.getState().projectiles.length > projCountBefore) {
      playSFX('laser-fire')
    }

    // 4. Projectile movement (pass enemies for homing missile steering)
    const enemiesForHoming = useEnemies.getState().enemies
    projectileSystemRef.current.tick(useWeapons.getState().projectiles, clampedDelta, enemiesForHoming)
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

      // 7c. Spawn particles + XP orbs for deaths, increment kill counter
      for (let i = 0; i < deathEvents.length; i++) {
        const event = deathEvents[i]
        if (event.killed) {
          addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
          playSFX('explosion')
          const xpReward = ENEMIES[event.enemy.typeId]?.xpReward ?? 0
          if (xpReward > 0) {
            spawnOrb(event.enemy.x, event.enemy.z, xpReward)
          }
          useGame.getState().incrementKills()
        }
      }
    }

    // 7d. Player-enemy contact damage
    // Pre-check mirrors takeDamage() guards to skip enemy iteration when player can't take damage
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
          playSFX('damage-taken')
        }
      }
    }

    // 7e. Death check
    if (usePlayer.getState().currentHP <= 0) {
      playSFX('game-over-impact')
      useGame.getState().triggerGameOver()
      useWeapons.getState().cleanupInactive()
      return // Stop processing — no XP/level-up after death
    }

    // 7f. System timer — increment and check timeout
    const gameState = useGame.getState()
    const newTimer = gameState.systemTimer + clampedDelta
    gameState.setSystemTimer(newTimer)
    if (newTimer >= GAME_CONFIG.SYSTEM_TIMER) {
      playSFX('game-over-impact')
      gameState.triggerGameOver()
      useWeapons.getState().cleanupInactive()
      return // Stop processing — timer expired
    }

    // Cleanup projectiles marked inactive during damage resolution
    useWeapons.getState().cleanupInactive()

    // 7g. Planet scanning
    const scanResult = useLevel.getState().scanningTick(clampedDelta, playerPos[0], playerPos[2])
    const currentScanId = scanResult.activeScanPlanetId
    if (currentScanId && !prevScanPlanetRef.current) {
      playSFX('scan-start')
    }
    prevScanPlanetRef.current = currentScanId
    if (scanResult.completed) {
      playSFX('scan-complete')
      useGame.getState().triggerPlanetReward(scanResult.tier)
    }

    // 8. XP + progression
    // 8a. Update orb timers
    updateOrbs(clampedDelta)

    // 8b. Register XP orbs in spatial hash
    const orbArray = getOrbs()
    const orbCount = getOrbCount()
    for (let i = 0; i < orbCount; i++) {
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      assignEntity(pool[idx], _orbIds[i], orbArray[i].x, orbArray[i].z, GAME_CONFIG.XP_ORB_PICKUP_RADIUS, CATEGORY_XP_ORB)
      cs.registerEntity(pool[idx++])
    }

    // 8c. Query player-xpOrb collisions
    // Collect in descending index order so swap-to-end doesn't corrupt lower indices
    const orbHits = cs.queryCollisions(pool[0], CATEGORY_XP_ORB)
    if (orbHits.length > 0) {
      const indices = []
      for (let i = 0; i < orbHits.length; i++) {
        const orbIndex = parseInt(orbHits[i].id.split('_')[1], 10)
        if (orbIndex < getOrbCount()) indices.push(orbIndex)
      }
      indices.sort((a, b) => b - a)
      for (let i = 0; i < indices.length; i++) {
        const xpValue = collectOrb(indices[i])
        usePlayer.getState().addXP(xpValue)
      }
    }

    // 8e. Check pending level-up — consume flag and trigger pause + modal
    if (usePlayer.getState().pendingLevelUp) {
      playSFX('level-up')
      usePlayer.getState().consumeLevelUp()
      useGame.getState().triggerLevelUp()
    }

    // 9. Cleanup dead entities
  })

  return null // GameLoop is a logic-only component, no rendering
}
