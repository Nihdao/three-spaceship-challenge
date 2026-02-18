// Storage key for the new combined progression format (Story 25.2).
// Stores both shipLevels and selectedSkins as a single JSON object.
export const STORAGE_KEY_SHIP_PROGRESSION = 'SPACESHIP_SHIP_PROGRESSION'

// Legacy key from Story 25.1 — kept for migration purposes only.
export const STORAGE_KEY_SHIP_LEVELS = 'SPACESHIP_SHIP_LEVELS'

const DEFAULT_SHIP_LEVELS = { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 }
const DEFAULT_SELECTED_SKINS = { BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' }

export function getPersistedShipProgression() {
  try {
    // Try new combined format first
    const stored = localStorage.getItem(STORAGE_KEY_SHIP_PROGRESSION)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          shipLevels: parsed.shipLevels || { ...DEFAULT_SHIP_LEVELS },
          selectedSkins: parsed.selectedSkins || { ...DEFAULT_SELECTED_SKINS },
        }
      }
    }

    // Migrate from old format (Story 25.1 key, flat { BALANCED: 1, ... } object)
    const legacy = localStorage.getItem(STORAGE_KEY_SHIP_LEVELS)
    if (legacy !== null) {
      const parsed = JSON.parse(legacy)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          shipLevels: parsed,
          selectedSkins: { ...DEFAULT_SELECTED_SKINS },
        }
      }
    }
  } catch {
    // localStorage unavailable or parse error
  }

  return {
    shipLevels: { ...DEFAULT_SHIP_LEVELS },
    selectedSkins: { ...DEFAULT_SELECTED_SKINS },
  }
}

export function setPersistedShipProgression(data) {
  try {
    localStorage.setItem(STORAGE_KEY_SHIP_PROGRESSION, JSON.stringify(data))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
