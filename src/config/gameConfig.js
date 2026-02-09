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
  PLAYER_COLLISION_RADIUS: 1.5, // approximate half-width of ship model

  // XP Orbs (Story 3.1)
  XP_ORB_PICKUP_RADIUS: 3.0,
  XP_ORB_MESH_SCALE: [0.8, 0.8, 0.8],
  XP_ORB_COLOR: '#00ffcc',

  // Progression
  XP_LEVEL_CURVE: [100, 150, 225, 340, 510, 765, 1148, 1722, 2583, 3875],

  // Player movement (Story 1.2)
  PLAYER_ACCELERATION: 750,      // units/sec² — how fast ship reaches full speed
  PLAYER_FRICTION: 0.92,         // per-frame velocity decay when no input (0-1, lower = more drag)
  PLAYER_ROTATION_SPEED: 20,     // radians/sec interpolation speed for yaw (Story 2.8: doubled for snappy rotation, < 0.2s for 90° turn)
  PLAYER_MAX_BANK_ANGLE: 0.4,    // radians (~23°) — max visual tilt during turns
  PLAYER_BANK_SPEED: 8,          // how fast bank angle responds

  // Play area
  PLAY_AREA_SIZE: 2000,        // half-width of square play area (updated from 200 in Story 1.3)
  BOUNDARY_WARNING_DISTANCE: 100,  // updated from 20 in Story 1.3

  // Spawning (Story 2.2)
  SPAWN_INTERVAL_BASE: 5.0,           // seconds between spawns at start
  SPAWN_INTERVAL_MIN: 1.5,            // fastest spawn rate
  SPAWN_RAMP_RATE: 0.01,              // interval decrease per second of game time
  SPAWN_DISTANCE_MIN: 80,             // minimum spawn distance from player
  SPAWN_DISTANCE_MAX: 120,            // maximum spawn distance from player
  SPAWN_BATCH_SIZE_BASE: 1,           // enemies per spawn at start
  SPAWN_BATCH_RAMP_INTERVAL: 30,      // seconds between batch size increases

  // Environment (Story 1.3)
  STAR_COUNT: 4000,
  STAR_FIELD_RADIUS: 5000,
  BOUNDARY_WALL_BASE_OPACITY: 0.08,
  BOUNDARY_WALL_WARN_OPACITY: 0.6,
  BOUNDARY_WALL_HEIGHT: 200,
  BOUNDARY_WALL_COLOR: '#00ffff',

  // Hit feedback (Story 2.7)
  HIT_FLASH_DURATION_MS: 100,         // milliseconds of scale pulse after non-lethal hit
  HIT_FLASH_SCALE_MULT: 1.15,         // scale multiplier during hit flash (1.0 = no change)

  // Projectile spawn offsets (Story 2.9)
  PROJECTILE_SPAWN_Y_OFFSET: -0.5,       // negative Y to spawn below ship model
  PROJECTILE_SPAWN_FORWARD_OFFSET: 2.5,  // distance forward along ship's facing direction

  // Combat resolution (Story 2.4)
  CONTACT_DAMAGE_COOLDOWN: 0.5,       // seconds between contact damage ticks
  PARTICLE_EXPLOSION_COUNT: 8,        // particles per enemy death explosion
  PARTICLE_EXPLOSION_SPEED: 50,       // particle outward speed (units/sec)
  PARTICLE_EXPLOSION_LIFETIME: 0.4,   // particle lifetime in seconds
  PARTICLE_EXPLOSION_SIZE: 0.3,       // particle size in world units
}
