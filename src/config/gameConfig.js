export const GAME_CONFIG = {
  // System
  SYSTEM_TIMER: 600,           // 10 minutes in seconds

  // Player
  PLAYER_BASE_HP: 100,
  PLAYER_BASE_SPEED: 150,      // units/sec
  DASH_COOLDOWN: 3,            // seconds
  DASH_DURATION: 0.3,          // seconds

  // Entities
  MAX_ENEMIES_ON_SCREEN: 100,
  MAX_PROJECTILES: 200,
  MAX_XP_ORBS: 50,

  // Collision
  SPATIAL_HASH_CELL_SIZE: 2,   // world units

  // Progression
  XP_LEVEL_CURVE: [100, 150, 225, 340, 510, 765, 1148, 1722, 2583, 3875],

  // Play area
  PLAY_AREA_SIZE: 200,         // half-width of square play area
  BOUNDARY_WARNING_DISTANCE: 20,
}
