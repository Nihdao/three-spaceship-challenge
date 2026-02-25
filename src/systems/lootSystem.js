import { spawnOrb, resetOrbs } from './xpOrbSystem.js'
import { spawnHealGem, resetHealGems } from './healGemSystem.js'
import { spawnGem, reset as resetFragmentGems } from './fragmentGemSystem.js'
import { spawnRareItem, resetRareItems } from './rareItemSystem.js'
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
export function registerLootType(lootId, { dropChanceKey, dropChanceCapKey, spawnFn }) {
  _registry.set(lootId, { dropChanceKey, dropChanceCapKey, spawnFn })
}

/**
 * Compute a radially-scattered position for a drop, offset from the enemy death point.
 * @param {number} x - Origin X
 * @param {number} z - Origin Z
 * @param {number} index - Drop index (0 = XP, 1 = first registry item, ...)
 * @returns {[number, number]} Scattered [sx, sz]
 */
const _scatterResult = [0, 0]
function _scatterPos(x, z, index) {
  const angle = index * 2.094 + (Math.random() - 0.5) * 0.4
  const r = 0.6 + Math.random() * 0.4
  _scatterResult[0] = x + Math.cos(angle) * r
  _scatterResult[1] = z + Math.sin(angle) * r
  return _scatterResult
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

  let dropIdx = 0 // Story 44.4: shared scatter index across all drops

  // XP Orb drop (rare or standard) - handled separately, not in registry
  // Rationale: XP is always guaranteed drop (not random), just rare vs standard
  if (xpReward > 0) {
    const isRare = Math.random() < Math.min(1.0, GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE + luckBonus)
    const [sx, sz] = _scatterPos(x, z, dropIdx++)
    if (isRare) {
      // Rare XP gem: 3x value, replaces standard orb
      spawnOrb(sx, sz, xpReward * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER, true)
    } else {
      // Standard XP orb
      spawnOrb(sx, sz, xpReward, false)
    }
  }

  // Registry-based loot drops (heal gem, fragment gem, future loot types)
  for (const [lootId, config] of _registry) {
    // Check per-enemy override first, fallback to global config
    // Story 20.4: Add luck bonus to all registry-based drop chances (additive, capped at 1.0)
    const baseDropChance = enemyInstance?.dropOverrides?.[lootId] ?? GAME_CONFIG[config.dropChanceKey]
    // Items with a cap use multiplicative luck scaling; others keep legacy additive behaviour
    const dropChance = config.dropChanceCapKey
      ? Math.min(GAME_CONFIG[config.dropChanceCapKey], baseDropChance * (1 + luckBonus))
      : Math.min(1.0, baseDropChance + luckBonus)

    if (Math.random() < dropChance) {
      const [sx, sz] = _scatterPos(x, z, dropIdx++)
      config.spawnFn(sx, sz)
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
  resetRareItems()
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
  dropChanceCapKey: 'HEAL_GEM_DROP_CAP',
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

// MAGNET_ITEM: Rare magnet item — activates magnetization for all collectibles (Story 44.5)
registerLootType('MAGNET_ITEM', {
  dropChanceKey: 'MAGNET_ITEM_DROP_CHANCE',
  dropChanceCapKey: 'MAGNET_ITEM_DROP_CAP',
  spawnFn: (x, z) => spawnRareItem(x, z, 'MAGNET'),
})

// SHIELD_ITEM: Rare shield item — grants temporary invulnerability (Story 44.5)
registerLootType('SHIELD_ITEM', {
  dropChanceKey: 'SHIELD_ITEM_DROP_CHANCE',
  dropChanceCapKey: 'SHIELD_ITEM_DROP_CAP',
  spawnFn: (x, z) => spawnRareItem(x, z, 'SHIELD'),
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
