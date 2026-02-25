// Procedural Upgrade System — Story 31.2
import { rollRarity, getRarityTier } from './raritySystem.js'

const UPGRADE_MAGNITUDE_TABLE = {
  COMMON:    { damage: 8,  area: 6,  cooldown: -6,  knockback: 10, crit: 1.5 },
  RARE:      { damage: 15, area: 12, cooldown: -12, knockback: 20, crit: 2.5 },
  EPIC:      { damage: 25, area: 20, cooldown: -20, knockback: 35, crit: 4   },
  LEGENDARY: { damage: 40, area: 32, cooldown: -30, knockback: 55, crit: 7   },
}

const UPGRADE_STATS = ['damage', 'area', 'cooldown', 'knockback', 'crit']

/**
 * Roll a random procedural upgrade for a weapon.
 * Pure function — no store access.
 *
 * @param {string} weaponId - Weapon ID (unused for logic, kept for future extensibility)
 * @param {number} luckStat - Combined luck stat (default 0)
 * @returns {{ stat, baseMagnitude, finalMagnitude, rarity, statPreview }}
 */
export function rollUpgrade(weaponId, luckStat = 0) {
  const stat = UPGRADE_STATS[Math.floor(Math.random() * UPGRADE_STATS.length)]
  const rarity = rollRarity(luckStat)
  const baseMagnitude = UPGRADE_MAGNITUDE_TABLE[rarity][stat]

  // Luck-biased variance ±3%: high luck biases toward the maximum (+3%)
  const u   = Math.random()
  const pow = Math.max(0.1, 1 - luckStat * 0.06)
  const roll = Math.pow(u, pow) * 6 - 3

  let finalMagnitude
  if (stat === 'crit') {
    // Crit never rolls below base magnitude
    finalMagnitude = Math.max(baseMagnitude, baseMagnitude + roll)
  } else {
    finalMagnitude = baseMagnitude + roll
  }

  const rarityTier = getRarityTier(rarity)
  const sign = finalMagnitude >= 0 ? '+' : ''
  const statLabel = stat.charAt(0).toUpperCase() + stat.slice(1)
  const statPreview = `${statLabel} ${sign}${finalMagnitude.toFixed(2)}%`

  return { stat, baseMagnitude, finalMagnitude, rarity, statPreview }
}
