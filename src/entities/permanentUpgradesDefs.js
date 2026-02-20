// Permanent upgrade definitions — purchased with Fragments from main menu (meta-progression)
// SEPARATE from tunnel upgrades (upgradeDefs.js) which are run-scoped
// Structure: Each upgrade has incremental bonus per level (store sums them)

export const PERMANENT_UPGRADES = {
  ATTACK_POWER: {
    id: 'ATTACK_POWER',
    name: 'Attack Power',
    description: 'Increases weapon damage',
    icon: '\u2694\uFE0F',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 50, bonus: 0.05 },
      { level: 2, cost: 100, bonus: 0.07 },
      { level: 3, cost: 200, bonus: 0.10 },
      { level: 4, cost: 350, bonus: 0.15 },
      { level: 5, cost: 500, bonus: 0.25 },
    ],
  },
  ARMOR: {
    id: 'ARMOR',
    name: 'Armor',
    description: 'Reduces incoming damage (flat reduction)',
    icon: '\uD83D\uDEE1\uFE0F',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 50, bonus: 1 },
      { level: 2, cost: 100, bonus: 2 },
      { level: 3, cost: 200, bonus: 3 },
      { level: 4, cost: 350, bonus: 5 },
      { level: 5, cost: 500, bonus: 8 },
    ],
  },
  MAX_HP: {
    id: 'MAX_HP',
    name: 'Max HP',
    description: 'Increases maximum health',
    icon: '\u2764\uFE0F',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 50, bonus: 10 },
      { level: 2, cost: 100, bonus: 20 },
      { level: 3, cost: 200, bonus: 40 },
    ],
  },
  REGEN: {
    id: 'REGEN',
    name: 'Regeneration',
    description: 'Passive HP regeneration per second',
    icon: '\uD83D\uDC9A',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 50, bonus: 0.2 },
      { level: 2, cost: 100, bonus: 0.4 },
      { level: 3, cost: 200, bonus: 1.0 },
    ],
  },
  ATTACK_SPEED: {
    id: 'ATTACK_SPEED',
    name: 'Attack Speed',
    description: 'Reduces weapon cooldowns',
    icon: '\u26A1',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 60, bonus: 0.05 },
      { level: 2, cost: 120, bonus: 0.10 },
      { level: 3, cost: 240, bonus: 0.20 },
    ],
  },
  ZONE: {
    id: 'ZONE',
    name: 'Zone',
    description: 'Increases projectile size',
    icon: '\uD83C\uDFAF',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 40, bonus: 0.10 },
      { level: 2, cost: 80, bonus: 0.15 },
      { level: 3, cost: 160, bonus: 0.25 },
    ],
  },
  // Story 20.4: Utility stat upgrades
  MAGNET: {
    id: 'MAGNET',
    name: 'Magnet',
    description: 'Increases pickup radius for XP and loot',
    icon: '\uD83E\uDDF2',
    maxLevel: 2,
    levels: [
      { level: 1, cost: 80, bonus: 0.15 },
      { level: 2, cost: 160, bonus: 0.30 },
    ],
  },
  LUCK: {
    id: 'LUCK',
    name: 'Luck',
    description: 'Increases loot drop chances',
    icon: '\uD83C\uDF40',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 100, bonus: 0.05 },
      { level: 2, cost: 200, bonus: 0.10 },
      { level: 3, cost: 400, bonus: 0.20 },
    ],
  },
  EXP_BONUS: {
    id: 'EXP_BONUS',
    name: 'Exp Bonus',
    description: 'Increases XP gain from all sources',
    icon: '\u2B50',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 60, bonus: 0.05 },
      { level: 2, cost: 120, bonus: 0.07 },
      { level: 3, cost: 240, bonus: 0.10 },
      { level: 4, cost: 420, bonus: 0.15 },
      { level: 5, cost: 600, bonus: 0.25 },
    ],
  },
  CURSE: {
    id: 'CURSE',
    name: 'Curse',
    description: 'Increases enemy spawn rate for more combat and loot',
    icon: '\uD83D\uDC80',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 50, bonus: 0.10 },
      { level: 2, cost: 100, bonus: 0.15 },
      { level: 3, cost: 200, bonus: 0.20 },
      { level: 4, cost: 350, bonus: 0.25 },
      { level: 5, cost: 500, bonus: 0.30 },
    ],
  },
  // Story 20.5: Meta stat upgrades (charges tracked, consumed by Epic 22)
  REVIVAL: {
    id: 'REVIVAL',
    name: 'Revival',
    description: 'Extra lives per run',
    icon: '\uD83D\uDC97',
    maxLevel: 2,
    levels: [
      { level: 1, cost: 500, bonus: 1 },
      { level: 2, cost: 1000, bonus: 1 },
    ],
  },
  REROLL: {
    id: 'REROLL',
    name: 'Reroll',
    description: 'Re-roll level-up choices per run',
    icon: '\uD83D\uDD04',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 300, bonus: 1 },
      { level: 2, cost: 600, bonus: 1 },
      { level: 3, cost: 1200, bonus: 1 },
    ],
  },
  SKIP: {
    id: 'SKIP',
    name: 'Skip',
    description: 'Skip unwanted level-up choices per run',
    icon: '\u23ED\uFE0F',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 250, bonus: 1 },
      { level: 2, cost: 500, bonus: 1 },
      { level: 3, cost: 1000, bonus: 1 },
    ],
  },
  BANISH: {
    id: 'BANISH',
    name: 'Banish',
    description: 'Permanently remove choices from the run',
    icon: '\uD83D\uDEAB',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 400, bonus: 1 },
      { level: 2, cost: 800, bonus: 1 },
      { level: 3, cost: 1600, bonus: 1 },
    ],
  },
}

export function getNextLevelCost(upgradeId, currentLevel) {
  const upgradeDef = PERMANENT_UPGRADES[upgradeId]
  if (!upgradeDef || currentLevel >= upgradeDef.maxLevel) return null
  return upgradeDef.levels[currentLevel].cost
}

export function getTotalBonus(upgradeId, level) {
  const upgradeDef = PERMANENT_UPGRADES[upgradeId]
  if (!upgradeDef) return 0
  let total = 0
  for (let i = 0; i < Math.min(level, upgradeDef.maxLevel); i++) {
    total += upgradeDef.levels[i].bonus
  }
  return total
}
