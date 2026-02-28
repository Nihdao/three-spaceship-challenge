import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Enemy type definitions with stats, behavior, and visuals.
 *
 * Story 19.5: Optional dropOverrides field added for per-enemy loot customization.
 * Format: dropOverrides: { LOOT_TYPE_ID: dropChance }
 * Example: dropOverrides: { FRAGMENT_GEM: 0.25 } // 25% fragment chance vs 12% default
 *
 * Note: dropOverrides are optional. If not specified, global drop chances from
 * gameConfig.js are used. This is for future balance tuning (e.g., elite enemies
 * or mini-bosses with higher Fragment drop rates).
 */
export const ENEMIES = {
  // Type 1: Basic Chaser
  FODDER_BASIC: {
    id: 'FODDER_BASIC',
    tier: 'FODDER',
    name: 'Drone',
    type: 1,
    hp: 14,
    speed: 17,
    damage: 5,
    radius: 2.0,
    xpReward: 12,
    behavior: 'chase',
    spawnWeight: 100,
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [3, 3, 3],
    color: null,
  },

  // Type 2: Tank Chaser
  FODDER_TANK: {
    id: 'FODDER_TANK',
    tier: 'FODDER',
    name: 'Tank Drone',
    type: 2,
    hp: 27,
    speed: 12,
    damage: 5,
    radius: 2.6,
    xpReward: 15,
    behavior: 'chase',
    spawnWeight: 60,
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [4, 4, 4],
    color: null,
  },

  // Type 3: Swarm Fast Sweep
  FODDER_SWARM: {
    id: 'FODDER_SWARM',
    tier: 'FODDER',
    name: 'Swarm Scout',
    type: 3,
    hp: 6,
    speed: 35,
    damage: 3,
    radius: 1.0,
    xpReward: 5,
    behavior: 'sweep',
    spawnWeight: 40,
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [1.5, 1.5, 1.5],
    color: null,
  },

  // Type 4: Shockwave Blob
  SHOCKWAVE_BLOB: {
    id: 'SHOCKWAVE_BLOB',
    tier: 'SKIRMISHER',
    name: 'Shockwave Blob',
    type: 4,
    hp: 10,
    speed: 8,
    damage: 5,
    radius: 3.25,
    xpReward: 20,
    behavior: 'shockwave',
    spawnWeight: 30,
    modelPath: '/models/enemies/enemy-blob.glb',
    meshScale: [2, 2, 2],
    color: null,
    shockwaveInterval: 3.5,
    shockwaveRadius: 15,
    shockwaveDamage: 8,
  },

  // Type 6: Sniper Mobile
  SNIPER_MOBILE: {
    id: 'SNIPER_MOBILE',
    tier: 'SKIRMISHER',
    name: 'Mobile Sniper',
    type: 6,
    hp: 17,
    speed: 20,
    damage: 0,
    radius: 2.0,
    xpReward: 25,
    behavior: 'sniper_mobile',
    spawnWeight: 25,
    modelPath: '/models/enemies/robot-enemy-flying-gun.glb',
    meshScale: [3, 3, 3],
    color: null,
    attackRange: 40,
    attackCooldown: 2,
    projectileSpeed: 80,
    projectileDamage: 10,
    projectileColor: '#ff3333',
  },

  // Type 7: Sniper Fixed
  SNIPER_FIXED: {
    id: 'SNIPER_FIXED',
    tier: 'ASSAULT',
    name: 'Fixed Turret',
    type: 7,
    hp: 7,
    speed: 0,
    damage: 0,
    radius: 2.0,
    xpReward: 30,
    behavior: 'sniper_fixed',
    spawnWeight: 0,
    modelPath: '/models/enemies/robot-enemy-flying-gun.glb',
    meshScale: [3, 3, 3],
    color: '#ff3333',
    attackRange: 60,
    attackCooldown: 4,
    telegraphDuration: 1.0,
    projectileSpeed: 150,
    projectileDamage: 20,
    projectileColor: '#ff0000',
  },

  // Type 8: Teleporter
  TELEPORTER: {
    id: 'TELEPORTER',
    tier: 'ASSAULT',
    name: 'Phase Shifter',
    type: 8,
    hp: 12,
    speed: 15,
    damage: 5,
    radius: 1.6,
    xpReward: 25,
    behavior: 'teleport',
    spawnWeight: 20,
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [2.5, 2.5, 2.5],
    color: '#cc66ff',
    teleportCooldown: 5,
    teleportRange: 30,
    burstProjectileCount: 3,
    burstProjectileSpeed: 100,
    burstProjectileDamage: 5,
  },

  // Elite Bruiser — periodic high-threat enemy, never spawned by wave system
  ELITE_BRUISER: {
    id: 'ELITE_BRUISER',
    tier: 'ELITE',
    name: 'Bruiser',
    type: 9,
    hp: 50,
    speed: 13,
    damage: 5,
    radius: 3.5,
    xpReward: 100,
    behavior: 'chase',
    spawnWeight: 0,
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [7, 7, 7],
    color: '#ff2200',
    isElite: true,
    emissiveColor: '#ff2200',
    emissiveIntensity: 1.2,
  },

  // Boss (separate system, not part of 8-type roster)
  // Values reference GAME_CONFIG to stay DRY with useBoss.jsx and GameLoop.jsx
  BOSS_SENTINEL: {
    id: 'BOSS_SENTINEL',
    name: 'Void Sentinel',
    type: 0,
    hp: GAME_CONFIG.BOSS_HP,
    speed: GAME_CONFIG.BOSS_MOVE_SPEED,
    damage: GAME_CONFIG.BOSS_CONTACT_DAMAGE,
    radius: GAME_CONFIG.BOSS_COLLISION_RADIUS,
    xpReward: 0,
    behavior: 'boss',
    spawnWeight: 0,
    modelPath: '/models/enemies/SpaceshipBoss.glb',
    color: '#cc66ff',
    meshScale: [8, 8, 8],
  },

  // Story 22.4: Tough Boss Overhaul - HP Sponge with Wave Persistence
  BOSS_SPACESHIP: {
    id: 'BOSS_SPACESHIP',
    name: 'Titan Cruiser',
    type: 0,
    hp: GAME_CONFIG.BOSS_BASE_HP, // Base HP, scaled by system difficulty at spawn
    speed: 10, // Slow and menacing
    damage: 20, // High contact damage
    radius: 3.0, // Large collision radius
    xpReward: 5000, // Base XP (multiplied by BOSS_LOOT_XP_MULTIPLIER on defeat)
    behavior: 'chase', // Uses existing chase behavior
    spawnWeight: 0, // Never spawns via normal wave system
    modelPath: '/models/enemies/SpaceshipBoss.glb',
    color: '#ff3333', // Red accent
    meshScale: [12, 12, 12], // 4x regular enemy size (FODDER_BASIC is [3,3,3])
    isBoss: true, // Flag to identify boss entity
    emissiveColor: '#ff0000', // Red glow
    emissiveIntensity: 0.8, // Strong glow
    particleTrail: true, // Enable particle trail effect
  },
}
