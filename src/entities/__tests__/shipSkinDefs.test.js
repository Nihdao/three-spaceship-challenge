import { describe, it, expect } from 'vitest'
import { SHIP_SKINS, getSkinForShip } from '../shipSkinDefs.js'

const SHIP_IDS = ['BALANCED', 'GLASS_CANNON', 'TANK']

describe('SHIP_SKINS', () => {
  describe('structure', () => {
    it('contains exactly 3 ships', () => {
      expect(Object.keys(SHIP_SKINS)).toHaveLength(3)
      expect(SHIP_SKINS).toHaveProperty('BALANCED')
      expect(SHIP_SKINS).toHaveProperty('GLASS_CANNON')
      expect(SHIP_SKINS).toHaveProperty('TANK')
    })

    // Colour skins (lv3/6/9) deferred pending mesh material architecture rework.
    // Each ship has only the default skin until a future story adds proper material overrides.
    it.each(SHIP_IDS)('%s has exactly 1 skin (default only)', (shipId) => {
      expect(SHIP_SKINS[shipId]).toHaveLength(1)
    })

    it.each(SHIP_IDS)('%s first skin is the default (id="default", requiredLevel=1)', (shipId) => {
      const first = SHIP_SKINS[shipId][0]
      expect(first.id).toBe('default')
      expect(first.requiredLevel).toBe(1)
      expect(first.tintColor).toBeNull()
      expect(first.emissiveTint).toBeNull()
    })
  })

  describe('skin data validity', () => {
    it.each(SHIP_IDS)('%s skins each have id, name, unlockMessage', (shipId) => {
      for (const skin of SHIP_SKINS[shipId]) {
        expect(skin).toHaveProperty('id')
        expect(skin).toHaveProperty('name')
        expect(skin).toHaveProperty('unlockMessage')
        expect(typeof skin.id).toBe('string')
        expect(typeof skin.name).toBe('string')
        expect(typeof skin.unlockMessage).toBe('string')
      }
    })

    it.each(SHIP_IDS)('%s skin IDs are unique within the ship', (shipId) => {
      const ids = SHIP_SKINS[shipId].map(s => s.id)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    })
  })
})

describe('getSkinForShip', () => {
  it('returns the default skin when called with "default" id', () => {
    for (const shipId of SHIP_IDS) {
      const skin = getSkinForShip(shipId, 'default')
      expect(skin.id).toBe('default')
      expect(skin.tintColor).toBeNull()
    }
  })

  it('returns the default skin when ID not found (fallback)', () => {
    const skin = getSkinForShip('BALANCED', 'nonexistent')
    expect(skin.id).toBe('default')
  })

  it('returns null for unknown ship ID', () => {
    const skin = getSkinForShip('UNKNOWN', 'default')
    expect(skin).toBeNull()
  })
})
