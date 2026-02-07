import { create } from 'zustand'

const useWeapons = create((set, get) => ({
  // --- State ---
  activeWeapons: [],
  projectiles: [],

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta) => {
    // Frame update logic — to be implemented in Story 2.3
  },

  // --- Actions ---
  reset: () => set({ activeWeapons: [], projectiles: [] }),
}))

export default useWeapons
