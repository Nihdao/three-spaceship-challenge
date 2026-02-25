import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'

// Story 32.2: AURA tick() behavior tests

const POS = [0, 0, 0]
const ROT = 0

describe('useWeapons.tick() — AURA (Story 32.2)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('AURA')
  })

  it('AURA weapon is added to activeWeapons', () => {
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
    expect(useWeapons.getState().activeWeapons[0].weaponId).toBe('AURA')
  })

  it('does NOT create any projectiles when ticked', () => {
    useWeapons.getState().tick(0.1, POS, ROT)
    expect(useWeapons.getState().projectiles.length).toBe(0)
  })

  it('does NOT push projectiles even after many ticks', () => {
    for (let i = 0; i < 10; i++) {
      useWeapons.getState().tick(0.5, POS, ROT)
    }
    expect(useWeapons.getState().projectiles.length).toBe(0)
  })

  it('cooldownTimer is NOT decremented for aura weapons', () => {
    const weapon = useWeapons.getState().activeWeapons[0]
    const initialCooldownTimer = weapon.cooldownTimer
    useWeapons.getState().tick(0.5, POS, ROT)
    const weaponAfter = useWeapons.getState().activeWeapons[0]
    expect(weaponAfter.cooldownTimer).toBe(initialCooldownTimer)
  })

  it('cooldownTimer stays at 0 after many ticks (not driven negative)', () => {
    for (let i = 0; i < 20; i++) {
      useWeapons.getState().tick(0.3, POS, ROT)
    }
    const weaponAfter = useWeapons.getState().activeWeapons[0]
    expect(weaponAfter.cooldownTimer).toBe(0)
  })

  it('other projectile weapons still fire normally alongside AURA', () => {
    useWeapons.getState().addWeapon('LASER_FRONT')
    useWeapons.getState().tick(0.1, POS, ROT)
    // LASER_FRONT fires immediately (cooldownTimer starts at 0)
    expect(useWeapons.getState().projectiles.length).toBe(1)
  })

  it('AURA occupies exactly 1 slot — duplicate rejected', () => {
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
    // Try adding it again — existing duplicate check should prevent it
    useWeapons.getState().addWeapon('AURA')
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
  })
})

describe('AURA upgradeWeapon() — multipliers chain (code-review M5)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('AURA')
  })

  it('damage upgrade sets multipliers.damageMultiplier correctly', () => {
    useWeapons.getState().upgradeWeapon('AURA', { stat: 'damage', finalMagnitude: 25, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.damageMultiplier).toBeCloseTo(1.25, 5)
  })

  it('area upgrade sets multipliers.areaMultiplier correctly', () => {
    useWeapons.getState().upgradeWeapon('AURA', { stat: 'area', finalMagnitude: 20, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.areaMultiplier).toBeCloseTo(1.20, 5)
  })

  it('cooldown upgrade sets multipliers.cooldownMultiplier below 1', () => {
    useWeapons.getState().upgradeWeapon('AURA', { stat: 'cooldown', finalMagnitude: -20, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.cooldownMultiplier).toBeCloseTo(0.80, 5)
  })

  it('stacked upgrades accumulate in multipliers', () => {
    useWeapons.getState().upgradeWeapon('AURA', { stat: 'damage', finalMagnitude: 25, rarity: 'EPIC' })
    useWeapons.getState().upgradeWeapon('AURA', { stat: 'damage', finalMagnitude: 25, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    // Two +25% stacks → 1.25 * 1.25 = 1.5625
    expect(weapon.multipliers.damageMultiplier).toBeCloseTo(1.5625, 3)
  })
})
