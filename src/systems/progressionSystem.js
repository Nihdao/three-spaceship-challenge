import { WEAPONS } from '../entities/weaponDefs.js'
import { BOONS } from '../entities/boonDefs.js'
import { rollRarity, getRarityTier } from './raritySystem.js'
import { rollUpgrade } from './upgradeSystem.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Compute time bonus points from seconds remaining at victory.
 * Each started minute awards TIME_BONUS_PER_MINUTE points (ceiling).
 */
export function computeTimeBonus(remainingSeconds) {
  if (remainingSeconds <= 0) return 0
  return Math.ceil(remainingSeconds / 60) * GAME_CONFIG.TIME_BONUS_PER_MINUTE
}

const MAX_WEAPON_SLOTS = 4
const MAX_BOON_SLOTS = 3
const MAX_WEAPON_LEVEL = 9

// Pool of concrete stat boosts used as fallback padding when all weapons/boons are maxed (Story 48.5)
const STAT_BOOST_POOL = [
  { statType: 'hp_max',   statValue: 8,    name: 'Max HP +8',     description: 'Increases max HP by 8 points' },
  { statType: 'damage',   statValue: 0.04, name: 'Damage +4%',    description: 'Increases damage output by 4%' },
  { statType: 'speed',    statValue: 0.2,  name: 'Speed +0.2',    description: 'Increases ship speed by 0.2' },
  { statType: 'cooldown', statValue: 0.05, name: 'Atk Speed +5%', description: 'Reduces weapon cooldown by 5%' },
]

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

// Weighted random pick from upgrade/boon candidates — preferred boons get 2× weight (Story 50.4)
function pickWeightedUpgrade(candidates, preferredBoonIds) {
  const totalWeight = candidates.reduce((sum, c) => {
    const isBoon = c.type === 'new_boon' || c.type === 'boon_upgrade'
    return sum + (isBoon && preferredBoonIds.includes(c.id) ? 2 : 1)
  }, 0)
  let r = Math.random() * totalWeight
  for (const candidate of candidates) {
    const isBoon = candidate.type === 'new_boon' || candidate.type === 'boon_upgrade'
    r -= (isBoon && preferredBoonIds.includes(candidate.id) ? 2 : 1)
    if (r <= 0) return candidate
  }
  return candidates[candidates.length - 1]
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
export function generateChoices(currentLevel, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = [], luckStat = 0, preferredBoonIds = []) {
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
      const picked = pickWeightedUpgrade(availableUpgrades, preferredBoonIds)
      availableUpgrades = availableUpgrades.filter(c => c !== picked)
      choices.push(picked)
    } else if (!wantUpgrade && availableNewWeapons.length > 0) {
      const picked = pickWeightedWeapon(availableNewWeapons)
      availableNewWeapons = availableNewWeapons.filter(c => c !== picked)
      choices.push(picked)
    } else if (availableUpgrades.length > 0) {
      // Fallback: wanted new weapon but pool empty
      const picked = pickWeightedUpgrade(availableUpgrades, preferredBoonIds)
      availableUpgrades = availableUpgrades.filter(c => c !== picked)
      choices.push(picked)
    } else if (availableNewWeapons.length > 0) {
      // Fallback: upgradePool exhausted, pick new weapon instead
      const picked = pickWeightedWeapon(availableNewWeapons)
      availableNewWeapons = availableNewWeapons.filter(c => c !== picked)
      choices.push(picked)
    } else {
      break // Both pools exhausted
    }
  }

  // Pad with named choices in extreme edge case (all maxed) — Story 48.5
  if (choices.length < Math.min(3, effectiveCount)) {
    const entry = STAT_BOOST_POOL[Math.floor(Math.random() * STAT_BOOST_POOL.length)]
    choices.push({
      type: 'stat_boost',
      statType: entry.statType,
      statValue: entry.statValue,
      id: `stat_boost_${choices.length}`,
      name: entry.name,
      description: entry.description,
      statPreview: entry.description,
      level: null,
      icon: null,
    })
  }
  if (choices.length < Math.min(3, effectiveCount)) {
    choices.push({
      type: 'fragment_bonus',
      id: 'fragment_bonus',
      name: 'Fragment Boost',
      description: '+30 Fragments — permanent currency for the run',
      statPreview: '+30 Fragments',
      level: null,
      icon: null,
    })
  }
  if (choices.length < Math.min(3, effectiveCount)) {
    choices.push({
      type: 'heal_bonus',
      id: 'heal_bonus',
      name: 'Emergency Repair',
      description: 'Restore 25 HP (capped at max HP)',
      statPreview: '+25 HP',
      level: null,
      icon: null,
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
    // stat_boost / fragment_bonus / heal_bonus choices don't get rarity (Story 48.5)
    if (choice.type === 'stat_boost' || choice.type === 'fragment_bonus' || choice.type === 'heal_bonus') {
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
export function generatePlanetReward(tier, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = [], luckStat = 0, preferredBoonIds = []) {
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

  // Pad if pool too small (edge case: all maxed) — Story 48.5
  if (filtered.length < count) {
    const entry = STAT_BOOST_POOL[Math.floor(Math.random() * STAT_BOOST_POOL.length)]
    filtered.push({
      type: 'stat_boost',
      statType: entry.statType,
      statValue: entry.statValue,
      id: `stat_boost_${filtered.length}`,
      name: entry.name,
      description: entry.description,
      statPreview: entry.description,
      level: null,
      icon: null,
    })
  }
  if (filtered.length < count) {
    filtered.push({
      type: 'fragment_bonus',
      id: 'fragment_bonus',
      name: 'Fragment Boost',
      description: '+30 Fragments — permanent currency for the run',
      statPreview: '+30 Fragments',
      level: null,
      icon: null,
    })
  }
  if (filtered.length < count) {
    filtered.push({
      type: 'heal_bonus',
      id: 'heal_bonus',
      name: 'Emergency Repair',
      description: 'Restore 25 HP (capped at max HP)',
      statPreview: '+25 HP',
      level: null,
      icon: null,
    })
  }

  // Weighted slot-by-slot pick (Story 50.4: preferred boons get 2× weight)
  const picks = []
  let remaining = [...filtered]
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const picked = pickWeightedUpgrade(remaining, preferredBoonIds)
    picks.push(picked)
    remaining = remaining.filter(c => c !== picked)
  }

  // Legendary: guarantee at least one new_weapon or new_boon if available — post-pick check (MEDIUM-2 fix)
  if (tier === 'legendary') {
    const hasNew = picks.some(c => c.type === 'new_weapon' || c.type === 'new_boon')
    if (!hasNew) {
      const newItem = remaining.find(c => c.type === 'new_weapon' || c.type === 'new_boon')
      if (newItem) {
        picks[picks.length - 1] = newItem
      }
    }
  }

  const result = applyRarityToChoices(picks, effectiveLuck)

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
