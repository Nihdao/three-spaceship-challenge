import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SHIPS } from '../../entities/shipDefs.js'

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
  mockLocalStorage.clear()
})

// Dynamic imports after localStorage mock is set up
const { default: useUpgrades } = await import('../../stores/useUpgrades.jsx')
const { default: usePlayer } = await import('../../stores/usePlayer.jsx')

/**
 * Computes effectiveStats by combining ship base stats + permanent upgrade bonuses.
 * This is the core logic that ShipSelect.jsx will use to display enriched stats.
 */
function computeEffectiveStats(shipId) {
  const ship = SHIPS[shipId]
  const bonuses = useUpgrades.getState().getComputedBonuses()

  const shipBaseStats = {
    maxHP: ship.baseHP,
    speed: ship.baseSpeed,
    damageMultiplier: ship.baseDamageMultiplier,
    regen: ship.baseRegen ?? 0,
    armor: ship.baseArmor ?? 0,
    attackSpeed: ship.baseAttackSpeed ?? 0,
    zone: ship.baseZone ?? 0,
    magnet: ship.baseMagnet ?? 0,
    luck: ship.baseLuck ?? 0,
    expBonus: ship.baseExpBonus ?? 0,
    curse: ship.baseCurse ?? 0,
    revival: ship.baseRevival ?? 0,
    reroll: ship.baseReroll ?? 0,
    skip: ship.baseSkip ?? 0,
    banish: ship.baseBanish ?? 0,
  }

  // For multiplier stats (attackPower, zone, magnet, expBonus, attackSpeed):
  // - If bonuses are RELATIVE (>1.0 means +10%, etc.), we show the DELTA
  // - For display purposes, bonusValue = (bonuses.magnet - 1.0) when showing badge
  // - effectiveStats shows the final multiplied/added value

  const effectiveStats = {
    maxHP: shipBaseStats.maxHP + (bonuses.maxHP ?? 0),
    speed: shipBaseStats.speed,
    damageMultiplier: shipBaseStats.damageMultiplier * (bonuses.attackPower ?? 1.0),
    regen: shipBaseStats.regen + (bonuses.regen ?? 0),
    armor: shipBaseStats.armor + (bonuses.armor ?? 0),
    attackSpeed: 1.0 - (bonuses.attackSpeed ?? 1.0), // Attack speed bonus inverted (1.0 - 0.9 = 0.1 = 10% faster)
    zone: (bonuses.zone ?? 1.0) - 1.0, // Convert multiplier to percentage (1.2 - 1.0 = 0.2 = 20%)
    magnet: (bonuses.magnet ?? 1.0) - 1.0, // Convert multiplier to percentage
    luck: shipBaseStats.luck + (bonuses.luck ?? 0),
    expBonus: (bonuses.expBonus ?? 1.0) - 1.0, // Convert multiplier to percentage
    curse: shipBaseStats.curse + (bonuses.curse ?? 0),
    revival: shipBaseStats.revival + (bonuses.revival ?? 0),
    reroll: shipBaseStats.reroll + (bonuses.reroll ?? 0),
    skip: shipBaseStats.skip + (bonuses.skip ?? 0),
    banish: shipBaseStats.banish + (bonuses.banish ?? 0),
  }

  return { shipBaseStats, effectiveStats, bonuses }
}

describe('ShipSelect — Enriched Stats Display Logic (Story 20.7)', () => {
  beforeEach(() => {
    useUpgrades.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
  })

  describe('Task 1: Compute effectiveStats from ship base + permanent bonuses', () => {
    it('should combine ship base stats with permanent upgrade bonuses', () => {
      const shipId = 'BALANCED'
      const ship = SHIPS[shipId]

      // Purchase upgrades to create bonuses
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('MAX_HP')
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')

      const { effectiveStats, bonuses } = computeEffectiveStats(shipId)

      expect(effectiveStats.maxHP).toBe(ship.baseHP + bonuses.maxHP)
      expect(effectiveStats.damageMultiplier).toBeGreaterThan(ship.baseDamageMultiplier)
    })

    it('should handle case where no permanent upgrades exist (bonuses = defaults)', () => {
      const shipId = 'BALANCED'
      const ship = SHIPS[shipId]

      const { effectiveStats } = computeEffectiveStats(shipId)

      expect(effectiveStats.maxHP).toBe(ship.baseHP) // No bonus
      expect(effectiveStats.armor).toBe(0) // Default to 0
      expect(effectiveStats.regen).toBe(0) // Default to 0
    })
  })

  describe('Task 2 & 4: Handle all 15 stats with defaults for undefined ship stats', () => {
    it('should default to 0 for stats not defined on ship (armor, regen, meta stats)', () => {
      const shipId = 'BALANCED'
      const ship = SHIPS[shipId]

      // Ships only define baseHP, baseSpeed, baseDamageMultiplier
      expect(ship.baseArmor).toBeUndefined()
      expect(ship.baseRegen).toBeUndefined()
      expect(ship.baseRevival).toBeUndefined()

      const { shipBaseStats } = computeEffectiveStats(shipId)

      expect(shipBaseStats.armor).toBe(0)
      expect(shipBaseStats.regen).toBe(0)
      expect(shipBaseStats.revival).toBe(0)
      expect(shipBaseStats.reroll).toBe(0)
      expect(shipBaseStats.skip).toBe(0)
      expect(shipBaseStats.banish).toBe(0)
      expect(shipBaseStats.magnet).toBe(0)
      expect(shipBaseStats.luck).toBe(0)
      expect(shipBaseStats.expBonus).toBe(0)
      expect(shipBaseStats.curse).toBe(0)
    })

    it('should add permanent bonuses to default 0 values correctly', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('ARMOR')
      useUpgrades.getState().purchaseUpgrade('REVIVAL')

      const { effectiveStats, bonuses } = computeEffectiveStats('BALANCED')

      expect(effectiveStats.armor).toBe(0 + bonuses.armor) // base 0 + bonus
      expect(effectiveStats.revival).toBe(0 + bonuses.revival) // base 0 + bonus
    })

    it('should compute all 15 stats correctly', () => {
      const { effectiveStats } = computeEffectiveStats('BALANCED')

      // Verify all 15 stats are present
      expect(effectiveStats).toHaveProperty('maxHP')
      expect(effectiveStats).toHaveProperty('speed')
      expect(effectiveStats).toHaveProperty('damageMultiplier')
      expect(effectiveStats).toHaveProperty('regen')
      expect(effectiveStats).toHaveProperty('armor')
      expect(effectiveStats).toHaveProperty('attackSpeed')
      expect(effectiveStats).toHaveProperty('zone')
      expect(effectiveStats).toHaveProperty('magnet')
      expect(effectiveStats).toHaveProperty('luck')
      expect(effectiveStats).toHaveProperty('expBonus')
      expect(effectiveStats).toHaveProperty('curse')
      expect(effectiveStats).toHaveProperty('revival')
      expect(effectiveStats).toHaveProperty('reroll')
      expect(effectiveStats).toHaveProperty('skip')
      expect(effectiveStats).toHaveProperty('banish')
    })
  })

  describe('Task 3: Identify when bonuses exist for visual differentiation', () => {
    it('should identify which stats have bonuses > 0 for visual indicators', () => {
      usePlayer.setState({ fragments: 1000 })
      useUpgrades.getState().purchaseUpgrade('MAX_HP')
      useUpgrades.getState().purchaseUpgrade('MAGNET')
      useUpgrades.getState().purchaseUpgrade('REVIVAL')

      const { bonuses } = computeEffectiveStats('BALANCED')

      expect(bonuses.maxHP).toBeGreaterThan(0) // Should show green badge
      expect(bonuses.magnet).toBeGreaterThan(1.0) // Should show green badge
      expect(bonuses.revival).toBeGreaterThan(0) // Should show green badge
      expect(bonuses.armor).toBe(0) // Should NOT show badge
    })

    it('should identify NO bonuses when no upgrades purchased', () => {
      const { bonuses } = computeEffectiveStats('BALANCED')

      expect(bonuses.maxHP).toBe(0)
      expect(bonuses.armor).toBe(0)
      expect(bonuses.regen).toBe(0)
      expect(bonuses.revival).toBe(0)
      // Multipliers default to 1.0 (no bonus)
      expect(bonuses.attackPower).toBe(1.0)
      expect(bonuses.zone).toBe(1.0)
    })
  })

  describe('Integration: Multiple upgrades across all stat categories', () => {
    it('should compute effectiveStats correctly with bonuses across Combat, Utility, Meta stats', () => {
      usePlayer.setState({ fragments: 10000 })

      // Combat stats
      useUpgrades.getState().purchaseUpgrade('MAX_HP')
      useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
      useUpgrades.getState().purchaseUpgrade('ARMOR')
      useUpgrades.getState().purchaseUpgrade('REGEN')
      useUpgrades.getState().purchaseUpgrade('ATTACK_SPEED')
      useUpgrades.getState().purchaseUpgrade('ZONE')

      // Utility stats
      useUpgrades.getState().purchaseUpgrade('MAGNET')
      useUpgrades.getState().purchaseUpgrade('LUCK')
      useUpgrades.getState().purchaseUpgrade('EXP_BONUS')
      useUpgrades.getState().purchaseUpgrade('CURSE')

      // Meta stats
      useUpgrades.getState().purchaseUpgrade('REVIVAL')
      useUpgrades.getState().purchaseUpgrade('REROLL')
      useUpgrades.getState().purchaseUpgrade('SKIP')
      useUpgrades.getState().purchaseUpgrade('BANISH')

      const { effectiveStats, shipBaseStats, bonuses } = computeEffectiveStats('BALANCED')

      // Combat stats verified
      expect(effectiveStats.maxHP).toBe(shipBaseStats.maxHP + bonuses.maxHP)
      expect(effectiveStats.armor).toBe(shipBaseStats.armor + bonuses.armor)
      expect(effectiveStats.regen).toBe(shipBaseStats.regen + bonuses.regen)
      expect(effectiveStats.damageMultiplier).toBeGreaterThan(shipBaseStats.damageMultiplier)

      // Utility stats verified (multipliers converted to percentages)
      expect(effectiveStats.magnet).toBeGreaterThan(0) // bonuses.magnet > 1.0, so (1.X - 1.0) > 0
      expect(effectiveStats.luck).toBeGreaterThan(shipBaseStats.luck)
      expect(effectiveStats.expBonus).toBeGreaterThan(0) // bonuses.expBonus > 1.0, so (1.X - 1.0) > 0
      expect(effectiveStats.curse).toBeGreaterThan(shipBaseStats.curse)

      // Meta stats verified
      expect(effectiveStats.revival).toBeGreaterThan(shipBaseStats.revival)
      expect(effectiveStats.reroll).toBeGreaterThan(shipBaseStats.reroll)
      expect(effectiveStats.skip).toBeGreaterThan(shipBaseStats.skip)
      expect(effectiveStats.banish).toBeGreaterThan(shipBaseStats.banish)
    })
  })
})
