import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { rollRarity, getRarityTier } from './raritySystem.js'

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
 * @param {Array<{itemId: string, type: 'weapon'|'boon'}>} [banishedItems] - Items to exclude from new selections (Story 22.2)
 * @param {number} [luckStat] - Combined luck stat for rarity roll (Story 22.3)
 * @returns {Array<{type: string, id: string, name: string, description: string, level: number|null, icon: string|null, statPreview: string|null, rarity: string, rarityColor: string, rarityName: string, rarityMultiplier: number}>}
 */
export function generateChoices(currentLevel, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = [], luckStat = 0) {
  const pool = buildFullPool(equippedWeapons, equippedBoonIds, equippedBoons, banishedItems)

  shuffle(pool)

  // Pick 3-4 choices
  const count = Math.min(4, Math.max(3, pool.length))

  if (pool.length >= count) {
    return applyRarityToChoices(pool.slice(0, count), luckStat)
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

  return applyRarityToChoices(choices.slice(0, Math.min(4, Math.max(3, choices.length))), luckStat)
}

/**
 * Build the full reward pool from equipped state (shared logic with generateChoices).
 */
function buildFullPool(equippedWeapons, equippedBoonIds, equippedBoons, banishedItems = []) {
  const pool = []
  const equippedWeaponIds = equippedWeapons.map(w => w.weaponId)

  // Extract banished weapon and boon IDs for filtering (Story 22.2)
  const banishedWeaponIds = banishedItems.filter(item => item.type === 'weapon').map(item => item.itemId)
  const banishedBoonIds = banishedItems.filter(item => item.type === 'boon').map(item => item.itemId)

  // Weapon upgrades
  for (const weapon of equippedWeapons) {
    const def = WEAPONS[weapon.weaponId]
    if (!def) continue
    if (weapon.level >= MAX_WEAPON_LEVEL) continue
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

  // New weapons
  if (equippedWeaponIds.length < MAX_WEAPON_SLOTS) {
    for (const weaponId of Object.keys(WEAPONS)) {
      if (equippedWeaponIds.includes(weaponId)) continue
      if (banishedWeaponIds.includes(weaponId)) continue // Story 22.2: Exclude banished weapons
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

  // New boons
  if (equippedBoonIds.length < MAX_BOON_SLOTS) {
    for (const boonId of Object.keys(BOONS)) {
      if (equippedBoonIds.includes(boonId)) continue
      if (banishedBoonIds.includes(boonId)) continue // Story 22.2: Exclude banished boons
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

  // Boon upgrades
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

  return pool
}

/**
 * Roll and apply rarity to a slice of choices (Story 22.3).
 * Each choice gets exactly one rarity — same item cannot appear at multiple rarities.
 */
function applyRarityToChoices(choices, luckStat) {
  return choices.map(choice => {
    // stat_boost choices don't get rarity (no meaningful scaling)
    if (choice.type === 'stat_boost') {
      return { ...choice, rarity: 'COMMON', rarityColor: '#ffffff', rarityName: 'Common', rarityMultiplier: 1.0 }
    }

    const rarityId = rollRarity(luckStat)
    const rarityTier = getRarityTier(rarityId)

    let scaledStatPreview = choice.statPreview
    if (choice.type === 'new_weapon' || choice.type === 'weapon_upgrade') {
      scaledStatPreview = applyRarityToWeaponPreview(choice, rarityId, rarityTier)
    } else if (choice.type === 'new_boon' || choice.type === 'boon_upgrade') {
      scaledStatPreview = applyRarityToBoonPreview(choice, rarityTier)
    }

    return {
      ...choice,
      rarity: rarityId,
      rarityColor: rarityTier.color,
      rarityName: rarityTier.name,
      rarityMultiplier: rarityTier.bonusMultiplier,
      statPreview: scaledStatPreview,
    }
  })
}

function applyRarityToWeaponPreview(choice, rarityId, rarityTier) {
  const def = WEAPONS[choice.id]
  if (!def) return choice.statPreview

  const multiplier = def.rarityDamageMultipliers?.[rarityId] ?? rarityTier.bonusMultiplier

  if (choice.type === 'new_weapon') {
    const scaledDamage = Math.round(def.baseDamage * multiplier)
    return `Damage: ${scaledDamage}`
  } else {
    // weapon_upgrade: scale the next upgrade's damage
    const upgrade = def.upgrades?.find(u => u.level === choice.level)
    if (!upgrade) return choice.statPreview
    const prevUpgrade = def.upgrades?.find(u => u.level === choice.level - 1)
    const baseDamage = prevUpgrade?.damage ?? def.baseDamage
    const scaledDamage = Math.round(upgrade.damage * multiplier)
    return `Damage: ${baseDamage} → ${scaledDamage}`
  }
}

function applyRarityToBoonPreview(choice, rarityTier) {
  if (!choice.statPreview) return choice.statPreview

  // For upgrade previews ("15% → 30%"), scale only the LAST percentage (the new value).
  // For new-boon previews ("+15%"), the last is also the only — same logic applies.
  const pctMatches = [...choice.statPreview.matchAll(/([+-]?\d+)%/g)]
  if (pctMatches.length > 0) {
    const last = pctMatches[pctMatches.length - 1]
    const basePercent = parseInt(last[1])
    const scaledPercent = Math.round(basePercent * rarityTier.bonusMultiplier)
    const sign = scaledPercent >= 0 && String(last[1]).startsWith('+') ? '+' : ''
    const lastIdx = choice.statPreview.lastIndexOf(last[0])
    return (
      choice.statPreview.slice(0, lastIdx) +
      `${sign}${scaledPercent}%` +
      choice.statPreview.slice(lastIdx + last[0].length)
    )
  }

  // Try to scale absolute values: "+20" → "+23"
  const absMatch = choice.statPreview.match(/([+-]?\d+)(?!%)/)
  if (absMatch) {
    const baseVal = parseInt(absMatch[1])
    const scaledVal = Math.round(baseVal * rarityTier.bonusMultiplier)
    return choice.statPreview.replace(absMatch[0], `${scaledVal >= 0 && absMatch[1].startsWith('+') ? '+' : ''}${scaledVal}`)
  }

  return choice.statPreview
}

/**
 * Generate planet scan reward choices filtered by tier quality.
 * Returns same format as generateChoices() for UI compatibility.
 */
export function generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = []) {
  const pool = buildFullPool(equippedWeapons, equippedBoonIds, equippedBoons, banishedItems)
  const count = GAME_CONFIG.PLANET_SCAN_REWARD_CHOICES

  let filtered
  if (tier === 'standard') {
    // Prefer upgrades for equipped weapons + common boons
    filtered = pool.filter(c => c.type === 'weapon_upgrade' || c.type === 'new_boon' || c.type === 'boon_upgrade')
    if (filtered.length < count) filtered = pool // fallback to full pool
  } else if (tier === 'rare') {
    // Balanced — allow everything
    filtered = pool
  } else {
    // Legendary — prioritize new weapons + new boons
    const newItems = pool.filter(c => c.type === 'new_weapon' || c.type === 'new_boon')
    const rest = pool.filter(c => c.type !== 'new_weapon' && c.type !== 'new_boon')
    filtered = [...newItems, ...rest]
  }

  shuffle(filtered)

  // Legendary: guarantee at least one new_weapon or new_boon if available
  if (tier === 'legendary') {
    const topSlice = filtered.slice(0, count)
    const hasNew = topSlice.some(c => c.type === 'new_weapon' || c.type === 'new_boon')
    if (!hasNew) {
      const newItem = filtered.find(c => c.type === 'new_weapon' || c.type === 'new_boon')
      if (newItem) {
        filtered = [newItem, ...filtered.filter(c => c !== newItem)]
      }
    }
  }

  // Pad if pool too small (edge case: all maxed)
  while (filtered.length < count) {
    filtered.push({
      type: 'stat_boost',
      id: `stat_boost_${filtered.length}`,
      name: 'Stat Boost',
      description: 'Minor stat improvement',
      level: null,
      icon: null,
      statPreview: null,
    })
  }

  // Story 22.3: Apply rarity to planet reward choices (luckStat=0 — no luck for scan rewards)
  return applyRarityToChoices(filtered.slice(0, count), 0)
}
