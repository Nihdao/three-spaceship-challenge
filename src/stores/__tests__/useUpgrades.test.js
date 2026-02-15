import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { STORAGE_KEY_UPGRADES } from '../../utils/upgradesStorage.js'

// Mock localStorage for Node test environment
const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}

beforeEach(() => {
  globalThis.localStorage = mockLocalStorage
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

// Dynamic imports after localStorage mock is set up
const { default: useUpgrades } = await import('../useUpgrades.jsx')
const { default: usePlayer } = await import('../usePlayer.jsx')

describe('useUpgrades', () => {
  beforeEach(() => {
    useUpgrades.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
  })

  describe('purchaseUpgrade', () => {
    it('increases level and deducts fragments', () => {
      usePlayer.setState({ fragments: 200 })
      const result = useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      expect(result).toBe(true)
      expect(useUpgrades.getState().upgradeLevels.ATTACK_POWER).toBe(1)
      expect(usePlayer.getState().fragments).toBe(150) // 200 - 50
    })

    it('returns false if not enough fragments', () => {
      usePlayer.setState({ fragments: 10 })
      const result = useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      expect(result).toBe(false)
      expect(useUpgrades.getState().upgradeLevels.ATTACK_POWER).toBeUndefined()
    })

    it('returns false when maxed', () => {
      usePlayer.setState({ fragments: 10000 })
      for (let i = 0; i < 3; i++) {
        useUpgrades.getState().purchaseUpgrade('ZONE')
      }
      expect(useUpgrades.getState().upgradeLevels.ZONE).toBe(3)
      const result = useUpgrades.getState().purchaseUpgrade('ZONE')
      expect(result).toBe(false)
      expect(useUpgrades.getState().upgradeLevels.ZONE).toBe(3)
    })

    it('succeeds when fragments exactly equal cost', () => {
      usePlayer.setState({ fragments: 50 }) // ATTACK_POWER level 1 costs exactly 50
      const result = useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      expect(result).toBe(true)
      expect(useUpgrades.getState().upgradeLevels.ATTACK_POWER).toBe(1)
      expect(usePlayer.getState().fragments).toBe(0)
    })

    it('returns false for unknown upgrade', () => {
      usePlayer.setState({ fragments: 1000 })
      const result = useUpgrades.getState().purchaseUpgrade('NONEXISTENT')
      expect(result).toBe(false)
    })

    it('purchases multiple levels with escalating costs', () => {
      usePlayer.setState({ fragments: 500 })
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER') // cost 50 -> 450
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER') // cost 100 -> 350
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER') // cost 200 -> 150
      expect(useUpgrades.getState().upgradeLevels.ATTACK_POWER).toBe(3)
      expect(usePlayer.getState().fragments).toBe(150)
    })
  })

  describe('getUpgradeLevel', () => {
    it('returns 0 for unpurchased upgrades', () => {
      expect(useUpgrades.getState().getUpgradeLevel('ATTACK_POWER')).toBe(0)
    })

    it('returns current level after purchase', () => {
      usePlayer.setState({ fragments: 200 })
      useUpgrades.getState().purchaseUpgrade('ARMOR')
      expect(useUpgrades.getState().getUpgradeLevel('ARMOR')).toBe(1)
    })
  })

  describe('getTotalFragmentsSpent', () => {
    it('returns 0 with no purchases', () => {
      expect(useUpgrades.getState().getTotalFragmentsSpent()).toBe(0)
    })

    it('sums costs of all purchased levels', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER') // 50
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER') // 100
      useUpgrades.getState().purchaseUpgrade('ZONE') // 40
      expect(useUpgrades.getState().getTotalFragmentsSpent()).toBe(190)
    })
  })

  describe('getComputedBonuses', () => {
    it('returns defaults with no upgrades', () => {
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.attackPower).toBe(1.0)
      expect(bonuses.armor).toBe(0)
      expect(bonuses.maxHP).toBe(0)
      expect(bonuses.regen).toBe(0)
      expect(bonuses.attackSpeed).toBe(1.0)
      expect(bonuses.zone).toBe(1.0)
    })

    it('computes correct attackPower bonus', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.attackPower).toBeCloseTo(1.10)
    })

    it('computes correct armor bonus', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('ARMOR')
      useUpgrades.getState().purchaseUpgrade('ARMOR')
      useUpgrades.getState().purchaseUpgrade('ARMOR')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.armor).toBe(3)
    })

    it('computes correct attackSpeed bonus (reduction)', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('ATTACK_SPEED')
      useUpgrades.getState().purchaseUpgrade('ATTACK_SPEED')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.attackSpeed).toBeCloseTo(0.90)
    })

    it('computes correct zone bonus', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('ZONE')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.zone).toBeCloseTo(1.10)
    })

    it('computes correct maxHP bonus', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('MAX_HP')
      useUpgrades.getState().purchaseUpgrade('MAX_HP')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.maxHP).toBe(20)
    })

    it('computes correct regen bonus', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('REGEN')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.regen).toBeCloseTo(0.2)
    })

    // Story 20.4: Utility stat bonuses
    it('returns utility defaults with no upgrades', () => {
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.magnet).toBe(1.0)
      expect(bonuses.luck).toBe(0.0)
      expect(bonuses.expBonus).toBe(1.0)
      expect(bonuses.curse).toBe(0.0)
    })

    it('computes correct magnet bonus (multiplier)', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('MAGNET')
      useUpgrades.getState().purchaseUpgrade('MAGNET')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.magnet).toBeCloseTo(1.30)
    })

    it('computes correct luck bonus (additive)', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('LUCK')
      useUpgrades.getState().purchaseUpgrade('LUCK')
      useUpgrades.getState().purchaseUpgrade('LUCK')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.luck).toBeCloseTo(0.15)
    })

    it('computes correct expBonus bonus (multiplier)', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('EXP_BONUS')
      useUpgrades.getState().purchaseUpgrade('EXP_BONUS')
      useUpgrades.getState().purchaseUpgrade('EXP_BONUS')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.expBonus).toBeCloseTo(1.15)
    })

    it('computes correct curse bonus (additive)', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('CURSE')
      useUpgrades.getState().purchaseUpgrade('CURSE')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      expect(bonuses.curse).toBeCloseTo(0.20)
    })
  })

  describe('persistence', () => {
    it('saves to localStorage on purchase', () => {
      usePlayer.setState({ fragments: 200 })
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      const stored = JSON.parse(store[STORAGE_KEY_UPGRADES])
      expect(stored.ATTACK_POWER).toBe(1)
    })

    it('clears localStorage on reset', () => {
      usePlayer.setState({ fragments: 200 })
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      useUpgrades.getState().reset()
      const stored = JSON.parse(store[STORAGE_KEY_UPGRADES])
      expect(stored).toEqual({})
    })
  })

  describe('reset', () => {
    it('clears all upgrade levels', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      useUpgrades.getState().purchaseUpgrade('ARMOR')
      useUpgrades.getState().reset()
      expect(useUpgrades.getState().upgradeLevels).toEqual({})
      expect(useUpgrades.getState().getUpgradeLevel('ATTACK_POWER')).toBe(0)
    })
  })
})
