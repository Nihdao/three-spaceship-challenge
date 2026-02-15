export const STORAGE_KEY_UPGRADES = 'SPACESHIP_PERMANENT_UPGRADES'

export function getPersistedUpgrades() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_UPGRADES)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // localStorage unavailable or parse error
  }
  return {}
}

export function setPersistedUpgrades(upgrades) {
  try {
    localStorage.setItem(STORAGE_KEY_UPGRADES, JSON.stringify(upgrades))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
