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

    it.each(SHIP_IDS)('%s has exactly 4 skins (default + ocean + specter + aurum)', (shipId) => {
      expect(SHIP_SKINS[shipId]).toHaveLength(4)
    })

    it.each(SHIP_IDS)('%s first skin is the default (id="default", requiredLevel=1)', (shipId) => {
      const first = SHIP_SKINS[shipId][0]
      expect(first.id).toBe('default')
      expect(first.requiredLevel).toBe(1)
      expect(first.emissiveTint).toBeNull()
    })

    it.each(SHIP_IDS)('%s progression skins have correct requiredLevels (3, 6, 9)', (shipId) => {
      const [, ocean, specter, aurum] = SHIP_SKINS[shipId]
      expect(ocean.id).toBe('ocean')
      expect(ocean.requiredLevel).toBe(3)
      expect(specter.id).toBe('specter')
      expect(specter.requiredLevel).toBe(6)
      expect(aurum.id).toBe('aurum')
      expect(aurum.requiredLevel).toBe(9)
    })

    it.each(SHIP_IDS)('%s progression skins each have a modelPath string', (shipId) => {
      const progressionSkins = SHIP_SKINS[shipId].slice(1)
      for (const skin of progressionSkins) {
        expect(typeof skin.modelPath).toBe('string')
        expect(skin.modelPath.length).toBeGreaterThan(0)
      }
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
