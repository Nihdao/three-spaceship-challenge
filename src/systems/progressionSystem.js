import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { rollRarity, getRarityTier } from './raritySystem.js'
import { rollUpgrade } from './upgradeSystem.js'

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

// Weighted random pick from new-weapon candidates — internal helper, not exported (Story 31.3)
function pickWeightedWeapon(candidates) {
  const totalWeight = candidates.reduce((sum, c) => sum + (WEAPONS[c.id]?.rarityWeight ?? 1), 0)
  let r = Math.random() * totalWeight
  for (const candidate of candidates) {
    r -= (WEAPONS[candidate.id]?.rarityWeight ?? 1)
    if (r <= 0) return candidate
  }
  return candidates[candidates.length - 1] // safety fallback
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

  // P4: probability of 4th choice (Story 31.3 AC#1)
  const P4 = luckStat === 0 ? 0 : Math.min(luckStat / (luckStat + 8), 0.85)
  const desiredCount = (Math.random() < P4) ? 4 : 3
  // Note: Dev Notes spec reads `pool.length >= 3 ? desiredCount : pool.length` which has an
  // edge-case bug when pool.length >= 3 but < desiredCount (returns desiredCount=4 with only 3 items,
  // causing the loop to break early). This implementation is equivalent for pool.length >= 4 and
  // correct for pool.length = 3 with desiredCount = 4.
  const effectiveCount = Math.min(desiredCount, Math.max(3, pool.length))

  // Separate upgrade candidates vs new-weapon candidates (Story 31.3 AC#2)
  const upgradePool = pool.filter(c => c.type !== 'new_weapon')
  const newWeaponPool = pool.filter(c => c.type === 'new_weapon')

  // P_upgrade per-slot probability (Story 31.3 AC#2, #3)
  const slotsAvailable = equippedWeapons.length < MAX_WEAPON_SLOTS
  const x = (currentLevel % 2 === 0) ? 2 : 1
  const P_upgrade = !slotsAvailable
    ? 1.0
    : Math.max(0.10, (0.5 + 0.1 * x) - luckStat * 0.04)

  // Build choices slot by slot — no duplicates (items removed after pick) (Story 31.3 AC#5)
  const choices = []
  let availableUpgrades = [...upgradePool]
  let availableNewWeapons = [...newWeaponPool]

  for (let i = 0; i < effectiveCount; i++) {
    const wantUpgrade = Math.random() < P_upgrade

    if (wantUpgrade && availableUpgrades.length > 0) {
      const idx = Math.floor(Math.random() * availableUpgrades.length)
      choices.push(availableUpgrades.splice(idx, 1)[0])
    } else if (!wantUpgrade && availableNewWeapons.length > 0) {
      const picked = pickWeightedWeapon(availableNewWeapons)
      availableNewWeapons = availableNewWeapons.filter(c => c !== picked)
      choices.push(picked)
    } else if (availableUpgrades.length > 0) {
      // Fallback: wanted new weapon but pool empty
      const idx = Math.floor(Math.random() * availableUpgrades.length)
      choices.push(availableUpgrades.splice(idx, 1)[0])
    } else if (availableNewWeapons.length > 0) {
      // Fallback: upgradePool exhausted, pick new weapon instead
      const picked = pickWeightedWeapon(availableNewWeapons)
      availableNewWeapons = availableNewWeapons.filter(c => c !== picked)
      choices.push(picked)
    } else {
      break // Both pools exhausted
    }
  }

  // Pad with stat_boost only in extreme edge case (all maxed)
  while (choices.length < Math.min(3, effectiveCount)) {
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

  return applyRarityToChoices(choices, luckStat)
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

  // Story 31.2: Weapon upgrades — any equipped weapon below MAX_WEAPON_LEVEL is always upgradeable
  for (const weapon of equippedWeapons) {
    const def = WEAPONS[weapon.weaponId]
    if (!def) continue
    if (weapon.level >= MAX_WEAPON_LEVEL) continue
    pool.push({
      type: 'weapon_upgrade',
      id: weapon.weaponId,
      name: def.name,
      description: def.description,
      level: weapon.level + 1,
      icon: null,
      statPreview: null, // filled by rollUpgrade in applyRarityToChoices
      _def: def,
      _multipliers: weapon.multipliers ?? null,
      _globalDamageMult: weapon.globalDamageMult ?? 1,
      _globalCooldownMult: weapon.globalCooldownMult ?? 1,
    })
  }

  // New weapons
  if (equippedWeaponIds.length < MAX_WEAPON_SLOTS) {
    for (const weaponId of Object.keys(WEAPONS)) {
      if (equippedWeaponIds.includes(weaponId)) continue
      if (banishedWeaponIds.includes(weaponId)) continue // Story 22.2: Exclude banished weapons
      const def = WEAPONS[weaponId]
      if ((def.rarityWeight ?? 1) === 0) continue // Exclude disabled weapons (rarityWeight: 0)
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
 * Story 31.2: weapon_upgrade choices get rollUpgrade for statPreview.
 */
function applyRarityToChoices(choices, luckStat) {
  return choices.map(choice => {
    // stat_boost choices don't get rarity (no meaningful scaling)
    if (choice.type === 'stat_boost') {
      return { ...choice, rarity: 'COMMON', rarityColor: '#ffffff', rarityName: 'Common', rarityMultiplier: 1.0 }
    }

    // Story 31.2: weapon_upgrade rolls its own rarity inside rollUpgrade — skip the top-level rollRarity
    if (choice.type === 'weapon_upgrade') {
      const upgradeResult = rollUpgrade(choice.id, luckStat, choice._def ?? null, choice._multipliers ?? null, choice._globalDamageMult ?? 1, choice._globalCooldownMult ?? 1)
      const upgradeTier = getRarityTier(upgradeResult.rarity)
      return {
        ...choice,
        rarity: upgradeResult.rarity,
        rarityColor: upgradeTier.color,
        rarityName: upgradeTier.name,
        rarityMultiplier: upgradeTier.bonusMultiplier,
        statPreview: upgradeResult.statPreview,
        upgradeResult,
      }
    }

    const rarityId = rollRarity(luckStat)
    const rarityTier = getRarityTier(rarityId)

    let scaledStatPreview = choice.statPreview
    if (choice.type === 'new_weapon') {
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

  // Story 31.2: Show base stats without rarityDamageMultipliers (removed in 31.1)
  return `Damage: ${def.baseDamage} | Crit: ${((def.critChance ?? 0) * 100).toFixed(1)}%`
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
 * Tiers: 'standard' (silver/2 choices), 'rare' (gold/3 choices), 'legendary' (platinum/3+P4 choices).
 */
export function generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = [], luckStat = 0) {
  const pool = buildFullPool(equippedWeapons, equippedBoonIds, equippedBoons, banishedItems)

  let count, effectiveLuck
  if (tier === 'standard') {
    // Silver: 2 choices, no luck influence (AC: #1)
    count = 2
    effectiveLuck = 0
  } else if (tier === 'rare') {
    // Gold: 3 choices, real luckStat (AC: #2)
    count = 3
    effectiveLuck = luckStat
  } else {
    // Legendary/Platinum: 3+P4 choices, real luckStat (AC: #3)
    const P4 = luckStat === 0 ? 0 : Math.min(luckStat / (luckStat + 8), 0.85)
    count = Math.random() < P4 ? 4 : 3
    effectiveLuck = luckStat
  }

  let filtered
  if (tier === 'standard') {
    // Prefer upgrades for equipped weapons + boons
    filtered = pool.filter(c => c.type === 'weapon_upgrade' || c.type === 'new_boon' || c.type === 'boon_upgrade')
    if (filtered.length < count) filtered = pool
  } else if (tier === 'rare') {
    // Balanced — full pool
    filtered = pool
  } else {
    // Legendary: full pool — post-shuffle guarantee check enforces new-item priority (AC: #5)
    filtered = pool
  }

  shuffle(filtered)

  // Legendary: guarantee at least one new_weapon or new_boon if available (AC: #5)
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

  const result = applyRarityToChoices(filtered.slice(0, count), effectiveLuck)

  // Legendary (platinum): guaranteed RARE+ enforcement (AC: #4)
  if (tier === 'legendary') {
    const allCommon = result.every(c => c.rarity === 'COMMON')
    if (allCommon) {
      const rarityTier = getRarityTier('RARE')
      result[0] = {
        ...result[0],
        rarity: 'RARE',
        rarityColor: rarityTier.color,
        rarityName: rarityTier.name,
        rarityMultiplier: rarityTier.bonusMultiplier,
      }
    }
  }

  return result
}
