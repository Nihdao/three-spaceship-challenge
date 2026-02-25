import { create } from 'zustand'
import { WEAPONS } from '../entities/weaponDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

let nextProjectileId = 0

// Per-weapon active projectile counter — avoids O(N) filter in fire() poolLimit check (Story 41.2 AC 6)
const _projCountByWeapon = new Map()

// Pre-allocated alive buffer — avoids per-call array allocation in cleanupInactive()
const _alive = []

const useWeapons = create((set, get) => ({
  // --- State ---
  activeWeapons: [],
  projectiles: [],

  // --- Actions ---

  initializeWeapons: () => {
    nextProjectileId = 0
    set({
      activeWeapons: [{ weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } }],
      projectiles: [],
    })
  },

  tick: (delta, playerPosition, playerRotation, boonModifiers = {}, aimDirection = null) => {
    const { activeWeapons, projectiles } = get()
    const newProjectiles = []
    const { damageMultiplier = 1, cooldownMultiplier = 1, critChance = 0, critMultiplier = 2.0, projectileSpeedMultiplier = 1.0, zoneMultiplier = 1.0 } = boonModifiers

    // Story 21.1: Use aimDirection for dual-stick firing, fallback to playerRotation
    const fireDirection = aimDirection ? aimDirection : [Math.sin(playerRotation), -Math.cos(playerRotation)]
    const fireAngle = Math.atan2(fireDirection[0], -fireDirection[1])

    for (let i = 0; i < activeWeapons.length; i++) {
      const weapon = activeWeapons[i]
      const def = WEAPONS[weapon.weaponId]

      // Story 11.3: Advance orbital angle every tick for smooth rotation
      if (def.projectilePattern === 'orbital') {
        weapon.orbitalAngle = (weapon.orbitalAngle || 0) + delta * (def.orbitalSpeed || 2.0)
      }

      // Story 32.1: Handle LASER_CROSS — non-projectile rotation weapon
      // Must run BEFORE cooldownTimer mutation to avoid corrupting unrelated state
      if (def.weaponType === 'laser_cross') {
        weapon.laserCrossAngle = (weapon.laserCrossAngle ?? 0) + delta * def.rotationSpeed * projectileSpeedMultiplier
        weapon.laserCrossIsActive = weapon.laserCrossIsActive ?? true
        weapon.laserCrossCycleTimer = (weapon.laserCrossCycleTimer ?? 0) + delta
        // Phase transition with while loop to handle large delta (single-tick tests)
        let phaseDuration = weapon.laserCrossIsActive
          ? def.activeTime
          : def.inactiveTime * cooldownMultiplier
        while (weapon.laserCrossCycleTimer >= phaseDuration) {
          weapon.laserCrossCycleTimer -= phaseDuration
          weapon.laserCrossIsActive = !weapon.laserCrossIsActive
          phaseDuration = weapon.laserCrossIsActive
            ? def.activeTime
            : def.inactiveTime * cooldownMultiplier
        }
        continue // Skip all projectile spawning logic
      }

      // Story 32.2: Handle MAGNETIC_FIELD — passive aura weapon, no projectile spawning
      // Must run BEFORE cooldownTimer mutation (weapon has no cooldown concept)
      if (def.weaponType === 'aura') {
        continue
      }

      // Story 32.4: Handle SHOCKWAVE — arc burst weapon, cooldown managed in GameLoop section 7a-quater
      // Must run BEFORE cooldownTimer mutation to avoid corrupting unrelated state
      if (def.weaponType === 'shockwave') {
        continue
      }

      // Story 32.5: Handle MINE_AROUND — orbiting proximity mines, all logic in GameLoop section 7a-quinquies
      // Must run BEFORE cooldownTimer mutation (mines have no cooldown concept)
      if (def.weaponType === 'mine_around') {
        continue
      }

      // Story 32.6: Handle TACTICAL_SHOT — instant remote strike, all logic in GameLoop section 7a-sexies
      // Must run BEFORE cooldownTimer mutation (tactical shot has its own cooldown: tacticalCooldownTimer)
      if (def.weaponType === 'tactical_shot') {
        continue
      }

      // Mutate cooldown in-place (no set() call) to avoid unnecessary Zustand re-renders.
      weapon.cooldownTimer -= delta

      if (weapon.cooldownTimer <= 0) {
        // Story 31.2: Effective cooldown uses per-weapon multiplier with floor + boon multiplier
        weapon.cooldownTimer = Math.max(def.baseCooldown * 0.15, def.baseCooldown * (weapon.multipliers?.cooldownMultiplier ?? 1.0)) * cooldownMultiplier

        // Respect MAX_PROJECTILES cap
        if (projectiles.length + newProjectiles.length >= GAME_CONFIG.MAX_PROJECTILES) continue

        const fwd = GAME_CONFIG.PROJECTILE_SPAWN_FORWARD_OFFSET
        // Story 31.2: Use per-weapon damageMultiplier
        const baseDamage = def.baseDamage * (weapon.multipliers?.damageMultiplier ?? 1.0)
        // Story 31.2: totalCritChance = weapon def crit + upgrade critBonus + boon critChance
        const totalCritChance = Math.min(1.0,
          (def.critChance ?? 0) + (weapon.multipliers?.critBonus ?? 0) + critChance
        )
        // Story 31.2: Always use def color and meshScale (upgradeVisuals removed)
        const color = def.projectileColor
        const meshScale = def.projectileMeshScale

        // Determine firing angles based on projectile pattern
        // Story 21.1: Use fireAngle (based on aimDirection or rotation)
        let angles
        if (def.projectilePattern === 'spread') {
          const spreadAngle = def.spreadAngle || 0.26
          angles = [fireAngle - spreadAngle, fireAngle, fireAngle + spreadAngle]
        } else if (def.projectilePattern === 'pellet') {
          // Shotgun: multiple pellets with randomized angles within cone
          const pelletCount = def.pelletCount || 7
          const spreadAngle = def.spreadAngle || 0.45
          angles = []
          for (let p = 0; p < pelletCount; p++) {
            angles.push(fireAngle + (Math.random() * 2 - 1) * spreadAngle)
          }
        } else if (def.projectilePattern === 'diagonals') {
          // Story 32.3: 4-projectile X burst, offsets at ±45° and ±135° from fireAngle
          angles = [
            fireAngle + Math.PI * 0.25,   // +45°
            fireAngle + Math.PI * 0.75,   // +135°
            fireAngle + Math.PI * 1.25,   // +225°
            fireAngle + Math.PI * 1.75,   // +315°
          ]
        } else {
          angles = [fireAngle]
        }

        // Story 32.3: Per-weapon pool limit — evict oldest projectiles to make room before spawning
        // Story 41.2: Use counter lookup instead of O(N) filter
        if (def.poolLimit !== undefined) {
          const weaponProjCount = _projCountByWeapon.get(weapon.weaponId) || 0
          const toEvict = weaponProjCount + angles.length - def.poolLimit
          if (toEvict > 0) {
            let evicted = 0
            for (let e = 0; e < projectiles.length && evicted < toEvict; e++) {
              if (projectiles[e].weaponId === weapon.weaponId && projectiles[e].active) {
                projectiles[e].active = false
                _projCountByWeapon.set(weapon.weaponId, (_projCountByWeapon.get(weapon.weaponId) || 0) - 1)
                evicted++
              }
            }
          }
        }

        // Determine spawn position (drone fires from offset)
        // Story 21.1: Use fireDirection for spawn offset
        let spawnX = playerPosition[0] + fireDirection[0] * fwd
        let spawnZ = playerPosition[2] + fireDirection[1] * fwd
        if (def.projectilePattern === 'drone' && def.followOffset) {
          spawnX = playerPosition[0] + def.followOffset[0]
          spawnZ = playerPosition[2] + def.followOffset[2]
        } else if (def.projectilePattern === 'orbital') {
          const radius = def.orbitalRadius || 12
          spawnX = playerPosition[0] + Math.cos(weapon.orbitalAngle || 0) * radius
          spawnZ = playerPosition[2] + Math.sin(weapon.orbitalAngle || 0) * radius
        } else if (def.projectilePattern === 'diagonals') {
          spawnX = playerPosition[0]
          spawnZ = playerPosition[2]
        }

        for (let a = 0; a < angles.length; a++) {
          if (projectiles.length + newProjectiles.length >= GAME_CONFIG.MAX_PROJECTILES) break
          const angle = angles[a]
          const dirX = Math.sin(angle)
          const dirZ = -Math.cos(angle)

          // Story 32.3: Independent crit roll per projectile (AC#1 requirement)
          let projDamage = baseDamage * damageMultiplier
          let projIsCrit = false
          if (totalCritChance > 0 && Math.random() < totalCritChance) {
            projDamage *= critMultiplier
            projIsCrit = true
          }

          const proj = {
            id: `proj_${nextProjectileId++}`,
            weaponId: weapon.weaponId,
            x: spawnX,
            z: spawnZ,
            prevX: spawnX,
            prevZ: spawnZ,
            y: GAME_CONFIG.PROJECTILE_SPAWN_Y_OFFSET,
            dirX,
            dirZ,
            speed: def.baseSpeed * projectileSpeedMultiplier,
            damage: projDamage,
            isCrit: projIsCrit,
            radius: def.projectileRadius * zoneMultiplier,
            lifetime: def.projectileLifetime,
            elapsedTime: 0,
            color,
            meshScale,
            homing: def.homing || false,
            active: true,
          }

          // Story 11.3: Piercing projectiles (Railgun)
          if (def.projectilePattern === 'piercing') {
            proj.piercing = true
            proj.pierceCount = def.pierceCount ?? 3
            proj.pierceHits = 0
          }

          // Story 11.3: Explosive projectiles
          if (def.projectilePattern === 'explosion') {
            proj.explosionRadius = def.explosionRadius || 15
            proj.explosionDamage = def.explosionDamage || def.baseDamage
          }

          newProjectiles.push(proj)
        }
      }
    }

    if (newProjectiles.length > 0) {
      // Story 41.2: Increment per-weapon counters for newly spawned projectiles
      for (let i = 0; i < newProjectiles.length; i++) {
        const wid = newProjectiles[i].weaponId
        _projCountByWeapon.set(wid, (_projCountByWeapon.get(wid) || 0) + 1)
      }
      set({ projectiles: projectiles.concat(newProjectiles) })
    }
  },

  // Story 31.2: rarity parameter kept for backward compat but no longer used for damage scaling
  addWeapon: (weaponId, _rarity = 'COMMON') => {
    const { activeWeapons } = get()
    if (activeWeapons.length >= 4) return // Max 4 weapon slots
    if (activeWeapons.some(w => w.weaponId === weaponId)) return // Already equipped
    const weapon = {
      weaponId,
      level: 1,
      cooldownTimer: 0,
      multipliers: {
        damageMultiplier: 1.0,
        areaMultiplier: 1.0,
        cooldownMultiplier: 1.0,
        knockbackMultiplier: 1.0,
        critBonus: 0,
      },
    }
    set({ activeWeapons: [...activeWeapons, weapon] })
  },

  // Story 31.2: upgradeWeapon now accepts { stat, finalMagnitude, rarity } object
  upgradeWeapon: (weaponId, upgradeResult) => {
    const { activeWeapons } = get()
    const idx = activeWeapons.findIndex(w => w.weaponId === weaponId)
    if (idx === -1) return
    const weapon = activeWeapons[idx]
    if (weapon.level >= 9) return // Max level
    const def = WEAPONS[weaponId]
    if (!def) return

    const updated = [...activeWeapons]
    const prevMultipliers = weapon.multipliers ?? { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 }
    const newMultipliers = { ...prevMultipliers }

    if (!upgradeResult) return

    const { stat, finalMagnitude, rarity } = upgradeResult
    switch (stat) {
      case 'damage':
        newMultipliers.damageMultiplier *= (1 + finalMagnitude / 100)
        break
      case 'area':
        newMultipliers.areaMultiplier *= (1 + finalMagnitude / 100)
        break
      case 'cooldown':
        newMultipliers.cooldownMultiplier *= (1 + finalMagnitude / 100)
        // Clamp: never below 15% of base cooldown (multiplier floor)
        newMultipliers.cooldownMultiplier = Math.max(0.15, newMultipliers.cooldownMultiplier)
        break
      case 'knockback':
        newMultipliers.knockbackMultiplier *= (1 + finalMagnitude / 100)
        break
      case 'crit':
        newMultipliers.critBonus += finalMagnitude / 100
        // Cap: def.critChance + critBonus ≤ 1.0
        newMultipliers.critBonus = Math.min(1.0 - (def.critChance ?? 0), newMultipliers.critBonus)
        break
      default:
        break
    }
    updated[idx] = {
      ...weapon,
      level: weapon.level + 1,
      cooldownTimer: weapon.cooldownTimer,
      multipliers: newMultipliers,
      rarity: rarity ?? weapon.rarity,
    }

    set({ activeWeapons: updated })
  },

  getEquippedWeaponIds: () => {
    return get().activeWeapons.map(w => w.weaponId)
  },

  getWeaponLevel: (weaponId) => {
    const weapon = get().activeWeapons.find(w => w.weaponId === weaponId)
    return weapon ? weapon.level : 0
  },

  cleanupInactive: () => {
    const { projectiles } = get()
    _alive.length = 0
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (p.active) {
        _alive.push(p)
      } else {
        // Story 41.2: Decrement per-weapon counter for deactivated projectiles
        const count = _projCountByWeapon.get(p.weaponId)
        if (count > 0) _projCountByWeapon.set(p.weaponId, count - 1)
      }
    }
    if (_alive.length !== projectiles.length) {
      set({ projectiles: _alive.slice() })
    }
  },

  clearProjectiles: () => {
    nextProjectileId = 0
    _projCountByWeapon.clear()
    const { activeWeapons } = get()
    set({
      projectiles: [],
      activeWeapons: activeWeapons.map(w => ({ ...w, cooldownTimer: 0 })),
    })
  },

  reset: () => {
    nextProjectileId = 0
    _projCountByWeapon.clear()
    set({ activeWeapons: [], projectiles: [] })
  },
}))

export default useWeapons
