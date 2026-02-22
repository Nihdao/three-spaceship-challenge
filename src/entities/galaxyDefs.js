export const GALAXIES = [
  {
    id: 'andromeda_reach',
    name: 'Andromeda Reach',
    description: 'A spiral arm teeming with hostile fleets and rich asteroid fields.',
    systemCount: 3,
    locked: false,
    colorTheme: '#cc44ff',
    challengeSlots: [],
    fragmentMultiplier: 1.0,
    // --- Gameplay Profile (Story 34.1) ---
    planetCount: 15,
    wormholeThreshold: 0.75,          // 75% scanned → wormhole spawns (= 12 planets for Andromeda)
    planetRarity: {
      standard: 8,
      rare: 5,
      legendary: 2,
    },
    luckRarityBias: {
      standard: -0.15,   // per +1 luck: fewer standard
      rare: 0.10,        // per +1 luck: more rare
      legendary: 0.05,   // per +1 luck: more legendary
    },
    galaxyRarityBias: 0.0,             // 0 = neutral reference galaxy
    enemySpeedMult: 1.5,               // All enemy base speeds ×1.5
    difficultyScalingPerSystem: {
      hp: 1.25,
      damage: 1.20,
      speed: 1.10,
      xpReward: 1.15,
    },
    systemNamePool: [
      'IRON REACH', 'SHATTERED VEIL', 'DEAD ORBIT', 'BURNING FRONT',
      'ASHEN BELT', 'VOID CORONA', 'FRACTURE ZONE', 'BLEEDING ARM',
      'DUST CORRIDOR', 'SILENT WRECK', 'PALE MARGIN', 'SULFUR TIDE',
      'CINDER GATE', 'RUST MERIDIAN', 'TORN NEBULA', 'COLLAPSED RIM',
    ],
  },
  // Future galaxies (locked: true) — add here when unlock system is implemented
]

export function getAvailableGalaxies() {
  return GALAXIES.filter(g => !g.locked)
}

export function getDefaultGalaxy() {
  return getAvailableGalaxies()[0] || GALAXIES[0]
}

export function getGalaxyById(id) {
  return GALAXIES.find(g => g.id === id)
}
