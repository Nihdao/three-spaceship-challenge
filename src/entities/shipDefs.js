// Ship variant definitions — plain data objects (no classes, no logic).
// Each ship offers a distinct playstyle with clear tradeoffs.
// To add a new ship: copy an existing entry, give it a unique SCREAMING_CAPS id,
// and adjust stats so no ship is objectively superior.
//
// Stat ranges:
//   baseHP            60-150   (health points, determines survivability)
//   baseSpeed         40-60    (movement speed, affects dodging & positioning)
//   baseDamageMultiplier 0.8-1.5 (applied to all weapon damage)

export const SHIPS = {
  BALANCED: {
    id: 'BALANCED',
    name: 'Vanguard',
    description: 'Well-rounded ship with balanced stats. Perfect for beginners.',
    baseHP: 100,
    baseSpeed: 50,
    baseDamageMultiplier: 1.0,
    levelScaling: 0.08, // +8% per level above 1
    revival: 0,
    reroll: 0,
    skip: 0,
    banish: 0,
    locked: false,
    modelPath: '/models/ships/Spaceship.glb',
    colorTheme: '#4a9eff',
    icon: '🚀',
    traits: [],
  },
  GLASS_CANNON: {
    id: 'GLASS_CANNON',
    name: 'Striker',
    description: 'High damage output but fragile. Master dodging or face quick defeat.',
    baseHP: 70,
    baseSpeed: 55,
    baseDamageMultiplier: 1.4,
    levelScaling: 0.08, // +8% per level above 1
    revival: 0,
    reroll: 0,
    skip: 0,
    banish: 0,
    locked: true,
    modelPath: '/models/ships/Spaceship.glb',
    colorTheme: '#ff4a4a',
    icon: '⚡',
    traits: ['highRisk'],
  },
  TANK: {
    id: 'TANK',
    name: 'Fortress',
    description: 'Maximum survivability with thick armor. Slower but outlasts the competition.',
    baseHP: 150,
    baseSpeed: 42,
    baseDamageMultiplier: 0.85,
    levelScaling: 0.08, // +8% per level above 1
    revival: 0,
    reroll: 0,
    skip: 0,
    banish: 0,
    locked: true,
    modelPath: '/models/ships/Spaceship.glb',
    colorTheme: '#4aff4a',
    icon: '🛡️',
    traits: ['tanky'],
  },
}

// Trait display metadata — maps trait id to user-facing label and description.
export const TRAIT_INFO = {
  highRisk: {
    label: 'High Risk',
    description: 'Fewer hit points demand precise dodging to survive.',
    icon: '🎯',
  },
  tanky: {
    label: 'Heavy Armor',
    description: 'Extra hull plating absorbs more punishment.',
    icon: '🛡️',
  },
}

export function getDefaultShipId() {
  const unlocked = Object.values(SHIPS).find(ship => !ship.locked)
  return unlocked?.id || 'BALANCED'
}
