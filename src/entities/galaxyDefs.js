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
    difficulty: 2,
    timePerSystem: '10 min',
    // --- Gameplay Profile (Story 34.1) ---
    planetCount: 10,
    wormholeThreshold: 0.7,           // 70% scanned → wormhole spawns (= 7 planets for Andromeda)
    planetRarity: {
      standard: 5,
      rare: 3,
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
  {
    id: 'andromeda_inferno',
    name: 'Andromeda Inferno',
    description: "The beating heart of Andromeda — where every fleet is a death sentence.",
    systemCount: 3,
    locked: false,
    colorTheme: '#ff2244',
    challengeSlots: [],
    fragmentMultiplier: 2.0,
    difficulty: 4,
    timePerSystem: '5 min',
    // --- Gameplay Profile ---
    planetCount: 7,
    wormholeThreshold: 0.7,
    planetRarity: {
      standard: 3,
      rare: 3,
      legendary: 1,
    },
    luckRarityBias: {
      standard: -0.15,
      rare: 0.10,
      legendary: 0.05,
    },
    galaxyRarityBias: 0.0,
    enemySpeedMult: 1.5,
    difficultyScalingPerSystem: {
      hp: 1.25,
      damage: 1.20,
      speed: 1.10,
      xpReward: 1.15,
    },
    // --- CHAOS-specific fields (consumed by stories 52.2–52.6) ---
    chaosEnemyMult: { hp: 1.30, damage: 1.30, speed: 1.30, spawnRate: 1.30 },
    bossTier1Hp: 15000,
    systemTimerBase: 300,
    systemTimerIncrement: 300,
    xpMultiplier: 2.0,
    scoreMultiplier: 2.0,
    backgroundTheme: 'chaos',
    systemNamePool: [
      'BLOOD MERIDIAN', 'SHATTERED CORE', 'INFERNO GATE', 'BURNING AXIS',
      'CRIMSON VEIL', 'SCAR CONVERGENCE', 'HELLFIRE ARM', 'MOLTEN RIM',
      'FORGE ABYSS', 'INCANDESCENT FRONT', 'CINDER CROWN', 'ASH NEXUS',
      'EMBER BREACH', 'MAGMA CORRIDOR', 'IGNITION POINT', 'SCORCHED MERIDIAN',
    ],
  },
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
