export const SHIPS = {
  BALANCED: {
    id: 'BALANCED',
    name: 'Vanguard',
    description: 'Well-rounded ship with balanced stats. Perfect for beginners.',
    baseHP: 100,
    baseSpeed: 50,
    baseDamageMultiplier: 1.0,
    locked: false,
    modelPath: '/models/ships/Spaceship.glb',
  },
  GLASS_CANNON: {
    id: 'GLASS_CANNON',
    name: 'Striker',
    description: 'High damage but low HP. High risk, high reward.',
    baseHP: 60,
    baseSpeed: 60,
    baseDamageMultiplier: 1.5,
    locked: true,
    modelPath: '/models/ships/Spaceship.glb',
  },
  TANK: {
    id: 'TANK',
    name: 'Fortress',
    description: 'High HP and durability. Slower but survives longer.',
    baseHP: 150,
    baseSpeed: 40,
    baseDamageMultiplier: 0.8,
    locked: true,
    modelPath: '/models/ships/Spaceship.glb',
  },
}

export function getDefaultShipId() {
  const unlocked = Object.values(SHIPS).find(ship => !ship.locked)
  return unlocked?.id || 'BALANCED'
}
