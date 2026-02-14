/**
 * Loot type definitions registry
 * Story 19.5: Centralized loot type configuration for extensibility
 *
 * Each loot type defines:
 * - id: Unique identifier
 * - label: Display name
 * - colorHex: Visual color
 * - scale: Visual scale [x, y, z]
 * - pulseSpeed: Animation speed (radians/sec)
 * - pickupSfx: Audio key for pickup sound
 * - valueConfigKey: gameConfig.js key for value/multiplier
 * - dropChanceKey: gameConfig.js key for drop chance
 */

export const LOOT_TYPE_IDS = {
  XP_ORB_RARE: 'XP_ORB_RARE',
  HEAL_GEM: 'HEAL_GEM',
  FRAGMENT_GEM: 'FRAGMENT_GEM',
}

export const LOOT_TYPES = {
  [LOOT_TYPE_IDS.XP_ORB_RARE]: {
    id: 'XP_ORB_RARE',
    label: 'Rare XP Gem',
    colorHex: '#ffdd00',
    scale: [1.04, 1.04, 1.04], // Slightly larger than standard XP orbs
    pulseSpeed: 3.0,
    pickupSfx: 'xp_rare_pickup',
    valueConfigKey: 'RARE_XP_GEM_MULTIPLIER',
    dropChanceKey: 'RARE_XP_GEM_DROP_CHANCE',
  },
  [LOOT_TYPE_IDS.HEAL_GEM]: {
    id: 'HEAL_GEM',
    label: 'Heal Gem',
    colorHex: '#ff3366',
    scale: [0.8, 0.8, 0.8],
    pulseSpeed: 4.0,
    pickupSfx: 'hp-recover',
    valueConfigKey: 'HEAL_GEM_RESTORE_AMOUNT',
    dropChanceKey: 'HEAL_GEM_DROP_CHANCE',
  },
  [LOOT_TYPE_IDS.FRAGMENT_GEM]: {
    id: 'FRAGMENT_GEM',
    label: 'Fragment Gem',
    colorHex: '#cc66ff',
    scale: [1.0, 1.0, 1.0],
    pulseSpeed: 2.5,
    pickupSfx: 'fragment_pickup',
    valueConfigKey: 'FRAGMENT_DROP_AMOUNT',
    dropChanceKey: 'FRAGMENT_DROP_CHANCE',
  },
}
