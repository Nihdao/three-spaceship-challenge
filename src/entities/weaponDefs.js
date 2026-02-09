export const WEAPONS = {
  LASER_FRONT: {
    id: 'LASER_FRONT',
    name: 'Front Laser',
    description: 'Fires a laser beam forward',
    baseDamage: 10,
    baseCooldown: 0.5,     // seconds
    baseSpeed: 300,         // units/sec
    projectileType: 'beam',
    projectileRadius: 1.5,          // collision radius for spatial hash (= beam half-length: 3.0/2) (Story 2.9)
    projectileLifetime: 3.0,        // seconds before auto-despawn
    projectileColor: '#00ffff',     // cyan beam per UX neon palette
    projectileMeshScale: [0.75, 0.75, 3.0], // elongated beam shape (Story 2.9)
    sfxKey: 'laser',
    slot: 'any',            // 'fixed' for slot 1, 'any' for slots 2-4
    upgrades: [
      { level: 2, damage: 12, cooldown: 0.48, statPreview: 'Damage: 10 → 12' },
      { level: 3, damage: 15, cooldown: 0.45, statPreview: 'Damage: 12 → 15' },
      { level: 4, damage: 18, cooldown: 0.42, statPreview: 'Damage: 15 → 18' },
      { level: 5, damage: 22, cooldown: 0.38, statPreview: 'Damage: 18 → 22', upgradeVisuals: { color: '#44ffff' } },
      { level: 6, damage: 27, cooldown: 0.34, statPreview: 'Damage: 22 → 27' },
      { level: 7, damage: 33, cooldown: 0.30, statPreview: 'Damage: 27 → 33' },
      { level: 8, damage: 40, cooldown: 0.26, statPreview: 'Damage: 33 → 40', upgradeVisuals: { meshScale: [0.9, 0.9, 3.6] } },
      { level: 9, damage: 50, cooldown: 0.22, statPreview: 'Damage: 40 → 50', upgradeVisuals: { color: '#88ffff', meshScale: [1.0, 1.0, 4.0] } },
    ],
  },

  SPREAD_SHOT: {
    id: 'SPREAD_SHOT',
    name: 'Spread Shot',
    description: 'Fires 3 projectiles in a cone pattern',
    baseDamage: 6,
    baseCooldown: 0.7,
    baseSpeed: 250,
    projectileType: 'bullet',
    projectilePattern: 'spread',
    spreadAngle: 0.26,              // ~15 degrees
    projectileRadius: 0.8,
    projectileLifetime: 2.0,
    projectileColor: '#ff8800',
    projectileMeshScale: [0.5, 0.5, 1.5],
    sfxKey: 'spread',
    slot: 'any',
    upgrades: [
      { level: 2, damage: 8, cooldown: 0.65, statPreview: 'Damage: 6 → 8' },
      { level: 3, damage: 10, cooldown: 0.60, statPreview: 'Damage: 8 → 10' },
      { level: 4, damage: 12, cooldown: 0.55, statPreview: 'Damage: 10 → 12' },
      { level: 5, damage: 15, cooldown: 0.50, statPreview: 'Damage: 12 → 15', upgradeVisuals: { color: '#ffaa33' } },
      { level: 6, damage: 18, cooldown: 0.46, statPreview: 'Damage: 15 → 18' },
      { level: 7, damage: 22, cooldown: 0.42, statPreview: 'Damage: 18 → 22' },
      { level: 8, damage: 27, cooldown: 0.38, statPreview: 'Damage: 22 → 27', upgradeVisuals: { meshScale: [0.6, 0.6, 1.8] } },
      { level: 9, damage: 33, cooldown: 0.34, statPreview: 'Damage: 27 → 33', upgradeVisuals: { color: '#ffcc66', meshScale: [0.7, 0.7, 2.0] } },
    ],
  },

  MISSILE_HOMING: {
    id: 'MISSILE_HOMING',
    name: 'Homing Missile',
    description: 'Launches a slow missile that tracks enemies',
    baseDamage: 25,
    baseCooldown: 2.0,
    baseSpeed: 120,
    projectileType: 'missile',
    homing: true,
    projectileRadius: 1.2,
    projectileLifetime: 5.0,
    projectileColor: '#ff3333',
    projectileMeshScale: [0.6, 0.6, 2.0],
    sfxKey: 'missile',
    slot: 'any',
    upgrades: [
      { level: 2, damage: 30, cooldown: 1.8, statPreview: 'Damage: 25 → 30' },
      { level: 3, damage: 38, cooldown: 1.6, statPreview: 'Damage: 30 → 38' },
      { level: 4, damage: 46, cooldown: 1.45, statPreview: 'Damage: 38 → 46' },
      { level: 5, damage: 55, cooldown: 1.30, statPreview: 'Damage: 46 → 55', upgradeVisuals: { color: '#ff5555' } },
      { level: 6, damage: 65, cooldown: 1.15, statPreview: 'Damage: 55 → 65' },
      { level: 7, damage: 78, cooldown: 1.00, statPreview: 'Damage: 65 → 78' },
      { level: 8, damage: 92, cooldown: 0.85, statPreview: 'Damage: 78 → 92', upgradeVisuals: { meshScale: [0.72, 0.72, 2.4] } },
      { level: 9, damage: 110, cooldown: 0.70, statPreview: 'Damage: 92 → 110', upgradeVisuals: { color: '#ff8888', meshScale: [0.84, 0.84, 2.8] } },
    ],
  },

  PLASMA_BOLT: {
    id: 'PLASMA_BOLT',
    name: 'Plasma Bolt',
    description: 'Fires a slow, high-damage energy bolt',
    baseDamage: 20,
    baseCooldown: 1.2,
    baseSpeed: 180,
    projectileType: 'bolt',
    projectileRadius: 1.0,
    projectileLifetime: 3.5,
    projectileColor: '#aa00ff',
    projectileMeshScale: [0.7, 0.7, 2.0],
    sfxKey: 'plasma',
    slot: 'any',
    upgrades: [
      { level: 2, damage: 25, cooldown: 1.1, statPreview: 'Damage: 20 → 25' },
      { level: 3, damage: 32, cooldown: 1.0, statPreview: 'Damage: 25 → 32' },
      { level: 4, damage: 40, cooldown: 0.92, statPreview: 'Damage: 32 → 40' },
      { level: 5, damage: 50, cooldown: 0.84, statPreview: 'Damage: 40 → 50', upgradeVisuals: { color: '#cc44ff' } },
      { level: 6, damage: 62, cooldown: 0.76, statPreview: 'Damage: 50 → 62' },
      { level: 7, damage: 76, cooldown: 0.68, statPreview: 'Damage: 62 → 76' },
      { level: 8, damage: 92, cooldown: 0.60, statPreview: 'Damage: 76 → 92', upgradeVisuals: { meshScale: [0.84, 0.84, 2.4] } },
      { level: 9, damage: 112, cooldown: 0.52, statPreview: 'Damage: 92 → 112', upgradeVisuals: { color: '#dd77ff', meshScale: [0.98, 0.98, 2.8] } },
    ],
  },
}
