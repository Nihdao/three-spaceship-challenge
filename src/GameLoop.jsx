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
import useUpgrades from './stores/useUpgrades.jsx'
import useArmory from './stores/useArmory.jsx'
import { createCollisionSystem, segmentCircleIntersect, CATEGORY_PLAYER, CATEGORY_ENEMY, CATEGORY_PROJECTILE, CATEGORY_XP_ORB, CATEGORY_BOSS, CATEGORY_BOSS_PROJECTILE, CATEGORY_SHOCKWAVE, CATEGORY_ENEMY_PROJECTILE, CATEGORY_HEAL_GEM, CATEGORY_FRAGMENT_GEM, CATEGORY_RARE_ITEM } from './systems/collisionSystem.js'
import { createSpawnSystem } from './systems/spawnSystem.js'
import { createProjectileSystem } from './systems/projectileSystem.js'
import { createSeparationSystem } from './systems/separationSystem.js'
import { GAME_CONFIG } from './config/gameConfig.js'
import { addExplosion, resetParticles } from './systems/particleSystem.js'
import { playSFX, playScanLoop, stopScanLoop } from './audio/audioManager.js'
import { updateOrbs, updateMagnetization, collectOrb, getOrbs, getActiveCount as getOrbCount, spawnOrb, forceActivateMagnet } from './systems/xpOrbSystem.js'
import { updateHealGemMagnetization, collectHealGem, getHealGems, getActiveHealGemCount, forceActivateMagnetHealGems } from './systems/healGemSystem.js'
import { updateMagnetization as updateFragmentGemMagnetization, collectGem, getActiveGems, getActiveCount as getFragmentGemCount, forceActivateMagnetFragments } from './systems/fragmentGemSystem.js'
import { updateRareItemMagnetization, collectRareItem, getRareItems, getActiveRareItemCount, forceActivateMagnetRareItems } from './systems/rareItemSystem.js'
import { rollDrops, resetAll as resetLoot } from './systems/lootSystem.js'
import { resetFogGrid, markDiscovered as markFogDiscovered } from './systems/fogSystem.js'
import { addExplosionRing, tickRings, resetRings } from './systems/explosiveRoundVfx.js'
import { ENEMIES } from './entities/enemyDefs.js'
import { WEAPONS } from './entities/weaponDefs.js'
import useDamageNumbers from './stores/useDamageNumbers.jsx'
import useCompanion from './stores/useCompanion.jsx'
import { applyKnockbackImpulse } from './systems/knockbackSystem.js'
import { getGalaxyById } from './entities/galaxyDefs.js'

// Story 32.1: LASER_CROSS collision helper — segment-vs-point test in XZ plane
// armAngle: world-space angle of the arm's axis; armLength: half-length from center; armHalfWidth: hit zone radius
export function isHitByArm(ex, ez, px, pz, armAngle, armLength, armHalfWidth) {
  const dirX = Math.cos(armAngle)
  const dirZ = Math.sin(armAngle)
  const relX = ex - px
  const relZ = ez - pz
  const dot = relX * dirX + relZ * dirZ
  if (dot < -armLength || dot > armLength) return false // beyond arm ends
  const perpX = relX - dot * dirX
  const perpZ = relZ - dot * dirZ
  return Math.hypot(perpX, perpZ) <= armHalfWidth
}

const LASER_CROSS_TICK_RATE = 0.1 // seconds between damage ticks (Story 32.1)

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

// Pre-allocated fragment gem IDs — same pattern as orbs (Story 19.3)
const _fragmentGemIds = []
for (let i = 0; i < GAME_CONFIG.MAX_FRAGMENT_GEMS; i++) {
  _fragmentGemIds[i] = `fragmentGem_${i}`
}

// Pre-allocated rare item IDs — same pattern (Story 44.5)
const _rareItemIds = []
for (let i = 0; i < GAME_CONFIG.MAX_RARE_ITEMS; i++) {
  _rareItemIds[i] = `ritem_${i}`
}

const _sweptCandidates = [] // pre-allocated array for swept collision results

// Story 41.1: Pre-allocated hit/damage arrays — zero per-frame GC allocation
const _projectileHits = []
const _laserCrossHits = []
const _magHits = []
const _swHits = []
const _mineHits = []
const _uniqueHits = []
const _tacticalHits = []
const _dnEntries = []
const _seenEnemies = new Set()
const _eligibleTargets = [] // tactical_shot candidate pool — avoids per-fire allocation

// Story 43.2: Module-level _composedWeaponMods — mutated in-place each frame, never reallocated
const _composedWeaponMods = {
  damageMultiplier: 1,
  cooldownMultiplier: 1,
  critChance: 0,
  critMultiplier: 2.0,
  projectileSpeedMultiplier: 1.0,
  zoneMultiplier: 1,
}

// Story 43.2: Shockwave arc pool — reuses arc objects (and their embedded Set) across frames
const _swArcPool = []

function _getSwArc(centerX, centerZ, aimAngle, sectorAngle, maxRadius, expandSpeed, damage, isCrit) {
  for (let i = 0; i < _swArcPool.length; i++) {
    if (!_swArcPool[i].active) {
      const arc = _swArcPool[i]
      arc.centerX = centerX
      arc.centerZ = centerZ
      arc.aimAngle = aimAngle
      arc.sectorAngle = sectorAngle
      arc.prevRadius = 0
      arc.currentRadius = 0
      arc.maxRadius = maxRadius
      arc.expandSpeed = expandSpeed
      arc.damage = damage
      arc.isCrit = isCrit
      arc.hitEnemies.clear()
      arc.active = true
      return arc
    }
  }
  const arc = {
    centerX, centerZ, aimAngle, sectorAngle,
    prevRadius: 0, currentRadius: 0,
    maxRadius, expandSpeed, damage, isCrit,
    hitEnemies: new Set(),
    active: true,
  }
  _swArcPool.push(arc)
  return arc
}

// Assigns collision entity properties without creating a new object
function assignEntity(e, id, x, z, radius, category) {
  e.id = id; e.x = x; e.z = z; e.radius = radius; e.category = category
}

// Composes all damage multiplier sources (boons + upgrades + dilemmas + ship + permanent) into final multiplier
// Centralizes damage composition to ensure consistency across gameplay and boss phases
function composeDamageMultiplier(playerState, boonModifiers, upgradeStats, dilemmaStats) {
  return (boonModifiers.damageMultiplier ?? 1)
    * upgradeStats.damageMult
    * dilemmaStats.damageMult
    * playerState.shipBaseDamageMultiplier
    * playerState.permanentUpgradeBonuses.attackPower
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

  const separationSystemRef = useRef(null)
  if (!separationSystemRef.current) {
    separationSystemRef.current = createSeparationSystem()
  }

  const separationFrameRef = useRef(0)

  // Pre-allocated entity descriptor pool — avoids per-frame object allocation
  // during collision registration (150+ entities × 60 FPS = 9000+ allocs/s avoided)
  const entityPoolRef = useRef([])
  const prevPhaseRef = useRef(null)
  const prevDashRef = useRef(false)
  const prevDashCooldownRef = useRef(0)
  const prevScanPlanetRef = useRef(null)
  const tunnelTransitionTimerRef = useRef(null)
  // Story 34.5: Cache system scaling — recompute only on system transition, not every frame
  const systemScalingCacheKeyRef = useRef(-1) // -1 = invalid sentinel
  const systemScalingCachedRef = useRef(null)
  const fogFrameCountRef = useRef(0)   // Story 35.1: frame throttle for fog update
  const timerWarningFiredRef = useRef(false) // Per-system flag — reset on each system entry
  const scanReminderTimerRef = useRef(120)   // Counts down only when companion is fully idle


  // NOTE: Relies on mount order for correct useFrame execution sequence.
  // GameLoop must mount before GameplayScene in Experience.jsx so its
  // useFrame runs first (state computation before rendering reads).
  useFrame((state, delta) => {
    const { phase, isPaused } = useGame.getState()
    const clockMs = state.clock.elapsedTime * 1000

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
      resetRings() // Story 32.7
      resetLoot() // Story 19.4: Reset all loot systems (orbs, heal gems, fragment gems)
      resetFogGrid()                     // Story 35.1: new system = fresh exploration
      useDamageNumbers.getState().reset() // Story 27.1
      useCompanion.getState().clearQueue() // Story 30.3: clear dialogue queue between systems — preserves per-run shownEvents (planet-radar, low-hp-warning one-shots)
      timerWarningFiredRef.current = false // Reset per-system timer warning
      scanReminderTimerRef.current = 120   // Reset scan reminder on system entry
      // Accumulate elapsed time before resetting (for total run time display)
      const prevSystemTime = useGame.getState().systemTimer
      if (prevSystemTime > 0) useGame.getState().accumulateTime(prevSystemTime)
      // Note: useGame.systemTimer is the authoritative game timer (not useLevel.systemTimer)
      // kills/score intentionally persist across systems (run-total for roguelite scoring)
      useGame.getState().setSystemTimer(0)
      // Story 23.3: Initialize actual system duration (base + carried time from previous system)
      useLevel.getState().initializeSystemDuration()
      // Initialize planets for the new system (advanceSystem clears them, GameLoop re-populates)
      const galaxyConfigForTransition = getGalaxyById(useGame.getState().selectedGalaxyId)
      if (!galaxyConfigForTransition) {
        console.warn('[GameLoop] No galaxyConfig available — skipping initializePlanets')
      } else {
        useLevel.getState().initializePlanets(galaxyConfigForTransition, usePlayer.getState().getLuckStat())
        useLevel.getState().initializeSystemName(galaxyConfigForTransition.systemNamePool)
      }
    }

    // Reset systems only when starting a new game (from menu), not when resuming from levelUp, planetReward, tunnel, revive, or systemEntry→gameplay
    if ((phase === 'gameplay' || phase === 'systemEntry') && prevPhaseRef.current !== 'gameplay' && prevPhaseRef.current !== 'levelUp' && prevPhaseRef.current !== 'planetReward' && prevPhaseRef.current !== 'tunnel' && prevPhaseRef.current !== 'systemEntry' && prevPhaseRef.current !== 'revive') {
      spawnSystemRef.current.reset()
      projectileSystemRef.current.reset()
      useWeapons.getState().initializeWeapons()
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT') // Story 25.4: mark starter weapon discovered
      useBoons.getState().reset()
      resetParticles()
      resetRings() // Story 32.7
      resetLoot() // Story 19.4: Reset all loot systems (orbs, heal gems, fragment gems)
      resetFogGrid()                     // Story 35.1: new run = fresh exploration
      useDamageNumbers.getState().reset() // Story 27.1
      useCompanion.getState().reset() // Story 30.2: clear dialogue queue and shownEvents on full restart
      timerWarningFiredRef.current = false // Reset per-system timer warning
      scanReminderTimerRef.current = 120   // Reset scan reminder on new run
      usePlayer.getState().reset()
      // Story 20.1: Apply permanent upgrade bonuses after reset (meta-progression)
      usePlayer.getState().initializeRunStats(useUpgrades.getState().getComputedBonuses())
      useEnemies.getState().reset()
      useLevel.getState().reset()
      useLevel.getState().initializeSystemDuration() // Story 23.3: Mirrors tunnel→gameplay init; makes system 1 duration explicit
      const galaxyConfigForNewGame = getGalaxyById(useGame.getState().selectedGalaxyId)
      if (!galaxyConfigForNewGame) {
        console.warn('[GameLoop] No galaxyConfig available — skipping initializePlanets')
      } else {
        useLevel.getState().initializePlanets(galaxyConfigForNewGame, usePlayer.getState().getLuckStat())
        useLevel.getState().initializeSystemName(galaxyConfigForNewGame.systemNamePool)
      }
      useBoss.getState().reset()
      systemScalingCacheKeyRef.current = -1 // Story 34.5: invalidate scaling cache (galaxy may change between runs)
    }

    // Clear damage numbers when game over occurs (Story 28.1)
    if (phase === 'gameOver' && prevPhaseRef.current !== 'gameOver') {
      useDamageNumbers.getState().reset()
    }

    prevPhaseRef.current = phase

    // Story 17.4: Boss phase is deprecated — boss fight now happens during 'gameplay' phase
    // Removed deprecated boss phase tick code (previously ~210 lines, boss tick now in gameplay section 7f-ter)

    // Clear pending tunnel transition timer if we left gameplay unexpectedly (game over, menu)
    if (phase !== 'gameplay' && tunnelTransitionTimerRef.current) {
      clearTimeout(tunnelTransitionTimerRef.current)
      tunnelTransitionTimerRef.current = null
    }

    // Only tick during active gameplay
    if (phase !== 'gameplay' || isPaused) return

    // Clamp delta to prevent physics explosion after tab-return
    const clampedDelta = Math.min(delta, 0.1)

    // === TICK ORDER (deterministic) ===
    // 1. Input — read from useControlsStore
    const input = useControlsStore.getState()

    // 2. Player movement — compose boon + upgrade + dilemma speed modifiers
    // Story 21.1: Pass mouseWorldPos and mouseActive to tick() for frame-accurate aim direction calculation
    const boonModifiers = useBoons.getState().modifiers
    const { upgradeStats, dilemmaStats, permanentUpgradeBonuses } = usePlayer.getState()
    const composedSpeedMult = (boonModifiers.speedMultiplier ?? 1) * upgradeStats.speedMult * dilemmaStats.speedMult
    const { mouseWorldPos, mouseActive } = input
    // Story 20.1: Add permanent regen bonus to boon regen rate
    usePlayer.getState().tick(clampedDelta, input, composedSpeedMult, GAME_CONFIG.PLAY_AREA_SIZE, (boonModifiers.hpRegenRate ?? 0) + permanentUpgradeBonuses.regen, mouseWorldPos, mouseActive)

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
    _composedWeaponMods.damageMultiplier = composeDamageMultiplier(playerState, boonModifiers, upgradeStats, dilemmaStats)
    _composedWeaponMods.cooldownMultiplier = (boonModifiers.cooldownMultiplier ?? 1) * upgradeStats.cooldownMult * dilemmaStats.cooldownMult * playerState.permanentUpgradeBonuses.attackSpeed
    _composedWeaponMods.critChance = boonModifiers.critChance ?? 0
    _composedWeaponMods.critMultiplier = boonModifiers.critMultiplier ?? 2.0
    _composedWeaponMods.projectileSpeedMultiplier = boonModifiers.projectileSpeedMultiplier ?? 1.0
    _composedWeaponMods.zoneMultiplier = playerState.permanentUpgradeBonuses.zone
    _projectileHits.length = 0
    const projCountBefore = useWeapons.getState().projectiles.length
    // Story 21.1: Pass aimDirection for dual-stick firing
    useWeapons.getState().tick(clampedDelta, playerPos, playerState.rotation, _composedWeaponMods, playerState.aimDirection)
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
      // 3b. DIAGONALS spawn-position collision — each arm checked at player center before movement
      // Fixes: projectiles travel ~4.7 units before step-7 collision check, skipping nearby enemies
      const _diagEnemies = useEnemies.getState().enemies
      for (let _di = projCountBefore; _di < allProjs.length; _di++) {
        const _dp = allProjs[_di]
        if (!_dp.active || _dp.weaponId !== 'DIAGONALS') continue
        for (let _dei = 0; _dei < _diagEnemies.length; _dei++) {
          const _de = _diagEnemies[_dei]
          const _ddx = _de.x - _dp.x
          const _ddz = _de.z - _dp.z
          const _dcr = _dp.radius + _de.radius
          if (_ddx * _ddx + _ddz * _ddz <= _dcr * _dcr) {
            _dp.active = false
            _projectileHits.push({ enemyId: _de.id, damage: _dp.damage, isCrit: _dp.isCrit ?? false })
            applyKnockbackImpulse(_diagEnemies, _de.id, _dp)
            break
          }
        }
      }
    }

    // 4. Projectile movement (pass enemies for homing missile steering)
    const enemiesForHoming = useEnemies.getState().enemies
    const activeProjectiles = useWeapons.getState().projectiles
    projectileSystemRef.current.tick(activeProjectiles, clampedDelta, enemiesForHoming)
    // Story 32.7: Spawn ring for EXPLOSIVE_ROUND that just expired by lifetime (not by collision)
    {
      const allProjs = activeProjectiles
      for (let i = 0; i < allProjs.length; i++) {
        const p = allProjs[i]
        if (!p.active && p.explosionRadius && !p.ringSpawned) {
          p.ringSpawned = true
          addExplosionRing(p.x, p.z, p.explosionRadius)
        }
      }
    }
    tickRings(clampedDelta)
    useWeapons.getState().cleanupInactive()

    // 5. Enemy spawning + movement (skip during wormhole activation/active — Story 17.4, Story 22.4: waves continue during boss)
    const wormholeStatePre = useLevel.getState().wormholeState
    const bossActive = useBoss.getState().isActive
    if (wormholeStatePre !== 'activating' && wormholeStatePre !== 'active' && !useGame.getState()._debugSpawnPaused) {
      const currentSystem = useLevel.getState().currentSystem
      // Story 34.5: Compute system difficulty from galaxy profile — cached per system (not per frame)
      if (currentSystem !== systemScalingCacheKeyRef.current) {
        const _gc = getGalaxyById(useGame.getState().selectedGalaxyId)
        if (_gc?.difficultyScalingPerSystem) {
          const _si = currentSystem - 1 // 0-based system index
          const _s = _gc.difficultyScalingPerSystem
          systemScalingCachedRef.current = {
            hp:       Math.pow(_s.hp,       _si),
            damage:   Math.pow(_s.damage,   _si),
            speed:    Math.pow(_s.speed,    _si) * (_gc.enemySpeedMult ?? 1.0),
            xpReward: Math.pow(_s.xpReward, _si),
          }
        } else {
          systemScalingCachedRef.current = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
        }
        systemScalingCacheKeyRef.current = currentSystem
      }
      const systemScaling = systemScalingCachedRef.current
      // Story 23.1: Pass wave system parameters — systemNum + systemTimer drive phase-based spawning
      // Story 23.3: Use actualSystemDuration so wave phases scale to extended time
      const spawnInstructions = spawnSystemRef.current.tick(clampedDelta, playerPos[0], playerPos[2], {
        systemNum: currentSystem,
        systemTimer: useLevel.getState().actualSystemDuration,
        systemScaling,
      })
      if (spawnInstructions.length > 0) {
        useEnemies.getState().spawnEnemies(spawnInstructions)
      }
    }
    useEnemies.getState().tick(clampedDelta, playerPos, { leashEnabled: !bossActive })

    // 5b. Enemy separation — prevent stacking, form organic walls (Story 23.2)
    // Runs after enemy movement so positions are current; runs before collision detection
    // Throttled to every other frame to halve CPU cost (~50% savings, imperceptible visually)
    separationFrameRef.current++
    if (separationFrameRef.current % 2 === 0) {
      separationSystemRef.current.applySeparation(
        useEnemies.getState().enemies,
        useBoss.getState().boss,
        clampedDelta
      )
    }

    // 5d. Teleport particle effects (departure + arrival bursts)
    const teleportEvents = useEnemies.getState().consumeTeleportEvents()
    for (let i = 0; i < teleportEvents.length; i++) {
      const te = teleportEvents[i]
      addExplosion(te.oldX, te.oldZ, '#cc66ff', 0.5)
      addExplosion(te.newX, te.newZ, '#cc66ff', 0.5)
    }

    // 5e. Shockwave expansion + enemy projectile movement
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
    _dnEntries.length = 0 // Story 43.2: single reset — all weapon systems accumulate here, flushed once at end of 7b
    // 7a. Projectile-enemy collisions (spawn-hits from step 3b already in _projectileHits)
    // Anti-tunneling: fast projectiles (travel > 2×radius per frame) use swept segment-vs-circle
    // instead of point circle-vs-circle. Iterates enemies directly — cheap at typical counts.
    const projectileStartIdx = 1 + enemies.length

    for (let i = 0; i < projectiles.length; i++) {
      const pEntity = pool[projectileStartIdx + i]
      if (!pEntity) continue
      const proj = projectiles[i]
      if (!proj.active) continue

      // Determine if this projectile needs swept collision (moved more than its diameter)
      const travelDx = proj.x - (proj.prevX ?? proj.x)
      const travelDz = proj.z - (proj.prevZ ?? proj.z)
      const travelSq = travelDx * travelDx + travelDz * travelDz
      const diameterSq = (proj.radius * 2) * (proj.radius * 2)

      let hits
      if (travelSq > diameterSq) {
        // Swept collision: segment (prevX,prevZ)→(x,z) vs enemy circles
        _sweptCandidates.length = 0
        for (let e = 0; e < enemies.length; e++) {
          const en = enemies[e]
          const rSum = proj.radius + en.radius
          if (segmentCircleIntersect(proj.prevX, proj.prevZ, proj.x, proj.z, en.x, en.z, rSum)) {
            _sweptCandidates.push(pool[1 + e])
          }
        }
        hits = _sweptCandidates
      } else {
        hits = cs.queryCollisions(pEntity, CATEGORY_ENEMY)
      }

      if (hits.length > 0) {
        // Story 11.3: Piercing projectiles (Railgun) — hit multiple enemies before despawning
        if (proj.piercing) {
          for (let h = 0; h < hits.length; h++) {
            if (proj.pierceHits >= proj.pierceCount) break
            _projectileHits.push({ enemyId: hits[h].id, damage: proj.damage, isCrit: proj.isCrit ?? false })
            applyKnockbackImpulse(enemies, hits[h].id, proj) // Story 27.4
            proj.pierceHits++
          }
          if (proj.pierceHits >= proj.pierceCount) proj.active = false
        // Story 11.3: Explosive projectiles — deal direct hit + area damage
        } else if (proj.explosionRadius) {
          proj.active = false
          _projectileHits.push({ enemyId: hits[0].id, damage: proj.damage, isCrit: proj.isCrit ?? false })
          applyKnockbackImpulse(enemies, hits[0].id, proj) // Story 27.4: direct hit knockback
          // Area damage to all enemies within explosion radius
          for (let e = 0; e < enemies.length; e++) {
            if (enemies[e].id === hits[0].id) continue // already hit directly
            const dx = enemies[e].x - proj.x
            const dz = enemies[e].z - proj.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist <= proj.explosionRadius) {
              _projectileHits.push({ enemyId: enemies[e].id, damage: proj.explosionDamage, isCrit: proj.isCrit ?? false })
            }
          }
          addExplosion(proj.x, proj.z, proj.color)
          // Story 32.7: Spawn expanding ring VFX at explosion point
          proj.ringSpawned = true
          addExplosionRing(proj.x, proj.z, proj.explosionRadius)
        } else {
          proj.active = false
          _projectileHits.push({ enemyId: hits[0].id, damage: proj.damage, isCrit: proj.isCrit ?? false })
          applyKnockbackImpulse(enemies, hits[0].id, proj) // Story 27.4
        }
      }
    }

    // Story 41.1: Single weapon bucketing pass — read activeWeapons once (AC 2)
    const _weaponState = useWeapons.getState()
    let lcWeapon = null, magWeapon = null, swWeapon = null, mineWeapon = null, tactWeapon = null
    {
      const _aw = _weaponState.activeWeapons
      for (let _wi = 0; _wi < _aw.length; _wi++) {
        const _w = _aw[_wi]
        if (_w.weaponId === 'LASER_CROSS') { lcWeapon = _w; continue }
        const _wt = WEAPONS[_w.weaponId]?.weaponType
        if (_wt === 'aura') { magWeapon = _w }
        else if (_wt === 'shockwave') { swWeapon = _w }
        else if (_wt === 'mine_around') { mineWeapon = _w }
        else if (_wt === 'tactical_shot') { tactWeapon = _w }
      }
    }

    // 7a-bis. LASER_CROSS arm-enemy collision (Story 32.1)
    {
      if (lcWeapon && (lcWeapon.laserCrossIsActive ?? true)) {
        const lcDef = WEAPONS.LASER_CROSS
        lcWeapon.laserCrossDamageTick = (lcWeapon.laserCrossDamageTick ?? 0) + clampedDelta
        if (lcWeapon.laserCrossDamageTick >= LASER_CROSS_TICK_RATE) {
          lcWeapon.laserCrossDamageTick -= LASER_CROSS_TICK_RATE
          const angle = lcWeapon.laserCrossAngle ?? 0
          const halfWidth = lcDef.armWidth / 2
          _laserCrossHits.length = 0
          for (let e = 0; e < enemies.length; e++) {
            const enemy = enemies[e]
            const hit = isHitByArm(enemy.x, enemy.z, playerPos[0], playerPos[2], angle, lcDef.armLength, halfWidth)
                     || isHitByArm(enemy.x, enemy.z, playerPos[0], playerPos[2], angle + Math.PI / 2, lcDef.armLength, halfWidth)
            if (hit) {
              const totalCritChance = Math.min(1.0, (lcDef.critChance ?? 0) + (lcWeapon.multipliers?.critBonus ?? 0) + (_composedWeaponMods.critChance ?? 0))
              const isCrit = totalCritChance > 0 && Math.random() < totalCritChance
              const lcBaseDamage = (lcWeapon.overrides?.damage ?? lcDef.baseDamage) * (lcWeapon.multipliers?.damageMultiplier ?? 1.0)
              const dmg = lcBaseDamage * _composedWeaponMods.damageMultiplier * (isCrit ? (_composedWeaponMods.critMultiplier ?? 2.0) : 1)
              _laserCrossHits.push({ enemyId: enemy.id, damage: dmg, isCrit, x: enemy.x, z: enemy.z })
            }
          }
          if (_laserCrossHits.length > 0) {
            // Accumulate damage numbers (flushed once at end of section 7)
            for (let i = 0; i < _laserCrossHits.length; i++) {
              _dnEntries.push({ damage: Math.round(_laserCrossHits[i].damage), worldX: _laserCrossHits[i].x, worldZ: _laserCrossHits[i].z, isCrit: _laserCrossHits[i].isCrit })
            }
            // Apply batch damage and handle deaths (same pattern as section 7c)
            const lcDeathEvents = useEnemies.getState().damageEnemiesBatch(_laserCrossHits, clockMs)
            let _killsLc = 0
            for (let i = 0; i < lcDeathEvents.length; i++) {
              const event = lcDeathEvents[i]
              if (event.killed) {
                addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
                playSFX('explosion')
                rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z, event.enemy)
                _killsLc++
              }
            }
            if (_killsLc > 0) useGame.setState(s => ({ kills: s.kills + _killsLc, score: s.score + GAME_CONFIG.SCORE_PER_KILL * _killsLc }))
          }
        }
      }
    }

    // 7a-ter. MAGNETIC_FIELD aura damage (Story 32.2)
    {
      const AURA_BASE_TICK_RATE = 0.25
      if (magWeapon) {
        const magDef = WEAPONS[magWeapon.weaponId]
        // H1/H2/H3 fix: apply per-weapon multipliers (from upgradeWeapon()) alongside global _composedWeaponMods
        const weaponDamageMult = magWeapon.multipliers?.damageMultiplier ?? 1.0
        const weaponAreaMult = magWeapon.multipliers?.areaMultiplier ?? 1.0
        const weaponCooldownMult = magWeapon.multipliers?.cooldownMultiplier ?? 1.0
        const effectiveRadius = magDef.auraRadius * weaponAreaMult * _composedWeaponMods.zoneMultiplier
        magWeapon.effectiveRadius = effectiveRadius // sync for renderer
        // Compose per-weapon and global cooldown multipliers; clamped to 15% floor
        const effectiveTickRate = Math.max(
          AURA_BASE_TICK_RATE * 0.15,
          AURA_BASE_TICK_RATE * weaponCooldownMult * _composedWeaponMods.cooldownMultiplier
        )
        magWeapon.magneticDamageTick = (magWeapon.magneticDamageTick ?? 0) + clampedDelta
        if (magWeapon.magneticDamageTick >= effectiveTickRate) {
          magWeapon.magneticDamageTick -= effectiveTickRate
          const baseDmg = magDef.baseDamage * weaponDamageMult
          _magHits.length = 0
          for (let e = 0; e < enemies.length; e++) {
            const enemy = enemies[e]
            const dx = enemy.x - playerPos[0]
            const dz = enemy.z - playerPos[2]
            if (Math.sqrt(dx * dx + dz * dz) <= effectiveRadius) {
              const isCrit = _composedWeaponMods.critChance > 0 && Math.random() < _composedWeaponMods.critChance
              const dmg = baseDmg * _composedWeaponMods.damageMultiplier * (isCrit ? _composedWeaponMods.critMultiplier : 1)
              _magHits.push({ enemyId: enemy.id, damage: dmg, isCrit, x: enemy.x, z: enemy.z })
            }
          }
          if (_magHits.length > 0) {
            for (let i = 0; i < _magHits.length; i++) {
              _dnEntries.push({ damage: Math.round(_magHits[i].damage), worldX: _magHits[i].x, worldZ: _magHits[i].z, isCrit: _magHits[i].isCrit })
            }
            const deathEvents = useEnemies.getState().damageEnemiesBatch(_magHits, clockMs)
            let _killsMag = 0
            for (let i = 0; i < deathEvents.length; i++) {
              const event = deathEvents[i]
              if (event.killed) {
                addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
                playSFX('explosion')
                rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z, event.enemy)
                _killsMag++
              }
            }
            if (_killsMag > 0) useGame.setState(s => ({ kills: s.kills + _killsMag, score: s.score + GAME_CONFIG.SCORE_PER_KILL * _killsMag }))
          }
        }
      }
    }

    // 7a-quater. SHOCKWAVE arc burst weapon (Story 32.4)
    {
      if (swWeapon) {
        const swDef = WEAPONS[swWeapon.weaponId]
        // Per-weapon multipliers from upgradeWeapon() — mirrors MAGNETIC_FIELD pattern (H1/H2/H3 fix)
        const swDamageMult = swWeapon.multipliers?.damageMultiplier ?? 1.0
        const swAreaMult = swWeapon.multipliers?.areaMultiplier ?? 1.0
        const swCooldownMult = swWeapon.multipliers?.cooldownMultiplier ?? 1.0

        // Cooldown (managed here, bypassed in useWeapons.tick via continue)
        if (swWeapon.shockwaveCooldownTimer === undefined) swWeapon.shockwaveCooldownTimer = 0
        swWeapon.shockwaveCooldownTimer -= clampedDelta

        if (swWeapon.shockwaveCooldownTimer <= 0) {
          swWeapon.shockwaveCooldownTimer = Math.max(
            swDef.baseCooldown * 0.15,
            swDef.baseCooldown * swCooldownMult
          ) * _composedWeaponMods.cooldownMultiplier

          // Capture burst parameters at fire time
          const aimDir = playerState.aimDirection
          const aimAngle = aimDir ? Math.atan2(aimDir[0], -aimDir[1]) : playerState.rotation
          const baseDmg = swDef.baseDamage * swDamageMult
          const burstDmg = baseDmg * _composedWeaponMods.damageMultiplier
          const burstIsCrit = _composedWeaponMods.critChance > 0 && Math.random() < _composedWeaponMods.critChance
          const effectiveMaxRadius = swDef.waveMaxRadius * swAreaMult * _composedWeaponMods.zoneMultiplier

          if (!swWeapon.shockwavePendingArcs) swWeapon.shockwavePendingArcs = []
          if (!swWeapon.shockwaveArcs) swWeapon.shockwaveArcs = []

          // Queue 3 arcs with staggered delays
          for (let w = 0; w < swDef.waveCount; w++) {
            swWeapon.shockwavePendingArcs.push({
              remainingDelay: swDef.waveDelay * w,
              aimAngle,
              damage: burstDmg,
              isCrit: burstIsCrit,
              effectiveMaxRadius,
            })
          }
          playSFX(swDef.sfxKey)
        }

        // Prune inactive arcs before pool reuse — prevents double-reference when _getSwArc
        // reactivates a pooled arc that still has a stale entry in shockwaveArcs
        if (swWeapon.shockwaveArcs) {
          let pruneIdx = 0
          for (let a = 0; a < swWeapon.shockwaveArcs.length; a++) {
            if (swWeapon.shockwaveArcs[a].active) swWeapon.shockwaveArcs[pruneIdx++] = swWeapon.shockwaveArcs[a]
          }
          swWeapon.shockwaveArcs.length = pruneIdx
        }

        // Spawn pending arcs whose delay has elapsed
        if (swWeapon.shockwavePendingArcs?.length > 0) {
          let writeIdx = 0
          for (let p = 0; p < swWeapon.shockwavePendingArcs.length; p++) {
            const pending = swWeapon.shockwavePendingArcs[p]
            pending.remainingDelay -= clampedDelta
            if (pending.remainingDelay <= 0) {
              // Pool eviction: deactivate oldest arc if at limit
              if (!swWeapon.shockwaveArcs) swWeapon.shockwaveArcs = []
              let activeCount = 0
              for (let a = 0; a < swWeapon.shockwaveArcs.length; a++) {
                if (swWeapon.shockwaveArcs[a].active) activeCount++
              }
              if (activeCount >= swDef.poolLimit) {
                for (let a = 0; a < swWeapon.shockwaveArcs.length; a++) {
                  if (swWeapon.shockwaveArcs[a].active) { swWeapon.shockwaveArcs[a].active = false; break }
                }
              }
              const newArc = _getSwArc(
                playerPos[0], playerPos[2],
                pending.aimAngle, swDef.waveSectorAngle,
                pending.effectiveMaxRadius, swDef.waveExpandSpeed,
                pending.damage, pending.isCrit
              )
              swWeapon.shockwaveArcs.push(newArc)
            } else {
              swWeapon.shockwavePendingArcs[writeIdx++] = pending
            }
          }
          swWeapon.shockwavePendingArcs.length = writeIdx
        }

        // Expand arcs and detect hits
        _swHits.length = 0
        if (swWeapon.shockwaveArcs) {
          for (let a = 0; a < swWeapon.shockwaveArcs.length; a++) {
            const arc = swWeapon.shockwaveArcs[a]
            if (!arc.active) continue

            // Anchor arc to player so movement doesn't stretch/shrink the visual
            arc.centerX = playerPos[0]
            arc.centerZ = playerPos[2]

            const prevR = arc.currentRadius
            arc.currentRadius += arc.expandSpeed * clampedDelta

            if (arc.currentRadius >= arc.maxRadius) {
              arc.active = false
              continue
            }

            const halfSector = arc.sectorAngle / 2
            for (let e = 0; e < enemies.length; e++) {
              const enemy = enemies[e]
              if (arc.hitEnemies.has(enemy.id)) continue

              const dx = enemy.x - arc.centerX
              const dz = enemy.z - arc.centerZ
              const dist = Math.sqrt(dx * dx + dz * dz)

              // Ring crossing: enemy distance is between prevRadius and currentRadius (+ enemy radius)
              if (dist < prevR - enemy.radius || dist > arc.currentRadius + enemy.radius) continue

              // Sector check — same angle convention as fireAngle in useWeapons (atan2(worldX, -worldZ))
              const enemyAngle = Math.atan2(dx, -dz)
              let angleDiff = enemyAngle - arc.aimAngle
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
              if (Math.abs(angleDiff) > halfSector) continue

              arc.hitEnemies.add(enemy.id)
              const radialDirX = dist > 0 ? dx / dist : 0
              const radialDirZ = dist > 0 ? dz / dist : 1
              _swHits.push({ enemyId: enemy.id, damage: arc.damage, isCrit: arc.isCrit, dirX: radialDirX, dirZ: radialDirZ, x: enemy.x, z: enemy.z })
            }
          }

        }

        // Apply shockwave hits
        if (_swHits.length > 0) {
          for (let i = 0; i < _swHits.length; i++) {
            _dnEntries.push({ damage: Math.round(_swHits[i].damage), worldX: _swHits[i].x, worldZ: _swHits[i].z, isCrit: _swHits[i].isCrit })
          }

          for (let i = 0; i < _swHits.length; i++) {
            applyKnockbackImpulse(enemies, _swHits[i].enemyId, { weaponId: swWeapon.weaponId, dirX: _swHits[i].dirX, dirZ: _swHits[i].dirZ })
          }

          const deathEvents = useEnemies.getState().damageEnemiesBatch(_swHits, clockMs)
          let _killsSw = 0
          for (let i = 0; i < deathEvents.length; i++) {
            const event = deathEvents[i]
            if (event.killed) {
              addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
              playSFX('explosion')
              rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z, event.enemy)
              _killsSw++
            }
          }
          if (_killsSw > 0) useGame.setState(s => ({ kills: s.kills + _killsSw, score: s.score + GAME_CONFIG.SCORE_PER_KILL * _killsSw }))
        }
      }
    }

    // 7a-quinquies. MINE_AROUND orbiting proximity mines (Story 32.5)
    {
      if (mineWeapon) {
        const mineDef = WEAPONS[mineWeapon.weaponId]

        // Lazy init mine state on weapon object
        if (!mineWeapon.mines) {
          mineWeapon.mines = Array.from({ length: mineDef.mineCount }, (_, i) => ({
            slotIndex: i,
            active: true,
            respawnTimer: 0,
          }))
          mineWeapon.mineOrbitalAngle = 0
        }

        // Advance orbital angle (world space, independent of aim — NOT affected by projectileSpeedMultiplier)
        mineWeapon.mineOrbitalAngle += mineDef.orbitalSpeed * clampedDelta

        // Tick respawn timers for inactive mines
        for (let m = 0; m < mineWeapon.mines.length; m++) {
          const mine = mineWeapon.mines[m]
          if (!mine.active) {
            mine.respawnTimer -= clampedDelta
            if (mine.respawnTimer <= 0) mine.active = true
          }
        }

        // Proximity check, detonation, and AOE damage
        const effectiveExplosionRadius = mineDef.explosionRadius * _composedWeaponMods.zoneMultiplier
        const baseDmg = mineWeapon.overrides?.damage ?? mineDef.baseDamage
        const mineDmg = baseDmg * _composedWeaponMods.damageMultiplier
        const mineIsCrit = _composedWeaponMods.critChance > 0 && Math.random() < _composedWeaponMods.critChance
        _mineHits.length = 0

        for (let m = 0; m < mineWeapon.mines.length; m++) {
          const mine = mineWeapon.mines[m]
          if (!mine.active) continue

          const angle = mineWeapon.mineOrbitalAngle + (Math.PI * 2 / mineDef.mineCount) * mine.slotIndex
          const mineX = playerPos[0] + Math.cos(angle) * mineDef.orbitalRadius
          const mineZ = playerPos[2] + Math.sin(angle) * mineDef.orbitalRadius

          // Proximity check — any enemy within detection radius triggers mine
          let triggered = false
          for (let e = 0; e < enemies.length; e++) {
            const dx = enemies[e].x - mineX
            const dz = enemies[e].z - mineZ
            if (Math.sqrt(dx * dx + dz * dz) <= mineDef.mineDetectionRadius) {
              triggered = true
              break
            }
          }

          if (!triggered) continue

          // Detonation: AOE damage to all enemies in explosion radius
          for (let e = 0; e < enemies.length; e++) {
            const dx = enemies[e].x - mineX
            const dz = enemies[e].z - mineZ
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist <= effectiveExplosionRadius) {
              const rdx = dist > 0 ? dx / dist : 0
              const rdz = dist > 0 ? dz / dist : 1
              _mineHits.push({ enemyId: enemies[e].id, damage: mineDmg, isCrit: mineIsCrit, dirX: rdx, dirZ: rdz, x: enemies[e].x, z: enemies[e].z })
            }
          }

          // Deactivate mine and start respawn timer
          mine.active = false
          mine.respawnTimer = mineDef.mineRespawnTime

          // Explosion VFX + SFX
          addExplosion(mineX, mineZ, mineDef.projectileColor, 2.5)
          playSFX(mineDef.sfxKey)
        }

        // Apply mine explosion hits (deduplicate: enemy hit by multiple simultaneous mine AOEs → take damage once)
        if (_mineHits.length > 0) {
          _seenEnemies.clear()
          _uniqueHits.length = 0
          for (let i = 0; i < _mineHits.length; i++) {
            if (!_seenEnemies.has(_mineHits[i].enemyId)) {
              _seenEnemies.add(_mineHits[i].enemyId)
              _uniqueHits.push(_mineHits[i])
            }
          }

          for (let i = 0; i < _uniqueHits.length; i++) {
            _dnEntries.push({ damage: Math.round(_uniqueHits[i].damage), worldX: _uniqueHits[i].x, worldZ: _uniqueHits[i].z, isCrit: _uniqueHits[i].isCrit })
          }

          for (let i = 0; i < _uniqueHits.length; i++) {
            applyKnockbackImpulse(enemies, _uniqueHits[i].enemyId, { weaponId: mineWeapon.weaponId, dirX: _uniqueHits[i].dirX, dirZ: _uniqueHits[i].dirZ })
          }

          const deathEvents = useEnemies.getState().damageEnemiesBatch(_uniqueHits, clockMs)
          let _killsMine = 0
          for (let i = 0; i < deathEvents.length; i++) {
            const event = deathEvents[i]
            if (event.killed) {
              addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
              playSFX('explosion')
              rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z, event.enemy)
              _killsMine++
            }
          }
          if (_killsMine > 0) useGame.setState(s => ({ kills: s.kills + _killsMine, score: s.score + GAME_CONFIG.SCORE_PER_KILL * _killsMine }))
        }
      }
    }

    // 7a-sexies. TACTICAL_SHOT — Instant remote strike with AOE splash (Story 32.6)
    {
      if (tactWeapon) {
        const tactDef = WEAPONS[tactWeapon.weaponId]

        // Lazy init per-weapon state
        if (tactWeapon.tacticalCooldownTimer === undefined) tactWeapon.tacticalCooldownTimer = 0
        if (!tactWeapon.tacticalStrikes) tactWeapon.tacticalStrikes = []
        // lastTargetId: undefined on first frame = no exclusion, which is intentional

        // Tick cooldown
        tactWeapon.tacticalCooldownTimer = Math.max(0, tactWeapon.tacticalCooldownTimer - clampedDelta)

        // Tick VFX effects: age and remove expired (write-index compaction — zero allocation)
        {
          let _tsIdx = 0
          for (let s = 0; s < tactWeapon.tacticalStrikes.length; s++) {
            tactWeapon.tacticalStrikes[s].timer -= clampedDelta
            if (tactWeapon.tacticalStrikes[s].timer > 0) {
              tactWeapon.tacticalStrikes[_tsIdx++] = tactWeapon.tacticalStrikes[s]
            }
          }
          tactWeapon.tacticalStrikes.length = _tsIdx
        }

        // Fire when cooldown reaches 0
        if (tactWeapon.tacticalCooldownTimer <= 0) {
          const baseCooldown = (tactWeapon.overrides?.cooldown ?? tactDef.baseCooldown) * _composedWeaponMods.cooldownMultiplier
          tactWeapon.tacticalCooldownTimer = baseCooldown

          // Collect eligible targets within detectionRadius
          _eligibleTargets.length = 0
          for (let e = 0; e < enemies.length; e++) {
            const dx = enemies[e].x - playerPos[0]
            const dz = enemies[e].z - playerPos[2]
            if (dx * dx + dz * dz <= tactDef.detectionRadius * tactDef.detectionRadius) {
              _eligibleTargets.push(enemies[e])
            }
          }

          if (_eligibleTargets.length > 0) {
            // Random selection with anti-repeat: exclude lastTargetId when pool > 1
            let targetIdx = Math.floor(Math.random() * _eligibleTargets.length)
            if (_eligibleTargets.length > 1 && _eligibleTargets[targetIdx].id === tactWeapon.lastTargetId) {
              targetIdx = (targetIdx + 1) % _eligibleTargets.length
            }
            const target = _eligibleTargets[targetIdx]
            tactWeapon.lastTargetId = target.id

            // Compute damage values
            const baseDmg = tactWeapon.overrides?.damage ?? tactDef.baseDamage
            const isMainCrit = _composedWeaponMods.critChance > 0 && Math.random() < _composedWeaponMods.critChance
            const mainDmg = baseDmg * _composedWeaponMods.damageMultiplier * (isMainCrit ? _composedWeaponMods.critMultiplier : 1)
            const splashDmg = baseDmg * _composedWeaponMods.damageMultiplier * (tactDef.splashDamageRatio ?? 0.5)
            const effectiveSplashRadius = tactDef.strikeAoeRadius * _composedWeaponMods.zoneMultiplier

            // Build hit list: primary target + AOE splash on nearby enemies
            _tacticalHits.length = 0
            _tacticalHits.push({ enemyId: target.id, damage: mainDmg, isCrit: isMainCrit, x: target.x, z: target.z })
            for (let e = 0; e < enemies.length; e++) {
              if (enemies[e].id === target.id) continue // already hit as primary
              const dx = enemies[e].x - target.x
              const dz = enemies[e].z - target.z
              if (dx * dx + dz * dz <= effectiveSplashRadius * effectiveSplashRadius) {
                _tacticalHits.push({ enemyId: enemies[e].id, damage: splashDmg, isCrit: false, x: enemies[e].x, z: enemies[e].z })
              }
            }

            // Accumulate damage numbers (flushed once at end of section 7)
            for (let i = 0; i < _tacticalHits.length; i++) {
              _dnEntries.push({ damage: Math.round(_tacticalHits[i].damage), worldX: _tacticalHits[i].x, worldZ: _tacticalHits[i].z, isCrit: _tacticalHits[i].isCrit })
            }

            // Knockback on primary target — radial away from player
            const kbDist = Math.sqrt((target.x - playerPos[0]) ** 2 + (target.z - playerPos[2]) ** 2)
            const kbDirX = kbDist > 0 ? (target.x - playerPos[0]) / kbDist : 0
            const kbDirZ = kbDist > 0 ? (target.z - playerPos[2]) / kbDist : 1
            applyKnockbackImpulse(enemies, target.id, { weaponId: tactWeapon.weaponId, dirX: kbDirX, dirZ: kbDirZ })
            // Apply damage batch + handle kills
            const deathEvents = useEnemies.getState().damageEnemiesBatch(_tacticalHits, clockMs)
            let _killsTact = 0
            for (let i = 0; i < deathEvents.length; i++) {
              const event = deathEvents[i]
              if (event.killed) {
                addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
                playSFX('explosion')
                rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z, event.enemy)
                _killsTact++
              }
            }
            if (_killsTact > 0) useGame.setState(s => ({ kills: s.kills + _killsTact, score: s.score + GAME_CONFIG.SCORE_PER_KILL * _killsTact }))

            // Spawn VFX effect at strike position (up to poolLimit simultaneous effects)
            if (tactWeapon.tacticalStrikes.length < (tactDef.poolLimit ?? 4)) {
              tactWeapon.tacticalStrikes.push({
                x: target.x,
                z: target.z,
                timer: tactDef.strikeVfxDuration,
                maxDuration: tactDef.strikeVfxDuration,
                splashRadius: effectiveSplashRadius,
              })
            }

            playSFX(tactDef.sfxKey)
          }
          // If eligibleTargets.length === 0: cooldown already reset above, no shot, no VFX, no SFX
        }
      }
    }

    // 7b. Apply enemy damage (batch)
    if (_projectileHits.length > 0) {
      // Story 27.1: Accumulate damage numbers before damage resolution (enemy positions still valid).
      // Story 27.2: isCrit is set at projectile spawn time (useWeapons.tick); propagated to each hit.
      // Story 43.2: No per-weapon reset/flush — single spawnDamageNumbers call at end of section 7.
      for (let i = 0; i < _projectileHits.length; i++) {
        const hit = _projectileHits[i]
        for (let j = 0; j < enemies.length; j++) {
          if (enemies[j].id === hit.enemyId) {
            _dnEntries.push({
              damage: Math.round(hit.damage),
              worldX: enemies[j].x,
              worldZ: enemies[j].z,
              isCrit: hit.isCrit,
            })
            break
          }
        }
      }

      const deathEvents = useEnemies.getState().damageEnemiesBatch(_projectileHits, clockMs)

      // 7c. Spawn particles + XP orbs for deaths, increment kill counter
      let _kills7c = 0
      for (let i = 0; i < deathEvents.length; i++) {
        const event = deathEvents[i]
        if (event.killed) {
          addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
          playSFX('explosion')
          // Story 19.5: Registry-based loot system with per-enemy dropOverrides support
          // Pass enemy instance (not enemyDef) to enable per-enemy dropOverrides
          rollDrops(event.enemy.typeId, event.enemy.x, event.enemy.z, event.enemy)
          _kills7c++
        }
      }
      // Single setState — kills + score in one Zustand notification instead of 2×N
      if (_kills7c > 0) useGame.setState(s => ({ kills: s.kills + _kills7c, score: s.score + GAME_CONFIG.SCORE_PER_KILL * _kills7c }))
    }

    // Single DN flush — all weapon systems accumulated into _dnEntries across the entire frame (Story 43.2)
    if (_dnEntries.length > 0) useDamageNumbers.getState().spawnDamageNumbers(_dnEntries)

    // 7d. Player-enemy contact damage
    // Pre-check mirrors takeDamage() guards to skip enemy iteration when player can't take damage
    const playerHits = cs.queryCollisions(pool[0], CATEGORY_ENEMY)
    // Story 20.1: Read armor once for all damage sites this frame
    const permanentArmor = playerState.permanentUpgradeBonuses.armor
    if (playerHits.length > 0) {
      const pState = usePlayer.getState()
      if (pState.contactDamageCooldown <= 0 && !pState.isInvulnerable) {
        // Re-read enemies after projectile damage — killed enemies should not deal contact damage
        const aliveEnemies = useEnemies.getState().enemies
        let totalDamage = 0
        for (let i = 0; i < playerHits.length; i++) {
          let enemy = null
          for (let k = 0; k < aliveEnemies.length; k++) {
            if (aliveEnemies[k].id === playerHits[i].id) { enemy = aliveEnemies[k]; break }
          }
          if (enemy) totalDamage += enemy.damage
        }
        if (totalDamage > 0) {
          const armorReduced = Math.max(1, totalDamage - permanentArmor)
          usePlayer.getState().takeDamage(armorReduced, boonModifiers.damageReduction ?? 0)
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
          let sw = null
          for (let k = 0; k < shockwaves.length; k++) {
            if (shockwaves[k].id === swHits[i].id) { sw = shockwaves[k]; break }
          }
          if (sw) totalSwDamage += sw.damage
        }
        if (totalSwDamage > 0) {
          const armorReduced = Math.max(1, totalSwDamage - permanentArmor)
          usePlayer.getState().takeDamage(armorReduced, boonModifiers.damageReduction ?? 0)
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
          let ep = null
          for (let k = 0; k < enemyProj.length; k++) {
            if (enemyProj[k].id === epHits[i].id) { ep = enemyProj[k]; break }
          }
          if (ep) {
            totalEpDamage += ep.damage
            ep.active = false // Despawn on hit
          }
        }
        if (totalEpDamage > 0) {
          const armorReduced = Math.max(1, totalEpDamage - permanentArmor)
          usePlayer.getState().takeDamage(armorReduced, boonModifiers.damageReduction ?? 0)
          playSFX('damage-taken')
        }
      }
    }

    // 7e. Death check with revival system (Story 22.1)
    if (usePlayer.getState().currentHP <= 0) {
      const { revivalCharges } = usePlayer.getState()
      if (revivalCharges > 0) {
        // Player has revival charges — show revive prompt
        useGame.getState().enterRevivePhase()
      } else {
        // No revival charges — game over
        playSFX('game-over-impact')
        useGame.getState().updateHighScore()
        useGame.getState().triggerGameOver()
        useWeapons.getState().cleanupInactive()
      }
      return // Stop processing after death/revive prompt
    }

    // 7f. System timer — increment and check timeout (pause during boss fight — Story 17.4)
    const gameState = useGame.getState()
    let newTimer = gameState.systemTimer // Initialize with current timer
    if (!bossActive) {
      newTimer = gameState.systemTimer + clampedDelta
      gameState.setSystemTimer(newTimer)
      const actualDuration = useLevel.getState().actualSystemDuration
      const timeLeft = actualDuration - newTimer
      if (timeLeft <= 60 && !timerWarningFiredRef.current) {
        timerWarningFiredRef.current = true
        useCompanion.getState().trigger('timer-warning', 'high')
      }
      if (newTimer >= actualDuration) { // Story 23.3: use actual duration
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

    // 7f-bis. Wormhole activation check (spawn now triggered by scan count — Story 34.4)
    const levelState = useLevel.getState()
    if (levelState.wormholeState === 'visible') {
      const wh = levelState.wormhole
      const dx = playerPos[0] - wh.x
      const dz = playerPos[2] - wh.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist <= GAME_CONFIG.WORMHOLE_ACTIVATION_RADIUS) {
        useLevel.getState().activateWormhole()
        // Story 22.4: Don't clear enemies — boss spawns alongside existing waves
        playSFX('wormhole-activate')
        // Story 17.6: Trigger impressive flash on first wormhole touch (map clear celebration)
        useGame.getState().triggerWormholeFirstTouch()
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
      const wormholeGameState = useGame.getState()
      if (dist <= GAME_CONFIG.WORMHOLE_ACTIVATION_RADIUS && !wormholeGameState.tunnelTransitionPending) {
        if (levelState.currentSystem < GAME_CONFIG.MAX_SYSTEMS) {
          // Story 17.6: Trigger flash immediately, transition very quickly
          // Flash covers the entire scene loading while fading out
          wormholeGameState.setTunnelTransitionPending(true)
          wormholeGameState.triggerTunnelEntryFlash() // Flash starts NOW at full opacity
          const transitionDelay = 150 // ms - Very short delay, just enough to see flash start
          tunnelTransitionTimerRef.current = setTimeout(() => {
            tunnelTransitionTimerRef.current = null
            useGame.getState().setPhase('tunnel')
          }, transitionDelay)
        } else {
          wormholeGameState.updateHighScore()
          wormholeGameState.triggerVictory()
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
          const scale = exp.isFinal ? GAME_CONFIG.BOSS_DEATH_FINAL_EXPLOSION_SCALE : GAME_CONFIG.BOSS_SCALE_MULTIPLIER
          addExplosion(exp.x, exp.z, '#ff3333', scale)
          playSFX('boss-hit')
        }
        if (defeatResult.animationComplete && !bossState.rewardGiven) {
          playSFX('boss-defeat')
          const fragMult = (boonModifiers.fragmentMultiplier ?? 1.0) * playerState.upgradeStats.fragmentMult
          usePlayer.getState().addFragments(Math.round(GAME_CONFIG.BOSS_LOOT_FRAGMENTS * fragMult))
          // Story 22.4: Drop large XP reward on boss defeat
          const bossXpReward = 5000 * GAME_CONFIG.BOSS_LOOT_XP_MULTIPLIER
          const orbCount = 10
          const xpPerOrb = bossXpReward / orbCount
          const bossPos = useBoss.getState().boss
          if (bossPos) {
            for (let i = 0; i < orbCount; i++) {
              const angle = (i / orbCount) * Math.PI * 2
              const spread = 3
              spawnOrb(bossPos.x + Math.cos(angle) * spread, bossPos.z + Math.sin(angle) * spread, xpPerOrb)
            }
          }
          // Story 23.3: Store remaining time as carryover for the next system
          // Calculated at boss defeat (not wormhole entry) so tunnel time is excluded
          const currentTimerAtDefeat = useGame.getState().systemTimer
          const actualDurationAtDefeat = useLevel.getState().actualSystemDuration
          useLevel.getState().setCarriedTime(Math.max(0, actualDurationAtDefeat - currentTimerAtDefeat))
          useLevel.getState().reactivateWormhole()
          useBoss.getState().setRewardGiven(true)
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

        // Player projectiles vs boss (with swept collision for fast projectiles)
        if (boss && boss.hp > 0) {
          const projStartIdx = 1 + enemies.length
          const bossR = GAME_CONFIG.BOSS_COLLISION_RADIUS
          for (let i = 0; i < projectiles.length; i++) {
            const pEntity = pool[projStartIdx + i]
            if (!pEntity) continue
            const proj = projectiles[i]
            if (!proj.active) continue

            const _tdx = proj.x - (proj.prevX ?? proj.x)
            const _tdz = proj.z - (proj.prevZ ?? proj.z)
            const _tsq = _tdx * _tdx + _tdz * _tdz
            const _dsq = (proj.radius * 2) * (proj.radius * 2)

            let bossHit
            if (_tsq > _dsq) {
              bossHit = segmentCircleIntersect(proj.prevX, proj.prevZ, proj.x, proj.z, boss.x, boss.z, proj.radius + bossR)
            } else {
              bossHit = cs.queryCollisions(pEntity, CATEGORY_BOSS).length > 0
            }

            if (bossHit) {
              if (proj.piercing) {
                proj.pierceHits = (proj.pierceHits || 0) + 1
                if (proj.pierceHits >= proj.pierceCount) proj.active = false
              } else {
                proj.active = false
              }
              const result = bossState.damageBoss(proj.damage)
              playSFX('boss-hit')
              if (result.killed) {
                addExplosion(boss.x, boss.z, '#ff3333', GAME_CONFIG.BOSS_SCALE_MULTIPLIER)
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
              const armorReduced = Math.max(1, totalDamage - permanentArmor)
              usePlayer.getState().takeDamage(armorReduced, boonModifiers.damageReduction ?? 0)
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
              const bossDmg = Math.max(1, Math.round(GAME_CONFIG.BOSS_CONTACT_DAMAGE * (boss.damageMultiplier || 1)) - permanentArmor)
              usePlayer.getState().takeDamage(bossDmg, boonModifiers.damageReduction ?? 0)
              playSFX('damage-taken')
            }
          }
        }
      }
    }

    // 7g. Planet scanning
    const scanResult = useLevel.getState().scanningTick(clampedDelta, playerPos[0], playerPos[2])
    const currentScanId = scanResult.activeScanPlanetId

    // Scan started (entered zone)
    if (currentScanId && !prevScanPlanetRef.current) {
      playScanLoop()
    }

    // Scan interrupted (left zone before completion)
    if (!currentScanId && prevScanPlanetRef.current) {
      stopScanLoop()
    }

    prevScanPlanetRef.current = currentScanId

    // Scan completed successfully
    if (scanResult.completed) {
      stopScanLoop()
      playSFX('scan-complete')
      useCompanion.getState().trigger('scan-complete')
      useGame.getState().triggerPlanetReward(scanResult.tier)
      // Story 34.4: Scan-based wormhole trigger
      const scanGalaxyConfig = getGalaxyById(useGame.getState().selectedGalaxyId)
      if (scanGalaxyConfig && useLevel.getState().wormholeState === 'hidden') {
        const threshold = Math.ceil(scanGalaxyConfig.planetCount * scanGalaxyConfig.wormholeThreshold)
        const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
        if (scannedCount >= threshold) {
          useLevel.getState().spawnWormhole(playerPos[0], playerPos[2])
          playSFX('wormhole-spawn')
        }
        // Story 37.2: Near-wormhole-threshold companion hint (one-shot per run)
        if (!useCompanion.getState().hasShown('near-wormhole-threshold') && scannedCount === threshold - 1) {
          useCompanion.getState().trigger('near-wormhole-threshold')
          useCompanion.getState().markShown('near-wormhole-threshold')
        }
      }
    }

    // Story 35.1: Fog of war — mark player's visited area every 10 frames
    // Skipped during boss phase to avoid marking unchecked boss arena zones
    fogFrameCountRef.current++
    if (fogFrameCountRef.current % 10 === 0 && !bossActive) {
      markFogDiscovered(playerPos[0], playerPos[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)
    }

    // 8. XP + progression
    // 8a. Update orb timers + magnetization (Story 11.1)
    updateOrbs(clampedDelta)
    // Story 20.4: Combine boon pickup radius with permanent magnet upgrade (multiplicative stacking)
    // Stacking: boon pickupRadius × permanent magnet → e.g., 1.5 × 1.3 = 1.95
    const composedPickupRadius = (boonModifiers.pickupRadiusMultiplier ?? 1.0) * permanentUpgradeBonuses.magnet
    updateMagnetization(playerPos[0], playerPos[2], clampedDelta, composedPickupRadius)
    // Story 19.2: Update heal gem magnetization (uses same radius/speed as XP orbs)
    updateHealGemMagnetization(playerPos[0], playerPos[2], clampedDelta, composedPickupRadius)
    // Story 19.3: Update fragment gem magnetization (uses same radius/speed as XP orbs)
    updateFragmentGemMagnetization(playerPos[0], playerPos[2], clampedDelta, composedPickupRadius)
    // Story 44.5: Update rare item magnetization (same sticky pattern)
    updateRareItemMagnetization(playerPos[0], playerPos[2], clampedDelta, composedPickupRadius)

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

    // Story 19.3: Register fragment gems in spatial hash
    const fragmentGemArray = getActiveGems()
    const fragmentGemCount = getFragmentGemCount()
    for (let i = 0; i < fragmentGemCount; i++) {
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      assignEntity(pool[idx], _fragmentGemIds[i], fragmentGemArray[i].x, fragmentGemArray[i].z, GAME_CONFIG.FRAGMENT_GEM_PICKUP_RADIUS, CATEGORY_FRAGMENT_GEM)
      cs.registerEntity(pool[idx++])
    }

    // Story 44.5: Register rare items in spatial hash
    const rareItemArray = getRareItems()
    const rareItemCount = getActiveRareItemCount()
    for (let i = 0; i < rareItemCount; i++) {
      if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
      assignEntity(pool[idx], _rareItemIds[i], rareItemArray[i].x, rareItemArray[i].z, GAME_CONFIG.RARE_ITEM_PICKUP_RADIUS, CATEGORY_RARE_ITEM)
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
      // Story 20.4: Combine boon XP multiplier with permanent expBonus (multiplicative stacking)
      // Stacking: boon xpMult × permanent expBonus → e.g., 1.5 × 1.25 = 1.875
      const xpMult = (boonModifiers.xpMultiplier ?? 1.0) * permanentUpgradeBonuses.expBonus
      let totalXP = 0
      for (let i = 0; i < indices.length; i++) {
        const orbIndex = indices[i]
        // Story 19.1: Check if orb is rare before collecting (to play appropriate SFX)
        const isRare = orbArray[orbIndex].isRare
        totalXP += collectOrb(orbIndex)
        // Story 19.1: Play distinct SFX for rare XP gem collection
        if (isRare) {
          playSFX('xp_rare_pickup')
        }
      }
      // Single addXP call — avoids N Zustand set() notifications when many orbs collected at once
      if (totalXP > 0) usePlayer.getState().addXP(Math.floor(totalXP * xpMult))
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

    // Story 19.3: Query player-fragmentGem collisions
    const fragmentGemHits = cs.queryCollisions(pool[0], CATEGORY_FRAGMENT_GEM)
    if (fragmentGemHits.length > 0) {
      const indices = []
      for (let i = 0; i < fragmentGemHits.length; i++) {
        const gemIndex = parseInt(fragmentGemHits[i].id.split('_')[1], 10)
        if (gemIndex < getFragmentGemCount()) indices.push(gemIndex)
      }
      indices.sort((a, b) => b - a)
      const fragMult = (boonModifiers.fragmentMultiplier ?? 1.0) * playerState.upgradeStats.fragmentMult
      for (let i = 0; i < indices.length; i++) {
        const gemIndex = indices[i]
        const fragmentValue = collectGem(gemIndex)
        usePlayer.getState().addFragments(Math.round(fragmentValue * fragMult))
        playSFX('fragment_pickup')
      }
    }

    // Story 44.5: Query player-rareItem collisions
    const rareItemHits = cs.queryCollisions(pool[0], CATEGORY_RARE_ITEM)
    if (rareItemHits.length > 0) {
      const rIndices = []
      for (let i = 0; i < rareItemHits.length; i++) {
        const rIndex = parseInt(rareItemHits[i].id.split('_')[1], 10)
        if (rIndex < getActiveRareItemCount()) rIndices.push(rIndex)
      }
      rIndices.sort((a, b) => b - a)
      for (let i = 0; i < rIndices.length; i++) {
        const rIndex = rIndices[i]
        const { type } = collectRareItem(rIndex)
        playSFX('rare-item-collect')
        if (type === 'MAGNET') {
          forceActivateMagnet()
          forceActivateMagnetHealGems()
          forceActivateMagnetFragments()
          forceActivateMagnetRareItems()
        } else if (type === 'BOMB') {
          const enemies = useEnemies.getState().enemies
          const bombRadSq = GAME_CONFIG.BOMB_ITEM_RADIUS * GAME_CONFIG.BOMB_ITEM_RADIUS
          const bombHits = []
          for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j]
            const dx = e.x - playerPos[0]
            const dz = e.z - playerPos[2]
            if (dx * dx + dz * dz <= bombRadSq) bombHits.push({ enemyId: e.id, damage: Infinity })
          }
          if (bombHits.length > 0) useEnemies.getState().damageEnemiesBatch(bombHits)
          const bossState = useBoss.getState()
          if (bossState.isActive && bossState.boss) {
            bossState.damageBoss(bossState.boss.maxHp * GAME_CONFIG.BOMB_ITEM_BOSS_DAMAGE_PERCENT)
          }
        } else if (type === 'SHIELD') {
          usePlayer.getState().activateShield(GAME_CONFIG.SHIELD_ITEM_DURATION)
        }
      }
    }

    // 8e. Check pending level-up — consume flag and trigger pause + modal
    if (usePlayer.getState().pendingLevelUps > 0) {
      playSFX('level-up')
      useCompanion.getState().trigger('level-up')
      usePlayer.getState().consumeLevelUp()
      useGame.getState().triggerLevelUp()
    }

    // 8f. Periodic scan reminder — fires every 120s but ONLY when companion is fully idle
    // and wormhole hasn't spawned yet. Timer freezes while any message is active.
    if (phase === 'gameplay' && !bossActive) {
      const companionState = useCompanion.getState()
      if (companionState.current === null && companionState.queue.length === 0) {
        scanReminderTimerRef.current = Math.max(0, scanReminderTimerRef.current - clampedDelta)
        if (scanReminderTimerRef.current === 0) {
          if (useLevel.getState().wormholeState === 'hidden') {
            useCompanion.getState().trigger('scan-reminder')
          }
          scanReminderTimerRef.current = 120
        }
      }
    }

    // 9. Cleanup dead entities
    useDamageNumbers.getState().tick(clampedDelta) // Story 27.1: Age and remove expired numbers
  })

  return null // GameLoop is a logic-only component, no rendering
}
