import { create } from 'zustand'
import { WEAPONS } from '../entities/weaponDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

let nextProjectileId = 0

const useWeapons = create((set, get) => ({
  // --- State ---
  activeWeapons: [],
  projectiles: [],

  // --- Actions ---

  initializeWeapons: () => {
    nextProjectileId = 0
    set({
      activeWeapons: [{ weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0 }],
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

      // Mutate cooldown in-place (no set() call) to avoid unnecessary Zustand re-renders.
      // Cooldown is internal bookkeeping — no subscriber needs to react to timer ticks.
      weapon.cooldownTimer -= delta

      if (weapon.cooldownTimer <= 0) {
        weapon.cooldownTimer = (weapon.overrides?.cooldown ?? def.baseCooldown) * cooldownMultiplier

        // Respect MAX_PROJECTILES cap
        if (projectiles.length + newProjectiles.length >= GAME_CONFIG.MAX_PROJECTILES) continue

        const fwd = GAME_CONFIG.PROJECTILE_SPAWN_FORWARD_OFFSET
        let baseDamage = weapon.overrides?.damage ?? def.baseDamage
        let projDamage = baseDamage * damageMultiplier
        if (critChance > 0 && Math.random() < critChance) projDamage *= critMultiplier
        const color = weapon.overrides?.upgradeVisuals?.color ?? def.projectileColor
        const meshScale = weapon.overrides?.upgradeVisuals?.meshScale ?? def.projectileMeshScale

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
        } else {
          angles = [fireAngle]
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
        }

        for (let a = 0; a < angles.length; a++) {
          if (projectiles.length + newProjectiles.length >= GAME_CONFIG.MAX_PROJECTILES) break
          const angle = angles[a]
          const dirX = Math.sin(angle)
          const dirZ = -Math.cos(angle)

          const proj = {
            id: `proj_${nextProjectileId++}`,
            weaponId: weapon.weaponId,
            x: spawnX,
            z: spawnZ,
            y: GAME_CONFIG.PROJECTILE_SPAWN_Y_OFFSET,
            dirX,
            dirZ,
            speed: def.baseSpeed * projectileSpeedMultiplier,
            damage: projDamage,
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
            proj.pierceCount = weapon.overrides?.pierceCount ?? def.pierceCount ?? 3
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
      set({ projectiles: projectiles.concat(newProjectiles) })
    }
  },

  addWeapon: (weaponId, rarity = 'COMMON') => {
    const { activeWeapons } = get()
    if (activeWeapons.length >= 4) return // Max 4 weapon slots
    if (activeWeapons.some(w => w.weaponId === weaponId)) return // Already equipped
    const def = WEAPONS[weaponId]
    // Story 22.3: Apply rarity damage multiplier to baseDamage at add time
    const rarityMultiplier = def?.rarityDamageMultipliers?.[rarity] ?? 1.0
    const weapon = { weaponId, level: 1, cooldownTimer: 0, rarity }
    if (rarityMultiplier !== 1.0 && def?.baseDamage) {
      weapon.overrides = { damage: Math.round(def.baseDamage * rarityMultiplier) }
    }
    set({ activeWeapons: [...activeWeapons, weapon] })
  },

  upgradeWeapon: (weaponId, rarity = 'COMMON') => {
    const { activeWeapons } = get()
    const idx = activeWeapons.findIndex(w => w.weaponId === weaponId)
    if (idx === -1) return
    const weapon = activeWeapons[idx]
    if (weapon.level >= 9) return // Max level
    const def = WEAPONS[weaponId]
    const upgrade = def?.upgrades?.[weapon.level - 1]
    const updated = [...activeWeapons]
    // Each upgrade's rarity is independent — use the passed rarity for this upgrade's damage scaling
    updated[idx] = { ...weapon, level: weapon.level + 1, cooldownTimer: weapon.cooldownTimer, rarity }
    // Apply gameplay-relevant overrides only; carry forward upgradeVisuals from previous threshold
    if (upgrade) {
      // Story 22.3: Apply rarity damage multiplier to upgrade damage
      const rarityMultiplier = def?.rarityDamageMultipliers?.[rarity] ?? 1.0
      const newOverrides = {
        damage: Math.round(upgrade.damage * rarityMultiplier),
        cooldown: upgrade.cooldown,
      }
      if (upgrade.upgradeVisuals) {
        newOverrides.upgradeVisuals = upgrade.upgradeVisuals
      } else if (weapon.overrides?.upgradeVisuals) {
        newOverrides.upgradeVisuals = weapon.overrides.upgradeVisuals
      }
      // Story 11.3: Propagate pierceCount from upgrades (e.g., Railgun level 9)
      if (upgrade.pierceCount !== undefined) {
        newOverrides.pierceCount = upgrade.pierceCount
      } else if (weapon.overrides?.pierceCount !== undefined) {
        newOverrides.pierceCount = weapon.overrides.pierceCount
      }
      updated[idx].overrides = newOverrides
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
    const alive = projectiles.filter((p) => p.active)
    if (alive.length !== projectiles.length) {
      set({ projectiles: alive })
    }
  },

  clearProjectiles: () => {
    nextProjectileId = 0
    const { activeWeapons } = get()
    set({
      projectiles: [],
      activeWeapons: activeWeapons.map(w => ({ ...w, cooldownTimer: 0 })),
    })
  },

  reset: () => {
    nextProjectileId = 0
    set({ activeWeapons: [], projectiles: [] })
  },
}))

export default useWeapons
