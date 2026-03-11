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

    it.each(SHIP_IDS)('%s has exactly 4 skins (default + lv3 + lv6 + lv9)', (shipId) => {
      expect(SHIP_SKINS[shipId]).toHaveLength(4)
    })

    it.each(SHIP_IDS)('%s first skin is the default (id="default", requiredLevel=1)', (shipId) => {
      const first = SHIP_SKINS[shipId][0]
      expect(first.id).toBe('default')
      expect(first.requiredLevel).toBe(1)
      expect(first.emissiveTint).toBeNull()
    })

    it.each(SHIP_IDS)('%s progression skins have requiredLevels 3, 6, 9', (shipId) => {
      const [, lv3, lv6, lv9] = SHIP_SKINS[shipId]
      expect(lv3.requiredLevel).toBe(3)
      expect(lv6.requiredLevel).toBe(6)
      expect(lv9.requiredLevel).toBe(9)
      // IDs are ship-specific, not validated here
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

  describe('GLASS_CANNON skin data', () => {
    it('default skin is Ember (#cc5500)', () => {
      const skin = SHIP_SKINS.GLASS_CANNON[0]
      expect(skin.name).toBe('Ember')
      expect(skin.tintColor).toBe('#cc5500')
      expect(skin.modelPath).toBeNull()
    })

    it('lv3 skin is eclipse with SpaceshipB_3.glb', () => {
      const skin = SHIP_SKINS.GLASS_CANNON[1]
      expect(skin.id).toBe('eclipse')
      expect(skin.modelPath).toBe('./models/ships/SpaceshipB_3.glb')
      expect(skin.tintColor).toBe('#cc44bb')
    })

    it('lv6 skin is specter with SpaceshipB_6.glb', () => {
      const skin = SHIP_SKINS.GLASS_CANNON[2]
      expect(skin.id).toBe('specter')
      expect(skin.modelPath).toBe('./models/ships/SpaceshipB_6.glb')
      expect(skin.tintColor).toBe('#e0e0e0')
    })

    it('lv9 skin is aurum with SpaceshipB_9.glb', () => {
      const skin = SHIP_SKINS.GLASS_CANNON[3]
      expect(skin.id).toBe('aurum')
      expect(skin.modelPath).toBe('./models/ships/SpaceshipB_9.glb')
      expect(skin.tintColor).toBe('#ffd60a')
    })
  })

  describe('TANK skin data', () => {
    it('default skin is Glacial (#44aaff)', () => {
      const skin = SHIP_SKINS.TANK[0]
      expect(skin.name).toBe('Glacial')
      expect(skin.tintColor).toBe('#44aaff')
      expect(skin.modelPath).toBeNull()
    })

    it('lv3 skin is venom with SpaceshipC_3.glb', () => {
      const skin = SHIP_SKINS.TANK[1]
      expect(skin.id).toBe('venom')
      expect(skin.modelPath).toBe('./models/ships/SpaceshipC_3.glb')
      expect(skin.tintColor).toBe('#44cc44')
    })

    it('lv6 skin is specter with SpaceshipC_6.glb', () => {
      const skin = SHIP_SKINS.TANK[2]
      expect(skin.id).toBe('specter')
      expect(skin.modelPath).toBe('./models/ships/SpaceshipC_6.glb')
      expect(skin.tintColor).toBe('#e0e0e0')
    })

    it('lv9 skin is aurum with SpaceshipC_9.glb', () => {
      const skin = SHIP_SKINS.TANK[3]
      expect(skin.id).toBe('aurum')
      expect(skin.modelPath).toBe('./models/ships/SpaceshipC_9.glb')
      expect(skin.tintColor).toBe('#ffd60a')
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

  it('getSkinForShip GLASS_CANNON default returns Ember #cc5500', () => {
    const skin = getSkinForShip('GLASS_CANNON', 'default')
    expect(skin.id).toBe('default')
    expect(skin.name).toBe('Ember')
    expect(skin.tintColor).toBe('#cc5500')
    expect(skin.modelPath).toBeNull()
    expect(skin.emissiveTint).toBeNull()
  })

  it('getSkinForShip TANK venom returns SpaceshipC_3.glb #44cc44', () => {
    const skin = getSkinForShip('TANK', 'venom')
    expect(skin.modelPath).toBe('./models/ships/SpaceshipC_3.glb')
    expect(skin.tintColor).toBe('#44cc44')
  })
})
