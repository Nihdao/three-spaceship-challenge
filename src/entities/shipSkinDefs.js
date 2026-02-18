// Ship skin definitions — cosmetic skins unlocked via ship progression.
// Colour skins (lv3/6/9) are deferred pending mesh material architecture rework:
// mat.color acts as a texture multiplier, not a replacement, so tinting is
// visually unreliable. A future story will expose per-mesh material overrides.
// Each ship currently has only 1 skin: the default appearance.
// Skin structure: { id, name, requiredLevel, tintColor, emissiveTint, unlockMessage }

export const SHIP_SKINS = {
  BALANCED: [
    {
      id: 'default',
      name: 'Vanguard Standard',
      requiredLevel: 1,
      tintColor: null,
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
  ],
  GLASS_CANNON: [
    {
      id: 'default',
      name: 'Striker Standard',
      requiredLevel: 1,
      tintColor: null,
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
  ],
  TANK: [
    {
      id: 'default',
      name: 'Fortress Standard',
      requiredLevel: 1,
      tintColor: null,
      emissiveTint: null,
      unlockMessage: 'Default appearance',
    },
  ],
}

// Returns the skin object for a ship by skin ID. Falls back to default skin if not found.
export function getSkinForShip(shipId, skinId) {
  const skins = SHIP_SKINS[shipId]
  if (!skins) return null
  return skins.find(s => s.id === skinId) || skins[0]
}
