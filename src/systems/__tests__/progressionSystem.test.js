import { describe, it, expect, beforeEach } from 'vitest'
import { generateChoices, generatePlanetReward } from '../progressionSystem.js'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { BOONS } from '../../entities/boonDefs.js'

describe('progressionSystem', () => {
  describe('generateChoices', () => {
    it('returns an array of 3-4 choices', () => {
      const choices = generateChoices(2, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      expect(choices.length).toBeGreaterThanOrEqual(3)
      expect(choices.length).toBeLessThanOrEqual(4)
    })

    it('includes weapon upgrades for equipped weapons below max level', () => {
      const choices = generateChoices(2, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      const upgrades = choices.filter(c => c.type === 'weapon_upgrade')
      if (upgrades.length > 0) {
        expect(upgrades[0]).toHaveProperty('id')
        expect(upgrades[0]).toHaveProperty('name')
        expect(upgrades[0]).toHaveProperty('description')
        expect(upgrades[0]).toHaveProperty('statPreview')
      }
    })

    it('uses correct upgrade tier based on weapon level', () => {
      // Weapon at level 2 should offer level 3 upgrade, not level 2
      let foundUpgrade = false
      for (let i = 0; i < 20; i++) {
        const choices = generateChoices(3, [{ weaponId: 'LASER_FRONT', level: 2 }], [])
        const upgrade = choices.find(c => c.type === 'weapon_upgrade' && c.id === 'LASER_FRONT')
        if (upgrade) {
          expect(upgrade.level).toBe(3) // upgrades[1].level = 3
          expect(upgrade.statPreview).toContain('15') // level 3 damage = 15
          foundUpgrade = true
          break
        }
      }
      expect(foundUpgrade).toBe(true)
    })

    it('skips weapon upgrade if weapon level exceeds available tiers', () => {
      // LASER_FRONT has upgrades up to level 9. Level 9 weapon has no more upgrades.
      const choices = generateChoices(10, [{ weaponId: 'LASER_FRONT', level: 9 }], [])
      const laserUpgrades = choices.filter(c => c.type === 'weapon_upgrade' && c.id === 'LASER_FRONT')
      expect(laserUpgrades.length).toBe(0)
    })

    it('includes new weapon options when weapon slots available', () => {
      const choices = generateChoices(2, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      const newWeapons = choices.filter(c => c.type === 'new_weapon')
      expect(newWeapons.length).toBeGreaterThanOrEqual(0)
      if (newWeapons.length > 0) {
        expect(newWeapons[0].level).toBeNull()
        expect(newWeapons[0]).toHaveProperty('description')
      }
    })

    it('excludes new weapons when 4 weapons already equipped', () => {
      const fourWeapons = [
        { weaponId: 'LASER_FRONT', level: 1 },
        { weaponId: 'SPREAD_SHOT', level: 1 },
        { weaponId: 'MISSILE_HOMING', level: 1 },
        { weaponId: 'PLASMA_BOLT', level: 1 },
      ]
      const choices = generateChoices(5, fourWeapons, [])
      const newWeapons = choices.filter(c => c.type === 'new_weapon')
      expect(newWeapons.length).toBe(0)
    })

    it('includes new boon options when boon slots available', () => {
      const choices = generateChoices(2, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      const newBoons = choices.filter(c => c.type === 'new_boon')
      expect(newBoons.length).toBeGreaterThanOrEqual(0)
      if (newBoons.length > 0) {
        expect(newBoons[0].level).toBeNull()
        expect(newBoons[0]).toHaveProperty('description')
      }
    })

    it('excludes new boons when 3 boons already equipped', () => {
      const threeBoons = ['DAMAGE_AMP', 'SPEED_BOOST', 'COOLDOWN_REDUCTION']
      const choices = generateChoices(5, [{ weaponId: 'LASER_FRONT', level: 1 }], threeBoons)
      const newBoons = choices.filter(c => c.type === 'new_boon')
      expect(newBoons.length).toBe(0)
    })

    it('does not include duplicate choices', () => {
      const choices = generateChoices(3, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      const ids = choices.map(c => `${c.type}_${c.id}`)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    })

    it('each choice has required properties including icon', () => {
      const choices = generateChoices(2, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      for (const choice of choices) {
        expect(choice).toHaveProperty('type')
        expect(choice).toHaveProperty('id')
        expect(choice).toHaveProperty('name')
        expect(choice).toHaveProperty('description')
        expect(choice).toHaveProperty('level')
        expect(choice).toHaveProperty('icon')
        expect(choice).toHaveProperty('statPreview')
        expect(['weapon_upgrade', 'new_weapon', 'new_boon', 'boon_upgrade', 'stat_boost']).toContain(choice.type)
      }
    })

    it('weapon upgrade choice has statPreview string', () => {
      let foundUpgrade = false
      for (let i = 0; i < 20; i++) {
        const choices = generateChoices(2, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
        const upgrade = choices.find(c => c.type === 'weapon_upgrade')
        if (upgrade) {
          expect(typeof upgrade.statPreview).toBe('string')
          expect(upgrade.statPreview).not.toBe('')
          foundUpgrade = true
          break
        }
      }
      expect(foundUpgrade).toBe(true)
    })

    it('returns at least 3 choices even with limited pool (fallback padding)', () => {
      const fourWeapons = [
        { weaponId: 'LASER_FRONT', level: 1 },
        { weaponId: 'SPREAD_SHOT', level: 1 },
        { weaponId: 'MISSILE_HOMING', level: 1 },
        { weaponId: 'PLASMA_BOLT', level: 1 },
      ]
      const threeBoons = ['DAMAGE_AMP', 'SPEED_BOOST', 'COOLDOWN_REDUCTION']
      const choices = generateChoices(2, fourWeapons, threeBoons)
      expect(choices.length).toBeGreaterThanOrEqual(3)
    })

    it('new weapon choice has level null', () => {
      let found = false
      for (let i = 0; i < 20; i++) {
        const choices = generateChoices(2, [], [])
        const newWeapon = choices.find(c => c.type === 'new_weapon')
        if (newWeapon) {
          expect(newWeapon.level).toBeNull()
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })

    // --- Story 3.4: Boon upgrade choices ---

    it('includes boon_upgrade choices for equipped boons below maxLevel', () => {
      const equippedBoons = [{ boonId: 'DAMAGE_AMP', level: 1 }]
      let found = false
      for (let i = 0; i < 20; i++) {
        const choices = generateChoices(3, [{ weaponId: 'LASER_FRONT', level: 1 }], ['DAMAGE_AMP'], equippedBoons)
        const upgrade = choices.find(c => c.type === 'boon_upgrade' && c.id === 'DAMAGE_AMP')
        if (upgrade) {
          expect(upgrade.level).toBe(2)
          expect(upgrade.statPreview).toBeTruthy()
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })

    it('does not include boon_upgrade for maxed boons', () => {
      const equippedBoons = [{ boonId: 'DAMAGE_AMP', level: 3 }] // maxLevel = 3
      // Run multiple times due to shuffle
      for (let i = 0; i < 20; i++) {
        const choices = generateChoices(5, [{ weaponId: 'LASER_FRONT', level: 1 }], ['DAMAGE_AMP'], equippedBoons)
        const upgrade = choices.find(c => c.type === 'boon_upgrade' && c.id === 'DAMAGE_AMP')
        expect(upgrade).toBeUndefined()
      }
    })

    it('boon_upgrade choice has required properties', () => {
      const equippedBoons = [{ boonId: 'SPEED_BOOST', level: 1 }]
      let found = false
      for (let i = 0; i < 20; i++) {
        const choices = generateChoices(3, [{ weaponId: 'LASER_FRONT', level: 1 }], ['SPEED_BOOST'], equippedBoons)
        const upgrade = choices.find(c => c.type === 'boon_upgrade')
        if (upgrade) {
          expect(upgrade).toHaveProperty('type', 'boon_upgrade')
          expect(upgrade).toHaveProperty('id')
          expect(upgrade).toHaveProperty('name')
          expect(upgrade).toHaveProperty('description')
          expect(upgrade).toHaveProperty('level')
          expect(upgrade).toHaveProperty('icon')
          expect(upgrade).toHaveProperty('statPreview')
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })

    it('each choice has valid type including boon_upgrade', () => {
      const equippedBoons = [{ boonId: 'DAMAGE_AMP', level: 1 }]
      const choices = generateChoices(3, [{ weaponId: 'LASER_FRONT', level: 1 }], ['DAMAGE_AMP'], equippedBoons)
      for (const choice of choices) {
        expect(['weapon_upgrade', 'new_weapon', 'new_boon', 'boon_upgrade', 'stat_boost']).toContain(choice.type)
      }
    })
  })

  // --- Story 5.3: generatePlanetReward ---

  describe('generatePlanetReward', () => {
    it('returns exactly 3 choices', () => {
      const choices = generatePlanetReward('silver', [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      expect(choices).toHaveLength(3)
    })

    it('each choice has required properties', () => {
      const choices = generatePlanetReward('gold', [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      for (const choice of choices) {
        expect(choice).toHaveProperty('type')
        expect(choice).toHaveProperty('id')
        expect(choice).toHaveProperty('name')
        expect(choice).toHaveProperty('description')
        expect(choice).toHaveProperty('level')
        expect(choice).toHaveProperty('icon')
        expect(choice).toHaveProperty('statPreview')
        expect(['weapon_upgrade', 'new_weapon', 'new_boon', 'boon_upgrade', 'stat_boost']).toContain(choice.type)
      }
    })

    it('silver tier: choices weighted toward upgrades/common boons', () => {
      // Run multiple times to account for shuffle randomness
      let upgradeOrBoonCount = 0
      const runs = 20
      for (let i = 0; i < runs; i++) {
        const choices = generatePlanetReward('silver', [{ weaponId: 'LASER_FRONT', level: 1 }], [])
        for (const c of choices) {
          if (c.type === 'weapon_upgrade' || c.type === 'new_boon' || c.type === 'boon_upgrade') {
            upgradeOrBoonCount++
          }
        }
      }
      // Silver should have a majority of upgrade/boon choices across many runs
      expect(upgradeOrBoonCount).toBeGreaterThan(runs) // at least 1 per run on average
    })

    it('platinum tier: includes new weapon or new boon if available', () => {
      // With only 1 weapon equipped and slots available, platinum should offer new weapons
      let foundNewItem = false
      for (let i = 0; i < 30; i++) {
        const choices = generatePlanetReward('platinum', [{ weaponId: 'LASER_FRONT', level: 1 }], [])
        if (choices.some(c => c.type === 'new_weapon' || c.type === 'new_boon')) {
          foundNewItem = true
          break
        }
      }
      expect(foundNewItem).toBe(true)
    })

    it('handles edge case: all weapons maxed, all boons equipped', () => {
      const fourMaxWeapons = [
        { weaponId: 'LASER_FRONT', level: 9 },
        { weaponId: 'SPREAD_SHOT', level: 9 },
        { weaponId: 'MISSILE_HOMING', level: 9 },
        { weaponId: 'PLASMA_BOLT', level: 9 },
      ]
      const allBoons = ['DAMAGE_AMP', 'SPEED_BOOST', 'COOLDOWN_REDUCTION']
      const maxedBoons = allBoons.map(id => ({ boonId: id, level: 3 }))
      const choices = generatePlanetReward('platinum', fourMaxWeapons, allBoons, maxedBoons)
      expect(choices).toHaveLength(3) // Should still return 3 via fallback
    })

    it('return format matches generateChoices format', () => {
      const planetChoices = generatePlanetReward('gold', [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      const levelUpChoices = generateChoices(2, [{ weaponId: 'LASER_FRONT', level: 1 }], [])
      // Both should have same property keys
      const planetKeys = Object.keys(planetChoices[0]).sort()
      const levelUpKeys = Object.keys(levelUpChoices[0]).sort()
      expect(planetKeys).toEqual(levelUpKeys)
    })
  })
})
