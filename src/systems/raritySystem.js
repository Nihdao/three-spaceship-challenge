// Rarity roll logic — Story 22.3
import { RARITY_TIERS, BASE_RARITY_PROBABILITIES } from '../config/rarityDefs.js'

/**
 * Roll a random rarity tier based on luck stat.
 * Luck shifts probabilities: each 1% luck moves ~0.5% from Common to higher tiers.
 *
 * @param {number} luckStat - Combined luck from ship base + permanent upgrades + boons (default 0)
 * @returns {string} - Rarity tier ID: 'COMMON', 'RARE', 'EPIC', or 'LEGENDARY'
 */
export function rollRarity(luckStat = 0) {
  // Each 1% luck shifts 0.5% total probability — distributed across higher tiers
  const shift = luckStat * 0.005

  const probabilities = {
    COMMON: Math.max(0, BASE_RARITY_PROBABILITIES.COMMON - shift * 3),
    RARE: Math.max(0, BASE_RARITY_PROBABILITIES.RARE + shift * 1.5),
    EPIC: Math.max(0, BASE_RARITY_PROBABILITIES.EPIC + shift * 1.0),
    LEGENDARY: Math.max(0, BASE_RARITY_PROBABILITIES.LEGENDARY + shift * 0.5),
  }

  // Normalize to ensure probabilities sum to 1.0 (handles extreme luck values)
  const total = Object.values(probabilities).reduce((sum, p) => sum + p, 0)
  const normalized = Object.fromEntries(
    Object.entries(probabilities).map(([tier, p]) => [tier, p / total])
  )

  // Weighted random selection
  const roll = Math.random()
  let cumulative = 0
  for (const [tier, probability] of Object.entries(normalized)) {
    cumulative += probability
    if (roll < cumulative) {
      return tier
    }
  }

  return 'COMMON' // Fallback (floating point edge case)
}

/**
 * Get rarity tier definition by ID.
 * Returns COMMON tier if ID is not found.
 *
 * @param {string} rarityId - Rarity tier ID
 * @returns {object} - Rarity tier definition from RARITY_TIERS
 */
export function getRarityTier(rarityId) {
  return RARITY_TIERS[rarityId] || RARITY_TIERS.COMMON
}
