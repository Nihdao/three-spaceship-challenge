import { describe, it, expect } from 'vitest'
import { WEAPONS } from '../weaponDefs.js'

// Story 32.5: MINE_AROUND non-projectile orbiting proximity mines weapon def tests

describe('MINE_AROUND weapon def (Story 32.5)', () => {
  const def = WEAPONS.MINE_AROUND

  it('exists in WEAPONS', () => {
    expect(def).toBeDefined()
  })

  it('has weaponType "mine_around" (not projectileType)', () => {
    expect(def.weaponType).toBe('mine_around')
  })

  it('does NOT have projectileType, baseSpeed, projectileRadius, projectileLifetime, projectileMeshScale, baseCooldown, projectilePattern', () => {
    expect(def).not.toHaveProperty('projectileType')
    expect(def).not.toHaveProperty('baseSpeed')
    expect(def).not.toHaveProperty('projectileRadius')
    expect(def).not.toHaveProperty('projectileLifetime')
    expect(def).not.toHaveProperty('projectileMeshScale')
    expect(def).not.toHaveProperty('baseCooldown')
    expect(def).not.toHaveProperty('projectilePattern')
  })

  it('has id "MINE_AROUND"', () => {
    expect(def.id).toBe('MINE_AROUND')
  })

  it('has name "Mine Field"', () => {
    expect(def.name).toBe('Mine Field')
  })

  it('has baseDamage: 50', () => {
    expect(def.baseDamage).toBe(50)
  })

  it('has mineCount: 3', () => {
    expect(def.mineCount).toBe(3)
  })

  it('has orbitalRadius: 15', () => {
    expect(def.orbitalRadius).toBe(15)
  })

  it('has orbitalSpeed: 0.8', () => {
    expect(def.orbitalSpeed).toBe(0.8)
  })

  it('has mineDetectionRadius: 4', () => {
    expect(def.mineDetectionRadius).toBe(4)
  })

  it('has explosionRadius: 10', () => {
    expect(def.explosionRadius).toBe(10)
  })

  it('has mineRespawnTime: 5', () => {
    expect(def.mineRespawnTime).toBe(5)
  })

  it('has poolLimit: 3 (same as mineCount)', () => {
    expect(def.poolLimit).toBe(3)
  })

  it('has projectileColor "#06d6a0"', () => {
    expect(def.projectileColor).toBe('#06d6a0')
  })

  it('has knockbackStrength: 4', () => {
    expect(def.knockbackStrength).toBe(4)
  })

  it('has slot "any"', () => {
    expect(def.slot).toBe('any')
  })

  it('has sfxKey "mine-explosion"', () => {
    expect(def.sfxKey).toBe('mine-explosion')
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
