export const STORAGE_KEY_SHIP_LEVELS = 'SPACESHIP_SHIP_LEVELS'

const DEFAULT_SHIP_LEVELS = { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 }

export function getPersistedShipLevels() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SHIP_LEVELS)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // localStorage unavailable or parse error
  }
  return { ...DEFAULT_SHIP_LEVELS }
}

export function setPersistedShipLevels(shipLevels) {
  try {
    localStorage.setItem(STORAGE_KEY_SHIP_LEVELS, JSON.stringify(shipLevels))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
