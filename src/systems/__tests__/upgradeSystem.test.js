import { describe, it, expect, vi, afterEach } from 'vitest'
import { rollUpgrade } from '../upgradeSystem.js'
import { WEAPONS } from '../../entities/weaponDefs.js'

const VALID_STATS = ['damage', 'area', 'cooldown', 'knockback']
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

  it('stat is one of the 4 valid stats', () => {
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

  it('damage COMMON finalMagnitude is between 7 and 13 (10 ± 3)', () => {
    // Force stat = 'damage' (index 0) and rarity = COMMON, variance u = 0.5
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)    // stat index 0 → 'damage'
      .mockReturnValueOnce(0)    // rarity roll → COMMON (0 < COMMON threshold)
      .mockReturnValueOnce(0.5)  // variance u = 0.5 → roll ≈ 0 → finalMagnitude ≈ baseMagnitude

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('damage')
    expect(result.rarity).toBe('COMMON')
    expect(result.finalMagnitude).toBeGreaterThanOrEqual(7)
    expect(result.finalMagnitude).toBeLessThanOrEqual(13)
  })

  it('cooldown COMMON finalMagnitude is between -11 and -5 (-8 ± 3)', () => {
    // stat index = Math.floor(u * 4); u ∈ [0.5, 0.75) → index 2 → 'cooldown'
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)   // stat index 2 → 'cooldown'
      .mockReturnValueOnce(0)     // rarity → COMMON
      .mockReturnValueOnce(0.5)   // variance u = 0.5

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('cooldown')
    expect(result.rarity).toBe('COMMON')
    expect(result.finalMagnitude).toBeGreaterThanOrEqual(-11)
    expect(result.finalMagnitude).toBeLessThanOrEqual(-5)
  })

  it('statPreview matches format regex', () => {
    const regex = /^(Damage|Area|Cooldown|Knockback) [+-]\d+(\.\d+)?%$/
    for (let i = 0; i < 30; i++) {
      const result = rollUpgrade('LASER_FRONT', 0)
      expect(result.statPreview).toMatch(regex)
    }
  })

  it('LEGENDARY damage: baseMagnitude = 45', () => {
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
    expect(result.baseMagnitude).toBe(45)
  })

  it('baseMagnitude matches magnitude table for all stat/rarity combos (sampling)', () => {
    const expectedTable = {
      COMMON:    { damage: 10, area:  8, cooldown:  -8, knockback: 12 },
      RARE:      { damage: 18, area: 14, cooldown: -12, knockback: 22 },
      EPIC:      { damage: 28, area: 22, cooldown: -18, knockback: 35 },
      LEGENDARY: { damage: 45, area: 32, cooldown: -22, knockback: 50 },
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

  it('finalMagnitude can be below baseMagnitude (variance)', () => {
    // Force damage stat, COMMON rarity, variance u=0 → roll = -3
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)    // stat → 'damage'
      .mockReturnValueOnce(0)    // rarity → COMMON
      .mockReturnValueOnce(0)    // u = 0 → roll = -3

    const result = rollUpgrade('LASER_FRONT', 0)
    expect(result.stat).toBe('damage')
    // baseMagnitude=10, roll=-3 → finalMagnitude=7
    expect(result.finalMagnitude).toBe(7)
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

  describe('buildStatPreview via weaponDef path', () => {
    const weaponDef = { baseDamage: 10, baseCooldown: 0.5, projectileRadius: 1 }
    const weaponMult = {
      damageMultiplier: 1.0,
      cooldownMultiplier: 1.0,
      areaMultiplier: 1.0,
      knockbackMultiplier: 1.0,
    }

    it('damage stat: statPreview shows "Damage  cur → nxt" absolute values (no %)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)    // stat index 0 → 'damage'
        .mockReturnValueOnce(0)    // rarity → COMMON (baseMagnitude=10)
        .mockReturnValueOnce(0.5)  // variance u=0.5 → roll=0 → finalMagnitude=10

      const result = rollUpgrade('LASER_FRONT', 0, weaponDef, weaponMult)
      // cur = 10 * 1.0 * 1 = 10, nxt = 10 * (1.0 * 1.10) * 1 = 11
      expect(result.statPreview).toBe('Damage  10 → 11')
    })

    it('cooldown stat: statPreview shows "Fire rate  Xs → Ys" format', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // stat index 2 → 'cooldown'
        .mockReturnValueOnce(0)    // rarity → COMMON (baseMagnitude=-8)
        .mockReturnValueOnce(0.5)  // variance u=0.5 → roll=0 → finalMagnitude=-8

      const result = rollUpgrade('LASER_FRONT', 0, weaponDef, weaponMult)
      // nxtMult = max(0.15, 1.0 * 0.85) = 0.85; cur=0.50s, nxt=0.50*0.85=0.425s
      expect(result.statPreview).toMatch(/^Fire rate  0\.50s → 0\.\d{2}s$/)
    })

    it('area stat: statPreview shows "Radius  cur → nxt" format', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.25)  // stat index 1 → 'area'
        .mockReturnValueOnce(0)     // rarity → COMMON (baseMagnitude=8)
        .mockReturnValueOnce(0.5)   // variance u=0.5 → roll=0 → finalMagnitude=8

      const result = rollUpgrade('LASER_FRONT', 0, weaponDef, weaponMult)
      // cur = 1 * 1.0 = 1.0, nxt = 1.0 * 1.08 ≈ 1.1
      expect(result.statPreview).toMatch(/^Radius  1\.0 → 1\.\d+$/)
    })

    it('knockback stat: statPreview shows "Knockback  cur× → nxt×" format', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.75)  // stat index 3 → 'knockback'
        .mockReturnValueOnce(0)     // rarity → COMMON (baseMagnitude=12)
        .mockReturnValueOnce(0.5)   // variance u=0.5 → roll=0 → finalMagnitude=12

      const result = rollUpgrade('LASER_FRONT', 0, weaponDef, weaponMult)
      // kbMult=1.0, nxt = 1.0 * 1.12 = 1.12
      expect(result.statPreview).toBe('Knockback  1.00× → 1.12×')
    })
  })

  describe('eligible stat filter (AC#1–4)', () => {
    const defaultMult = {
      damageMultiplier: 1,
      cooldownMultiplier: 1,
      areaMultiplier: 1,
      knockbackMultiplier: 1,
      critBonus: 0,
    }

    it('AURA weapon never rolls cooldown stat (no baseCooldown)', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollUpgrade('AURA', 0, WEAPONS.AURA, defaultMult)
        expect(result.stat).not.toBe('cooldown')
        expect(result.statPreview).not.toMatch(/NaN/)
      }
    })

    it('MINE_AROUND weapon never rolls cooldown stat (no baseCooldown)', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollUpgrade('MINE_AROUND', 0, WEAPONS.MINE_AROUND, defaultMult)
        expect(result.stat).not.toBe('cooldown')
        expect(result.statPreview).not.toMatch(/NaN/)
      }
    })

    it('weapon with baseCooldown > 0 keeps cooldown eligible (AC#4)', () => {
      // Force stat index 2 in a 4-element array → 'cooldown' (not filtered)
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // effectiveStats has 4 elements (cooldown included), index 2 → 'cooldown'
        .mockReturnValueOnce(0)    // rarity → COMMON
        .mockReturnValueOnce(0.5)  // variance

      const weaponWithCooldown = { baseDamage: 10, baseCooldown: 0.5, projectileRadius: 1 }
      const result = rollUpgrade('LASER_FRONT', 0, weaponWithCooldown, defaultMult)
      expect(result.stat).toBe('cooldown')
    })

    it('null weaponDef does not filter cooldown (AC#2)', () => {
      // With null weaponDef, all 4 stats remain eligible
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // index 2 → 'cooldown' (no filter when weaponDef=null)
        .mockReturnValueOnce(0)    // rarity → COMMON
        .mockReturnValueOnce(0.5)  // variance

      const result = rollUpgrade('LASER_FRONT', 0)
      expect(result.stat).toBe('cooldown')
    })
  })
})
