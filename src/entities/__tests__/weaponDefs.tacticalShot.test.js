import { describe, it, expect } from 'vitest'
import { WEAPONS } from '../weaponDefs.js'

// Story 32.6: TACTICAL_SHOT non-projectile instant-strike weapon def tests

describe('TACTICAL_SHOT weapon def (Story 32.6)', () => {
  const def = WEAPONS.TACTICAL_SHOT

  it('exists in WEAPONS', () => {
    expect(def).toBeDefined()
  })

  it('has weaponType "tactical_shot" (not projectileType)', () => {
    expect(def.weaponType).toBe('tactical_shot')
  })

  it('does NOT have projectileType, baseSpeed, projectileRadius, projectileLifetime, projectileMeshScale, projectilePattern', () => {
    expect(def).not.toHaveProperty('projectileType')
    expect(def).not.toHaveProperty('baseSpeed')
    expect(def).not.toHaveProperty('projectileRadius')
    expect(def).not.toHaveProperty('projectileLifetime')
    expect(def).not.toHaveProperty('projectileMeshScale')
    expect(def).not.toHaveProperty('projectilePattern')
  })

  it('has id "TACTICAL_SHOT"', () => {
    expect(def.id).toBe('TACTICAL_SHOT')
  })

  it('has name "Tactical Strike"', () => {
    expect(def.name).toBe('Tactical Strike')
  })

  it('has baseDamage: 35', () => {
    expect(def.baseDamage).toBe(35)
  })

  it('has baseCooldown: 1.2', () => {
    expect(def.baseCooldown).toBe(1.2)
  })

  it('has detectionRadius: 60', () => {
    expect(def.detectionRadius).toBe(60)
  })

  it('has strikeAoeRadius: 6', () => {
    expect(def.strikeAoeRadius).toBe(6)
  })

  it('has strikeVfxDuration: 0.3', () => {
    expect(def.strikeVfxDuration).toBe(0.3)
  })

  it('has splashDamageRatio: 0.5', () => {
    expect(def.splashDamageRatio).toBe(0.5)
  })

  it('has poolLimit: 4', () => {
    expect(def.poolLimit).toBe(4)
  })

  it('has projectileColor "#2dc653"', () => {
    expect(def.projectileColor).toBe('#2dc653')
  })

  it('has sfxKey "tactical-shot"', () => {
    expect(def.sfxKey).toBe('tactical-shot')
  })

  it('has knockbackStrength: 2', () => {
    expect(def.knockbackStrength).toBe(2)
  })

  it('has slot "any"', () => {
    expect(def.slot).toBe('any')
  })

  it('has rarityWeight defined (Story 32.6 code-review M1 fix)', () => {
    expect(def.rarityWeight).toBeDefined()
    expect(def.rarityWeight).toBeGreaterThan(0)
  })

  it('does NOT have implemented field (eligible for level-up pool after Task 7)', () => {
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
