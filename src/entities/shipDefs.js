// Ship variant definitions — plain data objects (no classes, no logic).
// Each ship offers a distinct playstyle with clear tradeoffs.
// To add a new ship: copy an existing entry, give it a unique SCREAMING_CAPS id,
// and adjust stats so no ship is objectively superior.
//
// Stat ranges:
//   baseHP            50-180   (health points, determines survivability)
//   baseSpeed         35-65    (movement speed, affects dodging & positioning)
//   baseDamageMultiplier 0.85-1.1 (applied to all weapon damage)

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
    defaultWeaponId: 'LASER_FRONT',
    preferredBoonIds: [],
    modelPath: './models/ships/Spaceship.glb',
    colorTheme: '#4a9eff',
    icon: '🚀',
    traits: [],
  },
  GLASS_CANNON: {
    id: 'GLASS_CANNON',
    name: 'Striker',
    description: 'Ultra-fast hunter. Fragile hull but blistering speed and fire rate.',
    baseHP: 50,
    baseSpeed: 65,
    baseDamageMultiplier: 1.1,
    levelScaling: 0.10, // +10% per level above 1
    revival: 0,
    reroll: 0,
    skip: 0,
    banish: 0,
    locked: false,
    defaultWeaponId: 'BEAM',
    preferredBoonIds: ['SPEED_BOOST', 'COOLDOWN_REDUCTION'],
    modelPath: './models/ships/SpaceshipB.glb',
    colorTheme: '#cc5500',
    icon: '⚡',
    traits: ['highRisk'],
  },
  TANK: {
    id: 'TANK',
    name: 'Fortress',
    description: 'Living fortress. Extreme armor and permanent aura field, but sluggish to maneuver.',
    baseHP: 180,
    baseSpeed: 35,
    baseDamageMultiplier: 0.85,
    baseZone: 20,
    levelScaling: 0.10, // +10% per level above 1
    revival: 0,
    reroll: 0,
    skip: 0,
    banish: 0,
    locked: false,
    defaultWeaponId: 'AURA',
    preferredBoonIds: ['HP_REGEN', 'MAX_HP_UP', 'DAMAGE_REDUCTION'],
    modelPath: './models/ships/SpaceshipC.glb',
    colorTheme: '#44aaff',
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
