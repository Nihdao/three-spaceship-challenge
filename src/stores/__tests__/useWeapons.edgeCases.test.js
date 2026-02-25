// Story 31.2: Removed dead weapon refs (RAILGUN, TRI_SHOT, SHOTGUN, SATELLITE, DRONE)
// Current implemented weapons: LASER_FRONT, SPREAD_SHOT, BEAM, EXPLOSIVE_ROUND
import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

const DEFAULT_MULTIPLIERS = { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 }
// No-op stub for tests that only care about level increment, not multiplier changes
const NO_OP_UPGRADE = { stat: 'damage', finalMagnitude: 0, rarity: 'COMMON' }

describe('useWeapons — edge cases (Story 11.3, updated 31.2)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
  })

  it('all 4 weapon slots filled with implemented weapons fire without conflict', () => {
    useWeapons.setState({
      activeWeapons: [
        { weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } },
        { weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } },
        { weaponId: 'BEAM', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } },
        { weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } },
      ],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    // LASER: 1, SPREAD: 3, BEAM: 1, EXPLOSIVE_ROUND: 1 = 6
    expect(projs.length).toBe(6)
    // All should have unique IDs
    const ids = new Set(projs.map(p => p.id))
    expect(ids.size).toBe(projs.length)
  })

  it('Explosive Round carries explosion data on projectile', () => {
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } }],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.explosionRadius).toBe(15)
    expect(p.explosionDamage).toBe(10)
  })

  it('SPREAD_SHOT fires 3 projectiles, all with correct weaponId', () => {
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } }],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    expect(projs.length).toBe(3)
    projs.forEach(p => expect(p.weaponId).toBe('SPREAD_SHOT'))
  })

  it('weapon level can be upgraded from 1 to 9 and caps at 9', () => {
    const weaponId = 'LASER_FRONT'
    useWeapons.setState({
      activeWeapons: [{ weaponId, level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } }],
      projectiles: [],
    })
    for (let lvl = 1; lvl < 9; lvl++) {
      useWeapons.getState().upgradeWeapon(weaponId, NO_OP_UPGRADE)
    }
    expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
    // Should not upgrade past 9
    useWeapons.getState().upgradeWeapon(weaponId, NO_OP_UPGRADE)
    expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
  })

  it('MAX_PROJECTILES cap respected with spread-shot multi-pellet fire', () => {
    // Fill projectile pool near cap, then fire SPREAD_SHOT (3 pellets)
    const fakeProjectiles = []
    for (let i = 0; i < GAME_CONFIG.MAX_PROJECTILES - 2; i++) {
      fakeProjectiles.push({ id: `fake_${i}`, active: true })
    }
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } }],
      projectiles: fakeProjectiles,
    })
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    // Should only fire up to cap, not all 3 pellets
    expect(useWeapons.getState().projectiles.length).toBeLessThanOrEqual(GAME_CONFIG.MAX_PROJECTILES)
  })

  it('EXPLOSIVE_ROUND fires from near player position', () => {
    const playerPos = [100, 0, 100]
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } }],
      projectiles: [],
    })
    useWeapons.getState().tick(0.01, playerPos, 0)
    const p = useWeapons.getState().projectiles[0]
    // Should be near player position (with small forward offset, at most 5 units away)
    expect(Math.abs(p.x - playerPos[0])).toBeLessThanOrEqual(5)
    expect(Math.abs(p.z - playerPos[2])).toBeLessThanOrEqual(5)
  })

  it('all implemented weapons can be upgraded through all 9 levels without error', () => {
    const implementedWeaponIds = ['LASER_FRONT', 'SPREAD_SHOT', 'BEAM', 'EXPLOSIVE_ROUND']
    for (const weaponId of implementedWeaponIds) {
      useWeapons.getState().reset()
      useWeapons.setState({
        activeWeapons: [{ weaponId, level: 1, cooldownTimer: 0, multipliers: { ...DEFAULT_MULTIPLIERS } }],
        projectiles: [],
      })
      for (let lvl = 1; lvl < 9; lvl++) {
        useWeapons.getState().upgradeWeapon(weaponId, NO_OP_UPGRADE)
      }
      expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
      // Should not upgrade past 9
      useWeapons.getState().upgradeWeapon(weaponId, NO_OP_UPGRADE)
      expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
    }
  })
})
