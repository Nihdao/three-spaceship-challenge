import { create } from 'zustand'
import { PLANETS } from '../entities/planetDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const useLevel = create((set, get) => ({
  // --- State ---
  systemTimer: 0,
  difficulty: 1,
  planets: [],
  wormholeState: 'hidden', // 'hidden' | 'visible' | 'active'
  activeScanPlanetId: null,

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta) => {
    // Frame update logic — to be implemented in future stories
  },

  // --- Planet Scanning (Story 5.3) ---
  scanningTick: (delta, playerX, playerZ) => {
    const { planets, activeScanPlanetId } = get()
    let closestUnscanPlanet = null
    let closestDist = Infinity

    // Find closest unscanned planet in range
    for (const planet of planets) {
      if (planet.scanned) continue
      const dx = playerX - planet.x
      const dz = playerZ - planet.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const scanRadius = PLANETS[planet.typeId].scanRadius
      if (dist <= scanRadius && dist < closestDist) {
        closestUnscanPlanet = planet
        closestDist = dist
      }
    }

    if (closestUnscanPlanet) {
      const switchedPlanet = activeScanPlanetId && activeScanPlanetId !== closestUnscanPlanet.id
      const scanTime = PLANETS[closestUnscanPlanet.typeId].scanTime
      const newProgress = closestUnscanPlanet.scanProgress + (delta / scanTime)

      if (newProgress >= 1.0) {
        // Scan complete
        const updatedPlanets = planets.map(p => {
          if (p.id === closestUnscanPlanet.id) return { ...p, scanned: true, scanProgress: 1 }
          if (switchedPlanet && p.id === activeScanPlanetId) return { ...p, scanProgress: 0 }
          return p
        })
        set({ planets: updatedPlanets, activeScanPlanetId: null })
        return { completed: true, planetId: closestUnscanPlanet.id, tier: closestUnscanPlanet.tier }
      }

      // Scan in progress
      const updatedPlanets = planets.map(p => {
        if (p.id === closestUnscanPlanet.id) return { ...p, scanProgress: newProgress }
        if (switchedPlanet && p.id === activeScanPlanetId) return { ...p, scanProgress: 0 }
        return p
      })
      set({ planets: updatedPlanets, activeScanPlanetId: closestUnscanPlanet.id })
      return { completed: false, activeScanPlanetId: closestUnscanPlanet.id, scanProgress: newProgress }
    }

    // Not in any scan zone — reset active scan
    if (activeScanPlanetId) {
      const updatedPlanets = planets.map(p =>
        p.id === activeScanPlanetId ? { ...p, scanProgress: 0 } : p
      )
      set({ planets: updatedPlanets, activeScanPlanetId: null })
    }
    return { completed: false, activeScanPlanetId: null, scanProgress: 0 }
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
    activeScanPlanetId: null,
  }),
}))

export default useLevel
