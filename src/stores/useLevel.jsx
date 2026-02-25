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

  // --- Procedural System Names (Story 34.3) ---
  currentSystemName: null,
  usedSystemNames: [],

  // --- Cumulative Timer (Story 23.3) ---
  carriedTime: 0, // Time remaining from previous system (seconds); added to next system's duration
  actualSystemDuration: GAME_CONFIG.SYSTEM_TIMER, // Effective duration for current system (base + carried)

  // --- Banish Tracking (Story 22.2) ---
  banishedItems: [], // Array of { itemId: 'laser', type: 'weapon' | 'boon' }

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
    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i]
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

      // Reset previous planet's progress in-place if switching targets
      if (switchedPlanet) {
        for (let i = 0; i < planets.length; i++) {
          if (planets[i].id === activeScanPlanetId) { planets[i].scanProgress = 0; break }
        }
      }

      if (newProgress >= 1.0) {
        // Scan complete — mutate in-place + set() for React subscribers
        closestUnscanPlanet.scanned = true
        closestUnscanPlanet.scanProgress = 1
        set({ planets, activeScanPlanetId: null })
        return { completed: true, planetId: closestUnscanPlanet.id, tier: closestUnscanPlanet.tier }
      }

      // Scan in progress — mutate scanProgress directly (renderers read via getState())
      closestUnscanPlanet.scanProgress = newProgress
      // Only call set() when activeScanPlanetId changes (scan start or target switch)
      if (activeScanPlanetId !== closestUnscanPlanet.id) {
        set({ activeScanPlanetId: closestUnscanPlanet.id })
      }
      return { completed: false, activeScanPlanetId: closestUnscanPlanet.id, scanProgress: newProgress }
    }

    // Not in any scan zone — reset active scan
    if (activeScanPlanetId) {
      for (let i = 0; i < planets.length; i++) {
        if (planets[i].id === activeScanPlanetId) { planets[i].scanProgress = 0; break }
      }
      set({ activeScanPlanetId: null })
    }
    return { completed: false, activeScanPlanetId: null, scanProgress: 0 }
  },

  // --- Actions ---

  // --- Banish Tracking (Story 22.2) ---
  addBanishedItem: (itemId, type) => {
    const { banishedItems } = get()
    if (!banishedItems.find(item => item.itemId === itemId && item.type === type)) {
      set({ banishedItems: [...banishedItems, { itemId, type }] })
    }
  },

  clearBanishedItems: () => set({ banishedItems: [] }),

  // --- Cumulative Timer (Story 23.3) ---
  setCarriedTime: (time) => set({ carriedTime: Math.max(0, time) }),

  // Consumes carriedTime to initialize actualSystemDuration for the new system.
  // Called on system entry from tunnel. Clears carriedTime after consuming it.
  initializeSystemDuration: () => {
    const carried = get().carriedTime
    set({ actualSystemDuration: GAME_CONFIG.SYSTEM_TIMER + carried, carriedTime: 0 })
  },

  initializeSystemName: (pool) => {
    if (!pool || pool.length === 0) return
    const { usedSystemNames } = get()
    let available = pool.filter(name => !usedSystemNames.includes(name))
    // Wrap-around: if all names used, reset tracking and pick from full pool
    // Resetting usedSystemNames to [name] restores deduplication for subsequent calls
    const isWrapped = available.length === 0
    if (isWrapped) available = [...pool]
    const name = available[Math.floor(Math.random() * available.length)]
    set({ currentSystemName: name, usedSystemNames: isWrapped ? [name] : [...usedSystemNames, name] })
  },

  initializePlanets: (galaxyConfig, luckValue = 0) => {
    const planets = []
    const margin = GAME_CONFIG.PLANET_PLACEMENT_MARGIN
    const minCenter = GAME_CONFIG.PLANET_MIN_DISTANCE_FROM_CENTER
    const minBetween = GAME_CONFIG.PLANET_MIN_DISTANCE_BETWEEN
    const range = GAME_CONFIG.PLAY_AREA_SIZE - margin

    // Luck-adjusted weights (clamped to min 0)
    const base = galaxyConfig.planetRarity
    const bias = galaxyConfig.luckRarityBias
    const weights = {
      standard:  Math.max(0, base.standard  + bias.standard  * luckValue),
      rare:      Math.max(0, base.rare      + bias.rare      * luckValue),
      legendary: Math.max(0, base.legendary + bias.legendary * luckValue),
    }
    let totalWeight = weights.standard + weights.rare + weights.legendary
    if (totalWeight <= 0) {
      console.warn('[initializePlanets] All luck-adjusted weights clamped to 0 — defaulting to base weights without luck bias')
      weights.standard = base.standard
      weights.rare = base.rare
      weights.legendary = base.legendary
      totalWeight = base.standard + base.rare + base.legendary
    }

    // Rarity → typeId mapping
    const TYPE_MAP = {
      standard:  'PLANET_CINDER',
      rare:      'PLANET_PULSE',
      legendary: 'PLANET_VOID',
    }

    for (let i = 0; i < galaxyConfig.planetCount; i++) {
      // Weighted random roll for type
      const roll = Math.random() * totalWeight
      let typeId
      if (roll < weights.standard) {
        typeId = TYPE_MAP.standard
      } else if (roll < weights.standard + weights.rare) {
        typeId = TYPE_MAP.rare
      } else {
        typeId = TYPE_MAP.legendary
      }

      const def = PLANETS[typeId]

      // Spatial placement with constraints
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

  // Story 22.4: Helper for testing boss HP scaling across systems
  setSystemNumber: (systemNumber) => set({ currentSystem: systemNumber }),

  reset: () => set({
    currentSystem: 1,
    systemTimer: 0,
    difficulty: 1,
    planets: [],
    wormholeState: 'hidden',
    wormhole: null,
    wormholeActivationTimer: 0,
    activeScanPlanetId: null,
    banishedItems: [], // Story 22.2: Clear banish list on new run
    carriedTime: 0, // Story 23.3: Reset carryover on new game
    actualSystemDuration: GAME_CONFIG.SYSTEM_TIMER, // Story 23.3: Reset to base duration
    currentSystemName: null,
    usedSystemNames: [],
  }),
}))

export default useLevel
