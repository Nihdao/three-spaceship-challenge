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

  // Player movement (Story 1.2)
  PLAYER_ACCELERATION: 750,      // units/sec² — how fast ship reaches full speed
  PLAYER_FRICTION: 0.92,         // per-frame velocity decay when no input (0-1, lower = more drag)
  PLAYER_ROTATION_SPEED: 10,     // radians/sec interpolation speed for yaw
  PLAYER_MAX_BANK_ANGLE: 0.4,    // radians (~23°) — max visual tilt during turns
  PLAYER_BANK_SPEED: 8,          // how fast bank angle responds

  // Play area
  PLAY_AREA_SIZE: 200,         // half-width of square play area
  BOUNDARY_WARNING_DISTANCE: 20,
}
