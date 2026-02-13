import { GAME_CONFIG } from '../config/gameConfig.js'

export const ENEMIES = {
  FODDER_BASIC: {
    id: 'FODDER_BASIC',
    name: 'Drone',
    hp: 20,
    speed: 17,
    damage: 5,
    radius: 1.5,
    xpReward: 12, // Story 11.2: +20% for faster progression
    behavior: 'chase',
    spawnWeight: 100,
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    color: '#ff5555',
    meshScale: [3, 3, 3],
  },
  FODDER_FAST: {
    id: 'FODDER_FAST',
    name: 'Scout',
    hp: 12,
    speed: 30,
    damage: 3,
    radius: 1.2,
    xpReward: 10, // Story 11.2: +25% for faster progression
    behavior: 'chase',
    spawnWeight: 60,
    modelPath: '/models/enemies/robot-enemy-flying-gun.glb',
    color: '#ff3366',
    meshScale: [2.5, 2.5, 2.5],
  },
  BOSS_SENTINEL: {
    id: 'BOSS_SENTINEL',
    name: 'Void Sentinel',
    hp: GAME_CONFIG.BOSS_HP,
    speed: GAME_CONFIG.BOSS_MOVE_SPEED,
    damage: GAME_CONFIG.BOSS_CONTACT_DAMAGE,
    radius: GAME_CONFIG.BOSS_COLLISION_RADIUS,
    behavior: 'boss',
    color: '#cc66ff',
    meshScale: [8, 8, 8],
  },
}
