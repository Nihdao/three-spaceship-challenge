import { describe, it, expect } from 'vitest'
import { LOOT_TYPES, LOOT_TYPE_IDS } from '../lootDefs.js'

describe('lootDefs.js', () => {
  describe('LOOT_TYPE_IDS', () => {
    it('should export all loot type ID constants', () => {
      expect(LOOT_TYPE_IDS.XP_ORB_RARE).toBe('XP_ORB_RARE')
      expect(LOOT_TYPE_IDS.HEAL_GEM).toBe('HEAL_GEM')
      expect(LOOT_TYPE_IDS.FRAGMENT_GEM).toBe('FRAGMENT_GEM')
    })
  })

  describe('LOOT_TYPES', () => {
    it('should have all required loot type entries', () => {
      expect(LOOT_TYPES[LOOT_TYPE_IDS.XP_ORB_RARE]).toBeDefined()
      expect(LOOT_TYPES[LOOT_TYPE_IDS.HEAL_GEM]).toBeDefined()
      expect(LOOT_TYPES[LOOT_TYPE_IDS.FRAGMENT_GEM]).toBeDefined()
    })

    it('should have all required fields for XP_ORB_RARE', () => {
      const rareXp = LOOT_TYPES[LOOT_TYPE_IDS.XP_ORB_RARE]
      expect(rareXp.id).toBe('XP_ORB_RARE')
      expect(rareXp.label).toBe('Rare XP Gem')
      expect(rareXp.colorHex).toBe('#ffdd00')
      expect(rareXp.scale).toEqual([1.04, 1.04, 1.04])
      expect(rareXp.pulseSpeed).toBe(3.0)
      expect(rareXp.pickupSfx).toBe('xp_rare_pickup')
      expect(rareXp.valueConfigKey).toBe('RARE_XP_GEM_MULTIPLIER')
      expect(rareXp.dropChanceKey).toBe('RARE_XP_GEM_DROP_CHANCE')
    })

    it('should have all required fields for HEAL_GEM', () => {
      const healGem = LOOT_TYPES[LOOT_TYPE_IDS.HEAL_GEM]
      expect(healGem.id).toBe('HEAL_GEM')
      expect(healGem.label).toBe('Heal Gem')
      expect(healGem.colorHex).toBe('#ff3366')
      expect(healGem.scale).toEqual([0.8, 0.8, 0.8])
      expect(healGem.pulseSpeed).toBe(4.0)
      expect(healGem.pickupSfx).toBe('hp-recover')
      expect(healGem.valueConfigKey).toBe('HEAL_GEM_RESTORE_AMOUNT')
      expect(healGem.dropChanceKey).toBe('HEAL_GEM_DROP_CHANCE')
    })

    it('should have all required fields for FRAGMENT_GEM', () => {
      const fragmentGem = LOOT_TYPES[LOOT_TYPE_IDS.FRAGMENT_GEM]
      expect(fragmentGem.id).toBe('FRAGMENT_GEM')
      expect(fragmentGem.label).toBe('Fragment Gem')
      expect(fragmentGem.colorHex).toBe('#cc66ff')
      expect(fragmentGem.scale).toEqual([1.0, 1.0, 1.0])
      expect(fragmentGem.pulseSpeed).toBe(2.5)
      expect(fragmentGem.pickupSfx).toBe('fragment_pickup')
      expect(fragmentGem.valueConfigKey).toBe('FRAGMENT_DROP_AMOUNT')
      expect(fragmentGem.dropChanceKey).toBe('FRAGMENT_DROP_CHANCE')
    })
  })
})
