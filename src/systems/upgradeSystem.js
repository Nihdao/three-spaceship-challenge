// Procedural Upgrade System — Story 31.2
import { rollRarity, getRarityTier } from './raritySystem.js'

const UPGRADE_MAGNITUDE_TABLE = {
  COMMON:    { damage: 8,  area: 6,  cooldown: -6,  knockback: 10, crit: 1.5 },
  RARE:      { damage: 15, area: 12, cooldown: -12, knockback: 20, crit: 2.5 },
  EPIC:      { damage: 25, area: 20, cooldown: -20, knockback: 35, crit: 4   },
  LEGENDARY: { damage: 40, area: 32, cooldown: -30, knockback: 55, crit: 7   },
}

const UPGRADE_STATS = ['damage', 'area', 'cooldown', 'knockback', 'crit']

// Build a contextual "current → new" preview using the weapon's actual current state.
// globalDamageMult and globalCooldownMult include perm upgrades, ship level, boons, dilemmas.
function buildStatPreview(stat, finalMagnitude, weaponDef, weaponMultipliers, globalDamageMult = 1, globalCooldownMult = 1) {
  const dmgMult      = weaponMultipliers.damageMultiplier  ?? 1.0
  const cooldownMult = weaponMultipliers.cooldownMultiplier ?? 1.0
  const areaMult     = weaponMultipliers.areaMultiplier    ?? 1.0
  const kbMult       = weaponMultipliers.knockbackMultiplier ?? 1.0
  const critBonus    = weaponMultipliers.critBonus          ?? 0

  switch (stat) {
    case 'damage': {
      const cur = weaponDef.baseDamage * dmgMult * globalDamageMult
      const nxt = weaponDef.baseDamage * (dmgMult * (1 + finalMagnitude / 100)) * globalDamageMult
      return `Damage  ${Math.round(cur)} → ${Math.round(nxt)}`
    }
    case 'cooldown': {
      const nxtMult = Math.max(0.15, cooldownMult * (1 + finalMagnitude / 100))
      const cur = Math.max(weaponDef.baseCooldown * 0.15, weaponDef.baseCooldown * cooldownMult) * globalCooldownMult
      const nxt = Math.max(weaponDef.baseCooldown * 0.15, weaponDef.baseCooldown * nxtMult) * globalCooldownMult
      return `Fire rate  ${cur.toFixed(2)}s → ${nxt.toFixed(2)}s`
    }
    case 'area': {
      const cur = (weaponDef.projectileRadius ?? 1) * areaMult
      const nxt = cur * (1 + finalMagnitude / 100)
      return `Radius  ${cur.toFixed(1)} → ${nxt.toFixed(1)}`
    }
    case 'knockback': {
      const nxt = kbMult * (1 + finalMagnitude / 100)
      return `Knockback  ${kbMult.toFixed(2)}× → ${nxt.toFixed(2)}×`
    }
    case 'crit': {
      const baseCrit  = weaponDef.critChance ?? 0
      const newBonus  = Math.min(1.0 - baseCrit, critBonus + finalMagnitude / 100)
      const cur = (baseCrit + critBonus) * 100
      const nxt = (baseCrit + newBonus) * 100
      return `Crit  ${cur.toFixed(1)}% → ${nxt.toFixed(1)}%`
    }
    default: {
      const sign = finalMagnitude >= 0 ? '+' : ''
      return `${stat} ${sign}${finalMagnitude.toFixed(1)}%`
    }
  }
}

/**
 * Roll a random procedural upgrade for a weapon.
 * Pure function — no store access.
 *
 * @param {string} weaponId           - Weapon ID (kept for future extensibility)
 * @param {number} luckStat           - Combined luck stat (default 0)
 * @param {object|null} weaponDef     - Weapon definition from WEAPONS (optional)
 * @param {object|null} weaponMult    - Current weapon.multipliers object (optional)
 * @param {number} globalDamageMult   - Global damage multiplier (perm upgrades + ship level + boons)
 * @param {number} globalCooldownMult - Global cooldown multiplier (perm upgrades + boons)
 *   When weaponDef + weaponMult are provided, statPreview shows "current → new" absolute values.
 *   Otherwise falls back to "+X%" delta format.
 * @returns {{ stat, baseMagnitude, finalMagnitude, rarity, statPreview }}
 */
export function rollUpgrade(weaponId, luckStat = 0, weaponDef = null, weaponMult = null, globalDamageMult = 1, globalCooldownMult = 1) {
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

  const statPreview = (weaponDef && weaponMult)
    ? buildStatPreview(stat, finalMagnitude, weaponDef, weaponMult, globalDamageMult, globalCooldownMult)
    : (() => {
        const sign = finalMagnitude >= 0 ? '+' : ''
        const label = stat.charAt(0).toUpperCase() + stat.slice(1)
        return `${label} ${sign}${finalMagnitude.toFixed(2)}%`
      })()

  return { stat, baseMagnitude, finalMagnitude, rarity, statPreview }
}
