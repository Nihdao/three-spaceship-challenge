import { describe, it, expect } from 'vitest'
import { WEAPONS } from '../weaponDefs.js'

// Story 32.4: SHOCKWAVE non-projectile arc burst weapon def tests

describe('SHOCKWAVE weapon def (Story 32.4)', () => {
  const def = WEAPONS.SHOCKWAVE

  it('exists in WEAPONS', () => {
    expect(def).toBeDefined()
  })

  it('has weaponType "shockwave" (not projectileType)', () => {
    expect(def.weaponType).toBe('shockwave')
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

  it('has baseDamage: 40', () => {
    expect(def.baseDamage).toBe(40)
  })

  it('has baseCooldown: 2.5', () => {
    expect(def.baseCooldown).toBe(2.5)
  })

  it('has waveCount: 3', () => {
    expect(def.waveCount).toBe(3)
  })

  it('has waveDelay: 0.2', () => {
    expect(def.waveDelay).toBe(0.2)
  })

  it('has waveSectorAngle ≈ 2.094 (Math.PI * 2 / 3)', () => {
    expect(def.waveSectorAngle).toBeCloseTo(Math.PI * 2 / 3, 5)
  })

  it('has waveExpandSpeed: 100', () => {
    expect(def.waveExpandSpeed).toBe(100)
  })

  it('has waveMaxRadius: 22', () => {
    expect(def.waveMaxRadius).toBe(22)
  })

  it('has poolLimit: 9', () => {
    expect(def.poolLimit).toBe(9)
  })

  it('has projectileColor "#f9e547"', () => {
    expect(def.projectileColor).toBe('#f9e547')
  })

  it('has knockbackStrength: 5', () => {
    expect(def.knockbackStrength).toBe(5)
  })

  it('has slot "any"', () => {
    expect(def.slot).toBe('any')
  })

  it('has sfxKey', () => {
    expect(typeof def.sfxKey).toBe('string')
    expect(def.sfxKey.length).toBeGreaterThan(0)
  })

  it('does NOT have implemented field (eligible for level-up pool after Task 7 QA)', () => {
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
