import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useWeapons — edge cases for new weapons (Story 11.3)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
  })

  it('all 4 weapon slots filled with diverse weapons fire without conflict', () => {
    useWeapons.setState({
      activeWeapons: [
        { weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0 },
        { weaponId: 'SHOTGUN', level: 1, cooldownTimer: 0 },
        { weaponId: 'RAILGUN', level: 1, cooldownTimer: 0 },
        { weaponId: 'TRI_SHOT', level: 1, cooldownTimer: 0 },
      ],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    // LASER: 1, SHOTGUN: 7, RAILGUN: 1, TRI_SHOT: 3 = 12
    expect(projs.length).toBe(12)
    // All should have unique IDs
    const ids = new Set(projs.map(p => p.id))
    expect(ids.size).toBe(projs.length)
  })

  it('4 orbital/drone weapons fire independently', () => {
    useWeapons.setState({
      activeWeapons: [
        { weaponId: 'SATELLITE', level: 1, cooldownTimer: 0 },
        { weaponId: 'DRONE', level: 1, cooldownTimer: 0 },
        { weaponId: 'BEAM', level: 1, cooldownTimer: 0 },
        { weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0 },
      ],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    // Each fires 1 projectile = 4 total
    expect(projs.length).toBe(4)
    const weaponIds = projs.map(p => p.weaponId)
    expect(weaponIds).toContain('SATELLITE')
    expect(weaponIds).toContain('DRONE')
    expect(weaponIds).toContain('BEAM')
    expect(weaponIds).toContain('EXPLOSIVE_ROUND')
  })

  it('Railgun piercing projectile carries correct pierceCount', () => {
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'RAILGUN', level: 1, cooldownTimer: 0 }],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.piercing).toBe(true)
    expect(p.pierceCount).toBe(5)
    expect(p.pierceHits).toBe(0)
  })

  it('Explosive Round carries explosion data on projectile', () => {
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0 }],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.explosionRadius).toBe(15)
    expect(p.explosionDamage).toBe(10)
  })

  it('Shotgun pellets all hit single target — damage stacks', () => {
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'SHOTGUN', level: 1, cooldownTimer: 0 }],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    const totalDamage = projs.reduce((sum, p) => sum + p.damage, 0)
    // 7 pellets × 4 damage = 28
    expect(totalDamage).toBe(WEAPONS.SHOTGUN.baseDamage * WEAPONS.SHOTGUN.pelletCount)
  })

  it('weapon visual upgrades apply at levels 5, 8, 9 for new weapons', () => {
    // Test RAILGUN upgrade visuals
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'RAILGUN', level: 1, cooldownTimer: 0 }],
      projectiles: [],
    })
    // Upgrade to level 5
    for (let i = 0; i < 4; i++) useWeapons.getState().upgradeWeapon('RAILGUN')
    expect(useWeapons.getState().activeWeapons[0].level).toBe(5)
    expect(useWeapons.getState().activeWeapons[0].overrides.upgradeVisuals.color).toBe('#6699ff')

    // Upgrade to level 8
    for (let i = 0; i < 3; i++) useWeapons.getState().upgradeWeapon('RAILGUN')
    expect(useWeapons.getState().activeWeapons[0].level).toBe(8)
    expect(useWeapons.getState().activeWeapons[0].overrides.upgradeVisuals.meshScale).toEqual([0.36, 0.36, 7.2])

    // Upgrade to level 9
    useWeapons.getState().upgradeWeapon('RAILGUN')
    expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
    expect(useWeapons.getState().activeWeapons[0].overrides.upgradeVisuals.color).toBe('#88bbff')
    expect(useWeapons.getState().activeWeapons[0].overrides.upgradeVisuals.meshScale).toEqual([0.42, 0.42, 8.4])
  })

  it('MAX_PROJECTILES cap respected with shotgun multi-pellet fire', () => {
    // Fill projectile pool near cap, then fire shotgun (7 pellets)
    const fakeProjectiles = []
    for (let i = 0; i < GAME_CONFIG.MAX_PROJECTILES - 3; i++) {
      fakeProjectiles.push({ id: `fake_${i}`, active: true })
    }
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'SHOTGUN', level: 1, cooldownTimer: 0 }],
      projectiles: fakeProjectiles,
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    // Should only fire 3 more pellets (to reach cap), not all 7
    expect(useWeapons.getState().projectiles.length).toBeLessThanOrEqual(GAME_CONFIG.MAX_PROJECTILES)
  })

  it('Drone fires from offset position', () => {
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'DRONE', level: 1, cooldownTimer: 0 }],
      projectiles: [],
    })
    const playerPos = [100, 0, 100]
    useWeapons.getState().tick(0.01, playerPos, 0)
    const p = useWeapons.getState().projectiles[0]
    const offset = WEAPONS.DRONE.followOffset
    expect(p.x).toBeCloseTo(playerPos[0] + offset[0], 0)
    expect(p.z).toBeCloseTo(playerPos[2] + offset[2], 0)
  })

  it('all new weapons can be upgraded through all 9 levels without error', () => {
    const newWeaponIds = ['RAILGUN', 'TRI_SHOT', 'SHOTGUN', 'SATELLITE', 'DRONE', 'BEAM', 'EXPLOSIVE_ROUND']
    for (const weaponId of newWeaponIds) {
      useWeapons.getState().reset()
      useWeapons.setState({
        activeWeapons: [{ weaponId, level: 1, cooldownTimer: 0 }],
        projectiles: [],
      })
      for (let lvl = 1; lvl < 9; lvl++) {
        useWeapons.getState().upgradeWeapon(weaponId)
      }
      expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
      // Should not upgrade past 9
      useWeapons.getState().upgradeWeapon(weaponId)
      expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
    }
  })
})
