import { create } from 'zustand'

const usePlayer = create((set, get) => ({
  // --- State ---
  position: [0, 0, 0],
  currentHP: 100,
  maxHP: 100,
  isInvulnerable: false,

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta, input) => {
    // Frame update logic — to be implemented in Story 1.2
  },

  // --- Actions ---
  reset: () => set({
    position: [0, 0, 0],
    currentHP: 100,
    maxHP: 100,
    isInvulnerable: false,
  }),
}))

export default usePlayer
