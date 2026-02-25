import { describe, it, expect, vi, afterEach } from 'vitest'
import { rollUpgrade } from '../upgradeSystem.js'

const VALID_STATS = ['damage', 'area', 'cooldown', 'knockback', 'crit']
const VALID_RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']

describe('upgradeSystem — rollUpgrade', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns an object with { stat, baseMagnitude, finalMagnitude, rarity, statPreview }', () => {
    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result).toHaveProperty('stat')
    expect(result).toHaveProperty('baseMagnitude')
    expect(result).toHaveProperty('finalMagnitude')
    expect(result).toHaveProperty('rarity')
    expect(result).toHaveProperty('statPreview')
  })

  it('stat is one of the 5 valid stats', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollUpgrade('LASER_FRONT', 0)
      expect(VALID_STATS).toContain(result.stat)
    }
  })

  it('rarity is one of COMMON | RARE | EPIC | LEGENDARY', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollUpgrade('LASER_FRONT', 0)
      expect(VALID_RARITIES).toContain(result.rarity)
    }
  })

  it('damage COMMON finalMagnitude is between 5 and 11 (8 ± 3)', () => {
    // Force stat = 'damage' (index 0) and rarity = COMMON, variance u = 0.5
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)    // stat index 0 → 'damage'
      .mockReturnValueOnce(0)    // rarity roll → COMMON (0 < COMMON threshold)
      .mockReturnValueOnce(0.5)  // variance u = 0.5 → roll ≈ 0 → finalMagnitude ≈ baseMagnitude

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('damage')
    expect(result.rarity).toBe('COMMON')
    expect(result.finalMagnitude).toBeGreaterThanOrEqual(5)
    expect(result.finalMagnitude).toBeLessThanOrEqual(11)
  })

  it('cooldown COMMON finalMagnitude is between -9 and -3', () => {
    // stat index = Math.floor(u * 5); u ∈ [0.4, 0.6) → index 2 → 'cooldown'
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.4)   // stat index 2 → 'cooldown'
      .mockReturnValueOnce(0)     // rarity → COMMON
      .mockReturnValueOnce(0.5)   // variance u = 0.5

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('cooldown')
    expect(result.rarity).toBe('COMMON')
    expect(result.finalMagnitude).toBeGreaterThanOrEqual(-9)
    expect(result.finalMagnitude).toBeLessThanOrEqual(-3)
  })

  it('crit finalMagnitude >= baseMagnitude (never below floor)', () => {
    // Force crit stat, worst case variance (u=0 → roll = -3)
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.8)  // stat index 4 → 'crit'
      .mockReturnValueOnce(0)    // rarity → COMMON (baseMagnitude = 1.5)
      .mockReturnValueOnce(0)    // u = 0 → roll = 0^1 * 6 - 3 = -3 → crit floor kicks in

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('crit')
    expect(result.finalMagnitude).toBeGreaterThanOrEqual(result.baseMagnitude)
  })

  it('statPreview matches format regex', () => {
    const regex = /^(Damage|Area|Cooldown|Knockback|Crit) [+-]\d+(\.\d+)?%$/
    for (let i = 0; i < 30; i++) {
      const result = rollUpgrade('LASER_FRONT', 0)
      expect(result.statPreview).toMatch(regex)
    }
  })

  it('LEGENDARY damage: baseMagnitude = 40', () => {
    // Force damage stat and highest rarity roll → LEGENDARY
    // With luck=0: COMMON~60%, RARE~25%, EPIC~10%, LEGENDARY~5%
    // u ≥ 0.95 → LEGENDARY
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)     // stat index 0 → 'damage'
      .mockReturnValueOnce(0.999) // rarity roll → LEGENDARY
      .mockReturnValueOnce(1.0)   // variance u = 1.0 → max roll

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('damage')
    expect(result.rarity).toBe('LEGENDARY')
    expect(result.baseMagnitude).toBe(40)
  })

  it('baseMagnitude matches magnitude table for all stat/rarity combos (sampling)', () => {
    const expectedTable = {
      COMMON:    { damage: 8,  area: 6,  cooldown: -6,  knockback: 10, crit: 1.5 },
      RARE:      { damage: 15, area: 12, cooldown: -12, knockback: 20, crit: 2.5 },
      EPIC:      { damage: 25, area: 20, cooldown: -20, knockback: 35, crit: 4   },
      LEGENDARY: { damage: 40, area: 32, cooldown: -30, knockback: 55, crit: 7   },
    }

    const seen = new Set()
    for (let i = 0; i < 1000; i++) {
      const result = rollUpgrade('LASER_FRONT', 0)
      const key = `${result.rarity}_${result.stat}`
      if (!seen.has(key)) {
        seen.add(key)
        const expected = expectedTable[result.rarity]?.[result.stat]
        if (expected !== undefined) {
          expect(result.baseMagnitude).toBe(expected)
        }
      }
    }
    // Should have seen at least some combos
    expect(seen.size).toBeGreaterThan(0)
  })

  it('finalMagnitude for non-crit stats can be below baseMagnitude (variance)', () => {
    // Force damage stat, COMMON rarity, variance u=0 → roll = -3
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)    // stat → 'damage'
      .mockReturnValueOnce(0)    // rarity → COMMON
      .mockReturnValueOnce(0)    // u = 0 → roll = -3

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('damage')
    // baseMagnitude=8, roll=-3 → finalMagnitude=5
    expect(result.finalMagnitude).toBeCloseTo(5, 1)
  })

  it('statPreview contains the stat name capitalized (no rarity label, Story 31.2)', () => {
    for (let i = 0; i < 10; i++) {
      const result = rollUpgrade('LASER_FRONT', 0)
      const statLabel = result.stat.charAt(0).toUpperCase() + result.stat.slice(1)
      expect(result.statPreview).toContain(statLabel)
      // Story 31.2: rarity name is NOT in statPreview (rarity is in upgradeResult.rarity field)
      const rarityName = result.rarity.charAt(0) + result.rarity.slice(1).toLowerCase()
      expect(result.statPreview).not.toContain(rarityName)
    }
  })
})
