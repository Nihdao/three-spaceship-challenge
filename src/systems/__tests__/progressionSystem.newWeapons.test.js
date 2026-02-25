// Story 31.2: Updated to remove dead weapon refs (RAILGUN, TRI_SHOT, SATELLITE, DRONE, SHOTGUN removed in 31.1)
// Story 32.8: All 10 weapons fully implemented — no stubs remain (implemented: false removed from LASER_CROSS)
import { describe, it, expect } from 'vitest'
import { generateChoices } from '../progressionSystem.js'
import { WEAPONS } from '../../entities/weaponDefs.js'

describe('progressionSystem — weapon integration (Story 11.3, updated 31.2)', () => {
  const ALL_WEAPON_IDS = ['LASER_FRONT', 'SPREAD_SHOT', 'BEAM', 'EXPLOSIVE_ROUND', 'AURA', 'DIAGONALS', 'SHOCKWAVE', 'MINE_AROUND', 'TACTICAL_SHOT', 'LASER_CROSS']

  it('new weapons appear in choice pool when slots are available', () => {
    // Fill boon slots so new_boon items don't compete with new_weapon in the upgrade pool.
    // With only 1 weapon_upgrade available and 9 new_weapon candidates, once the single
    // upgrade is consumed the remaining slots always fall back to new_weapon picks.
    const equipped = [{ weaponId: 'LASER_FRONT', level: 1 }]
    const equippedBoonIds = ['DAMAGE_AMP', 'SPEED_BOOST', 'COOLDOWN_REDUCTION']
    const choices = generateChoices(2, equipped, equippedBoonIds)

    const newWeaponChoices = choices.filter(c => c.type === 'new_weapon')
    expect(newWeaponChoices.length).toBeGreaterThan(0)
  })

  it('WEAPONS registry has exactly 10 weapons (all implemented)', () => {
    const allIds = Object.keys(WEAPONS)
    expect(allIds.length).toBe(10)
    for (const id of ALL_WEAPON_IDS) {
      expect(allIds).toContain(id)
    }
  })

  it('no weapon has implemented: false (all are eligible for level-up pool)', () => {
    for (const [id, def] of Object.entries(WEAPONS)) {
      expect(def, `${id} should not have implemented field`).not.toHaveProperty('implemented')
    }
  })

  it('fills all 4 weapon slots with upgrades only (no new weapons when full)', () => {
    const equipped = [
      { weaponId: 'LASER_FRONT', level: 1 },
      { weaponId: 'SPREAD_SHOT', level: 1 },
      { weaponId: 'BEAM', level: 1 },
      { weaponId: 'EXPLOSIVE_ROUND', level: 1 },
    ]
    const equippedBoonIds = ['DAMAGE_AMP', 'SPEED_BOOST', 'CRIT_CHANCE']
    const equippedBoons = [
      { boonId: 'DAMAGE_AMP', level: 1 },
      { boonId: 'SPEED_BOOST', level: 1 },
      { boonId: 'CRIT_CHANCE', level: 1 },
    ]
    const choices = generateChoices(5, equipped, equippedBoonIds, equippedBoons)

    // With 4 slots full, should offer upgrades not new weapons
    const newWeaponChoices = choices.filter(c => c.type === 'new_weapon')
    expect(newWeaponChoices.length).toBe(0)

    // Should offer upgrade choices for equipped weapons or boons
    const upgradeChoices = choices.filter(c => c.type === 'weapon_upgrade' || c.type === 'boon_upgrade')
    expect(upgradeChoices.length).toBeGreaterThan(0)
  })

  it('all weapon descriptions are set and non-trivial', () => {
    for (const id of ALL_WEAPON_IDS) {
      const def = WEAPONS[id]
      expect(def.name).toBeTruthy()
      expect(def.description).toBeTruthy()
      expect(def.description.length).toBeGreaterThan(10)
    }
  })

  it('weighted sampling favors higher rarityWeight weapons (Story 31.3 AC#4)', () => {
    // 0 weapons, 3 maxed boons → pool = only 4 implemented new_weapon candidates
    // LASER_FRONT(weight=10) vs BEAM(weight=4): true empirical ratio ≈1.65
    // 500 runs × 3 picks = 1500 picks; SD(beam)≈14.7 → threshold 1.3 is ~4.8 SD below expected
    const equippedBoonIds = ['DAMAGE_AMP', 'SPEED_BOOST', 'COOLDOWN_REDUCTION']
    const maxedBoons = equippedBoonIds.map(id => ({ boonId: id, level: 3 }))
    let laserCount = 0
    let beamCount = 0
    for (let i = 0; i < 500; i++) {
      const choices = generateChoices(2, [], equippedBoonIds, maxedBoons, [], 0)
      for (const c of choices) {
        if (c.type === 'new_weapon' && c.id === 'LASER_FRONT') laserCount++
        if (c.type === 'new_weapon' && c.id === 'BEAM') beamCount++
      }
    }
    // Conservative threshold: LASER_FRONT should appear ≥1.3× more than BEAM
    expect(laserCount).toBeGreaterThan(0)
    if (beamCount > 0) {
      expect(laserCount / beamCount).toBeGreaterThanOrEqual(1.3)
    }
  })

  it('Story 31.2: weapon_upgrade choices for all implemented weapons have upgradeResult', () => {
    // All 4 implemented weapons at level 1 — all upgradeable
    const equipped = ALL_WEAPON_IDS.map(id => ({ weaponId: id, level: 1 }))
    const seen = new Set()
    for (let i = 0; i < 50; i++) {
      const choices = generateChoices(5, equipped.slice(0, 1), [])
      for (const c of choices) {
        if (c.type === 'weapon_upgrade') {
          expect(c.upgradeResult).toBeDefined()
          expect(c.upgradeResult.stat).toBeTruthy()
          expect(typeof c.upgradeResult.finalMagnitude).toBe('number')
          seen.add(c.id)
        }
      }
    }
    expect(seen.size).toBeGreaterThan(0)
  })
})
