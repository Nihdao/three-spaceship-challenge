import { describe, it, expect } from 'vitest'
import { PERMANENT_UPGRADES, getNextLevelCost, getTotalBonus } from '../permanentUpgradesDefs.js'

describe('permanentUpgradesDefs', () => {
  const upgradeIds = Object.keys(PERMANENT_UPGRADES)

  it('defines exactly 6 combat stat upgrades', () => {
    expect(upgradeIds).toHaveLength(6)
    expect(upgradeIds).toEqual(
      expect.arrayContaining(['ATTACK_POWER', 'ARMOR', 'MAX_HP', 'REGEN', 'ATTACK_SPEED', 'ZONE'])
    )
  })

  it.each(upgradeIds)('%s has valid structure', (id) => {
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

  it.each(upgradeIds)('%s levels have cost and bonus', (id) => {
    const upgrade = PERMANENT_UPGRADES[id]
    for (let i = 0; i < upgrade.levels.length; i++) {
      const level = upgrade.levels[i]
      expect(level.level).toBe(i + 1)
      expect(typeof level.cost).toBe('number')
      expect(level.cost).toBeGreaterThan(0)
      expect(typeof level.bonus).toBe('number')
      expect(level.bonus).toBeGreaterThan(0)
    }
  })

  it.each(upgradeIds)('%s has escalating costs', (id) => {
    const upgrade = PERMANENT_UPGRADES[id]
    for (let i = 1; i < upgrade.levels.length; i++) {
      expect(upgrade.levels[i].cost).toBeGreaterThan(upgrade.levels[i - 1].cost)
    }
  })

  it('ATTACK_POWER and ARMOR have 5 levels', () => {
    expect(PERMANENT_UPGRADES.ATTACK_POWER.maxLevel).toBe(5)
    expect(PERMANENT_UPGRADES.ARMOR.maxLevel).toBe(5)
  })

  it('MAX_HP, REGEN, ATTACK_SPEED, ZONE have 3 levels', () => {
    expect(PERMANENT_UPGRADES.MAX_HP.maxLevel).toBe(3)
    expect(PERMANENT_UPGRADES.REGEN.maxLevel).toBe(3)
    expect(PERMANENT_UPGRADES.ATTACK_SPEED.maxLevel).toBe(3)
    expect(PERMANENT_UPGRADES.ZONE.maxLevel).toBe(3)
  })

  describe('getNextLevelCost', () => {
    it('returns cost for next level', () => {
      expect(getNextLevelCost('ATTACK_POWER', 0)).toBe(50)
      expect(getNextLevelCost('ATTACK_POWER', 1)).toBe(100)
    })

    it('returns null when maxed', () => {
      expect(getNextLevelCost('ATTACK_POWER', 5)).toBeNull()
    })

    it('returns null for unknown upgrade', () => {
      expect(getNextLevelCost('NONEXISTENT', 0)).toBeNull()
    })
  })

  describe('getTotalBonus', () => {
    it('returns cumulative bonus', () => {
      // ATTACK_POWER: each level adds +0.05
      expect(getTotalBonus('ATTACK_POWER', 3)).toBeCloseTo(0.15)
    })

    it('returns 0 for level 0', () => {
      expect(getTotalBonus('ATTACK_POWER', 0)).toBe(0)
    })

    it('clamps to maxLevel', () => {
      expect(getTotalBonus('ATTACK_POWER', 10)).toBeCloseTo(0.25)
    })

    it('returns 0 for unknown upgrade', () => {
      expect(getTotalBonus('NONEXISTENT', 1)).toBe(0)
    })
  })
})
