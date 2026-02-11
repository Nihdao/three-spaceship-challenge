import { create } from 'zustand'
import { PLANETS } from '../entities/planetDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

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
  initializePlanets: () => {
    const planets = []
    const margin = GAME_CONFIG.PLANET_PLACEMENT_MARGIN
    const minCenter = GAME_CONFIG.PLANET_MIN_DISTANCE_FROM_CENTER
    const minBetween = GAME_CONFIG.PLANET_MIN_DISTANCE_BETWEEN
    const range = GAME_CONFIG.PLAY_AREA_SIZE - margin

    const tiers = [
      { typeId: 'PLANET_SILVER', count: GAME_CONFIG.PLANET_COUNT_SILVER },
      { typeId: 'PLANET_GOLD', count: GAME_CONFIG.PLANET_COUNT_GOLD },
      { typeId: 'PLANET_PLATINUM', count: GAME_CONFIG.PLANET_COUNT_PLATINUM },
    ]

    for (const { typeId, count } of tiers) {
      const def = PLANETS[typeId]
      for (let i = 0; i < count; i++) {
        let x, z, valid
        let attempts = 0
        do {
          x = (Math.random() * 2 - 1) * range
          z = (Math.random() * 2 - 1) * range
          const distFromCenter = Math.sqrt(x * x + z * z)
          valid = distFromCenter >= minCenter
          if (valid) {
            for (const p of planets) {
              const dx = p.x - x, dz = p.z - z
              if (Math.sqrt(dx * dx + dz * dz) < minBetween) {
                valid = false
                break
              }
            }
          }
          attempts++
        } while (!valid && attempts < 50)

        if (attempts >= 50) {
          console.warn(`Planet placement: ${typeId}_${i} placed after 50 failed attempts (constraints may be violated)`)
        }

        planets.push({
          id: `${typeId}_${i}`,
          typeId,
          tier: def.tier,
          x, z,
          scanned: false,
          scanProgress: 0,
        })
      }
    }
    set({ planets })
  },

  reset: () => set({
    systemTimer: 0,
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
  }),
}))

export default useLevel
