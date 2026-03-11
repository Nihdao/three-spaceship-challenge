import { describe, it, expect } from 'vitest'
import { SHIPS, TRAIT_INFO, getDefaultShipId } from '../shipDefs.js'
import { WEAPONS } from '../weaponDefs.js'
import { BOONS } from '../boonDefs.js'

describe('shipDefs', () => {
  it('exports a SHIPS object with at least one ship', () => {
    expect(Object.keys(SHIPS).length).toBeGreaterThanOrEqual(1)
  })

  it('every ship has required properties', () => {
    for (const ship of Object.values(SHIPS)) {
      expect(ship).toHaveProperty('id')
      expect(ship).toHaveProperty('name')
      expect(ship).toHaveProperty('description')
      expect(ship).toHaveProperty('baseHP')
      expect(ship).toHaveProperty('baseSpeed')
      expect(ship).toHaveProperty('baseDamageMultiplier')
      expect(ship).toHaveProperty('locked')
      expect(ship).toHaveProperty('modelPath')
      expect(typeof ship.id).toBe('string')
      expect(typeof ship.name).toBe('string')
      expect(typeof ship.baseHP).toBe('number')
      expect(typeof ship.baseSpeed).toBe('number')
      expect(typeof ship.baseDamageMultiplier).toBe('number')
      expect(typeof ship.locked).toBe('boolean')
    }
  })

  it('has at least one unlocked ship', () => {
    const unlocked = Object.values(SHIPS).filter(s => !s.locked)
    expect(unlocked.length).toBeGreaterThanOrEqual(1)
  })

  it('BALANCED ship exists and is unlocked', () => {
    expect(SHIPS.BALANCED).toBeDefined()
    expect(SHIPS.BALANCED.locked).toBe(false)
  })

  it('ship id matches its key in SHIPS object', () => {
    for (const [key, ship] of Object.entries(SHIPS)) {
      expect(ship.id).toBe(key)
    }
  })

  it('every ship has colorTheme, icon, and traits (Story 9.2)', () => {
    for (const ship of Object.values(SHIPS)) {
      expect(typeof ship.colorTheme).toBe('string')
      expect(ship.colorTheme).toMatch(/^#/)
      expect(typeof ship.icon).toBe('string')
      expect(Array.isArray(ship.traits)).toBe(true)
    }
  })

  it('has at least 3 ship variants', () => {
    expect(Object.keys(SHIPS).length).toBeGreaterThanOrEqual(3)
  })

  it('each ship has distinct stat profile (no two ships identical)', () => {
    const ships = Object.values(SHIPS)
    for (let i = 0; i < ships.length; i++) {
      for (let j = i + 1; j < ships.length; j++) {
        const sameHP = ships[i].baseHP === ships[j].baseHP
        const sameSpeed = ships[i].baseSpeed === ships[j].baseSpeed
        const sameDmg = ships[i].baseDamageMultiplier === ships[j].baseDamageMultiplier
        expect(sameHP && sameSpeed && sameDmg).toBe(false)
      }
    }
  })

  it('all trait ids in ships reference existing TRAIT_INFO entries', () => {
    for (const ship of Object.values(SHIPS)) {
      for (const traitId of ship.traits) {
        expect(TRAIT_INFO[traitId]).toBeDefined()
        expect(TRAIT_INFO[traitId].label).toBeTruthy()
        expect(TRAIT_INFO[traitId].description).toBeTruthy()
      }
    }
  })

  describe('getDefaultShipId', () => {
    it('returns the first unlocked ship id', () => {
      const defaultId = getDefaultShipId()
      expect(defaultId).toBeTruthy()
      expect(SHIPS[defaultId]).toBeDefined()
      expect(SHIPS[defaultId].locked).toBe(false)
    })

    it('returns BALANCED specifically (AC4)', () => {
      expect(getDefaultShipId()).toBe('BALANCED')
    })
  })

  describe('GLASS_CANNON (Striker) stats — AC1', () => {
    it('has correct stat values', () => {
      expect(SHIPS.GLASS_CANNON.baseHP).toBe(50)
      expect(SHIPS.GLASS_CANNON.baseSpeed).toBe(65)
      expect(SHIPS.GLASS_CANNON.baseDamageMultiplier).toBe(1.1)
      expect(SHIPS.GLASS_CANNON.levelScaling).toBe(0.10)
      expect(SHIPS.GLASS_CANNON.locked).toBe(false)
      expect(SHIPS.GLASS_CANNON.defaultWeaponId).toBe('BEAM')
      expect(SHIPS.GLASS_CANNON.modelPath).toBe('./models/ships/SpaceshipB.glb')
      expect(SHIPS.GLASS_CANNON.colorTheme).toBe('#cc5500')
    })
    it('preferredBoonIds equals [SPEED_BOOST, COOLDOWN_REDUCTION] (Story 50.4 AC#1)', () => {
      expect(SHIPS.GLASS_CANNON.preferredBoonIds).toEqual(['SPEED_BOOST', 'COOLDOWN_REDUCTION'])
    })
  })

  describe('TANK (Fortress) stats — AC2', () => {
    it('has correct stat values', () => {
      expect(SHIPS.TANK.baseHP).toBe(180)
      expect(SHIPS.TANK.baseSpeed).toBe(35)
      expect(SHIPS.TANK.baseDamageMultiplier).toBe(0.85)
      expect(SHIPS.TANK.baseZone).toBe(20)
      expect(SHIPS.TANK.levelScaling).toBe(0.10)
      expect(SHIPS.TANK.locked).toBe(false)
      expect(SHIPS.TANK.defaultWeaponId).toBe('AURA')
      expect(SHIPS.TANK.modelPath).toBe('./models/ships/SpaceshipC.glb')
      expect(SHIPS.TANK.colorTheme).toBe('#44aaff')
    })
    it('preferredBoonIds equals [HP_REGEN, MAX_HP_UP, DAMAGE_REDUCTION] (Story 50.4 AC#2)', () => {
      expect(SHIPS.TANK.preferredBoonIds).toEqual(['HP_REGEN', 'MAX_HP_UP', 'DAMAGE_REDUCTION'])
    })
  })

  describe('BALANCED stats — AC3', () => {
    it('has defaultWeaponId LASER_FRONT', () => {
      expect(SHIPS.BALANCED.defaultWeaponId).toBe('LASER_FRONT')
    })
    it('preferredBoonIds equals [] — no bias (Story 50.4 AC#3)', () => {
      expect(SHIPS.BALANCED.preferredBoonIds).toEqual([])
    })
  })

  it('every ship defaultWeaponId references an existing weapon (M1)', () => {
    for (const ship of Object.values(SHIPS)) {
      if (ship.defaultWeaponId !== undefined) {
        expect(WEAPONS[ship.defaultWeaponId]).toBeDefined()
      }
    }
  })

  it('every preferredBoonId references an existing boon (M2)', () => {
    for (const ship of Object.values(SHIPS)) {
      if (Array.isArray(ship.preferredBoonIds)) {
        for (const boonId of ship.preferredBoonIds) {
          expect(BOONS[boonId]).toBeDefined()
        }
      }
    }
  })

})
