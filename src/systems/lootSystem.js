import { spawnOrb, resetOrbs } from './xpOrbSystem.js'
import { spawnHealGem, resetHealGems } from './healGemSystem.js'
import { spawnGem, reset as resetFragmentGems } from './fragmentGemSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'

/**
 * Roll loot drops for a defeated enemy.
 * Single entry point for all loot spawning logic.
 *
 * @param {string} enemyTypeId - Enemy type identifier from enemyDefs.js
 * @param {number} x - World X position
 * @param {number} z - World Z position
 */
export function rollDrops(enemyTypeId, x, z) {
  const enemyDef = ENEMIES[enemyTypeId]
  const xpReward = enemyDef?.xpReward ?? 0

  // XP Orb drop (rare or standard)
  if (xpReward > 0) {
    const isRare = Math.random() < GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE
    if (isRare) {
      // Rare XP gem: 3x value, replaces standard orb
      spawnOrb(x, z, xpReward * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER, true)
    } else {
      // Standard XP orb
      spawnOrb(x, z, xpReward, false)
    }
  }

  // Heal gem drop (independent roll)
  if (Math.random() < GAME_CONFIG.HEAL_GEM_DROP_CHANCE) {
    spawnHealGem(x, z, GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT)
  }

  // Fragment gem drop (independent roll)
  if (Math.random() < GAME_CONFIG.FRAGMENT_DROP_CHANCE) {
    spawnGem(x, z, GAME_CONFIG.FRAGMENT_DROP_AMOUNT)
  }
}

/**
 * Reset all loot subsystems (orbs, heal gems, fragment gems).
 * Called when resetting the game state.
 */
export function resetAll() {
  resetOrbs()
  resetHealGems()
  resetFragmentGems()
}
