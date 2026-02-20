export const STORAGE_KEY_GLOBAL_STATS = 'SPACESHIP_GLOBAL_STATS'

export function getDefaultStats() {
  return {
    version: 1,
    totalKills: 0,
    totalTimeSurvived: 0,
    totalRuns: 0,
    totalFragments: 0,
    bestRun: { highestSystem: 1, longestTime: 0, mostKills: 0, highestLevel: 1 },
    weaponUsage: {},
    boonUsage: {},
  }
}

export function getPersistedGlobalStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GLOBAL_STATS)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object') {
        if (!parsed.version || parsed.version < 1) {
          return getDefaultStats()
        }
        return { ...getDefaultStats(), ...parsed }
      }
    }
  } catch {
    // localStorage unavailable or parse error
  }
  return getDefaultStats()
}

export function setPersistedGlobalStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_STATS, JSON.stringify(stats))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
