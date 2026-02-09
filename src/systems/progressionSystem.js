import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'

const MAX_WEAPON_SLOTS = 4
const MAX_BOON_SLOTS = 3
const MAX_WEAPON_LEVEL = 9

// Fisher-Yates shuffle (in-place)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

/**
 * Generate 3-4 level-up choices based on current equipped state.
 * Pure function — no store access.
 *
 * @param {number} currentLevel - Player's current level
 * @param {Array<{weaponId: string, level: number}>} equippedWeapons - Equipped weapons with current levels
 * @param {string[]} equippedBoonIds - IDs of equipped boons
 * @param {Array<{boonId: string, level: number}>} [equippedBoons] - Equipped boons with levels (for upgrade choices)
 * @returns {Array<{type: string, id: string, name: string, description: string, level: number|null, icon: string|null, statPreview: string|null}>}
 */
export function generateChoices(currentLevel, equippedWeapons, equippedBoonIds, equippedBoons = []) {
  const pool = []
  const equippedWeaponIds = equippedWeapons.map(w => w.weaponId)

  // Weapon upgrades for equipped weapons (if level < max and upgrade tier exists)
  for (const weapon of equippedWeapons) {
    const def = WEAPONS[weapon.weaponId]
    if (!def) continue
    if (weapon.level >= MAX_WEAPON_LEVEL) continue
    // upgrades[0] = level 2 stats, upgrades[1] = level 3, etc.
    const upgradeIndex = weapon.level - 1
    const nextUpgrade = def.upgrades?.[upgradeIndex]
    if (!nextUpgrade) continue
    pool.push({
      type: 'weapon_upgrade',
      id: weapon.weaponId,
      name: def.name,
      description: def.description,
      level: nextUpgrade.level,
      icon: null,
      statPreview: nextUpgrade.statPreview || `Damage: ${weapon.level === 1 ? def.baseDamage : (def.upgrades[upgradeIndex - 1]?.damage ?? def.baseDamage)} → ${nextUpgrade.damage ?? def.baseDamage}`,
    })
  }

  // New weapons (if < MAX_WEAPON_SLOTS equipped)
  if (equippedWeaponIds.length < MAX_WEAPON_SLOTS) {
    const weaponKeys = Object.keys(WEAPONS)
    for (const weaponId of weaponKeys) {
      if (equippedWeaponIds.includes(weaponId)) continue
      const def = WEAPONS[weaponId]
      pool.push({
        type: 'new_weapon',
        id: weaponId,
        name: def.name,
        description: def.description,
        level: null,
        icon: null,
        statPreview: null,
      })
    }
  }

  // New boons (if < MAX_BOON_SLOTS equipped)
  if (equippedBoonIds.length < MAX_BOON_SLOTS) {
    const boonKeys = Object.keys(BOONS)
    for (const boonId of boonKeys) {
      if (equippedBoonIds.includes(boonId)) continue
      const def = BOONS[boonId]
      pool.push({
        type: 'new_boon',
        id: boonId,
        name: def.name,
        description: def.tiers?.[0]?.description ?? def.name,
        level: null,
        icon: null,
        statPreview: def.tiers?.[0]?.statPreview ?? null,
      })
    }
  }

  // Boon upgrades for equipped boons below maxLevel
  for (const equippedBoon of equippedBoons) {
    const def = BOONS[equippedBoon.boonId]
    if (!def) continue
    if (equippedBoon.level >= (def.maxLevel || 1)) continue
    const nextTier = def.tiers?.[equippedBoon.level]
    if (!nextTier) continue
    pool.push({
      type: 'boon_upgrade',
      id: equippedBoon.boonId,
      name: def.name,
      description: nextTier.description,
      level: nextTier.level,
      icon: null,
      statPreview: nextTier.statPreview || null,
    })
  }

  shuffle(pool)

  // Pick 3-4 choices
  const count = Math.min(4, Math.max(3, pool.length))

  if (pool.length >= count) {
    return pool.slice(0, count)
  }

  // Fallback: pad with additional upgrade tiers for equipped weapons
  const choices = [...pool]
  const usedKeys = new Set(choices.map(c => `${c.type}_${c.id}_${c.level}`))

  for (const weapon of equippedWeapons) {
    if (choices.length >= 3) break
    const def = WEAPONS[weapon.weaponId]
    if (!def?.upgrades) continue
    // Offer upgrade tiers beyond the one already in pool
    for (let tierIdx = weapon.level; tierIdx < def.upgrades.length; tierIdx++) {
      if (choices.length >= 3) break
      const upgrade = def.upgrades[tierIdx]
      const key = `weapon_upgrade_${weapon.weaponId}_${upgrade.level}`
      if (usedKeys.has(key)) continue
      usedKeys.add(key)
      choices.push({
        type: 'weapon_upgrade',
        id: weapon.weaponId,
        name: def.name,
        description: def.description,
        level: upgrade.level,
        icon: null,
        statPreview: upgrade.statPreview || `Damage: → ${upgrade.damage}`,
      })
    }
  }

  // Ultimate fallback: generic no-op choices (extreme edge case — all maxed out)
  while (choices.length < 3) {
    choices.push({
      type: 'stat_boost',
      id: `stat_boost_${choices.length}`,
      name: 'Stat Boost',
      description: 'Minor stat improvement',
      level: null,
      icon: null,
      statPreview: null,
    })
  }

  return choices.slice(0, Math.min(4, Math.max(3, choices.length)))
}
