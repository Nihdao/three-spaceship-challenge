import { create } from 'zustand'
import { getPersistedShipLevels, setPersistedShipLevels } from '../utils/shipProgressionStorage.js'
import { SHIP_LEVEL_COSTS, SHIP_LEVEL_SCALING, MAX_SHIP_LEVEL } from '../entities/shipProgressionDefs.js'
import { SHIPS } from '../entities/shipDefs.js'
import usePlayer from './usePlayer.jsx'

const DEFAULT_SHIP_LEVELS = { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 }

const useShipProgression = create((set, get) => ({
  // --- State ---
  shipLevels: getPersistedShipLevels(),

  // --- Actions ---

  // Attempt to level up a ship. Returns true on success, false if blocked.
  // Prerequisites: level < MAX_SHIP_LEVEL AND player has enough fragments.
  levelUpShip: (shipId) => {
    const state = get()
    const currentLevel = state.shipLevels[shipId] || 1

    if (currentLevel >= MAX_SHIP_LEVEL) return false

    const cost = SHIP_LEVEL_COSTS[currentLevel - 1]
    if (cost === undefined) return false

    const playerStore = usePlayer.getState()
    if (playerStore.fragments < cost) return false

    playerStore.addFragments(-cost)

    const newLevels = { ...state.shipLevels, [shipId]: currentLevel + 1 }
    set({ shipLevels: newLevels })
    setPersistedShipLevels(newLevels)
    return true
  },

  getShipLevel: (shipId) => {
    return get().shipLevels[shipId] || 1
  },

  // Returns the Fragment cost to reach the next level, or null if already at max.
  getNextLevelCost: (shipId) => {
    const currentLevel = get().shipLevels[shipId] || 1
    if (currentLevel >= MAX_SHIP_LEVEL) return null
    return SHIP_LEVEL_COSTS[currentLevel - 1]
  },

  // Returns the stat multiplier for a given ship at its current (or specified) level.
  // Uses the ship's own levelScaling from shipDefs.js (falls back to SHIP_LEVEL_SCALING).
  // Level 1 = 1.00x, Level 9 = 1.24x (at 0.03 scaling).
  getShipStatMultiplier: (shipId, level = null) => {
    const shipLevel = level !== null ? level : (get().shipLevels[shipId] || 1)
    const scaling = SHIPS[shipId]?.levelScaling ?? SHIP_LEVEL_SCALING
    return 1 + (shipLevel - 1) * scaling
  },

  // Resets all ship levels to 1 and clears localStorage (debugging only).
  reset: () => {
    const defaultLevels = { ...DEFAULT_SHIP_LEVELS }
    set({ shipLevels: defaultLevels })
    setPersistedShipLevels(defaultLevels)
  },
}))

export default useShipProgression
