// Ship skin definitions — cosmetic skins unlocked via ship progression.
// Skins lv3/6/9 use dedicated GLB files (colours baked into mesh materials).
// modelPath: null = use the ship's default modelPath from shipDefs.js
// tintColor: used only for the swatch button display colour in the UI.
// Skin structure: { id, name, requiredLevel, modelPath, tintColor, emissiveTint, unlockMessage }

const PROGRESSION_SKINS = [
  {
    id: 'ocean',
    name: 'Ocean',
    requiredLevel: 3,
    modelPath: '/models/ships/Spaceship_3.glb',
    tintColor: '#00cfff',
    unlockMessage: 'Unlocked at Level 3',
  },
  {
    id: 'specter',
    name: 'Specter',
    requiredLevel: 6,
    modelPath: '/models/ships/Spaceship_6.glb',
    tintColor: '#c0c0c0',
    unlockMessage: 'Unlocked at Level 6',
  },
  {
    id: 'aurum',
    name: 'Aurum',
    requiredLevel: 9,
    modelPath: '/models/ships/Spaceship_9.glb',
    tintColor: '#ffd60a',
    unlockMessage: 'Unlocked at Level 9',
  },
]

export const SHIP_SKINS = {
  BALANCED: [
    {
      id: 'default',
      name: 'Standard',
      requiredLevel: 1,
      modelPath: null,
      tintColor: '#9b4dca',
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
    ...PROGRESSION_SKINS,
  ],
  GLASS_CANNON: [
    {
      id: 'default',
      name: 'Standard',
      requiredLevel: 1,
      modelPath: null,
      tintColor: '#9b4dca',
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
    ...PROGRESSION_SKINS,
  ],
  TANK: [
    {
      id: 'default',
      name: 'Standard',
      requiredLevel: 1,
      modelPath: null,
      tintColor: '#9b4dca',
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
    ...PROGRESSION_SKINS,
  ],
}

// Returns the skin object for a ship by skin ID. Falls back to default skin if not found.
export function getSkinForShip(shipId, skinId) {
  const skins = SHIP_SKINS[shipId]
  if (!skins) return null
  return skins.find(s => s.id === skinId) || skins[0]
}
