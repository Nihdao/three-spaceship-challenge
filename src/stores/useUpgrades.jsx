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
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0, magnet: 1.0, luck: 0.0, expBonus: 1.0, curse: 0.0, revival: 0, reroll: 0, skip: 0, banish: 0 }

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
        else if (upgradeId === 'MAGNET') bonuses.magnet += levelDef.bonus
        else if (upgradeId === 'LUCK') bonuses.luck += levelDef.bonus
        else if (upgradeId === 'EXP_BONUS') bonuses.expBonus += levelDef.bonus
        else if (upgradeId === 'CURSE') bonuses.curse += levelDef.bonus
        else if (upgradeId === 'REVIVAL') bonuses.revival += levelDef.bonus
        else if (upgradeId === 'REROLL') bonuses.reroll += levelDef.bonus
        else if (upgradeId === 'SKIP') bonuses.skip += levelDef.bonus
        else if (upgradeId === 'BANISH') bonuses.banish += levelDef.bonus
      }
    }

    return bonuses
  },

  /**
   * Refunds all spent Fragments and resets all upgrades to level 0.
   * Persists changes immediately to localStorage.
   * @returns {void}
   */
  refundAll: () => {
    const state = get()
    const totalSpent = state.getTotalFragmentsSpent()

    set({ upgradeLevels: {} })
    setPersistedUpgrades({})

    usePlayer.getState().addFragments(totalSpent)
  },

  reset: () => {
    set({ upgradeLevels: {} })
    setPersistedUpgrades({})
  },
}))

export default useUpgrades
