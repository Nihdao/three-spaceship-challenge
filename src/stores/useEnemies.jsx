import { create } from 'zustand'
import { ENEMIES } from '../entities/enemyDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

// Shockwave lifetime constant (seconds for ring to expand and fade)
const SHOCKWAVE_LIFETIME = 0.5

// Sniper distance maintenance constants
const SNIPER_MIN_RANGE = 30
const SNIPER_MAX_RANGE = 40

// Sweep despawn margin beyond play area
const SWEEP_DESPAWN_MARGIN = 50

// Pre-allocated structures for damageEnemiesBatch (Story 41.2 AC 5)
const _damageMap = new Map()
const _killIds = new Set()

// Leash system (Story 36.1)
const LEASH_ELIGIBLE = new Set(['chase', 'shockwave', 'sniper_mobile'])
const LEASH_DIST_SQ = GAME_CONFIG.ENEMY_LEASH_DISTANCE * GAME_CONFIG.ENEMY_LEASH_DISTANCE

// Double-buffer for teleport events (Story 43.1) — avoids .slice() allocation
let _activeBuffer = []
let _readBuffer = []

// Enemy projectile default lifetime
const ENEMY_PROJECTILE_LIFETIME = 5.0

// Initialize behavior-specific properties based on def
function initBehaviorData(enemy, def, instruction) {
  switch (def.behavior) {
    case 'sweep':
      enemy.sweepDirection = instruction.sweepDirection || { x: 1, z: 0 }
      enemy.despawnTimer = 10 + Math.random() * 5
      break
    case 'shockwave':
      enemy.shockwaveTimer = def.shockwaveInterval
      break
    case 'sniper_mobile':
      enemy.attackTimer = def.attackCooldown
      break
    case 'sniper_fixed':
      enemy.attackTimer = def.attackCooldown
      enemy.telegraphTimer = 0
      enemy.attackState = 'idle'
      break
    case 'teleport':
      enemy.teleportTimer = def.teleportCooldown
      break
  }
}

const useEnemies = create((set, get) => ({
  // --- State ---
  enemies: [],
  nextId: 0,
  shockwaves: [],
  nextShockwaveId: 0,
  enemyProjectiles: [],
  nextEnemyProjId: 0,

  // --- Actions ---
  spawnEnemy: (typeId, x, z) => {
    const state = get()
    if (state.enemies.length >= GAME_CONFIG.MAX_ENEMIES_ON_SCREEN) return

    const def = ENEMIES[typeId]
    if (!def) return

    const id = `enemy_${state.nextId}`
    const enemy = {
      id,
      typeId,
      x,
      z,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      damage: def.damage,
      radius: def.radius,
      behavior: def.behavior,
      color: def.color,
      meshScale: def.meshScale,
      xpReward: def.xpReward,
      lastHitTime: -Infinity,
      hitFlashTimer: 0,
    }

    initBehaviorData(enemy, def, {})

    set({
      enemies: [...state.enemies, enemy],
      nextId: state.nextId + 1,
    })
  },

  // Batch spawn — single set() call for multiple enemies (called by GameLoop)
  spawnEnemies: (instructions) => {
    if (instructions.length === 0) return

    const state = get()
    let currentEnemies = state.enemies

    // Evict oldest non-protected enemies if pool is full (Story 36.2)
    let hadEviction = false
    let evictedCount = 0
    const slotsNeeded = Math.max(0, currentEnemies.length + instructions.length - GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
    if (slotsNeeded > 0) {
      for (let i = 0; i < currentEnemies.length && evictedCount < slotsNeeded; i++) {
        const e = currentEnemies[i]
        if (e.behavior !== 'boss' && ENEMIES[e.typeId]?.tier !== 'ELITE') {
          e._evict = true
          evictedCount++
        }
      }
      hadEviction = evictedCount > 0
    }

    const available = GAME_CONFIG.MAX_ENEMIES_ON_SCREEN - currentEnemies.length + evictedCount
    if (available <= 0) return

    const batch = []
    let nextId = state.nextId
    const limit = Math.min(instructions.length, available)

    for (let i = 0; i < limit; i++) {
      const instruction = instructions[i]
      const { typeId, x, z, scaling, difficultyMult = 1.0 } = instruction
      const def = ENEMIES[typeId]
      if (!def) continue

      // Per-stat scaling (Story 18.3) with backward compat for single difficultyMult
      const hpMult = scaling?.hp ?? difficultyMult
      const damageMult = scaling?.damage ?? difficultyMult
      const speedMult = scaling?.speed ?? difficultyMult
      const xpMult = scaling?.xpReward ?? difficultyMult

      const hp = Math.round(def.hp * hpMult)
      const enemy = {
        id: `enemy_${nextId}`,
        numericId: nextId,
        typeId,
        x,
        z,
        hp,
        maxHp: hp,
        speed: def.speed * speedMult,
        damage: Math.round(def.damage * damageMult),
        radius: def.radius,
        behavior: def.behavior,
        color: def.color,
        meshScale: def.meshScale,
        xpReward: Math.round(def.xpReward * xpMult),
        lastHitTime: -Infinity,
        hitFlashTimer: 0,
      }

      initBehaviorData(enemy, def, instruction)

      batch.push(enemy)
      nextId++
    }

    if (batch.length > 0 || hadEviction) {
      const result = []
      for (let i = 0; i < currentEnemies.length; i++) {
        if (!currentEnemies[i]._evict) result.push(currentEnemies[i])
      }
      for (let i = 0; i < batch.length; i++) {
        result.push(batch[i])
      }
      set({ enemies: result, nextId })
    }
  },

  // --- Shockwave actions ---
  spawnShockwave: (x, z, maxRadius, damage) => {
    const state = get()
    // Reuse inactive slot
    for (let i = 0; i < state.shockwaves.length; i++) {
      if (!state.shockwaves[i].active) {
        state.shockwaves[i].x = x
        state.shockwaves[i].z = z
        state.shockwaves[i].radius = 0
        state.shockwaves[i].maxRadius = maxRadius
        state.shockwaves[i].lifetime = SHOCKWAVE_LIFETIME
        state.shockwaves[i].damage = damage
        state.shockwaves[i].active = true
        return
      }
    }
    // No inactive slot, push new
    set({
      shockwaves: [...state.shockwaves, {
        id: `sw_${state.nextShockwaveId}`,
        x, z,
        radius: 0,
        maxRadius,
        lifetime: SHOCKWAVE_LIFETIME,
        damage,
        active: true,
      }],
      nextShockwaveId: state.nextShockwaveId + 1,
    })
  },

  tickShockwaves: (delta) => {
    const { shockwaves } = get()
    for (let i = 0; i < shockwaves.length; i++) {
      const sw = shockwaves[i]
      if (!sw.active) continue
      sw.radius += (sw.maxRadius / SHOCKWAVE_LIFETIME) * delta
      sw.lifetime -= delta
      if (sw.lifetime <= 0) {
        sw.active = false
      }
    }
  },

  // --- Enemy projectile actions ---
  spawnEnemyProjectile: (x, z, targetX, targetZ, speed, damage, color) => {
    const dx = targetX - x
    const dz = targetZ - z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < 0.01) return

    const vx = (dx / dist) * speed
    const vz = (dz / dist) * speed

    const state = get()
    // Reuse inactive slot
    for (let i = 0; i < state.enemyProjectiles.length; i++) {
      if (!state.enemyProjectiles[i].active) {
        const p = state.enemyProjectiles[i]
        p.x = x; p.z = z; p.vx = vx; p.vz = vz
        p.speed = speed; p.damage = damage; p.color = color
        p.lifetime = ENEMY_PROJECTILE_LIFETIME; p.active = true
        return
      }
    }
    // No inactive slot, push new
    set({
      enemyProjectiles: [...state.enemyProjectiles, {
        id: `eproj_${state.nextEnemyProjId}`,
        x, z, vx, vz,
        speed, damage,
        radius: 0.5,
        color,
        lifetime: ENEMY_PROJECTILE_LIFETIME,
        active: true,
      }],
      nextEnemyProjId: state.nextEnemyProjId + 1,
    })
  },

  // Spawn directional projectile (pre-computed velocity)
  _spawnEnemyProjectileVec: (x, z, vx, vz, speed, damage, color) => {
    const state = get()
    for (let i = 0; i < state.enemyProjectiles.length; i++) {
      if (!state.enemyProjectiles[i].active) {
        const p = state.enemyProjectiles[i]
        p.x = x; p.z = z; p.vx = vx; p.vz = vz
        p.speed = speed; p.damage = damage; p.color = color
        p.lifetime = ENEMY_PROJECTILE_LIFETIME; p.active = true
        return
      }
    }
    set({
      enemyProjectiles: [...state.enemyProjectiles, {
        id: `eproj_${state.nextEnemyProjId}`,
        x, z, vx, vz,
        speed, damage,
        radius: 0.5,
        color,
        lifetime: ENEMY_PROJECTILE_LIFETIME,
        active: true,
      }],
      nextEnemyProjId: state.nextEnemyProjId + 1,
    })
  },

  tickEnemyProjectiles: (delta) => {
    const { enemyProjectiles } = get()
    const bound = GAME_CONFIG.PLAY_AREA_SIZE + SWEEP_DESPAWN_MARGIN
    for (let i = 0; i < enemyProjectiles.length; i++) {
      const p = enemyProjectiles[i]
      if (!p.active) continue
      p.x += p.vx * delta
      p.z += p.vz * delta
      p.lifetime -= delta
      if (p.lifetime <= 0 || Math.abs(p.x) > bound || Math.abs(p.z) > bound) {
        p.active = false
      }
    }
  },

  // --- Tick (called by GameLoop each frame) ---
  // Mutates enemy positions in-place for zero GC pressure.
  // Readers use getState() in useFrame, not React subscriptions.
  tick: (delta, playerPosition, options = {}) => {
    const { enemies } = get()
    if (enemies.length === 0) return
    const leashEnabled = options.leashEnabled !== false

    const px = playerPosition[0]
    const pz = playerPosition[2]
    const bound = GAME_CONFIG.PLAY_AREA_SIZE
    const despawnBound = bound + SWEEP_DESPAWN_MARGIN

    let hasDespawns = false

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]

      // Decay hit flash timer (Story 27.3)
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer = Math.max(0, e.hitFlashTimer - delta)
      }

      if (e.behavior === 'chase') {
        const dx = px - e.x
        const dz = pz - e.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0.1) {
          e.x += (dx / dist) * e.speed * delta
          e.z += (dz / dist) * e.speed * delta
        }
        // Clamp chase enemies to play area
        e.x = Math.max(-bound, Math.min(bound, e.x))
        e.z = Math.max(-bound, Math.min(bound, e.z))

      } else if (e.behavior === 'sweep') {
        // Linear movement along sweepDirection, ignoring player
        e.x += e.sweepDirection.x * e.speed * delta
        e.z += e.sweepDirection.z * e.speed * delta
        // Decrement despawn timer
        e.despawnTimer -= delta
        // Despawn on timeout or leaving extended bounds
        if (e.despawnTimer <= 0 || Math.abs(e.x) > despawnBound || Math.abs(e.z) > despawnBound) {
          e._despawn = true
          hasDespawns = true
        }

      } else if (e.behavior === 'shockwave') {
        // Slow chase toward player
        const dx = px - e.x
        const dz = pz - e.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0.1) {
          e.x += (dx / dist) * e.speed * delta
          e.z += (dz / dist) * e.speed * delta
        }
        // Decrement shockwave timer
        e.shockwaveTimer -= delta
        if (e.shockwaveTimer <= 0) {
          const def = ENEMIES[e.typeId]
          get().spawnShockwave(e.x, e.z, def.shockwaveRadius, def.shockwaveDamage)
          e.shockwaveTimer = def.shockwaveInterval
        }
        // Clamp to play area
        e.x = Math.max(-bound, Math.min(bound, e.x))
        e.z = Math.max(-bound, Math.min(bound, e.z))

      } else if (e.behavior === 'sniper_mobile') {
        // Distance maintenance AI
        const dx = px - e.x
        const dz = pz - e.z
        const distSq = dx * dx + dz * dz
        const dist = Math.sqrt(distSq)

        if (dist > 0.1) {
          const nx = dx / dist
          const nz = dz / dist

          if (dist < SNIPER_MIN_RANGE) {
            // Too close — move away
            e.x -= nx * e.speed * delta
            e.z -= nz * e.speed * delta
          } else if (dist > SNIPER_MAX_RANGE) {
            // Too far — move toward
            e.x += nx * e.speed * delta
            e.z += nz * e.speed * delta
          } else {
            // In range band — strafe perpendicular
            e.x += nz * e.speed * delta
            e.z -= nx * e.speed * delta
          }
        }

        // Decrement attack timer
        e.attackTimer -= delta
        if (e.attackTimer <= 0) {
          const def = ENEMIES[e.typeId]
          get().spawnEnemyProjectile(e.x, e.z, px, pz, def.projectileSpeed, def.projectileDamage, def.projectileColor)
          e.attackTimer = def.attackCooldown
        }
        // Clamp to play area
        e.x = Math.max(-bound, Math.min(bound, e.x))
        e.z = Math.max(-bound, Math.min(bound, e.z))

      } else if (e.behavior === 'sniper_fixed') {
        // Stationary — speed=0, no movement
        // State machine: idle → telegraph → fire → idle
        if (e.attackState === 'idle') {
          e.attackTimer -= delta
          if (e.attackTimer <= 0) {
            e.attackState = 'telegraph'
            e.telegraphTimer = 0
            // Store target position at telegraph start
            e._targetX = px
            e._targetZ = pz
          }
        } else if (e.attackState === 'telegraph') {
          const def = ENEMIES[e.typeId]
          e.telegraphTimer += delta
          if (e.telegraphTimer >= def.telegraphDuration) {
            // Fire high-damage projectile toward position at telegraph start
            get().spawnEnemyProjectile(e.x, e.z, e._targetX, e._targetZ, def.projectileSpeed, def.projectileDamage, def.projectileColor)
            e.attackState = 'idle'
            e.attackTimer = def.attackCooldown
            e.telegraphTimer = 0
          }
        }

      } else if (e.behavior === 'teleport') {
        // Chase toward player
        const dx = px - e.x
        const dz = pz - e.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0.1) {
          e.x += (dx / dist) * e.speed * delta
          e.z += (dz / dist) * e.speed * delta
        }

        // Decrement teleport timer
        e.teleportTimer -= delta
        if (e.teleportTimer <= 0) {
          const def = ENEMIES[e.typeId]
          // Teleport to random nearby position
          const angle = Math.random() * Math.PI * 2
          const teleportDist = Math.random() * def.teleportRange
          const newX = e.x + Math.cos(angle) * teleportDist
          const newZ = e.z + Math.sin(angle) * teleportDist

          // Record teleport event for particle effects (consumed by GameLoop)
          const oldX = e.x
          const oldZ = e.z

          // Clamp to play area
          e.x = Math.max(-bound, Math.min(bound, newX))
          e.z = Math.max(-bound, Math.min(bound, newZ))

          _activeBuffer.push({ oldX, oldZ, newX: e.x, newZ: e.z })

          // Reset timer
          e.teleportTimer = def.teleportCooldown

          // Fire burst of projectiles toward player
          const burstDx = px - e.x
          const burstDz = pz - e.z
          const burstDist = Math.sqrt(burstDx * burstDx + burstDz * burstDz)
          if (burstDist > 0.1) {
            const baseAngle = Math.atan2(burstDz, burstDx)
            const count = def.burstProjectileCount
            const spread = 0.2 // radians between projectiles
            for (let b = 0; b < count; b++) {
              const a = baseAngle + (b - (count - 1) / 2) * spread
              const vx = Math.cos(a) * def.burstProjectileSpeed
              const vz = Math.sin(a) * def.burstProjectileSpeed
              get()._spawnEnemyProjectileVec(e.x, e.z, vx, vz, def.burstProjectileSpeed, def.burstProjectileDamage, def.color)
            }
          }
        }

        // Clamp to play area
        e.x = Math.max(-bound, Math.min(bound, e.x))
        e.z = Math.max(-bound, Math.min(bound, e.z))
      }
    }

    // --- Leash system (Story 36.1) ---
    if (leashEnabled) {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i]
        if (!LEASH_ELIGIBLE.has(e.behavior)) continue
        const dx = px - e.x
        const dz = pz - e.z
        if (dx * dx + dz * dz <= LEASH_DIST_SQ) continue
        // Teleport: record departure, compute new position, push arrival
        const oldX = e.x
        const oldZ = e.z
        const angle = Math.random() * Math.PI * 2
        const spawnDist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)
        e.x = Math.max(-bound, Math.min(bound, px + Math.cos(angle) * spawnDist))
        e.z = Math.max(-bound, Math.min(bound, pz + Math.sin(angle) * spawnDist))
        _activeBuffer.push({ oldX, oldZ, newX: e.x, newZ: e.z })
      }
    }

    // Remove despawned enemies (sweep timeout / out of bounds)
    if (hasDespawns) {
      set({ enemies: enemies.filter(e => !e._despawn) })
    }
  },

  // Returns full enemy snapshot on kill (callers need id, xpReward, etc.)
  // — differs from damageEnemiesBatch which returns minimal { x, z, typeId, color }
  damageEnemy: (enemyId, damage, clockMs) => {
    const { enemies } = get()
    let idx = -1
    for (let k = 0; k < enemies.length; k++) {
      if (enemies[k].id === enemyId) { idx = k; break }
    }
    if (idx === -1) return { killed: false, enemy: null }

    const enemy = enemies[idx]
    enemy.hp -= damage
    enemy.hitFlashTimer = GAME_CONFIG.HIT_FLASH.DURATION
    if (enemy.hp <= 0) {
      const deadEnemy = { ...enemy }
      const remaining = []
      for (let k = 0; k < enemies.length; k++) {
        if (k !== idx) remaining.push(enemies[k])
      }
      set({ enemies: remaining })
      return { killed: true, enemy: deadEnemy }
    }
    // IMPORTANT: if clockMs is undefined (caller outside GameLoop), performance.now() is used.
    // EnemyRenderer reads clock.elapsedTime * 1000 — the domain mismatch produces a huge
    // negative hitAge, which EnemyRenderer guards against with hitAge >= 0. No permanent flash.
    enemy.lastHitTime = clockMs ?? performance.now()
    return { killed: false, enemy }
  },

  damageEnemiesBatch: (hits, clockMs) => {
    if (hits.length === 0) return []

    const { enemies } = get()
    const results = []

    // Accumulate damage per enemy (reuse pre-allocated Map — Story 41.2)
    _damageMap.clear()
    for (let i = 0; i < hits.length; i++) {
      const { enemyId, damage } = hits[i]
      _damageMap.set(enemyId, (_damageMap.get(enemyId) || 0) + damage)
    }

    // Apply accumulated damage (reuse pre-allocated Set — Story 41.2)
    _killIds.clear()
    for (const [enemyId, totalDamage] of _damageMap) {
      let enemy = null
      for (let k = 0; k < enemies.length; k++) {
        if (enemies[k].id === enemyId) { enemy = enemies[k]; break }
      }
      if (!enemy) continue

      enemy.hp -= totalDamage
      enemy.hitFlashTimer = GAME_CONFIG.HIT_FLASH.DURATION
      if (enemy.hp <= 0) {
        _killIds.add(enemyId)
        results.push({ killed: true, enemy: { x: enemy.x, z: enemy.z, typeId: enemy.typeId, color: enemy.color } })
      } else {
        // See damageEnemy note: performance.now() fallback produces huge negative hitAge
        // in EnemyRenderer, guarded by hitAge >= 0 check there.
        enemy.lastHitTime = clockMs ?? performance.now()
        results.push({ killed: false, enemy })
      }
    }

    // Single set() call — remove killed enemies
    if (_killIds.size > 0) {
      set({ enemies: enemies.filter((e) => !_killIds.has(e.id)) })
    }

    return results
  },

  killEnemy: (id) => {
    const { enemies } = get()
    const filtered = []
    for (let k = 0; k < enemies.length; k++) {
      if (enemies[k].id !== id) filtered.push(enemies[k])
    }
    set({ enemies: filtered })
  },

  consumeTeleportEvents: () => {
    if (_activeBuffer.length === 0) {
      _readBuffer.length = 0
      return _readBuffer
    }
    const tmp = _readBuffer
    _readBuffer = _activeBuffer
    _activeBuffer = tmp
    _activeBuffer.length = 0
    return _readBuffer
  },

  reset: () => {
    _activeBuffer.length = 0
    _readBuffer.length = 0
    set({
      enemies: [],
      nextId: 0,
      shockwaves: [],
      nextShockwaveId: 0,
      enemyProjectiles: [],
      nextEnemyProjId: 0,
    })
  },
}))

export default useEnemies
