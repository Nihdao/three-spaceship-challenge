import { create } from 'zustand'
import { getPersistedShipProgression, setPersistedShipProgression } from '../utils/shipProgressionStorage.js'
import { SHIP_LEVEL_COSTS, SHIP_LEVEL_SCALING, MAX_SHIP_LEVEL } from '../entities/shipProgressionDefs.js'
import { SHIPS } from '../entities/shipDefs.js'
import { SHIP_SKINS } from '../entities/shipSkinDefs.js'
import usePlayer from './usePlayer.jsx'

const DEFAULT_SHIP_LEVELS = { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 }
const DEFAULT_SELECTED_SKINS = { BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' }

const _persisted = getPersistedShipProgression()

const useShipProgression = create((set, get) => ({
  // --- State ---
  shipLevels: _persisted.shipLevels,
  selectedSkins: _persisted.selectedSkins, // { BALANCED: 'default', ... }

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
    // Persist BOTH shipLevels AND selectedSkins to avoid data loss
    setPersistedShipProgression({ shipLevels: newLevels, selectedSkins: state.selectedSkins })
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

  // --- Skin Selection Actions (Story 25.2) ---

  // Set the selected skin for a ship. Returns false if skin is locked.
  setSelectedSkin: (shipId, skinId) => {
    const state = get()
    const availableSkins = state.getAvailableSkins(shipId)
    const skin = availableSkins.find(s => s.id === skinId)

    if (!skin || skin.locked) return false

    const newSelectedSkins = { ...state.selectedSkins, [shipId]: skinId }
    set({ selectedSkins: newSelectedSkins })
    setPersistedShipProgression({ shipLevels: state.shipLevels, selectedSkins: newSelectedSkins })
    return true
  },

  // Returns the selected skin ID for a ship (defaults to 'default').
  getSelectedSkin: (shipId) => {
    return get().selectedSkins[shipId] || 'default'
  },

  // Returns all skins for a ship with locked/unlocked status based on current ship level.
  getAvailableSkins: (shipId) => {
    const state = get()
    const currentLevel = state.shipLevels[shipId] || 1
    const skins = SHIP_SKINS[shipId] || []

    return skins.map(skin => ({
      ...skin,
      locked: skin.requiredLevel > currentLevel,
    }))
  },

  // Resets all ship levels to 1 and skin selections to default. Clears localStorage.
  reset: () => {
    const defaultLevels = { ...DEFAULT_SHIP_LEVELS }
    const defaultSkins = { ...DEFAULT_SELECTED_SKINS }
    set({ shipLevels: defaultLevels, selectedSkins: defaultSkins })
    setPersistedShipProgression({ shipLevels: defaultLevels, selectedSkins: defaultSkins })
  },
}))

export default useShipProgression
