export const WEAPONS = {
  LASER_FRONT: {
    id: 'LASER_FRONT',
    name: 'Front Laser',
    description: 'Fires a laser beam forward',
    baseDamage: 10,
    baseCooldown: 0.5,     // seconds
    baseSpeed: 300,         // units/sec
    projectileType: 'beam',
    slot: 'any',            // 'fixed' for slot 1, 'any' for slots 2-4
    upgrades: [
      // To be filled in Story 3.3
    ],
  },
}
