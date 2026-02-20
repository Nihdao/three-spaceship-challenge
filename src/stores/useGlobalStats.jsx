import { create } from 'zustand'
import { getDefaultStats, getPersistedGlobalStats, setPersistedGlobalStats } from '../utils/globalStatsStorage.js'

const useGlobalStats = create((set, get) => ({
  // --- State (loaded from localStorage on init) ---
  ...getPersistedGlobalStats(),

  // --- Actions ---
  recordRunEnd: (runData) => {
    const state = get()

    const newTotalKills = state.totalKills + runData.kills
    const newTotalTime = state.totalTimeSurvived + runData.timeSurvived
    const newTotalRuns = state.totalRuns + 1
    const newTotalFragments = state.totalFragments + runData.fragments

    const newBestRun = { ...state.bestRun }
    if (runData.systemsReached > newBestRun.highestSystem) {
      newBestRun.highestSystem = runData.systemsReached
    }
    if (runData.timeSurvived > newBestRun.longestTime) {
      newBestRun.longestTime = runData.timeSurvived
    }
    if (runData.kills > newBestRun.mostKills) {
      newBestRun.mostKills = runData.kills
    }
    if (runData.level > newBestRun.highestLevel) {
      newBestRun.highestLevel = runData.level
    }

    const newWeaponUsage = { ...state.weaponUsage }
    for (const weaponId of runData.weaponsUsed) {
      newWeaponUsage[weaponId] = (newWeaponUsage[weaponId] || 0) + 1
    }

    const newBoonUsage = { ...state.boonUsage }
    for (const boonId of runData.boonsUsed) {
      newBoonUsage[boonId] = (newBoonUsage[boonId] || 0) + 1
    }

    const newState = {
      version: 1,
      totalKills: newTotalKills,
      totalTimeSurvived: newTotalTime,
      totalRuns: newTotalRuns,
      totalFragments: newTotalFragments,
      bestRun: newBestRun,
      weaponUsage: newWeaponUsage,
      boonUsage: newBoonUsage,
    }

    set(newState)
    setPersistedGlobalStats(newState)
  },

  // Load state from localStorage (useful for testing and forcing a reload)
  loadFromStorage: () => {
    const loaded = getPersistedGlobalStats()
    set(loaded)
  },

  // --- Computed Getters ---
  getTopWeapons: (n = 5) => {
    const { weaponUsage } = get()
    const entries = Object.entries(weaponUsage)
    entries.sort((a, b) => b[1] - a[1])
    return entries.slice(0, n).map(([id, count]) => ({ weaponId: id, runCount: count }))
  },

  getTopBoons: (n = 5) => {
    const { boonUsage } = get()
    const entries = Object.entries(boonUsage)
    entries.sort((a, b) => b[1] - a[1])
    return entries.slice(0, n).map(([id, count]) => ({ boonId: id, runCount: count }))
  },

  getBestRun: () => get().bestRun,

  getCareerStats: () => {
    const { totalKills, totalTimeSurvived, totalRuns, totalFragments } = get()
    return { totalKills, totalTimeSurvived, totalRuns, totalFragments }
  },

  // --- Reset (for testing or factory reset) ---
  reset: () => {
    const defaultStats = getDefaultStats()
    set(defaultStats)
    setPersistedGlobalStats(defaultStats)
  },
}))

export default useGlobalStats
