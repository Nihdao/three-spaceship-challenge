import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

describe('useWeapons — rarity integration (Story 22.3)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().initializeWeapons()
  })

  it('addWeapon stores rarity on weapon', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'RARE')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    expect(weapon).toBeDefined()
    expect(weapon.rarity).toBe('RARE')
  })

  it('addWeapon COMMON: no damage override (uses baseDamage)', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'COMMON')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    // COMMON multiplier is 1.0, so no override needed
    expect(weapon.overrides).toBeUndefined()
  })

  it('addWeapon RARE: damage override is scaled by 1.15', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'RARE')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    const def = WEAPONS['SPREAD_SHOT']
    const expected = Math.round(def.baseDamage * 1.15)
    expect(weapon.overrides?.damage).toBe(expected)
  })

  it('addWeapon EPIC: damage override is scaled by 1.30', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'EPIC')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    const def = WEAPONS['SPREAD_SHOT']
    const expected = Math.round(def.baseDamage * 1.30)
    expect(weapon.overrides?.damage).toBe(expected)
  })

  it('addWeapon LEGENDARY: damage override is scaled by 1.50', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'LEGENDARY')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    const def = WEAPONS['SPREAD_SHOT']
    const expected = Math.round(def.baseDamage * 1.50)
    expect(weapon.overrides?.damage).toBe(expected)
  })

  it('addWeapon defaults to COMMON when no rarity provided', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    expect(weapon.rarity).toBe('COMMON')
  })

  it('upgradeWeapon uses the rarity passed to it (rarity does not persist across upgrades)', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'EPIC')
    useWeapons.getState().upgradeWeapon('SPREAD_SHOT', 'COMMON') // Each upgrade is independently rolled
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    expect(weapon.rarity).toBe('COMMON')
  })

  it('upgradeWeapon RARE: damage override is scaled by 1.15', () => {
    useWeapons.getState().addWeapon('SPREAD_SHOT', 'RARE')
    useWeapons.getState().upgradeWeapon('SPREAD_SHOT', 'RARE')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'SPREAD_SHOT')
    const def = WEAPONS['SPREAD_SHOT']
    const upgrade = def.upgrades[0] // level 2
    const expected = Math.round(upgrade.damage * 1.15)
    expect(weapon.overrides?.damage).toBe(expected)
  })

  it('upgradeWeapon LEGENDARY: damage override is scaled by 1.50', () => {
    useWeapons.getState().addWeapon('LASER_FRONT', 'LEGENDARY')
    useWeapons.getState().upgradeWeapon('LASER_FRONT', 'LEGENDARY')
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'LASER_FRONT')
    const def = WEAPONS['LASER_FRONT']
    const upgrade = def.upgrades[0] // level 2
    const expected = Math.round(upgrade.damage * 1.50)
    expect(weapon.overrides?.damage).toBe(expected)
  })
})
