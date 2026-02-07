import { create } from 'zustand'

const useEnemies = create((set, get) => ({
  // --- State ---
  enemies: [],
  count: 0,

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta) => {
    // Frame update logic — to be implemented in Story 2.2
  },

  // --- Actions ---
  reset: () => set({ enemies: [], count: 0 }),
}))

export default useEnemies
