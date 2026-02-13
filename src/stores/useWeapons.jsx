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

  tick: (delta, playerPosition, playerRotation, boonModifiers = {}) => {
    const { activeWeapons, projectiles } = get()
    const newProjectiles = []
    const { damageMultiplier = 1, cooldownMultiplier = 1, critChance = 0 } = boonModifiers

    for (let i = 0; i < activeWeapons.length; i++) {
      const weapon = activeWeapons[i]
      // Mutate cooldown in-place (no set() call) to avoid unnecessary Zustand re-renders.
      // Cooldown is internal bookkeeping — no subscriber needs to react to timer ticks.
      weapon.cooldownTimer -= delta

      if (weapon.cooldownTimer <= 0) {
        const def = WEAPONS[weapon.weaponId]
        weapon.cooldownTimer = (weapon.overrides?.cooldown ?? def.baseCooldown) * cooldownMultiplier

        // Respect MAX_PROJECTILES cap
        if (projectiles.length + newProjectiles.length >= GAME_CONFIG.MAX_PROJECTILES) continue

        const fwd = GAME_CONFIG.PROJECTILE_SPAWN_FORWARD_OFFSET
        let baseDamage = weapon.overrides?.damage ?? def.baseDamage
        let projDamage = baseDamage * damageMultiplier
        if (critChance > 0 && Math.random() < critChance) projDamage *= 2
        const color = weapon.overrides?.upgradeVisuals?.color ?? def.projectileColor
        const meshScale = weapon.overrides?.upgradeVisuals?.meshScale ?? def.projectileMeshScale

        // Determine firing angles based on projectile pattern
        let angles
        if (def.projectilePattern === 'spread') {
          const spreadAngle = def.spreadAngle || 0.26
          angles = [playerRotation - spreadAngle, playerRotation, playerRotation + spreadAngle]
        } else if (def.projectilePattern === 'pellet') {
          // Shotgun: multiple pellets with randomized angles within cone
          const pelletCount = def.pelletCount || 7
          const spreadAngle = def.spreadAngle || 0.45
          angles = []
          for (let p = 0; p < pelletCount; p++) {
            angles.push(playerRotation + (Math.random() * 2 - 1) * spreadAngle)
          }
        } else {
          angles = [playerRotation]
        }

        // Determine spawn position (drone fires from offset)
        let spawnX = playerPosition[0] + Math.sin(playerRotation) * fwd
        let spawnZ = playerPosition[2] + (-Math.cos(playerRotation)) * fwd
        if (def.projectilePattern === 'drone' && def.followOffset) {
          spawnX = playerPosition[0] + def.followOffset[0]
          spawnZ = playerPosition[2] + def.followOffset[2]
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
            speed: def.baseSpeed,
            damage: projDamage,
            radius: def.projectileRadius,
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
            proj.pierceCount = def.pierceCount || 3
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

  addWeapon: (weaponId) => {
    const { activeWeapons } = get()
    if (activeWeapons.length >= 4) return // Max 4 weapon slots
    if (activeWeapons.some(w => w.weaponId === weaponId)) return // Already equipped
    set({ activeWeapons: [...activeWeapons, { weaponId, level: 1, cooldownTimer: 0 }] })
  },

  upgradeWeapon: (weaponId) => {
    const { activeWeapons } = get()
    const idx = activeWeapons.findIndex(w => w.weaponId === weaponId)
    if (idx === -1) return
    const weapon = activeWeapons[idx]
    if (weapon.level >= 9) return // Max level
    const def = WEAPONS[weaponId]
    const upgrade = def?.upgrades?.[weapon.level - 1]
    const updated = [...activeWeapons]
    updated[idx] = { ...weapon, level: weapon.level + 1, cooldownTimer: weapon.cooldownTimer }
    // Apply gameplay-relevant overrides only; carry forward upgradeVisuals from previous threshold
    if (upgrade) {
      const newOverrides = { damage: upgrade.damage, cooldown: upgrade.cooldown }
      if (upgrade.upgradeVisuals) {
        newOverrides.upgradeVisuals = upgrade.upgradeVisuals
      } else if (weapon.overrides?.upgradeVisuals) {
        newOverrides.upgradeVisuals = weapon.overrides.upgradeVisuals
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

  reset: () => {
    nextProjectileId = 0
    set({ activeWeapons: [], projectiles: [] })
  },
}))

export default useWeapons
