// Story 31.2: Rarity tests rewritten — rarity no longer scales addWeapon damage.
// upgradeWeapon now accepts { stat, finalMagnitude, rarity } object.
import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

describe('useWeapons — multiplier-based upgrade system (Story 31.2)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().initializeWeapons()
  })

  it('addWeapon initializes multipliers to defaults (no damage scaling by rarity)', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'RARE')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    expect(weapon).toBeDefined()
    expect(weapon.multipliers).toEqual({
      damageMultiplier: 1.0,
      areaMultiplier: 1.0,
      cooldownMultiplier: 1.0,
      knockbackMultiplier: 1.0,
      critBonus: 0,
    })
  })

  it('addWeapon with any rarity does not create overrides (no damage scaling)', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'LEGENDARY')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    expect(weapon.overrides).toBeUndefined()
  })

  it('addWeapon defaults work without rarity parameter', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    expect(weapon).toBeDefined()
    expect(weapon.multipliers.damageMultiplier).toBe(1.0)
  })

  it('upgradeWeapon with damage upgradeResult increments damageMultiplier', () => {
    const upgradeResult = { stat: 'damage', finalMagnitude: 8, rarity: 'COMMON' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    expect(weapon.level).toBe(2)
    // damageMultiplier *= (1 + 8/100) = 1.08
    expect(weapon.multipliers.damageMultiplier).toBeCloseTo(1.08, 5)
  })

  it('upgradeWeapon with area upgradeResult increments areaMultiplier', () => {
    const upgradeResult = { stat: 'area', finalMagnitude: 6, rarity: 'COMMON' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    expect(weapon.multipliers.areaMultiplier).toBeCloseTo(1.06, 5)
  })

  it('upgradeWeapon with cooldown upgradeResult decrements cooldownMultiplier', () => {
    const upgradeResult = { stat: 'cooldown', finalMagnitude: -6, rarity: 'COMMON' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    // cooldownMultiplier *= (1 + (-6)/100) = 0.94
    expect(weapon.multipliers.cooldownMultiplier).toBeCloseTo(0.94, 5)
  })

  it('upgradeWeapon with knockback upgradeResult increments knockbackMultiplier', () => {
    const upgradeResult = { stat: 'knockback', finalMagnitude: 10, rarity: 'COMMON' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    expect(weapon.multipliers.knockbackMultiplier).toBeCloseTo(1.10, 5)
  })

  it('upgradeWeapon with crit upgradeResult adds to critBonus', () => {
    const upgradeResult = { stat: 'crit', finalMagnitude: 1.5, rarity: 'COMMON' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    // critBonus += 1.5/100 = 0.015
    expect(weapon.multipliers.critBonus).toBeCloseTo(0.015, 5)
  })

  it('upgradeWeapon cooldown clamps multiplier to 0.15 floor', () => {
    // Apply 10 massive LEGENDARY cooldown upgrades
    const upgradeResult = { stat: 'cooldown', finalMagnitude: -30, rarity: 'LEGENDARY' }
    for (let i = 0; i < 8; i++) {
      useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    }
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    expect(weapon.multipliers.cooldownMultiplier).toBeGreaterThanOrEqual(0.15)
  })

  it('upgradeWeapon crit clamps critBonus so def.critChance + critBonus <= 1.0', () => {
    const def = WEAPONS['LASER_FRONT']
    // Apply many crit upgrades
    const upgradeResult = { stat: 'crit', finalMagnitude: 7, rarity: 'LEGENDARY' }
    for (let i = 0; i < 20; i++) {
      useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    }
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    expect(weapon.multipliers.critBonus).toBeLessThanOrEqual(1.0 - (def.critChance ?? 0))
  })

  it('upgradeWeapon stores rarity from upgradeResult', () => {
    const upgradeResult = { stat: 'damage', finalMagnitude: 15, rarity: 'RARE' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    expect(weapon.rarity).toBe('RARE')
  })

  it('upgradeWeapon accumulates multipliers across multiple upgrades', () => {
    // 3 COMMON damage upgrades: 1.08^3 ≈ 1.2597
    const upgradeResult = { stat: 'damage', finalMagnitude: 8, rarity: 'COMMON' }
    for (let i = 0; i < 3; i++) {
      useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    }
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    expect(weapon.multipliers.damageMultiplier).toBeCloseTo(1.08 * 1.08 * 1.08, 5)
  })

  it('tick() fires projectile with damageMultiplier applied', () => {
    const upgradeResult = { stat: 'damage', finalMagnitude: 8, rarity: 'COMMON' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    // Force no crit to make damage check deterministic (LASER_FRONT has def.critChance=0.05)
    useWeapons.getState().activeWeapons[0].multipliers.critBonus = -(WEAPONS['LASER_FRONT'].critChance ?? 0)
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    const def = WEAPONS['LASER_FRONT']
    expect(p.damage).toBeCloseTo(def.baseDamage * 1.08, 4)
  })

  it('tick() applies boon damageMultiplier on top of weapon multiplier', () => {
    const upgradeResult = { stat: 'damage', finalMagnitude: 8, rarity: 'COMMON' }
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)
    // Force no crit to make damage check deterministic (LASER_FRONT has def.critChance=0.05)
    useWeapons.getState().activeWeapons[0].multipliers.critBonus = -(WEAPONS['LASER_FRONT'].critChance ?? 0)
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, { damageMultiplier: 1.5 })
    const p = useWeapons.getState().projectiles[0]
    const def = WEAPONS['LASER_FRONT']
    expect(p.damage).toBeCloseTo(def.baseDamage * 1.08 * 1.5, 4)
  })
})
