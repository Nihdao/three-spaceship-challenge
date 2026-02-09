import { create } from 'zustand'
import { BOONS } from '../entities/boonDefs.js'

const useBoons = create((set, get) => ({
  // --- State ---
  activeBoons: [],
  modifiers: { damageMultiplier: 1, speedMultiplier: 1, cooldownMultiplier: 1, critChance: 0 },

  // --- Actions ---
  addBoon: (boonId) => {
    const { activeBoons } = get()
    if (activeBoons.length >= 3) return // Max 3 boon slots
    if (activeBoons.some(b => b.boonId === boonId)) return // Already equipped
    set({ activeBoons: [...activeBoons, { boonId, level: 1 }] })
    get().computeModifiers()
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
    set({ activeBoons: updated })
    get().computeModifiers()
  },

  getEquippedBoonIds: () => {
    return get().activeBoons.map(b => b.boonId)
  },

  getEquippedBoons: () => {
    return get().activeBoons.map(b => ({ boonId: b.boonId, level: b.level }))
  },

  computeModifiers: () => {
    const { activeBoons } = get()
    let damageMultiplier = 1.0
    let speedMultiplier = 1.0
    let cooldownMultiplier = 1.0
    let critChance = 0.0

    for (const boon of activeBoons) {
      const def = BOONS[boon.boonId]
      if (!def) continue
      const tier = def.tiers?.[boon.level - 1]
      const effect = tier?.effect ?? def.effect
      if (effect.damageMultiplier) damageMultiplier *= effect.damageMultiplier
      if (effect.speedMultiplier) speedMultiplier *= effect.speedMultiplier
      if (effect.cooldownMultiplier) cooldownMultiplier *= effect.cooldownMultiplier
      if (effect.critChance) critChance += effect.critChance
    }

    critChance = Math.min(critChance, 1.0)
    set({ modifiers: { damageMultiplier, speedMultiplier, cooldownMultiplier, critChance } })
  },

  reset: () => set({
    activeBoons: [],
    modifiers: { damageMultiplier: 1, speedMultiplier: 1, cooldownMultiplier: 1, critChance: 0 },
  }),
}))

export default useBoons
