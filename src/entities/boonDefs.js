// Boon definitions — passive upgrades chosen at level-up
// Structure: BOON_ID: { id, name, maxLevel, effect (level 1 default), tiers [...] }
// Boon effects are computed by useBoons.computeModifiers() using tier data.
export const BOONS = {
  DAMAGE_AMP: {
    id: 'DAMAGE_AMP',
    name: 'Damage Amp',
    maxLevel: 3,
    effect: { damageMultiplier: 1.15 },
    tiers: [
      { level: 1, description: 'Increases all weapon damage by 15%', effect: { damageMultiplier: 1.15 }, statPreview: 'Damage: +15%' },
      { level: 2, description: 'Increases all weapon damage by 30%', effect: { damageMultiplier: 1.30 }, statPreview: 'Damage: 15% → 30%' },
      { level: 3, description: 'Increases all weapon damage by 50%', effect: { damageMultiplier: 1.50 }, statPreview: 'Damage: 30% → 50%' },
    ],
  },
  SPEED_BOOST: {
    id: 'SPEED_BOOST',
    name: 'Speed Boost',
    maxLevel: 3,
    effect: { speedMultiplier: 1.20 },
    tiers: [
      { level: 1, description: 'Increases ship movement speed by 20%', effect: { speedMultiplier: 1.20 }, statPreview: 'Speed: +20%' },
      { level: 2, description: 'Increases ship movement speed by 35%', effect: { speedMultiplier: 1.35 }, statPreview: 'Speed: 20% → 35%' },
      { level: 3, description: 'Increases ship movement speed by 50%', effect: { speedMultiplier: 1.50 }, statPreview: 'Speed: 35% → 50%' },
    ],
  },
  COOLDOWN_REDUCTION: {
    id: 'COOLDOWN_REDUCTION',
    name: 'Rapid Fire',
    maxLevel: 3,
    effect: { cooldownMultiplier: 0.85 },
    tiers: [
      { level: 1, description: 'Reduces all weapon cooldowns by 15%', effect: { cooldownMultiplier: 0.85 }, statPreview: 'Cooldown: -15%' },
      { level: 2, description: 'Reduces all weapon cooldowns by 28%', effect: { cooldownMultiplier: 0.72 }, statPreview: 'Cooldown: 15% → 28%' },
      { level: 3, description: 'Reduces all weapon cooldowns by 40%', effect: { cooldownMultiplier: 0.60 }, statPreview: 'Cooldown: 28% → 40%' },
    ],
  },
  CRIT_CHANCE: {
    id: 'CRIT_CHANCE',
    name: 'Critical Strike',
    maxLevel: 3,
    effect: { critChance: 0.10 },
    tiers: [
      { level: 1, description: 'Adds 10% chance for double damage hits', effect: { critChance: 0.10 }, statPreview: 'Crit: +10%' },
      { level: 2, description: 'Adds 20% chance for double damage hits', effect: { critChance: 0.20 }, statPreview: 'Crit: 10% → 20%' },
      { level: 3, description: 'Adds 30% chance for double damage hits', effect: { critChance: 0.30 }, statPreview: 'Crit: 20% → 30%' },
    ],
  },
}
