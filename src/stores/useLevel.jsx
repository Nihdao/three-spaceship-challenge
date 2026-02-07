import { create } from 'zustand'

const useLevel = create((set, get) => ({
  // --- State ---
  systemTimer: 0,
  difficulty: 1,
  planets: [],
  wormholeState: 'hidden', // 'hidden' | 'visible' | 'active'

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta) => {
    // Frame update logic — to be implemented in future stories
  },

  // --- Actions ---
  reset: () => set({
    systemTimer: 0,
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
  }),
}))

export default useLevel
