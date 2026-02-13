import { create } from 'zustand'
import { BOONS } from '../entities/boonDefs.js'

const DEFAULT_MODIFIERS = {
  damageMultiplier: 1, speedMultiplier: 1, cooldownMultiplier: 1, critChance: 0,
  critMultiplier: 2.0, projectileSpeedMultiplier: 1.0,
  maxHPBonus: 0, hpRegenRate: 0, damageReduction: 0,
  xpMultiplier: 1.0, fragmentMultiplier: 1.0, pickupRadiusMultiplier: 1.0,
}

// Pure function: compute modifiers from a boons array (avoids double set() in add/upgrade)
function computeFromBoons(activeBoons) {
  let damageMultiplier = 1.0
  let speedMultiplier = 1.0
  let cooldownMultiplier = 1.0
  let critChance = 0.0
  let critMultiplier = 2.0
  let projectileSpeedMultiplier = 1.0
  let maxHPBonus = 0
  let hpRegenRate = 0
  let damageReduction = 0
  let xpMultiplier = 1.0
  let fragmentMultiplier = 1.0
  let pickupRadiusMultiplier = 1.0

  for (const boon of activeBoons) {
    const def = BOONS[boon.boonId]
    if (!def) continue
    const tier = def.tiers?.[boon.level - 1]
    const effect = tier?.effect ?? def.effect
    if (effect.damageMultiplier !== undefined) damageMultiplier *= effect.damageMultiplier
    if (effect.speedMultiplier !== undefined) speedMultiplier *= effect.speedMultiplier
    if (effect.cooldownMultiplier !== undefined) cooldownMultiplier *= effect.cooldownMultiplier
    if (effect.critChance !== undefined) critChance += effect.critChance
    if (effect.critMultiplier !== undefined) critMultiplier = effect.critMultiplier
    if (effect.projectileSpeedMultiplier !== undefined) projectileSpeedMultiplier *= effect.projectileSpeedMultiplier
    if (effect.maxHPBonus !== undefined) maxHPBonus += effect.maxHPBonus
    if (effect.hpRegenRate !== undefined) hpRegenRate += effect.hpRegenRate
    if (effect.damageReduction !== undefined) damageReduction = Math.max(damageReduction, effect.damageReduction)
    if (effect.xpMultiplier !== undefined) xpMultiplier *= effect.xpMultiplier
    if (effect.fragmentMultiplier !== undefined) fragmentMultiplier *= effect.fragmentMultiplier
    if (effect.pickupRadiusMultiplier !== undefined) pickupRadiusMultiplier *= effect.pickupRadiusMultiplier
  }

  critChance = Math.min(critChance, 1.0)
  return {
    damageMultiplier, speedMultiplier, cooldownMultiplier, critChance,
    critMultiplier, projectileSpeedMultiplier,
    maxHPBonus, hpRegenRate, damageReduction,
    xpMultiplier, fragmentMultiplier, pickupRadiusMultiplier,
  }
}

const useBoons = create((set, get) => ({
  // --- State ---
  activeBoons: [],
  modifiers: { ...DEFAULT_MODIFIERS },

  // --- Actions ---
  addBoon: (boonId) => {
    const { activeBoons } = get()
    if (activeBoons.length >= 3) return // Max 3 boon slots
    if (activeBoons.some(b => b.boonId === boonId)) return // Already equipped
    const newBoons = [...activeBoons, { boonId, level: 1 }]
    set({ activeBoons: newBoons, modifiers: computeFromBoons(newBoons) })
  },

  upgradeBoon: (boonId) => {
    const { activeBoons } = get()
    const idx = activeBoons.findIndex(b => b.boonId === boonId)
    if (idx === -1) return
    const def = BOONS[boonId]
    if (!def) return
    const boon = activeBoons[idx]
    if (boon.level >= (def.maxLevel || 1)) return
    const updated = [...activeBoons]
    updated[idx] = { ...boon, level: boon.level + 1 }
    set({ activeBoons: updated, modifiers: computeFromBoons(updated) })
  },

  getEquippedBoonIds: () => {
    return get().activeBoons.map(b => b.boonId)
  },

  getEquippedBoons: () => {
    return get().activeBoons.map(b => ({ boonId: b.boonId, level: b.level }))
  },

  computeModifiers: () => {
    set({ modifiers: computeFromBoons(get().activeBoons) })
  },

  reset: () => set({
    activeBoons: [],
    modifiers: { ...DEFAULT_MODIFIERS },
  }),
}))

export default useBoons
