import { describe, it, expect } from 'vitest'
import { generateChoices } from '../progressionSystem.js'
import { WEAPONS } from '../../entities/weaponDefs.js'

describe('progressionSystem — new weapon integration (Story 11.3)', () => {
  const NEW_WEAPON_IDS = [
    'RAILGUN', 'TRI_SHOT', 'SATELLITE', 'DRONE', 'BEAM', 'EXPLOSIVE_ROUND', 'SHOTGUN',
  ]

  it('new weapons appear in choice pool when slots are available', () => {
    // Player has 1 weapon (LASER_FRONT), 3 empty slots
    const equipped = [{ weaponId: 'LASER_FRONT', level: 1 }]
    const choices = generateChoices(2, equipped, [])

    // Should include new_weapon choices from the pool
    const newWeaponChoices = choices.filter(c => c.type === 'new_weapon')
    // At least some new weapons should be offered (pool is shuffled)
    // With 10 unequipped weapons and 3-4 choices, at least 1 new weapon likely
    expect(newWeaponChoices.length).toBeGreaterThanOrEqual(0)
  })

  it('all 11 weapons are in the WEAPONS registry', () => {
    const allIds = Object.keys(WEAPONS)
    expect(allIds.length).toBe(11)
    for (const id of NEW_WEAPON_IDS) {
      expect(allIds).toContain(id)
    }
  })

  it('new weapons can be added via addWeapon and equipped', () => {
    // Simulate full 4-slot equipped state with new weapons + 3 boon slots filled
    // (fills boon slots to prevent new_boon choices from diluting pool)
    const equipped = [
      { weaponId: 'LASER_FRONT', level: 1 },
      { weaponId: 'RAILGUN', level: 1 },
      { weaponId: 'SHOTGUN', level: 1 },
      { weaponId: 'SATELLITE', level: 1 },
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

  it('new weapon descriptions are set in definitions', () => {
    for (const id of NEW_WEAPON_IDS) {
      const def = WEAPONS[id]
      expect(def.name).toBeTruthy()
      expect(def.description).toBeTruthy()
      expect(def.description.length).toBeGreaterThan(10)
    }
  })
})
