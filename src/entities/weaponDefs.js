export const WEAPONS = {
  LASER_FRONT: {
    id: 'LASER_FRONT',
    name: 'Front Laser',
    description: 'Fires a laser beam forward',
    baseDamage: 10,
    baseCooldown: 0.5,     // seconds
    baseSpeed: 300,         // units/sec
    projectileType: 'beam',
    projectileRadius: 0.3,          // collision radius for spatial hash
    projectileLifetime: 3.0,        // seconds before auto-despawn
    projectileColor: '#00ffff',     // cyan beam per UX neon palette
    projectileMeshScale: [0.8, 0.8, 1.0], // squarish shape
    slot: 'any',            // 'fixed' for slot 1, 'any' for slots 2-4
    upgrades: [
      // To be filled in Story 3.3
    ],
  },
}
