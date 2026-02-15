import { create } from 'zustand'
import { getPersistedUpgrades, setPersistedUpgrades } from '../utils/upgradesStorage.js'
import { PERMANENT_UPGRADES } from '../entities/permanentUpgradesDefs.js'
import usePlayer from './usePlayer.jsx'

const useUpgrades = create((set, get) => ({
  // --- State ---
  upgradeLevels: getPersistedUpgrades(),

  // --- Actions ---
  purchaseUpgrade: (upgradeId) => {
    const state = get()
    const upgradeDef = PERMANENT_UPGRADES[upgradeId]
    if (!upgradeDef) return false

    const currentLevel = state.upgradeLevels[upgradeId] || 0
    if (currentLevel >= upgradeDef.maxLevel) return false

    const nextLevelDef = upgradeDef.levels[currentLevel]
    if (!nextLevelDef) return false

    const playerState = usePlayer.getState()
    if (playerState.fragments < nextLevelDef.cost) return false

    playerState.addFragments(-nextLevelDef.cost)

    const newLevels = { ...state.upgradeLevels, [upgradeId]: currentLevel + 1 }
    set({ upgradeLevels: newLevels })
    setPersistedUpgrades(newLevels)
    return true
  },

  getUpgradeLevel: (upgradeId) => {
    return get().upgradeLevels[upgradeId] || 0
  },

  getTotalFragmentsSpent: () => {
    const state = get()
    let total = 0
    for (const [upgradeId, level] of Object.entries(state.upgradeLevels)) {
      const upgradeDef = PERMANENT_UPGRADES[upgradeId]
      if (!upgradeDef) continue
      for (let i = 0; i < level; i++) {
        if (upgradeDef.levels[i]) total += upgradeDef.levels[i].cost
      }
    }
    return total
  },

  getComputedBonuses: () => {
    const state = get()
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0 }

    for (const [upgradeId, level] of Object.entries(state.upgradeLevels)) {
      const upgradeDef = PERMANENT_UPGRADES[upgradeId]
      if (!upgradeDef) continue
      for (let i = 0; i < level; i++) {
        const levelDef = upgradeDef.levels[i]
        if (!levelDef) continue
        if (upgradeId === 'ATTACK_POWER') bonuses.attackPower += levelDef.bonus
        else if (upgradeId === 'ARMOR') bonuses.armor += levelDef.bonus
        else if (upgradeId === 'MAX_HP') bonuses.maxHP += levelDef.bonus
        else if (upgradeId === 'REGEN') bonuses.regen += levelDef.bonus
        else if (upgradeId === 'ATTACK_SPEED') bonuses.attackSpeed -= levelDef.bonus
        else if (upgradeId === 'ZONE') bonuses.zone += levelDef.bonus
      }
    }

    return bonuses
  },

  reset: () => {
    set({ upgradeLevels: {} })
    setPersistedUpgrades({})
  },
}))

export default useUpgrades
