import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

// Story 32.1: LASER_CROSS tick() behavior tests

const POS = [0, 0, 0]
const ROT = 0

describe('useWeapons.tick() — LASER_CROSS (Story 32.1)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('LASER_CROSS')
  })

  it('LASER_CROSS weapon is added to activeWeapons', () => {
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
    expect(useWeapons.getState().activeWeapons[0].weaponId).toBe('LASER_CROSS')
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

  it('lazily initializes laserCrossAngle to 0 on first tick', () => {
    useWeapons.getState().tick(0.01, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossAngle).toBeDefined()
  })

  it('advances laserCrossAngle by delta * rotationSpeed', () => {
    const def = WEAPONS.LASER_CROSS
    const delta = 0.1
    useWeapons.getState().tick(delta, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossAngle).toBeCloseTo(delta * def.rotationSpeed)
  })

  it('accumulates laserCrossAngle over multiple ticks', () => {
    const def = WEAPONS.LASER_CROSS
    useWeapons.getState().tick(0.1, POS, ROT)
    useWeapons.getState().tick(0.1, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossAngle).toBeCloseTo(0.2 * def.rotationSpeed)
  })

  it('lazily initializes laserCrossIsActive to true', () => {
    useWeapons.getState().tick(0.01, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossIsActive).toBe(true)
  })

  it('lazily initializes laserCrossCycleTimer to (near) 0', () => {
    useWeapons.getState().tick(0.01, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossCycleTimer).toBeGreaterThanOrEqual(0)
    expect(weapon.laserCrossCycleTimer).toBeLessThanOrEqual(0.05)
  })

  it('advances laserCrossCycleTimer by delta', () => {
    useWeapons.getState().tick(0.2, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossCycleTimer).toBeCloseTo(0.2)
  })

  it('cooldownTimer is NOT decremented for laser_cross weapons', () => {
    const weapon = useWeapons.getState().activeWeapons[0]
    const initialCooldownTimer = weapon.cooldownTimer
    useWeapons.getState().tick(0.5, POS, ROT)
    const weaponAfter = useWeapons.getState().activeWeapons[0]
    // cooldownTimer should remain 0 (not go negative)
    expect(weaponAfter.cooldownTimer).toBe(initialCooldownTimer)
  })

  it('toggles laserCrossIsActive to false after activeTime', () => {
    const def = WEAPONS.LASER_CROSS
    // Tick past the full activeTime
    useWeapons.getState().tick(def.activeTime + 0.01, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossIsActive).toBe(false)
  })

  it('subtracts activeTime from timer when toggling to inactive', () => {
    const def = WEAPONS.LASER_CROSS
    const excess = 0.05
    useWeapons.getState().tick(def.activeTime + excess, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    // Timer should be close to excess after subtraction
    expect(weapon.laserCrossCycleTimer).toBeCloseTo(excess, 2)
  })

  it('toggles laserCrossIsActive back to true after inactiveTime', () => {
    const def = WEAPONS.LASER_CROSS
    // Active phase full + inactive phase full
    useWeapons.getState().tick(def.activeTime + def.inactiveTime + 0.01, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossIsActive).toBe(true)
  })

  it('applies cooldownMultiplier to inactiveTime (shorter inactive = faster cycle)', () => {
    const def = WEAPONS.LASER_CROSS
    const cooldownMultiplier = 0.5 // 50% cooldown reduction → inactiveTime halved
    const boonMods = { cooldownMultiplier }

    // After activeTime, we're in inactive phase with halved duration
    // Tick past activeTime + (inactiveTime * 0.5)
    const reducedInactive = def.inactiveTime * cooldownMultiplier
    useWeapons.getState().tick(def.activeTime + reducedInactive + 0.01, POS, ROT, boonMods)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossIsActive).toBe(true) // back to active
  })

  it('applies projectileSpeedMultiplier to rotation speed (AC #7)', () => {
    const def = WEAPONS.LASER_CROSS
    const delta = 0.1
    const boons = { projectileSpeedMultiplier: 2.0 }
    useWeapons.getState().tick(delta, POS, ROT, boons)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.laserCrossAngle).toBeCloseTo(delta * def.rotationSpeed * 2.0)
  })

  it('other projectile weapons still fire normally alongside LASER_CROSS', () => {
    useWeapons.getState().addWeapon('LASER_FRONT')
    useWeapons.getState().tick(0.1, POS, ROT)
    // LASER_FRONT fires immediately (cooldownTimer starts at 0)
    expect(useWeapons.getState().projectiles.length).toBe(1)
  })
})
