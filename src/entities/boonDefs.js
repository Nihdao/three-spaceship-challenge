// Boon definitions — passive upgrades chosen at level-up
// Structure: BOON_ID: { id, name, maxLevel, effect (level 1 default), tiers [...] }
// Boon effects are computed by useBoons.computeModifiers() using tier data.

// Default rarity bonus multipliers — Story 22.3
const DEFAULT_RARITY_BONUS = { COMMON: 1.0, RARE: 1.15, EPIC: 1.30, LEGENDARY: 1.50 }

export const BOONS = {
  DAMAGE_AMP: {
    id: 'DAMAGE_AMP',
    name: 'Damage Amp',
    maxLevel: 3,
    effect: { damageMultiplier: 1.15 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
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
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
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
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
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
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Adds 10% chance for critical hits', effect: { critChance: 0.10 }, statPreview: 'Crit: +10%' },
      { level: 2, description: 'Adds 20% chance for critical hits', effect: { critChance: 0.20 }, statPreview: 'Crit: 10% → 20%' },
      { level: 3, description: 'Adds 30% chance for critical hits', effect: { critChance: 0.30 }, statPreview: 'Crit: 20% → 30%' },
    ],
  },
  // Story 11.4: New boons for complete roster
  CRIT_MULTIPLIER: {
    id: 'CRIT_MULTIPLIER',
    name: 'Critical Power',
    maxLevel: 3,
    effect: { critMultiplier: 2.2 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Critical hits deal 2.2x damage', effect: { critMultiplier: 2.2 }, statPreview: 'Crit Damage: 2.0x → 2.2x' },
      { level: 2, description: 'Critical hits deal 2.4x damage', effect: { critMultiplier: 2.4 }, statPreview: 'Crit Damage: 2.2x → 2.4x' },
      { level: 3, description: 'Critical hits deal 2.7x damage', effect: { critMultiplier: 2.7 }, statPreview: 'Crit Damage: 2.4x → 2.7x' },
    ],
  },
  PROJECTILE_SPEED: {
    id: 'PROJECTILE_SPEED',
    name: 'Velocity Rounds',
    maxLevel: 3,
    effect: { projectileSpeedMultiplier: 1.15 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Increases projectile speed by 15%', effect: { projectileSpeedMultiplier: 1.15 }, statPreview: 'Projectile Speed: +15%' },
      { level: 2, description: 'Increases projectile speed by 30%', effect: { projectileSpeedMultiplier: 1.30 }, statPreview: 'Projectile Speed: +30%' },
      { level: 3, description: 'Increases projectile speed by 50%', effect: { projectileSpeedMultiplier: 1.50 }, statPreview: 'Projectile Speed: +50%' },
    ],
  },
  MAX_HP_UP: {
    id: 'MAX_HP_UP',
    name: 'Hull Reinforcement',
    maxLevel: 3,
    effect: { maxHPBonus: 20 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Increases maximum HP by 20', effect: { maxHPBonus: 20 }, statPreview: 'Max HP: +20' },
      { level: 2, description: 'Increases maximum HP by 50', effect: { maxHPBonus: 50 }, statPreview: 'Max HP: +50' },
      { level: 3, description: 'Increases maximum HP by 100', effect: { maxHPBonus: 100 }, statPreview: 'Max HP: +100' },
    ],
  },
  HP_REGEN: {
    id: 'HP_REGEN',
    name: 'Auto Repair',
    maxLevel: 3,
    effect: { hpRegenRate: 1.0 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Regenerate 1 HP per second', effect: { hpRegenRate: 1.0 }, statPreview: 'HP Regen: +1/sec' },
      { level: 2, description: 'Regenerate 2 HP per second', effect: { hpRegenRate: 2.0 }, statPreview: 'HP Regen: +2/sec' },
      { level: 3, description: 'Regenerate 4 HP per second', effect: { hpRegenRate: 4.0 }, statPreview: 'HP Regen: +4/sec' },
    ],
  },
  DAMAGE_REDUCTION: {
    id: 'DAMAGE_REDUCTION',
    name: 'Armor Plating',
    maxLevel: 3,
    effect: { damageReduction: 0.10 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Reduces incoming damage by 10%', effect: { damageReduction: 0.10 }, statPreview: 'Damage Taken: -10%' },
      { level: 2, description: 'Reduces incoming damage by 18%', effect: { damageReduction: 0.18 }, statPreview: 'Damage Taken: -18%' },
      { level: 3, description: 'Reduces incoming damage by 25%', effect: { damageReduction: 0.25 }, statPreview: 'Damage Taken: -25%' },
    ],
  },
  XP_GAIN: {
    id: 'XP_GAIN',
    name: 'Neural Link',
    maxLevel: 3,
    effect: { xpMultiplier: 1.20 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Increases XP gained by 20%', effect: { xpMultiplier: 1.20 }, statPreview: 'XP Gain: +20%' },
      { level: 2, description: 'Increases XP gained by 40%', effect: { xpMultiplier: 1.40 }, statPreview: 'XP Gain: +40%' },
      { level: 3, description: 'Increases XP gained by 75%', effect: { xpMultiplier: 1.75 }, statPreview: 'XP Gain: +75%' },
    ],
  },
  FRAGMENT_GAIN: {
    id: 'FRAGMENT_GAIN',
    name: 'Scavenger',
    maxLevel: 3,
    effect: { fragmentMultiplier: 1.20 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Increases Fragment rewards by 20%', effect: { fragmentMultiplier: 1.20 }, statPreview: 'Fragment Gain: +20%' },
      { level: 2, description: 'Increases Fragment rewards by 40%', effect: { fragmentMultiplier: 1.40 }, statPreview: 'Fragment Gain: +40%' },
      { level: 3, description: 'Increases Fragment rewards by 75%', effect: { fragmentMultiplier: 1.75 }, statPreview: 'Fragment Gain: +75%' },
    ],
  },
  PICKUP_RADIUS: {
    id: 'PICKUP_RADIUS',
    name: 'Magnetic Field',
    maxLevel: 3,
    effect: { pickupRadiusMultiplier: 1.30 },
    rarityBonusMultipliers: { ...DEFAULT_RARITY_BONUS },
    tiers: [
      { level: 1, description: 'Increases pickup radius by 30%', effect: { pickupRadiusMultiplier: 1.30 }, statPreview: 'Pickup Radius: +30%' },
      { level: 2, description: 'Increases pickup radius by 60%', effect: { pickupRadiusMultiplier: 1.60 }, statPreview: 'Pickup Radius: +60%' },
      { level: 3, description: 'Doubles pickup radius', effect: { pickupRadiusMultiplier: 2.00 }, statPreview: 'Pickup Radius: +100%' },
    ],
  },
}
