import { spawnOrb, resetOrbs } from './xpOrbSystem.js'
import { spawnHealGem, resetHealGems } from './healGemSystem.js'
import { spawnGem, reset as resetFragmentGems } from './fragmentGemSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'
import usePlayer from '../stores/usePlayer.jsx'

/**
 * Story 19.5: Registry Pattern for Extensible Loot System
 *
 * Internal registry Map: lootId -> { dropChanceKey, spawnFn }
 * Allows data-driven loot drop system without hardcoded if/else logic
 */
const _registry = new Map()

/**
 * Register a loot type in the drop system.
 *
 * @param {string} lootId - Unique loot type identifier (e.g., 'HEAL_GEM')
 * @param {object} config - Loot configuration
 * @param {string} config.dropChanceKey - gameConfig.js key for drop chance (e.g., 'HEAL_GEM_DROP_CHANCE')
 * @param {function} config.spawnFn - Spawn function to call on successful drop (x, z, value?) => void
 */
export function registerLootType(lootId, { dropChanceKey, spawnFn }) {
  _registry.set(lootId, { dropChanceKey, spawnFn })
}

/**
 * Roll loot drops for a defeated enemy.
 * Single entry point for all loot spawning logic.
 *
 * Story 19.5: Refactored to use registry pattern with per-enemy override support.
 *
 * @param {string} enemyTypeId - Enemy type identifier from enemyDefs.js
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @param {object} [enemyInstance] - Optional enemy instance with dropOverrides field
 */
export function rollDrops(enemyTypeId, x, z, enemyInstance = null) {
  const enemyDef = ENEMIES[enemyTypeId]
  const xpReward = enemyDef?.xpReward ?? 0

  // Story 20.4: Read luck bonus for drop chance increases (additive)
  const luckBonus = usePlayer.getState().permanentUpgradeBonuses.luck

  // XP Orb drop (rare or standard) - handled separately, not in registry
  // Rationale: XP is always guaranteed drop (not random), just rare vs standard
  if (xpReward > 0) {
    const isRare = Math.random() < Math.min(1.0, GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE + luckBonus)
    if (isRare) {
      // Rare XP gem: 3x value, replaces standard orb
      spawnOrb(x, z, xpReward * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER, true)
    } else {
      // Standard XP orb
      spawnOrb(x, z, xpReward, false)
    }
  }

  // Registry-based loot drops (heal gem, fragment gem, future loot types)
  for (const [lootId, config] of _registry) {
    // Check per-enemy override first, fallback to global config
    // Story 20.4: Add luck bonus to all registry-based drop chances (additive, capped at 1.0)
    const baseDropChance = enemyInstance?.dropOverrides?.[lootId] ?? GAME_CONFIG[config.dropChanceKey]
    const dropChance = Math.min(1.0, baseDropChance + luckBonus)

    if (Math.random() < dropChance) {
      config.spawnFn(x, z)
    }
  }
}

/**
 * Spawn a specific loot type at a position (generic dispatch).
 * Can be called from any source: enemy death, chest opening, boss defeat, etc.
 *
 * Story 19.5: Enables future extensibility for Tier 3 chest/crate systems.
 *
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @param {string} lootId - Loot type identifier (e.g., 'HEAL_GEM')
 * @param {number} [value] - Optional value parameter (e.g., heal amount, fragment count)
 */
export function spawnLoot(x, z, lootId, value) {
  const config = _registry.get(lootId)
  if (config) {
    config.spawnFn(x, z, value)
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

/**
 * Testing utility: Get registry for validation.
 * DO NOT use in production code - for tests only.
 */
export function _getRegistryForTesting() {
  return _registry
}

// ============================================================================
// AUTO-REGISTER EXISTING LOOT TYPES (Story 19.2, 19.3)
// ============================================================================
// Note: XP orbs (standard and rare) are handled in hardcoded XP section above,
// not via registry. XP_ORB_RARE can be manually registered for future chest systems.

// HEAL_GEM: Health restore gems (Story 19.2)
registerLootType('HEAL_GEM', {
  dropChanceKey: 'HEAL_GEM_DROP_CHANCE',
  spawnFn: (x, z, value) => {
    const healAmount = value ?? GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT
    spawnHealGem(x, z, healAmount)
  },
})

// FRAGMENT_GEM: Fragment currency gems (Story 19.3)
registerLootType('FRAGMENT_GEM', {
  dropChanceKey: 'FRAGMENT_DROP_CHANCE',
  spawnFn: (x, z, value) => {
    const fragmentAmount = value ?? GAME_CONFIG.FRAGMENT_DROP_AMOUNT
    spawnGem(x, z, fragmentAmount)
  },
})

// ============================================================================
// MANUAL REGISTRATION API FOR FUTURE LOOT TYPES
// ============================================================================
// XP_ORB_RARE can be registered manually for use with spawnLoot() (Tier 3 chests):
//
// registerLootType('XP_ORB_RARE', {
//   dropChanceKey: 'RARE_XP_GEM_DROP_CHANCE',
//   spawnFn: (x, z, value) => {
//     spawnOrb(x, z, value, true)
//   },
// })
