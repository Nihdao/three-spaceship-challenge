export const WEAPONS = {
  LASER_FRONT: {
    id: 'LASER_FRONT',
    name: 'Front Laser',
    description: 'Fires a laser beam forward',
    baseDamage: 10,
    baseCooldown: 0.5,
    baseSpeed: 300,
    weaponType: 'projectile',             // Story 32.9: schema alignment
    projectileType: 'beam',
    projectileRadius: 1.5,
    projectileLifetime: 3.0,
    projectileColor: '#00e5ff',        // COLD family (Story 31.1)
    projectileMeshScale: [0.75, 0.75, 3.0],
    sfxKey: 'laser-fire',
    knockbackStrength: 1,
    baseArea: 1.0,
    critChance: 0.05,
    poolLimit: 15,
    rarityWeight: 10,
    slot: 'any',
  },

  SPREAD_SHOT: {
    id: 'SPREAD_SHOT',
    name: 'Spread Shot',
    description: 'Fires 3 projectiles in a cone pattern',
    baseDamage: 6,
    baseCooldown: 0.7,
    baseSpeed: 250,
    weaponType: 'projectile',             // Story 32.9: schema alignment
    projectileType: 'bullet',
    projectilePattern: 'spread',
    spreadAngle: 0.26,
    projectileRadius: 0.8,
    projectileLifetime: 2.0,
    projectileColor: '#ffd60a',        // VOLATILE family (Story 31.1)
    projectileMeshScale: [0.5, 0.5, 1.5],
    sfxKey: 'laser-fire',
    knockbackStrength: 1.5,
    baseArea: 0.8,
    critChance: 0.05,
    poolLimit: 30,
    rarityWeight: 8,
    slot: 'any',
  },

  BEAM: {
    id: 'BEAM',
    name: 'Beam Cannon',
    description: 'Continuous damage ray that locks onto enemies',
    baseDamage: 8,
    baseCooldown: 0.1,
    baseSpeed: 600,
    weaponType: 'beam_continuous',         // Story 32.9: schema alignment
    projectileType: 'beam_continuous',
    projectilePattern: 'beam',
    beamDuration: 2.0,
    beamRange: 100,
    projectileRadius: 1.0,
    projectileLifetime: 0.12,
    projectileColor: '#0096c7',        // COLD family (Story 31.1)
    projectileMeshScale: [0.12, 0.12, 8.0],  // very thin beam (Story 31.1)
    sfxKey: 'beam-fire',
    knockbackStrength: 0.375,
    baseArea: 0.12,
    critChance: 0.02,
    poolLimit: 50,
    rarityWeight: 4,
    slot: 'any',
  },

  EXPLOSIVE_ROUND: {
    id: 'EXPLOSIVE_ROUND',
    name: 'Explosive Round',
    description: 'Slow projectile that explodes on impact for area damage',
    baseDamage: 15,
    baseCooldown: 1.5,
    baseSpeed: 150,
    weaponType: 'projectile_explosion',   // Story 32.9: schema alignment
    projectileType: 'explosion',
    projectilePattern: 'explosion',
    explosionRadius: 15,
    explosionDamage: 10,
    projectileRadius: 1.2,
    projectileLifetime: 3.0,
    projectileColor: '#f4c430',        // VOLATILE family (Story 31.1)
    projectileMeshScale: [1.4, 1.4, 1.4],    // Story 31.1
    sfxKey: 'explosive-fire',
    knockbackStrength: 2,
    baseArea: 15,
    critChance: 0.05,
    poolLimit: 8,
    rarityWeight: 7,
    slot: 'any',
  },

  // ─── New weapon stubs (Epic 32 will implement rendering) ───────────────────

  LASER_CROSS: {
    id: 'LASER_CROSS',
    name: 'Laser Cross',
    description: 'Rotating cross beams that damage all nearby enemies',
    baseDamage: 2,             // per tick (0.1s) = 20 DPS at level 1
    weaponType: 'laser_cross', // discriminator for non-projectile handling
    rotationSpeed: 1.5,        // rad/sec (~4.2s per full revolution)
    activeTime: 3.0,           // seconds arms are visible
    inactiveTime: 1.5,         // seconds arms are hidden
    armLength: 24,             // world units (half from center to tip = 12)
    armWidth: 1.0,             // collision + visual width
    projectileColor: '#9b5de5',// ARCANE family — used by renderer
    sfxKey: 'laser-cross-fire',// placeholder SFX (console.warn if missing)
    knockbackStrength: 0,      // no knockback from continuous aura
    critChance: 0.03,
    rarityWeight: 0,              // disabled — excluded from level-up pool and armory
    slot: 'any',
  },

  AURA: {
    id: 'AURA',
    name: 'Aura',
    description: 'Permanent aura that damages all nearby enemies',
    baseDamage: 5,                // per tick (0.25s) = 20 DPS at level 1
    weaponType: 'aura',           // discriminator — skips projectile logic in useWeapons.tick()
    auraRadius: 15,               // world units (base disc radius, before zoneMultiplier)
    tickRate: 0.25,               // seconds between damage ticks (informational; GameLoop uses local constant)
    projectileColor: '#c084fc',   // ARCANE family — used by MagneticFieldRenderer
    sfxKey: 'magnetic-pulse',     // placeholder — never triggered (passive weapon)
    knockbackStrength: 0,         // no knockback from aura field
    slot: 'any',
  },

  DIAGONALS: {
    id: 'DIAGONALS',
    name: 'Diagonals',
    description: '4 diagonal shots in an X pattern, rotated toward cursor',
    baseDamage: 7,
    baseCooldown: 0.55,
    baseSpeed: 280,
    weaponType: 'projectile',             // Story 32.9: schema alignment (Dev Notes taxonomy)
    projectileType: 'bullet',
    projectilePattern: 'diagonals',
    projectileRadius: 2.0,
    projectileLifetime: 2.5,
    projectileColor: '#d8f0ff',        // near-white pale blue — glowing ray appearance
    projectileMeshScale: [1.2, 1.2, 1.2],
    sfxKey: 'laser-fire',
    knockbackStrength: 1.5,
    baseArea: 0.6,
    critChance: 0.08,
    poolLimit: 16,
    rarityWeight: 5,
    slot: 'any',
  },

  SHOCKWAVE: {
    id: 'SHOCKWAVE',
    name: 'Shockwave',
    description: '3 expanding arc waves centered on cursor with strong knockback',
    baseDamage: 40,
    baseCooldown: 2.5,
    weaponType: 'shockwave',        // discriminator — skip in useWeapons.tick(), managed in GameLoop 7a-quater
    waveCount: 3,                   // arcs per burst
    waveDelay: 0.2,                 // seconds between arc spawns in a burst
    waveSectorAngle: Math.PI * 2 / 3, // ~120° arc width (2.094 rad)
    waveExpandSpeed: 100,           // units/sec expansion rate
    waveMaxRadius: 22,              // world units (base, before zoneMultiplier)
    poolLimit: 9,                   // max active arcs (3 bursts × 3 arcs)
    projectileColor: '#f9e547',     // VOLATILE family — bright yellow arc
    sfxKey: 'shockwave-fire',       // placeholder SFX
    knockbackStrength: 5,           // strong radial knockback (read by applyKnockbackImpulse)
    slot: 'any',
  },

  MINE_AROUND: {
    id: 'MINE_AROUND',
    name: 'Mine Field',
    description: '3 orbiting mines that explode on enemy proximity',
    baseDamage: 50,
    weaponType: 'mine_around',
    mineCount: 3,
    orbitalRadius: 15,
    orbitalSpeed: 0.8,                 // rad/sec — full orbit ≈ 7.9s
    mineDetectionRadius: 4,
    explosionRadius: 10,
    mineRespawnTime: 5,
    poolLimit: 3,
    projectileColor: '#b06cf0',        // ARCANE family
    sfxKey: 'mine-explosion',
    knockbackStrength: 4,
    slot: 'any',
  },

  TACTICAL_SHOT: {
    id: 'TACTICAL_SHOT',
    name: 'Tactical Strike',
    description: 'Instant strike on a random nearby enemy with AOE splash',
    baseDamage: 35,
    baseCooldown: 1.2,
    weaponType: 'tactical_shot',       // discriminator — bypasses cooldown/projectile in useWeapons.tick()
    detectionRadius: 60,               // world units — max range for target selection
    strikeAoeRadius: 6,                // world units — AOE splash radius (base, before zoneMultiplier)
    strikeVfxDuration: 0.3,            // seconds — flash + ring animation lifetime
    splashDamageRatio: 0.5,            // splash damage = baseDamage * damageMultiplier * 0.5
    poolLimit: 4,                      // max simultaneous VFX instances
    projectileColor: '#2dc653',        // green — distinct from all existing weapons
    sfxKey: 'tactical-shot',           // placeholder SFX (audioManager handles missing files)
    knockbackStrength: 2,              // radial knockback on primary target only
    rarityWeight: 6,                   // Story 32.6 code-review fix — consistent with other special-mechanic weapons
    slot: 'any',
  },
}
