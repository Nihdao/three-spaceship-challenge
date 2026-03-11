// Procedural Upgrade System — Story 31.2
import { rollRarity, getRarityTier } from './raritySystem.js'

const UPGRADE_MAGNITUDE_TABLE = {
  COMMON:    { damage: 10, area:  8, cooldown:  -8, knockback: 12 },
  RARE:      { damage: 18, area: 14, cooldown: -12, knockback: 22 },
  EPIC:      { damage: 28, area: 22, cooldown: -18, knockback: 35 },
  LEGENDARY: { damage: 45, area: 32, cooldown: -22, knockback: 50 },
}

const UPGRADE_STATS = ['damage', 'area', 'cooldown', 'knockback']

// Build a contextual "current → new" preview using the weapon's actual current state.
// globalDamageMult and globalCooldownMult include perm upgrades, ship level, boons, dilemmas.
function buildStatPreview(stat, finalMagnitude, weaponDef, weaponMultipliers, globalDamageMult = 1, globalCooldownMult = 1) {
  const dmgMult      = weaponMultipliers.damageMultiplier  ?? 1.0
  const cooldownMult = weaponMultipliers.cooldownMultiplier ?? 1.0
  const areaMult     = weaponMultipliers.areaMultiplier    ?? 1.0
  const kbMult       = weaponMultipliers.knockbackMultiplier ?? 1.0
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
  const eligible = UPGRADE_STATS.filter(s => {
    if (s === 'cooldown' && weaponDef && !(weaponDef.baseCooldown > 0)) return false
    return true
  })
  const effectiveStats = eligible.length > 0 ? eligible : UPGRADE_STATS
  const stat = effectiveStats[Math.floor(Math.random() * effectiveStats.length)]
  const rarity = rollRarity(luckStat)
  const baseMagnitude = UPGRADE_MAGNITUDE_TABLE[rarity][stat]

  // Luck-biased variance ±3%: high luck biases toward the maximum (+3%)
  const u   = Math.random()
  const pow = Math.max(0.1, 1 - luckStat * 0.06)
  const roll = Math.pow(u, pow) * 6 - 3

  const finalMagnitude = baseMagnitude + roll

  const statPreview = (weaponDef && weaponMult)
    ? buildStatPreview(stat, finalMagnitude, weaponDef, weaponMult, globalDamageMult, globalCooldownMult)
    : (() => {
        const sign = finalMagnitude >= 0 ? '+' : ''
        const label = stat.charAt(0).toUpperCase() + stat.slice(1)
        return `${label} ${sign}${finalMagnitude.toFixed(2)}%`
      })()

  return { stat, baseMagnitude, finalMagnitude, rarity, statPreview }
}
