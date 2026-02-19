import { create } from 'zustand'

const STORAGE_KEY = 'armory-discovery'

function loadDiscoveryState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { weapons: new Set(), boons: new Set() }
    const parsed = JSON.parse(saved)
    return {
      weapons: new Set(parsed.weapons || []),
      boons: new Set(parsed.boons || []),
    }
  } catch {
    return { weapons: new Set(), boons: new Set() }
  }
}

function saveDiscoveryState(discovered) {
  try {
    const data = {
      weapons: Array.from(discovered.weapons),
      boons: Array.from(discovered.boons),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

const useArmory = create((set, get) => ({
  // State
  discovered: loadDiscoveryState(),

  // Actions
  markDiscovered: (type, id) => {
    const current = get().discovered
    if (current[type]?.has(id)) return // Already discovered — no state update needed
    const newDiscovered = {
      ...current,
      [type]: new Set([...current[type], id]),
    }
    saveDiscoveryState(newDiscovered)
    set({ discovered: newDiscovered })
  },

  isDiscovered: (type, id) => {
    return get().discovered[type]?.has(id) ?? false
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    set({ discovered: { weapons: new Set(), boons: new Set() } })
  },
}))

export default useArmory
