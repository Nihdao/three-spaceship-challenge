import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import usePlayer from '../usePlayer.jsx'
import { SHIPS, getDefaultShipId } from '../../entities/shipDefs.js'
import { WEAPONS } from '../../entities/weaponDefs.js'

describe('useWeapons — ship baseDamageMultiplier integration (Story 9.3 Task 4)', () => {
  beforeEach(() => {
    usePlayer.getState().setCurrentShipId(getDefaultShipId())
    usePlayer.getState().reset()
    useWeapons.getState().reset()
    useWeapons.getState().initializeWeapons()
  })

  function fireOnce(damageMultiplier = 1) {
    // Tick with enough delta to guarantee a shot fires (cooldown expires)
    useWeapons.getState().tick(
      10, // large delta to ensure cooldown expires
      [0, 0, 0], // player position
      0, // player rotation
      { damageMultiplier, cooldownMultiplier: 1, critChance: 0 }
    )
    return useWeapons.getState().projectiles
  }

  it('BALANCED ship (1.0x) produces base weapon damage', () => {
    const baseDamage = WEAPONS.LASER_FRONT.baseDamage
    const shipMult = SHIPS.BALANCED.baseDamageMultiplier // 1.0
    const projectiles = fireOnce(shipMult)

    expect(projectiles.length).toBeGreaterThan(0)
    expect(projectiles[0].damage).toBeCloseTo(baseDamage * shipMult, 5)
  })

  it('GLASS_CANNON ship (1.4x) produces higher weapon damage', () => {
    const baseDamage = WEAPONS.LASER_FRONT.baseDamage
    const shipMult = SHIPS.GLASS_CANNON.baseDamageMultiplier // 1.4
    const projectiles = fireOnce(shipMult)

    expect(projectiles.length).toBeGreaterThan(0)
    expect(projectiles[0].damage).toBeCloseTo(baseDamage * shipMult, 5)
  })

  it('TANK ship (0.85x) produces lower weapon damage', () => {
    const baseDamage = WEAPONS.LASER_FRONT.baseDamage
    const shipMult = SHIPS.TANK.baseDamageMultiplier // 0.85
    const projectiles = fireOnce(shipMult)

    expect(projectiles.length).toBeGreaterThan(0)
    expect(projectiles[0].damage).toBeCloseTo(baseDamage * shipMult, 5)
  })

  it('ship damage multiplier composes with boon damage multiplier', () => {
    const baseDamage = WEAPONS.LASER_FRONT.baseDamage
    const shipMult = SHIPS.GLASS_CANNON.baseDamageMultiplier // 1.4
    const boonMult = 1.5
    const composedMult = shipMult * boonMult

    const projectiles = fireOnce(composedMult)

    expect(projectiles.length).toBeGreaterThan(0)
    expect(projectiles[0].damage).toBeCloseTo(baseDamage * composedMult, 5)
  })
})
