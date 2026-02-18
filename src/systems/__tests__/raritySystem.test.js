import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rollRarity, getRarityTier } from '../raritySystem.js'
import { RARITY_TIERS, BASE_RARITY_PROBABILITIES } from '../../config/rarityDefs.js'

describe('raritySystem - rollRarity', () => {
  it('should always return a valid rarity tier ID', () => {
    const validTiers = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
    for (let i = 0; i < 50; i++) {
      const rarity = rollRarity(0)
      expect(validTiers).toContain(rarity)
    }
  })

  it('should return COMMON for roll=0 with no luck', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const rarity = rollRarity(0)
    expect(rarity).toBe('COMMON')
    vi.restoreAllMocks()
  })

  it('should return LEGENDARY for roll just below 1.0 with no luck', () => {
    // With no luck: COMMON=0.60, RARE=0.25, EPIC=0.12, LEGENDARY=0.03
    // Cumulative: COMMON=0.60, RARE=0.85, EPIC=0.97, LEGENDARY=1.0
    vi.spyOn(Math, 'random').mockReturnValue(0.98)
    const rarity = rollRarity(0)
    expect(rarity).toBe('LEGENDARY')
    vi.restoreAllMocks()
  })

  it('should respect base probabilities at 0 luck (statistical)', () => {
    const results = { COMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 }
    const iterations = 10000

    for (let i = 0; i < iterations; i++) {
      const rarity = rollRarity(0)
      results[rarity]++
    }

    // Allow 3% margin for randomness
    expect(results.COMMON / iterations).toBeCloseTo(BASE_RARITY_PROBABILITIES.COMMON, 1)
    expect(results.RARE / iterations).toBeCloseTo(BASE_RARITY_PROBABILITIES.RARE, 1)
    expect(results.EPIC / iterations).toBeCloseTo(BASE_RARITY_PROBABILITIES.EPIC, 1)
    expect(results.LEGENDARY / iterations).toBeCloseTo(BASE_RARITY_PROBABILITIES.LEGENDARY, 1)
  })

  it('should increase higher rarities with high luck stat', () => {
    const results = { COMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 }
    const iterations = 5000
    const luckStat = 50 // 50% luck

    for (let i = 0; i < iterations; i++) {
      const rarity = rollRarity(luckStat)
      results[rarity]++
    }

    // With 50 luck, COMMON should drop, higher rarities should increase
    expect(results.COMMON / iterations).toBeLessThan(BASE_RARITY_PROBABILITIES.COMMON)
    expect(results.LEGENDARY / iterations).toBeGreaterThan(BASE_RARITY_PROBABILITIES.LEGENDARY)
  })

  it('should handle extreme luck (100) without crashing', () => {
    // Should not throw, should always return a valid tier
    const validTiers = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
    for (let i = 0; i < 20; i++) {
      expect(validTiers).toContain(rollRarity(100))
    }
  })

  it('should handle negative luck gracefully', () => {
    const validTiers = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
    for (let i = 0; i < 20; i++) {
      expect(validTiers).toContain(rollRarity(-10))
    }
  })

  it('should default luckStat to 0 when not provided', () => {
    const validTiers = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
    expect(validTiers).toContain(rollRarity())
  })
})

describe('raritySystem - getRarityTier', () => {
  it('should return correct tier for COMMON', () => {
    const tier = getRarityTier('COMMON')
    expect(tier.id).toBe('COMMON')
    expect(tier.color).toBe('#ffffff')
    expect(tier.bonusMultiplier).toBe(1.0)
    expect(tier.glowIntensity).toBe(0)
  })

  it('should return correct tier for RARE', () => {
    const tier = getRarityTier('RARE')
    expect(tier.id).toBe('RARE')
    expect(tier.color).toBe('#3399ff')
    expect(tier.bonusMultiplier).toBe(1.15)
  })

  it('should return correct tier for EPIC', () => {
    const tier = getRarityTier('EPIC')
    expect(tier.id).toBe('EPIC')
    expect(tier.color).toBe('#9933ff')
    expect(tier.bonusMultiplier).toBe(1.30)
  })

  it('should return correct tier for LEGENDARY', () => {
    const tier = getRarityTier('LEGENDARY')
    expect(tier.id).toBe('LEGENDARY')
    expect(tier.color).toBe('#ffcc00')
    expect(tier.bonusMultiplier).toBe(1.50)
  })

  it('should return COMMON tier for unknown rarity ID', () => {
    const tier = getRarityTier('UNKNOWN')
    expect(tier.id).toBe('COMMON')
  })

  it('should return COMMON tier for undefined input', () => {
    const tier = getRarityTier(undefined)
    expect(tier.id).toBe('COMMON')
  })
})

describe('rarityDefs - RARITY_TIERS structure', () => {
  it('all four tiers exist', () => {
    expect(RARITY_TIERS.COMMON).toBeDefined()
    expect(RARITY_TIERS.RARE).toBeDefined()
    expect(RARITY_TIERS.EPIC).toBeDefined()
    expect(RARITY_TIERS.LEGENDARY).toBeDefined()
  })

  it('base probabilities sum to 1.0', () => {
    const total = Object.values(BASE_RARITY_PROBABILITIES).reduce((sum, p) => sum + p, 0)
    expect(total).toBeCloseTo(1.0, 5)
  })

  it('bonus multipliers increase with rarity', () => {
    expect(RARITY_TIERS.COMMON.bonusMultiplier).toBeLessThan(RARITY_TIERS.RARE.bonusMultiplier)
    expect(RARITY_TIERS.RARE.bonusMultiplier).toBeLessThan(RARITY_TIERS.EPIC.bonusMultiplier)
    expect(RARITY_TIERS.EPIC.bonusMultiplier).toBeLessThan(RARITY_TIERS.LEGENDARY.bonusMultiplier)
  })

  it('glow intensity increases with rarity', () => {
    expect(RARITY_TIERS.COMMON.glowIntensity).toBeLessThan(RARITY_TIERS.RARE.glowIntensity)
    expect(RARITY_TIERS.RARE.glowIntensity).toBeLessThan(RARITY_TIERS.EPIC.glowIntensity)
    expect(RARITY_TIERS.EPIC.glowIntensity).toBeLessThan(RARITY_TIERS.LEGENDARY.glowIntensity)
  })
})
