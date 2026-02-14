import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useGame from './stores/useGame.jsx'
import { useControlsStore } from './stores/useControlsStore.jsx'
import usePlayer from './stores/usePlayer.jsx'
import useEnemies from './stores/useEnemies.jsx'
import useLevel from './stores/useLevel.jsx'
import useWeapons from './stores/useWeapons.jsx'
import useBoons from './stores/useBoons.jsx'
import useBoss from './stores/useBoss.jsx'
import { createCollisionSystem, CATEGORY_PLAYER, CATEGORY_ENEMY, CATEGORY_PROJECTILE, CATEGORY_XP_ORB, CATEGORY_BOSS, CATEGORY_BOSS_PROJECTILE, CATEGORY_SHOCKWAVE, CATEGORY_ENEMY_PROJECTILE, CATEGORY_HEAL_GEM } from './systems/collisionSystem.js'
import { createSpawnSystem } from './systems/spawnSystem.js'
import { createProjectileSystem } from './systems/projectileSystem.js'
import { GAME_CONFIG } from './config/gameConfig.js'
import { addExplosion, resetParticles } from './systems/particleSystem.js'
import { playSFX } from './audio/audioManager.js'
import { spawnOrb, updateOrbs, updateMagnetization, collectOrb, getOrbs, getActiveCount as getOrbCount, resetOrbs } from './systems/xpOrbSystem.js'
import { spawnHealGem, updateHealGemMagnetization, collectHealGem, getHealGems, getActiveHealGemCount, resetHealGems } from './systems/healGemSystem.js'
import { ENEMIES } from './entities/enemyDefs.js'
import { WEAPONS } from './entities/weaponDefs.js'

// Pre-allocated orb IDs — avoids template string allocation per frame (50 orbs × 60 FPS)
const _orbIds = []
for (let i = 0; i < GAME_CONFIG.MAX_XP_ORBS; i++) {
  _orbIds[i] = `xporb_${i}`
}

// Pre-allocated heal gem IDs — same pattern as orbs (Story 19.2)
const _healGemIds = []
for (let i = 0; i < GAME_CONFIG.MAX_HEAL_GEMS; i++) {
  _healGemIds[i] = `healGem_${i}`
}

// Assigns collision entity properties without creating a new object
function assignEntity(e, id, x, z, radius, category) {
  e.id = id; e.x = x; e.z = z; e.radius = radius; e.category = category
}

// Composes all damage multiplier sources (boons + upgrades + dilemmas + ship) into final multiplier
// Centralizes damage composition to ensure consistency across gameplay and boss phases
function composeDamageMultiplier(playerState, boonModifiers, upgradeStats, dilemmaStats) {
  return (boonModifiers.damageMultiplier ?? 1)
    * upgradeStats.damageMult
    * dilemmaStats.damageMult
    * playerState.shipBaseDamageMultiplier
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

    // Clear residual entities when entering from tunnel (new system)
    // advanceSystem + resetForNewSystem are called by TunnelHub BEFORE phase change
    // GameLoop only clears entity pools and resets per-system systems
    if ((phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef.current === 'tunnel') {
      // Debug logging for system transitions (Story 18.4)
      if (GAME_CONFIG.DEBUG_TRANSITIONS) {
        const p = usePlayer.getState()
        const g = useGame.getState()
        const l = useLevel.getState()
        console.group(`[System Transition] Entering System ${l.currentSystem}`)
        console.log('Player: level=%d, HP=%d/%d, XP=%d/%d, fragments=%d', p.currentLevel, p.currentHP, p.maxHP, p.currentXP, p.xpForNextLevel, p.fragments)
        console.log('Weapons:', useWeapons.getState().activeWeapons.length, 'equipped')
        console.log('Boons:', useBoons.getState().activeBoons.length, 'active')
        console.log('Run stats: kills=%d, score=%d, totalTime=%.1fs', g.kills, g.score, g.totalElapsedTime)
        console.log('Reset: enemies, projectiles, orbs, particles, boss, spawn system, system timer')
        console.groupEnd()
      }

      useEnemies.getState().reset()
      useWeapons.getState().clearProjectiles()
      useBoss.getState().reset()
      spawnSystemRef.current.reset()
      projectileSystemRef.current.reset()
      resetParticles()
      resetOrbs()
      resetHealGems() // Story 19.2
      // Accumulate elapsed time before resetting (for total run time display)
      const prevSystemTime = useGame.getState().systemTimer
      if (prevSystemTime > 0) useGame.getState().accumulateTime(prevSystemTime)
      // Note: useGame.systemTimer is the authoritative game timer (not useLevel.systemTimer)
      // kills/score intentionally persist across systems (run-total for roguelite scoring)
      useGame.getState().setSystemTimer(0)
      // Initialize planets for the new system (advanceSystem clears them, GameLoop re-populates)
      useLevel.getState().initializePlanets()
    }

    // Reset systems only when starting a new game (from menu), not when resuming from levelUp, planetReward, tunnel, or systemEntry→gameplay
    if ((phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef.current !== 'gameplay' && prevPhaseRef.current !== 'levelUp' && prevPhaseRef.current !== 'planetReward' && prevPhaseRef.current !== 'tunnel' && prevPhaseRef.current !== 'systemEntry') {
      spawnSystemRef.current.reset()
      projectileSystemRef.current.reset()
      useWeapons.getState().initializeWeapons()
      useBoons.getState().reset()
      resetParticles()
      resetOrbs()
      resetHealGems() // Story 19.2
      usePlayer.getState().reset()
      useEnemies.getState().reset()
      useLevel.getState().reset()
      useLevel.getState().initializePlanets()
      useBoss.getState().reset()
    }

    prevPhaseRef.current = phase

    // Story 17.4: Boss phase is deprecated — boss fight now happens during 'gameplay' phase
    // Removed deprecated boss phase tick code (previously ~210 lines, boss tick now in gameplay section 7f-ter)

    // Only tick during active gameplay
    if (phase !== 'gameplay' || isPaused) return

    // Clamp delta to prevent physics explosion after tab-return
    const clampedDelta = Math.min(delta, 0.1)

    // === TICK ORDER (deterministic) ===
    // 1. Input — read from useControlsStore
    const input = useControlsStore.getState()

    // 2. Player movement — compose boon + upgrade + dilemma speed modifiers
    const boonModifiers = useBoons.getState().modifiers
    const { upgradeStats, dilemmaStats } = usePlayer.getState()
    const composedSpeedMult = (boonModifiers.speedMultiplier ?? 1) * upgradeStats.speedMult * dilemmaStats.speedMult
    usePlayer.getState().tick(clampedDelta, input, composedSpeedMult, GAME_CONFIG.PLAY_AREA_SIZE, boonModifiers.hpRegenRate ?? 0)

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

    // 3. Weapons fire — compose boon + upgrade + dilemma + ship modifiers
    const playerState = usePlayer.getState()
    const playerPos = playerState.position
    const composedWeaponMods = {
      damageMultiplier: composeDamageMultiplier(playerState, boonModifiers, upgradeStats, dilemmaStats),
      cooldownMultiplier: (boonModifiers.cooldownMultiplier ?? 1) * upgradeStats.cooldownMult * dilemmaStats.cooldownMult,
      critChance: boonModifiers.critChance ?? 0,
      critMultiplier: boonModifiers.critMultiplier ?? 2.0,
      projectileSpeedMultiplier: boonModifiers.projectileSpeedMultiplier ?? 1.0,
    }
    const projCountBefore = useWeapons.getState().projectiles.length
    useWeapons.getState().tick(clampedDelta, playerPos, playerState.rotation, composedWeaponMods)
    // Story 11.3: Play per-weapon SFX for newly fired projectiles
    const allProjs = useWeapons.getState().projectiles
    if (allProjs.length > projCountBefore) {
      let lastWid = null
      for (let i = projCountBefore; i < allProjs.length; i++) {
        const wid = allProjs[i].weaponId
        if (wid !== lastWid) {
          playSFX(WEAPONS[wid]?.sfxKey ?? 'laser-fire')
          lastWid = wid
        }
      }
    }

    // 4. Projectile movement (pass enemies for homing missile steering)
    const enemiesForHoming = useEnemies.getState().enemies
    projectileSystemRef.current.tick(useWeapons.getState().projectiles, clampedDelta, enemiesForHoming)
    useWeapons.getState().cleanupInactive()

    // 5. Enemy spawning + movement (skip during wormhole activation/active/boss fight — Story 17.4)
    const wormholeStatePre = useLevel.getState().wormholeState
    const bossActive = useBoss.getState().isActive
    if (wormholeStatePre !== 'activating' && wormholeStatePre !== 'active' && wormholeStatePre !== 'inactive' && !bossActive && !useGame.getState()._debugSpawnPaused) {
      const currentSystem = useLevel.getState().currentSystem
      const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
      const spawnInstructions = spawnSystemRef.current.tick(clampedDelta, playerPos[0], playerPos[2], scaling)
      if (spawnInstructions.length > 0) {
        useEnemies.getState().spawnEnemies(spawnInstructions)
      }
    }
    useEnemies.getState().tick(clampedDelta, playerPos)

    // 5b. Teleport particle effects (departure + arrival bursts)
    const teleportEvents = useEnemies.getState().consumeTeleportEvents()
    for (let i = 0; i < teleportEvents.length; i++) {
      const te = teleportEvents[i]
      addExplosion(te.oldX, te.oldZ, '#cc66ff', 0.5)
      addExplosion(te.newX, te.newZ, '#cc66ff', 0.5)
    }

    // 5c. Shockwave expansion + enemy projectile movement
    useEnemies.getState().tickShockwaves(clampedDelta)
    useEnemies.getState().tickEnemyProjectiles(clampedDelta)

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

    // Register active shockwaves
    const shockwaves = useEnemies.getState().shockwaves
    for (let i = 0; i < shockwaves.length; i++) {
      if (!shockwaves[i].active) continue
      const sw = shockwaves[i]
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      assignEntity(pool[idx], sw.id, sw.x, sw.z, sw.radius, CATEGORY_SHOCKWAVE)
      cs.registerEntity(pool[idx++])
    }

    // Register active enemy projectiles
    const enemyProj = useEnemies.getState().enemyProjectiles
    for (let i = 0; i < enemyProj.length; i++) {
      if (!enemyProj[i].active) continue
      const ep = enemyProj[i]
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      assignEntity(pool[idx], ep.id, ep.x, ep.z, ep.radius, CATEGORY_ENEMY_PROJECTILE)
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
        const proj = projectiles[i]

        // Story 11.3: Piercing projectiles (Railgun) — hit multiple enemies before despawning
        if (proj.piercing) {
          for (let h = 0; h < hits.length; h++) {
            if (proj.pierceHits >= proj.pierceCount) break
            projectileHits.push({ enemyId: hits[h].id, damage: proj.damage })
            proj.pierceHits++
          }
          if (proj.pierceHits >= proj.pierceCount) proj.active = false
        // Story 11.3: Explosive projectiles — deal direct hit + area damage
        } else if (proj.explosionRadius) {
          proj.active = false
          projectileHits.push({ enemyId: hits[0].id, damage: proj.damage })
          // Area damage to all enemies within explosion radius
          for (let e = 0; e < enemies.length; e++) {
            if (enemies[e].id === hits[0].id) continue // already hit directly
            const dx = enemies[e].x - proj.x
            const dz = enemies[e].z - proj.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist <= proj.explosionRadius) {
              projectileHits.push({ enemyId: enemies[e].id, damage: proj.explosionDamage })
            }
          }
          addExplosion(proj.x, proj.z, proj.color)
        } else {
          proj.active = false
          projectileHits.push({ enemyId: hits[0].id, damage: proj.damage })
        }
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
          const xpReward = event.enemy.xpReward ?? ENEMIES[event.enemy.typeId]?.xpReward ?? 0
          if (xpReward > 0) {
            // Story 19.1: Roll for rare XP gem drop
            const isRare = Math.random() < GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE
            if (isRare) {
              spawnOrb(event.enemy.x, event.enemy.z, xpReward * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER, true)
            } else {
              spawnOrb(event.enemy.x, event.enemy.z, xpReward, false)
            }
          }
          // Story 19.2: Roll for heal gem drop
          if (Math.random() < GAME_CONFIG.HEAL_GEM_DROP_CHANCE) {
            spawnHealGem(event.enemy.x, event.enemy.z, GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT)
          }
          useGame.getState().incrementKills()
          useGame.getState().addScore(GAME_CONFIG.SCORE_PER_KILL)
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
          usePlayer.getState().takeDamage(totalDamage, boonModifiers.damageReduction ?? 0)
          playSFX('damage-taken')
        }
      }
    }

    // 7d-bis. Shockwave vs player damage
    const swHits = cs.queryCollisions(pool[0], CATEGORY_SHOCKWAVE)
    if (swHits.length > 0) {
      const pState = usePlayer.getState()
      if (pState.contactDamageCooldown <= 0 && !pState.isInvulnerable) {
        let totalSwDamage = 0
        for (let i = 0; i < swHits.length; i++) {
          const sw = shockwaves.find(s => s.id === swHits[i].id)
          if (sw) totalSwDamage += sw.damage
        }
        if (totalSwDamage > 0) {
          usePlayer.getState().takeDamage(totalSwDamage, boonModifiers.damageReduction ?? 0)
          playSFX('damage-taken')
        }
      }
    }

    // 7d-ter. Enemy projectile vs player damage
    const epHits = cs.queryCollisions(pool[0], CATEGORY_ENEMY_PROJECTILE)
    if (epHits.length > 0) {
      const pState = usePlayer.getState()
      if (pState.contactDamageCooldown <= 0 && !pState.isInvulnerable) {
        let totalEpDamage = 0
        for (let i = 0; i < epHits.length; i++) {
          const ep = enemyProj.find(p => p.id === epHits[i].id)
          if (ep) {
            totalEpDamage += ep.damage
            ep.active = false // Despawn on hit
          }
        }
        if (totalEpDamage > 0) {
          usePlayer.getState().takeDamage(totalEpDamage, boonModifiers.damageReduction ?? 0)
          playSFX('damage-taken')
        }
      }
    }

    // 7e. Death check
    if (usePlayer.getState().currentHP <= 0) {
      playSFX('game-over-impact')
      useGame.getState().updateHighScore()
      useGame.getState().triggerGameOver()
      useWeapons.getState().cleanupInactive()
      return // Stop processing — no XP/level-up after death
    }

    // 7f. System timer — increment and check timeout (pause during boss fight — Story 17.4)
    const gameState = useGame.getState()
    let newTimer = gameState.systemTimer // Initialize with current timer
    if (!bossActive) {
      newTimer = gameState.systemTimer + clampedDelta
      gameState.setSystemTimer(newTimer)
      if (newTimer >= GAME_CONFIG.SYSTEM_TIMER) {
        // Don't trigger game over if wormhole is activating/active (player found it)
        if (wormholeStatePre !== 'activating' && wormholeStatePre !== 'active') {
          playSFX('game-over-impact')
          gameState.updateHighScore()
          gameState.triggerGameOver()
          useWeapons.getState().cleanupInactive()
          return // Stop processing — timer expired
        }
      }
    }

    // Cleanup projectiles marked inactive during damage resolution
    useWeapons.getState().cleanupInactive()

    // 7f-bis. Wormhole spawn + activation check
    const levelState = useLevel.getState()
    if (levelState.wormholeState === 'hidden') {
      if (newTimer >= GAME_CONFIG.SYSTEM_TIMER * GAME_CONFIG.WORMHOLE_SPAWN_TIMER_THRESHOLD) {
        useLevel.getState().spawnWormhole(playerPos[0], playerPos[2])
        playSFX('wormhole-spawn')
      }
    } else if (levelState.wormholeState === 'visible') {
      const wh = levelState.wormhole
      const dx = playerPos[0] - wh.x
      const dz = playerPos[2] - wh.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist <= GAME_CONFIG.WORMHOLE_ACTIVATION_RADIUS) {
        useLevel.getState().activateWormhole()
        useEnemies.getState().reset()
        playSFX('wormhole-activate')
      }
    } else if (levelState.wormholeState === 'activating') {
      const result = useLevel.getState().wormholeTick(clampedDelta)
      if (result.transitionReady) {
        // Story 17.4: Spawn boss in-place instead of transitioning to BossScene
        useBoss.getState().spawnBoss(levelState.currentSystem, levelState.wormhole)
        useLevel.getState().setWormholeInactive()
      }
    } else if (levelState.wormholeState === 'reactivated') {
      // Story 17.4: Post-boss wormhole — player must enter to transition
      const wh = levelState.wormhole
      const dx = playerPos[0] - wh.x
      const dz = playerPos[2] - wh.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist <= GAME_CONFIG.WORMHOLE_ACTIVATION_RADIUS) {
        if (levelState.currentSystem < GAME_CONFIG.MAX_SYSTEMS) {
          useGame.getState().setPhase('tunnel')
        } else {
          useGame.getState().updateHighScore()
          useGame.getState().triggerVictory()
        }
      }
    }

    // 7f-ter. Boss fight in gameplay (Story 17.4)
    if (bossActive) {
      const bossState = useBoss.getState()
      const boss = bossState.boss

      // Boss defeat animation
      if (bossState.bossDefeated) {
        const defeatResult = bossState.defeatTick(clampedDelta)
        for (let i = 0; i < defeatResult.explosions.length; i++) {
          const exp = defeatResult.explosions[i]
          const scale = exp.isFinal ? GAME_CONFIG.BOSS_DEATH_FINAL_EXPLOSION_SCALE : 1
          addExplosion(exp.x, exp.z, '#cc66ff', scale)
          playSFX('boss-hit')
        }
        if (defeatResult.animationComplete) {
          playSFX('boss-defeat')
          const fragMult = (boonModifiers.fragmentMultiplier ?? 1.0) * playerState.upgradeStats.fragmentMult
          usePlayer.getState().addFragments(Math.round(GAME_CONFIG.BOSS_FRAGMENT_REWARD * fragMult))
          useLevel.getState().reactivateWormhole()
        }
      } else {
        // Boss AI tick
        const prevBossPhase = boss?.phase ?? 0
        const bossProjCountBefore = bossState.bossProjectiles.length
        bossState.tick(clampedDelta, playerPos)
        const newBossPhase = bossState.boss?.phase ?? 0
        if (newBossPhase > prevBossPhase) playSFX('boss-phase')
        if (bossState.bossProjectiles.length > bossProjCountBefore) playSFX('boss-attack')

        // Register boss entities in collision system
        const bossIdx = idx
        if (boss && boss.hp > 0) {
          if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
          assignEntity(pool[idx], 'boss', boss.x, boss.z, GAME_CONFIG.BOSS_COLLISION_RADIUS, CATEGORY_BOSS)
          cs.registerEntity(pool[idx++])
        }

        // Register boss projectiles
        const bossProjectiles = bossState.bossProjectiles
        const bossProjStartIdx = idx
        for (let i = 0; i < bossProjectiles.length; i++) {
          if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
          const bp = bossProjectiles[i]
          assignEntity(pool[idx], bp.id, bp.x, bp.z, bp.radius, CATEGORY_BOSS_PROJECTILE)
          cs.registerEntity(pool[idx++])
        }

        // Player projectiles vs boss
        if (boss && boss.hp > 0) {
          const projStartIdx = 1 + enemies.length
          for (let i = 0; i < projectiles.length; i++) {
            const pEntity = pool[projStartIdx + i]
            if (!pEntity) continue
            const hits = cs.queryCollisions(pEntity, CATEGORY_BOSS)
            if (hits.length > 0) {
              const proj = projectiles[i]
              if (proj.piercing) {
                proj.pierceHits = (proj.pierceHits || 0) + 1
                if (proj.pierceHits >= proj.pierceCount) proj.active = false
              } else {
                proj.active = false
              }
              const result = bossState.damageBoss(proj.damage)
              playSFX('boss-hit')
              if (result.killed) {
                addExplosion(boss.x, boss.z, '#cc66ff')
              }
            }
          }
          useWeapons.getState().cleanupInactive()
        }

        // Boss projectiles vs player
        const playerEntity = pool[0]
        const bpHits = cs.queryCollisions(playerEntity, CATEGORY_BOSS_PROJECTILE)
        if (bpHits.length > 0) {
          const pState = usePlayer.getState()
          if (!pState.isInvulnerable && pState.contactDamageCooldown <= 0) {
            let totalDamage = 0
            const hitIds = new Set()
            for (let i = 0; i < bpHits.length; i++) {
              const hitBp = bossProjectiles.find(bp => bp.id === bpHits[i].id)
              totalDamage += hitBp ? hitBp.damage : GAME_CONFIG.BOSS_PROJECTILE_DAMAGE
              hitIds.add(bpHits[i].id)
            }
            if (totalDamage > 0) {
              usePlayer.getState().takeDamage(totalDamage, boonModifiers.damageReduction ?? 0)
              playSFX('damage-taken')
            }
            useBoss.setState({ bossProjectiles: bossProjectiles.filter(bp => !hitIds.has(bp.id)) })
          }
        }

        // Boss contact damage
        if (boss && boss.hp > 0) {
          const contactHits = cs.queryCollisions(playerEntity, CATEGORY_BOSS)
          if (contactHits.length > 0) {
            const pState = usePlayer.getState()
            if (!pState.isInvulnerable && pState.contactDamageCooldown <= 0) {
              usePlayer.getState().takeDamage(Math.round(GAME_CONFIG.BOSS_CONTACT_DAMAGE * (boss.damageMultiplier || 1)), boonModifiers.damageReduction ?? 0)
              playSFX('damage-taken')
            }
          }
        }
      }
    }

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
    // 8a. Update orb timers + magnetization (Story 11.1)
    updateOrbs(clampedDelta)
    updateMagnetization(playerPos[0], playerPos[2], clampedDelta, boonModifiers.pickupRadiusMultiplier ?? 1.0)
    // Story 19.2: Update heal gem magnetization (uses same radius/speed as XP orbs)
    updateHealGemMagnetization(playerPos[0], playerPos[2], clampedDelta, boonModifiers.pickupRadiusMultiplier ?? 1.0)

    // 8b. Register XP orbs in spatial hash
    const orbArray = getOrbs()
    const orbCount = getOrbCount()
    for (let i = 0; i < orbCount; i++) {
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      assignEntity(pool[idx], _orbIds[i], orbArray[i].x, orbArray[i].z, GAME_CONFIG.XP_ORB_PICKUP_RADIUS, CATEGORY_XP_ORB)
      cs.registerEntity(pool[idx++])
    }

    // Story 19.2: Register heal gems in spatial hash
    const healGemArray = getHealGems()
    const healGemCount = getActiveHealGemCount()
    for (let i = 0; i < healGemCount; i++) {
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      assignEntity(pool[idx], _healGemIds[i], healGemArray[i].x, healGemArray[i].z, GAME_CONFIG.HEAL_GEM_PICKUP_RADIUS, CATEGORY_HEAL_GEM)
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
      const xpMult = boonModifiers.xpMultiplier ?? 1.0
      for (let i = 0; i < indices.length; i++) {
        const orbIndex = indices[i]
        // Story 19.1: Check if orb is rare before collecting (to play appropriate SFX)
        const isRare = orbArray[orbIndex].isRare
        const xpValue = collectOrb(orbIndex)
        usePlayer.getState().addXP(xpValue * xpMult)
        // Story 19.1: Play distinct SFX for rare XP gem collection
        if (isRare) {
          playSFX('xp_rare_pickup')
        }
      }
    }

    // Story 19.2: Query player-healGem collisions
    const healGemHits = cs.queryCollisions(pool[0], CATEGORY_HEAL_GEM)
    if (healGemHits.length > 0) {
      const indices = []
      for (let i = 0; i < healGemHits.length; i++) {
        const gemIndex = parseInt(healGemHits[i].id.split('_')[1], 10)
        if (gemIndex < getActiveHealGemCount()) indices.push(gemIndex)
      }
      indices.sort((a, b) => b - a)
      for (let i = 0; i < indices.length; i++) {
        const gemIndex = indices[i]
        const healAmount = collectHealGem(gemIndex)
        usePlayer.getState().healFromGem(healAmount)
        playSFX('hp-recover')
      }
    }

    // 8e. Check pending level-up — consume flag and trigger pause + modal
    if (usePlayer.getState().pendingLevelUps > 0) {
      playSFX('level-up')
      usePlayer.getState().consumeLevelUp()
      useGame.getState().triggerLevelUp()
    }

    // 9. Cleanup dead entities
  })

  return null // GameLoop is a logic-only component, no rendering
}
