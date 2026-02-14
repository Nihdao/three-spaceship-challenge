import { create } from 'zustand'
import { PLANETS } from '../entities/planetDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const useLevel = create((set, get) => ({
  // --- State ---
  currentSystem: 1,
  systemTimer: 0,
  difficulty: 1,
  planets: [],
  wormholeState: 'hidden', // 'hidden' | 'visible' | 'activating' | 'active'
  wormhole: null, // { x, z } when spawned
  wormholeActivationTimer: 0,
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

  // --- Wormhole (Story 6.1) ---
  spawnWormhole: (playerX, playerZ) => {
    const angle = Math.random() * Math.PI * 2
    const dist = GAME_CONFIG.WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER
    let x = playerX + Math.cos(angle) * dist
    let z = playerZ + Math.sin(angle) * dist
    const bound = GAME_CONFIG.PLAY_AREA_SIZE - 50
    x = Math.max(-bound, Math.min(bound, x))
    z = Math.max(-bound, Math.min(bound, z))
    // Ensure clamping didn't place wormhole too close to player
    const dx = x - playerX
    const dz = z - playerZ
    const actualDist = Math.sqrt(dx * dx + dz * dz)
    const minDist = GAME_CONFIG.WORMHOLE_ACTIVATION_RADIUS * 3
    if (actualDist < minDist && actualDist > 0) {
      const scale = minDist / actualDist
      x = playerX + dx * scale
      z = playerZ + dz * scale
      x = Math.max(-bound, Math.min(bound, x))
      z = Math.max(-bound, Math.min(bound, z))
    }
    set({ wormhole: { x, z }, wormholeState: 'visible' })
  },

  activateWormhole: () => {
    set({ wormholeState: 'activating', wormholeActivationTimer: GAME_CONFIG.WORMHOLE_TRANSITION_DELAY })
  },

  wormholeTick: (delta) => {
    const { wormholeState, wormholeActivationTimer } = get()
    if (wormholeState !== 'activating') return { transitionReady: false }
    const newTimer = Math.max(0, wormholeActivationTimer - delta)
    if (newTimer <= 0) {
      set({ wormholeState: 'active', wormholeActivationTimer: 0 })
      return { transitionReady: true }
    }
    set({ wormholeActivationTimer: newTimer })
    return { transitionReady: false }
  },

  // Story 17.4: Boss fight wormhole states
  setWormholeInactive: () => {
    set({ wormholeState: 'inactive' })
  },

  reactivateWormhole: () => {
    set({ wormholeState: 'reactivated' })
  },

  advanceSystem: () => set(state => ({
    currentSystem: Math.min(state.currentSystem + 1, GAME_CONFIG.MAX_SYSTEMS),
    systemTimer: 0,
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
    wormhole: null,
    wormholeActivationTimer: 0,
    activeScanPlanetId: null,
  })),

  reset: () => set({
    currentSystem: 1,
    systemTimer: 0,
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
    wormhole: null,
    wormholeActivationTimer: 0,
    activeScanPlanetId: null,
  }),
}))

export default useLevel
