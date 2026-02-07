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

  tick: (delta, playerPosition, playerRotation) => {
    const { activeWeapons, projectiles } = get()
    const newProjectiles = []

    for (let i = 0; i < activeWeapons.length; i++) {
      const weapon = activeWeapons[i]
      // Mutate cooldown in-place (no set() call) to avoid unnecessary Zustand re-renders.
      // Cooldown is internal bookkeeping — no subscriber needs to react to timer ticks.
      weapon.cooldownTimer -= delta

      if (weapon.cooldownTimer <= 0) {
        const def = WEAPONS[weapon.weaponId]
        weapon.cooldownTimer = def.baseCooldown

        // Respect MAX_PROJECTILES cap
        if (projectiles.length + newProjectiles.length >= GAME_CONFIG.MAX_PROJECTILES) continue

        newProjectiles.push({
          id: `proj_${nextProjectileId++}`,
          weaponId: weapon.weaponId,
          x: playerPosition[0],
          z: playerPosition[2],
          dirX: Math.sin(playerRotation),
          dirZ: -Math.cos(playerRotation),
          speed: def.baseSpeed,
          damage: def.baseDamage,
          radius: def.projectileRadius,
          lifetime: def.projectileLifetime,
          elapsedTime: 0,
          color: def.projectileColor,
          meshScale: def.projectileMeshScale,
          active: true,
        })
      }
    }

    if (newProjectiles.length > 0) {
      set({ projectiles: projectiles.concat(newProjectiles) })
    }
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
