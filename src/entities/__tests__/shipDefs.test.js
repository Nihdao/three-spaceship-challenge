import { describe, it, expect } from 'vitest'
import { SHIPS, getDefaultShipId } from '../shipDefs.js'

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

  describe('getDefaultShipId', () => {
    it('returns the first unlocked ship id', () => {
      const defaultId = getDefaultShipId()
      expect(defaultId).toBeTruthy()
      expect(SHIPS[defaultId]).toBeDefined()
      expect(SHIPS[defaultId].locked).toBe(false)
    })
  })
})
