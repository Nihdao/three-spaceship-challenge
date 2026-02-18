// Rarity tier definitions — Story 22.3
// Used by raritySystem.js to roll rarity and by LevelUpModal.jsx to display rarity visuals.

export const RARITY_TIERS = {
  COMMON: {
    id: 'COMMON',
    name: 'Common',
    color: '#ffffff',       // White border
    bonusMultiplier: 1.0,   // Base value (no scaling)
    glowIntensity: 0,       // No glow
  },
  RARE: {
    id: 'RARE',
    name: 'Rare',
    color: '#3399ff',       // Blue border
    bonusMultiplier: 1.15,  // +15% bonus
    glowIntensity: 1,       // Subtle glow
  },
  EPIC: {
    id: 'EPIC',
    name: 'Epic',
    color: '#9933ff',       // Purple border
    bonusMultiplier: 1.30,  // +30% bonus
    glowIntensity: 2,       // Moderate glow
  },
  LEGENDARY: {
    id: 'LEGENDARY',
    name: 'Legendary',
    color: '#ffcc00',       // Gold border
    bonusMultiplier: 1.50,  // +50% bonus
    glowIntensity: 3,       // Strong glow
  },
}

// Base probabilities (before Luck modifier)
export const BASE_RARITY_PROBABILITIES = {
  COMMON: 0.60,      // 60%
  RARE: 0.25,        // 25%
  EPIC: 0.12,        // 12%
  LEGENDARY: 0.03,   // 3%
}
