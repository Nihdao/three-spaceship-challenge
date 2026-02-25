import { describe, it, expect } from 'vitest'
import { WEAPONS } from '../weaponDefs.js'

// Story 32.1: LASER_CROSS non-projectile weapon def tests

describe('LASER_CROSS weapon def (Story 32.1)', () => {
  const def = WEAPONS.LASER_CROSS

  it('exists in WEAPONS', () => {
    expect(def).toBeDefined()
  })

  it('has weaponType "laser_cross" (not projectileType)', () => {
    expect(def.weaponType).toBe('laser_cross')
  })

  it('does NOT have projectileType field', () => {
    expect(def).not.toHaveProperty('projectileType')
  })

  it('does NOT have baseSpeed, projectileRadius, projectileLifetime, projectileMeshScale', () => {
    expect(def).not.toHaveProperty('baseSpeed')
    expect(def).not.toHaveProperty('projectileRadius')
    expect(def).not.toHaveProperty('projectileLifetime')
    expect(def).not.toHaveProperty('projectileMeshScale')
  })

  it('has correct baseDamage (2 per tick)', () => {
    expect(def.baseDamage).toBe(2)
  })

  it('has rotationSpeed', () => {
    expect(def.rotationSpeed).toBeGreaterThan(0)
  })

  it('has activeTime and inactiveTime', () => {
    expect(def.activeTime).toBeGreaterThan(0)
    expect(def.inactiveTime).toBeGreaterThan(0)
  })

  it('has armLength and armWidth', () => {
    expect(def.armLength).toBeGreaterThan(0)
    expect(def.armWidth).toBeGreaterThan(0)
  })

  it('has projectileColor #9b5de5', () => {
    expect(def.projectileColor).toBe('#9b5de5')
  })

  it('has sfxKey', () => {
    expect(typeof def.sfxKey).toBe('string')
    expect(def.sfxKey.length).toBeGreaterThan(0)
  })

  it('has knockbackStrength 0', () => {
    expect(def.knockbackStrength).toBe(0)
  })

  it('has slot "any"', () => {
    expect(def.slot).toBe('any')
  })

  // Story 32.8: implemented, rarityDamageMultipliers, upgrades removed (dead code)
  it('does NOT have implemented field', () => {
    expect(def).not.toHaveProperty('implemented')
  })

  it('does NOT have rarityDamageMultipliers field', () => {
    expect(def).not.toHaveProperty('rarityDamageMultipliers')
  })

  it('does NOT have upgrades array', () => {
    expect(def).not.toHaveProperty('upgrades')
  })
})
