import { describe, it, expect } from 'vitest'
import { PERMANENT_UPGRADES, getNextLevelCost, getTotalBonus } from '../permanentUpgradesDefs.js'

describe('permanentUpgradesDefs — meta stats (Story 20.5)', () => {
  const META_IDS = ['REVIVAL', 'REROLL', 'SKIP', 'BANISH']

  it('defines exactly 14 upgrades (6 combat + 4 utility + 4 meta)', () => {
    expect(Object.keys(PERMANENT_UPGRADES)).toHaveLength(14)
  })

  it('includes all 4 meta upgrade IDs', () => {
    expect(Object.keys(PERMANENT_UPGRADES)).toEqual(
      expect.arrayContaining(META_IDS)
    )
  })

  it.each(META_IDS)('%s has valid structure', (id) => {
    const upgrade = PERMANENT_UPGRADES[id]
    expect(upgrade.id).toBe(id)
    expect(typeof upgrade.name).toBe('string')
    expect(typeof upgrade.description).toBe('string')
    expect(typeof upgrade.icon).toBe('string')
    expect(upgrade.icon.length).toBeGreaterThan(0)
    expect(typeof upgrade.maxLevel).toBe('number')
    expect(upgrade.maxLevel).toBeGreaterThan(0)
    expect(upgrade.levels).toHaveLength(upgrade.maxLevel)
  })

  it.each(META_IDS)('%s levels have cost and bonus', (id) => {
    const upgrade = PERMANENT_UPGRADES[id]
    for (let i = 0; i < upgrade.levels.length; i++) {
      const level = upgrade.levels[i]
      expect(level.level).toBe(i + 1)
      expect(typeof level.cost).toBe('number')
      expect(level.cost).toBeGreaterThan(0)
      expect(level.bonus).toBe(1) // Meta stats always +1 per level
    }
  })

  it.each(META_IDS)('%s has escalating costs', (id) => {
    const upgrade = PERMANENT_UPGRADES[id]
    for (let i = 1; i < upgrade.levels.length; i++) {
      expect(upgrade.levels[i].cost).toBeGreaterThan(upgrade.levels[i - 1].cost)
    }
  })

  it('REVIVAL has 2 levels', () => {
    expect(PERMANENT_UPGRADES.REVIVAL.maxLevel).toBe(2)
    expect(PERMANENT_UPGRADES.REVIVAL.levels).toHaveLength(2)
  })

  it('REROLL has 3 levels', () => {
    expect(PERMANENT_UPGRADES.REROLL.maxLevel).toBe(3)
    expect(PERMANENT_UPGRADES.REROLL.levels).toHaveLength(3)
  })

  it('SKIP has 3 levels', () => {
    expect(PERMANENT_UPGRADES.SKIP.maxLevel).toBe(3)
    expect(PERMANENT_UPGRADES.SKIP.levels).toHaveLength(3)
  })

  it('BANISH has 3 levels', () => {
    expect(PERMANENT_UPGRADES.BANISH.maxLevel).toBe(3)
    expect(PERMANENT_UPGRADES.BANISH.levels).toHaveLength(3)
  })

  it('meta stats total Fragment cost is 8150', () => {
    let total = 0
    for (const id of META_IDS) {
      for (const level of PERMANENT_UPGRADES[id].levels) {
        total += level.cost
      }
    }
    expect(total).toBe(8150)
  })

  it('meta stats are more expensive than combat/utility stats', () => {
    const combatUtilityIds = ['ATTACK_POWER', 'ARMOR', 'MAX_HP', 'REGEN', 'ATTACK_SPEED', 'ZONE', 'MAGNET', 'LUCK', 'EXP_BONUS', 'CURSE']
    let combatUtilityTotal = 0
    for (const id of combatUtilityIds) {
      for (const level of PERMANENT_UPGRADES[id].levels) {
        combatUtilityTotal += level.cost
      }
    }
    let metaTotal = 0
    for (const id of META_IDS) {
      for (const level of PERMANENT_UPGRADES[id].levels) {
        metaTotal += level.cost
      }
    }
    expect(metaTotal).toBeGreaterThan(combatUtilityTotal)
  })

  describe('getNextLevelCost — meta stats', () => {
    it('returns cost for REVIVAL level 1', () => {
      expect(getNextLevelCost('REVIVAL', 0)).toBe(500)
    })

    it('returns null when REVIVAL maxed (level 2)', () => {
      expect(getNextLevelCost('REVIVAL', 2)).toBeNull()
    })

    it('returns cost for REROLL level 2', () => {
      expect(getNextLevelCost('REROLL', 1)).toBe(600)
    })
  })

  describe('getTotalBonus — meta stats', () => {
    it('REVIVAL cumulative bonus at max is 2', () => {
      expect(getTotalBonus('REVIVAL', 2)).toBe(2)
    })

    it('REROLL cumulative bonus at max is 3', () => {
      expect(getTotalBonus('REROLL', 3)).toBe(3)
    })

    it('SKIP cumulative bonus at level 1 is 1', () => {
      expect(getTotalBonus('SKIP', 1)).toBe(1)
    })

    it('BANISH cumulative bonus at max is 3', () => {
      expect(getTotalBonus('BANISH', 3)).toBe(3)
    })
  })
})
