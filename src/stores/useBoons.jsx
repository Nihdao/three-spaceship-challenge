import { create } from 'zustand'
import { BOONS } from '../entities/boonDefs.js'

const DEFAULT_MODIFIERS = {
  damageMultiplier: 1, speedMultiplier: 1, cooldownMultiplier: 1, critChance: 0,
  critMultiplier: 2.0, projectileSpeedMultiplier: 1.0,
  maxHPBonus: 0, hpRegenRate: 0, damageReduction: 0,
  xpMultiplier: 1.0, fragmentMultiplier: 1.0, pickupRadiusMultiplier: 1.0,
  luckBonus: 0, // Story 22.3: Boon-contributed luck (shifts rarity probabilities)
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
  let luckBonus = 0

  for (const boon of activeBoons) {
    const def = BOONS[boon.boonId]
    if (!def) continue
    const tier = def.tiers?.[boon.level - 1]
    const effect = tier?.effect ?? def.effect
    // Story 22.3: Scale each effect by rarity bonus multiplier.
    // For ratio-based effects (mult > or < 1.0), scale the delta from 1.0 so COMMON (1.0x) is unchanged.
    // For additive effects, scale the raw value directly.
    const r = def.rarityBonusMultipliers?.[boon.rarity ?? 'COMMON'] ?? 1.0
    if (effect.damageMultiplier !== undefined) damageMultiplier *= 1 + (effect.damageMultiplier - 1) * r
    if (effect.speedMultiplier !== undefined) speedMultiplier *= 1 + (effect.speedMultiplier - 1) * r
    if (effect.cooldownMultiplier !== undefined) cooldownMultiplier *= 1 + (effect.cooldownMultiplier - 1) * r
    if (effect.critChance !== undefined) critChance += effect.critChance * r
    if (effect.critMultiplier !== undefined) critMultiplier = 2.0 + (effect.critMultiplier - 2.0) * r
    if (effect.projectileSpeedMultiplier !== undefined) projectileSpeedMultiplier *= 1 + (effect.projectileSpeedMultiplier - 1) * r
    if (effect.maxHPBonus !== undefined) maxHPBonus += effect.maxHPBonus * r
    if (effect.hpRegenRate !== undefined) hpRegenRate += effect.hpRegenRate * r
    if (effect.damageReduction !== undefined) damageReduction = Math.max(damageReduction, effect.damageReduction * r)
    if (effect.xpMultiplier !== undefined) xpMultiplier *= 1 + (effect.xpMultiplier - 1) * r
    if (effect.fragmentMultiplier !== undefined) fragmentMultiplier *= 1 + (effect.fragmentMultiplier - 1) * r
    if (effect.pickupRadiusMultiplier !== undefined) pickupRadiusMultiplier *= 1 + (effect.pickupRadiusMultiplier - 1) * r
    if (effect.luckBonus !== undefined) luckBonus += effect.luckBonus * r
  }

  critChance = Math.min(critChance, 1.0)
  return {
    damageMultiplier, speedMultiplier, cooldownMultiplier, critChance,
    critMultiplier, projectileSpeedMultiplier,
    maxHPBonus, hpRegenRate, damageReduction,
    xpMultiplier, fragmentMultiplier, pickupRadiusMultiplier,
    luckBonus,
  }
}

const useBoons = create((set, get) => ({
  // --- State ---
  activeBoons: [],
  modifiers: { ...DEFAULT_MODIFIERS },

  // --- Actions ---
  addBoon: (boonId, rarity = 'COMMON') => {
    const { activeBoons } = get()
    if (activeBoons.length >= 3) return // Max 3 boon slots
    if (activeBoons.some(b => b.boonId === boonId)) return // Already equipped
    // Story 22.3: Store rarity for reference; rarity bonus multiplier is applied to stat preview only
    // (modifier values stay as-is; rarity scaling is reflected in statPreview text)
    const newBoons = [...activeBoons, { boonId, level: 1, rarity }]
    set({ activeBoons: newBoons, modifiers: computeFromBoons(newBoons) })
  },

  upgradeBoon: (boonId, rarity = 'COMMON') => {
    const { activeBoons } = get()
    const idx = activeBoons.findIndex(b => b.boonId === boonId)
    if (idx === -1) return
    const def = BOONS[boonId]
    if (!def) return
    const boon = activeBoons[idx]
    if (boon.level >= (def.maxLevel || 1)) return
    const updated = [...activeBoons]
    // Each upgrade's rarity is independent — use the passed rarity for this upgrade
    updated[idx] = { ...boon, level: boon.level + 1, rarity }
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
