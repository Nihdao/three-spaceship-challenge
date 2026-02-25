import { describe, it, expect } from 'vitest'
import { WEAPONS } from '../weaponDefs.js'

// Story 32.2: AURA non-projectile weapon def tests

describe('AURA weapon def (Story 32.2)', () => {
  const def = WEAPONS.AURA

  it('exists in WEAPONS', () => {
    expect(def).toBeDefined()
  })

  it('has weaponType "aura" (not projectileType)', () => {
    expect(def.weaponType).toBe('aura')
  })

  it('does NOT have projectileType field', () => {
    expect(def).not.toHaveProperty('projectileType')
  })

  it('does NOT have baseCooldown, baseSpeed, projectileRadius, projectileLifetime, projectileMeshScale', () => {
    expect(def).not.toHaveProperty('baseCooldown')
    expect(def).not.toHaveProperty('baseSpeed')
    expect(def).not.toHaveProperty('projectileRadius')
    expect(def).not.toHaveProperty('projectileLifetime')
    expect(def).not.toHaveProperty('projectileMeshScale')
  })

  it('has baseDamage: 5', () => {
    expect(def.baseDamage).toBe(5)
  })

  it('has auraRadius: 15', () => {
    expect(def.auraRadius).toBe(15)
  })

  it('has tickRate: 0.25', () => {
    expect(def.tickRate).toBe(0.25)
  })

  it('has projectileColor "#c084fc"', () => {
    expect(def.projectileColor).toBe('#c084fc')
  })

  it('has knockbackStrength 0', () => {
    expect(def.knockbackStrength).toBe(0)
  })

  it('has slot "any"', () => {
    expect(def.slot).toBe('any')
  })

  it('has sfxKey', () => {
    expect(typeof def.sfxKey).toBe('string')
    expect(def.sfxKey.length).toBeGreaterThan(0)
  })

  it('does NOT have implemented field (eligible for level-up pool after Task 6)', () => {
    expect(def).not.toHaveProperty('implemented')
  })

  // Story 32.8: rarityDamageMultipliers and upgrades removed (dead code)
  it('does NOT have rarityDamageMultipliers field', () => {
    expect(def).not.toHaveProperty('rarityDamageMultipliers')
  })

  it('does NOT have upgrades array', () => {
    expect(def).not.toHaveProperty('upgrades')
  })
})
