import { create } from 'zustand'

const useBoons = create((set, get) => ({
  // --- State ---
  activeBoons: [],
  modifiers: {},

  // --- Actions ---
  computeModifiers: () => {
    // Recompute aggregate modifiers from activeBoons — to be implemented in Story 3.4
  },

  reset: () => set({ activeBoons: [], modifiers: {} }),
}))

export default useBoons
