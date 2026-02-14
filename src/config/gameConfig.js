export const GAME_CONFIG = {
  // Debug (Story 11.5, Story 18.4)
  DEBUG_CONSOLE_ENABLED: true,
  DEBUG_TRANSITIONS: false, // Story 18.4: Enable detailed system transition logging

  // System
  SYSTEM_TIMER: 600, // 10 minutes in seconds

  // Player
  PLAYER_BASE_HP: 100,
  PLAYER_BASE_SPEED: 80, // units/sec (was 150, reduced for tighter control)
  DASH_COOLDOWN: 3, // seconds
  DASH_DURATION: 0.3, // seconds
  DASH_TRAIL_COLOR: "#ff00ff", // magenta trail during dash

  // Entities
  MAX_ENEMIES_ON_SCREEN: 100,
  MAX_PROJECTILES: 200,
  MAX_XP_ORBS: 50,

  // Collision
  SPATIAL_HASH_CELL_SIZE: 2, // world units
  PLAYER_COLLISION_RADIUS: 1.5, // approximate half-width of ship model

  // XP Orbs (Story 3.1, extended Story 11.1)
  XP_ORB_PICKUP_RADIUS: 2.0,
  XP_MAGNET_RADIUS: 15.0, // Magnetization activation radius (> pickup radius)
  XP_MAGNET_SPEED: 120, // Orb movement speed when magnetized (units/sec)
  XP_MAGNET_ACCELERATION_CURVE: 2.0, // Ease-in exponent: 1.0=linear, 2.0=quadratic
  XP_ORB_MESH_SCALE: [0.8, 0.8, 0.8],
  XP_ORB_COLOR: "#00ffcc",

  // Progression — Story 11.2: Rebalanced for faster early-mid game progression
  // Design goals: Level 5 in 2-3 min, level 7-8 in 5-7 min, ~30% growth per level from level 6+
  // Early levels (1-5): -20-30% from original, Mid/Late levels (6+): ~30% growth rate
  XP_GROWTH_RATE: 1.02, // Per-level XP growth rate for levels beyond XP_LEVEL_CURVE (Story 14.3)
  XP_LEVEL_CURVE: [
    75, // Level 1 → 2 (-25% from 100)
    110, // Level 2 → 3 (-27% from 150)
    165, // Level 3 → 4 (-27% from 225)
    250, // Level 4 → 5 (-26% from 340)
    375, // Level 5 → 6 (-26% from 510)
    525, // Level 6 → 7 (~30% growth)
    700, // Level 7 → 8 (~30% growth)
    910, // Level 8 → 9 (~30% growth)
    1180, // Level 9 → 10 (~30% growth)
    1535, // Level 10 → 11 (~30% growth)
    2000, // Level 11 → 12 (~30% growth)
    2600, // Level 12 → 13 (~30% growth)
    3380, // Level 13 → 14 (~30% growth)
    4400, // Level 14 → 15 (~30% growth, aspirational)
  ],

  // Player movement (Story 1.2, tuned Story 14.2 for organic feel)
  PLAYER_ACCELERATION: 800, // units/sec² — how fast ship reaches full speed (bumped for punchier feel)
  PLAYER_FRICTION: 0.87, // per-frame velocity decay when no input (0-1, lower = more drag; was 0.92, tuned for slight glide feel)
  PLAYER_ROTATION_SPEED: 20, // radians/sec interpolation speed for yaw (Story 2.8: doubled for snappy rotation, < 0.2s for 90° turn)
  PLAYER_MAX_BANK_ANGLE: 0.4, // radians (~23°) — max visual tilt during turns
  PLAYER_BANK_SPEED: 8, // how fast bank angle responds

  // Play area
  PLAY_AREA_SIZE: 2000, // half-width of square play area (updated from 200 in Story 1.3)
  BOUNDARY_WARNING_DISTANCE: 100, // updated from 20 in Story 1.3

  // Spawning (Story 2.2)
  SPAWN_INTERVAL_BASE: 5.0, // seconds between spawns at start
  SPAWN_INTERVAL_MIN: 1.5, // fastest spawn rate
  SPAWN_RAMP_RATE: 0.01, // interval decrease per second of game time
  SPAWN_DISTANCE_MIN: 80, // minimum spawn distance from player
  SPAWN_DISTANCE_MAX: 120, // maximum spawn distance from player
  SPAWN_BATCH_SIZE_BASE: 1, // enemies per spawn at start
  SPAWN_BATCH_RAMP_INTERVAL: 30, // seconds between batch size increases

  // Time-gated enemy spawn schedule (Story 16.3)
  // Each entry defines when an enemy type becomes available for spawning
  // minTime: seconds of elapsed gameplay time before this type can spawn
  // typeId: enemy ID from enemyDefs.js
  TIME_GATED_SPAWN_SCHEDULE: [
    { minTime: 0,   typeId: 'FODDER_BASIC' },
    { minTime: 0,   typeId: 'FODDER_TANK' },
    { minTime: 60,  typeId: 'FODDER_SWARM' },    // 1 minute
    { minTime: 120, typeId: 'SHOCKWAVE_BLOB' },  // 2 minutes
    { minTime: 180, typeId: 'SNIPER_MOBILE' },   // 3 minutes
    { minTime: 300, typeId: 'SNIPER_FIXED' },    // 5 minutes
    { minTime: 360, typeId: 'TELEPORTER' },      // 6 minutes
  ],

  // Environment (Story 1.3)
  BOUNDARY_WALL_BASE_OPACITY: 0.08,
  BOUNDARY_WALL_WARN_OPACITY: 0.6,
  BOUNDARY_WALL_HEIGHT: 200,
  BOUNDARY_WALL_COLOR: "#00ffff",

  // Hit feedback (Story 2.7)
  HIT_FLASH_DURATION_MS: 100, // milliseconds of scale pulse after non-lethal hit
  HIT_FLASH_SCALE_MULT: 1.15, // scale multiplier during hit flash (1.0 = no change)

  // Projectile spawn offsets (Story 2.9)
  PROJECTILE_SPAWN_Y_OFFSET: -0.5, // negative Y to spawn below ship model
  PROJECTILE_SPAWN_FORWARD_OFFSET: 5.0, // distance forward along ship's facing direction (Story 12.2: increased from 2.5 to prevent emissive glow visible behind ship)

  // Combat resolution (Story 2.4 / Story 3.5)
  CONTACT_DAMAGE_COOLDOWN: 0.5, // seconds between contact damage ticks
  INVULNERABILITY_DURATION: 0.5, // seconds of i-frames after taking damage
  PARTICLE_EXPLOSION_COUNT: 8, // particles per enemy death explosion
  PARTICLE_EXPLOSION_SPEED: 50, // particle outward speed (units/sec)
  PARTICLE_EXPLOSION_LIFETIME: 0.4, // particle lifetime in seconds
  PARTICLE_EXPLOSION_SIZE: 0.3, // particle size in world units

  // Visual damage feedback (Story 4.6)
  DAMAGE_FLASH_DURATION: 0.1, // seconds of red screen flash after taking damage
  CAMERA_SHAKE_DURATION: 0.15, // seconds of camera shake after taking damage
  CAMERA_SHAKE_AMPLITUDE: 1.5, // world units max camera displacement during shake

  // Planets (Story 5.2)
  PLANET_COUNT_SILVER: 4,
  PLANET_COUNT_GOLD: 2,
  PLANET_COUNT_PLATINUM: 1,
  PLANET_SCAN_RADIUS_SILVER: 40,
  PLANET_SCAN_RADIUS_GOLD: 50,
  PLANET_SCAN_RADIUS_PLATINUM: 60,
  PLANET_MIN_DISTANCE_FROM_CENTER: 200,
  PLANET_MIN_DISTANCE_BETWEEN: 300,
  PLANET_PLACEMENT_MARGIN: 100,
  PLANET_MODEL_Y_OFFSET: -35,
  PLANET_ORBIT_SPEED: 0.1,

  // Planet scanning (Story 5.3)
  PLANET_SCAN_REWARD_CHOICES: 3,

  // Wormhole (Story 6.1)
  WORMHOLE_SPAWN_TIMER_THRESHOLD: 0.01,
  WORMHOLE_ACTIVATION_RADIUS: 25,
  WORMHOLE_SHOCKWAVE_DURATION: 1.5,
  WORMHOLE_SPAWN_DISTANCE_FROM_PLAYER: 300,
  WORMHOLE_BLOOM_FLASH_DURATION: 0.3,
  WORMHOLE_TRANSITION_DELAY: 2.0,

  // Wormhole Visual (Story 17.3)
  WORMHOLE_VISUAL: {
    SPHERE_RADIUS: 8,
    SPHERE_SEGMENTS: 32,
    PARTICLE_COUNT: 25,
    PARTICLE_ORBIT_RADIUS_MIN: 10,
    PARTICLE_ORBIT_RADIUS_MAX: 14,
    DORMANT_SWIRL_SPEED: 0.3,
    ACTIVE_SWIRL_SPEED: 1.5,
    DORMANT_PARTICLE_SPEED: 0.5,
    ACTIVE_PARTICLE_SPEED: 2.0,
    DORMANT_EMISSIVE_MIN: 0.2,
    DORMANT_EMISSIVE_MAX: 0.5,
    ACTIVE_EMISSIVE: 2.0,
    ACTIVATION_SCALE: 1.4,
  },

  // Boss (Story 6.2)
  BOSS_HP: 500,
  BOSS_ARENA_SIZE: 400,
  BOSS_MOVE_SPEED: 30,
  BOSS_COLLISION_RADIUS: 5,
  BOSS_CONTACT_DAMAGE: 15,
  BOSS_PROJECTILE_SPEED: 120,
  BOSS_PROJECTILE_DAMAGE: 10,
  BOSS_PROJECTILE_RADIUS: 0.8,
  BOSS_ATTACK_COOLDOWN: 2.5,
  BOSS_TELEGRAPH_DURATION: 0.8,
  BOSS_BURST_COUNT: 3,
  BOSS_BURST_SPREAD: 0.4,
  BOSS_PHASE_THRESHOLDS: [0.75, 0.5, 0.25],
  BOSS_NAME: "VOID SENTINEL",

  // Boss defeat (Story 6.3)
  BOSS_DEATH_EXPLOSION_COUNT: 5,
  BOSS_DEATH_EXPLOSION_INTERVAL: 0.2,
  BOSS_DEATH_FINAL_EXPLOSION_SCALE: 3.0,
  BOSS_DEFEAT_TRANSITION_DELAY: 3.0,
  BOSS_FRAGMENT_REWARD: 100,

  // Per-stat enemy scaling per system (Story 16.4)
  // Each stat can be tuned independently for balance
  ENEMY_SCALING_PER_SYSTEM: {
    1: { hp: 1.0, damage: 1.0, speed: 1.0, xpReward: 1.0 },
    2: { hp: 1.5, damage: 1.5, speed: 1.25, xpReward: 1.3 },
    3: { hp: 2.2, damage: 2.2, speed: 1.5, xpReward: 1.8 },
  },

  // Tunnel (Story 7.1)
  TUNNEL_ENTRY_ANIMATION_DURATION: 0.8,
  TUNNEL_EXIT_ANIMATION_DURATION: 0.5,
  MAX_SYSTEMS: 3,
  TUNNEL_AUTOSAVE_KEY: "spaceship-challenge-save",

  // HP Sacrifice (Story 7.4)
  HP_SACRIFICE_FRAGMENT_COST: 50,
  HP_SACRIFICE_HP_RECOVERY: 25,

  // Scoring (Story 8.4)
  SCORE_PER_KILL: 100,

  // Planet Capture Zone Aura (Story 12.3)
  PLANET_AURA: {
    OPACITY_MAX: 0.3,
    PULSE_SPEED: 2.0,
    PULSE_AMPLITUDE: 0.08,
    FADE_IN_DURATION: 0.3,
    FADE_OUT_DURATION: 0.4,
    SILVER_COLOR: "#cccccc",
    GOLD_COLOR: "#ffdd00",
    PLATINUM_COLOR: "#00ddff",
    COMPLETED_OPACITY: 0.3,
    COMPLETED_COLOR: "#888888",
    SHOW_COMPLETED_AURA: false,
  },

  // Projectile Visibility (Story 12.2)
  PROJECTILE_VISUALS: {
    EMISSIVE_INTENSITY: 3.0, // Projectile glow intensity (was 2.0, now brighter)
    EMISSIVE_BASE_COLOR: "#ffffff", // Material emissive color
    MOTION_BLUR_ENABLED: true, // Velocity-based elongation for fast projectiles
    SPEED_SCALE_MULT: 0.003, // Speed-to-scale multiplier (reduced from 0.015 — 0.003 gives subtle 1.3x-2x range)
    SPEED_SCALE_MAX: 2.0, // Maximum elongation cap (prevents extreme stretch on fast weapons like BEAM)
  },

  // Environment Visual Effects (Story 15.2, 15.3)
  ENVIRONMENT_VISUAL_EFFECTS: {
    // Grid visibility (Story 15.3)
    GRID_VISIBILITY: {
      GAMEPLAY: {
        enabled: true,
        divisions: 40,
        colorCenterLine: '#0d0d18',
        colorGrid: '#0a0a0f',
      },
      BOSS: {
        enabled: true,
        divisions: 20,
        colorCenterLine: '#1a0828',
        colorGrid: '#0d0415',
      },
      DEBUG: {
        colorCenterLine: '#00ffcc',
        colorGrid: '#00aaaa',
      },
    },

    // Ambient fog (Story 15.3)
    AMBIENT_FOG: {
      GAMEPLAY: {
        enabled: true,
        color: '#050510',
        density: 0.0003,
      },
      BOSS: {
        enabled: true,
        color: '#0a0515',
        density: 0.0002,
      },
    },

    STARFIELD_LAYERS: {
      DISTANT: {
        count: 1000,
        radius: 5000,
        sizeRange: [2, 3.5],
        opacityRange: [0.45, 0.65],
        parallaxFactor: 0,
        sizeAttenuation: false,
      },
      MID: {
        count: 1000,
        radius: 3000,
        sizeRange: [3.5, 6],
        opacityRange: [0.65, 0.85],
        parallaxFactor: 0.065,
        sizeAttenuation: false,
      },
      NEAR: {
        count: 1000,
        radius: 1500,
        sizeRange: [5.5, 8],
        opacityRange: [0.85, 1.0],
        parallaxFactor: 0.175,
        sizeAttenuation: true,
      },
    },
  },

  // System Entry Cinematic (Story 17.1)
  SYSTEM_ENTRY: {
    FLASH_DURATION: 0.2,        // seconds — white flash total duration
    PORTAL_GROW_TIME: 0.9,      // seconds — portal scale 0→1 (ease-out)
    SHIP_FLY_IN_TIME: 1.2,      // seconds — ship flies through portal to center
    PORTAL_SHRINK_TIME: 0.5,    // seconds — portal disappears after ship arrival
    PORTAL_RADIUS: 12,          // world units — portal disc radius
    PORTAL_COLOR: '#00ccff',    // portal glow color
    PORTAL_PARTICLE_COUNT: 40,  // orbiting particles around portal
    PORTAL_OFFSET_Z: 40,        // portal position below center (positive Z = bottom of screen)
  },

  // System names for display (Story 17.2)
  SYSTEM_NAMES: ['ALPHA CENTAURI', 'PROXIMA', 'KEPLER-442'],

  // System name banner timing (Story 17.2)
  SYSTEM_BANNER: {
    FADE_IN_DURATION: 0.3,  // seconds
    DISPLAY_DURATION: 2.5,  // seconds
    FADE_OUT_DURATION: 0.5, // seconds
  },

  // Player Ship Lighting (Story 12.1)
  PLAYER_SHIP_LIGHTING: {
    EMISSIVE_INTENSITY: 0, // Hull emissive — not needed with strong point/fill lights
    EMISSIVE_COLOR: "#000000", // Hull emissive color
    ENGINE_EMISSIVE_INTENSITY: 0.8, // Engine emissive intensity
    ENGINE_EMISSIVE_COLOR: "#00ccff", // Engine emissive color (cyan/blue)
    POINT_LIGHT_INTENSITY: 5.0, // Local point light intensity
    POINT_LIGHT_DISTANCE: 19, // Local point light distance
    POINT_LIGHT_Y: 1.0, // Local point light Y offset
    FILL_LIGHT_INTENSITY: 3.0, // Directional fill light intensity
    FILL_LIGHT_POSITION: [20, 8, -15], // Directional fill light position
    // Per-scene fill light overrides (Story 15.1) — null = use FILL_LIGHT_INTENSITY default
    FILL_LIGHT_INTENSITY_BOSS: null,
    FILL_LIGHT_INTENSITY_TUNNEL: null,
  },
};
