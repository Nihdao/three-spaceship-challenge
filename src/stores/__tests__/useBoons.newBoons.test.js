import { describe, it, expect, beforeEach } from 'vitest'
import useBoons from '../useBoons.jsx'
import { BOONS } from '../../entities/boonDefs.js'

describe('useBoons — Story 11.4 new boons', () => {
  beforeEach(() => {
    useBoons.getState().reset()
  })

  // --- Boon definitions validation ---

  it('should have at least 12 boon types defined', () => {
    expect(Object.keys(BOONS).length).toBeGreaterThanOrEqual(12)
  })

  it('each boon has required structure (id, name, maxLevel, effect, tiers)', () => {
    for (const [key, boon] of Object.entries(BOONS)) {
      expect(boon.id).toBe(key)
      expect(boon.name).toBeTruthy()
      expect(boon.maxLevel).toBe(3)
      expect(boon.effect).toBeTruthy()
      expect(boon.tiers).toHaveLength(3)
      for (const tier of boon.tiers) {
        expect(tier.level).toBeGreaterThanOrEqual(1)
        expect(tier.description).toBeTruthy()
        expect(tier.effect).toBeTruthy()
        expect(tier.statPreview).toBeTruthy()
      }
    }
  })

  // --- Default modifiers include new fields ---

  it('default modifiers include all new fields', () => {
    const m = useBoons.getState().modifiers
    expect(m.critMultiplier).toBe(2.0)
    expect(m.projectileSpeedMultiplier).toBe(1.0)
    expect(m.maxHPBonus).toBe(0)
    expect(m.hpRegenRate).toBe(0)
    expect(m.damageReduction).toBe(0)
    expect(m.xpMultiplier).toBe(1.0)
    expect(m.fragmentMultiplier).toBe(1.0)
    expect(m.pickupRadiusMultiplier).toBe(1.0)
  })

  it('reset restores all new modifier defaults', () => {
    useBoons.getState().addBoon('CRIT_MULTIPLIER')
    useBoons.getState().reset()
    const m = useBoons.getState().modifiers
    expect(m.critMultiplier).toBe(2.0)
    expect(m.maxHPBonus).toBe(0)
    expect(m.hpRegenRate).toBe(0)
  })

  // --- CRIT_MULTIPLIER ---

  it('CRIT_MULTIPLIER — sets critMultiplier at each tier', () => {
    useBoons.getState().addBoon('CRIT_MULTIPLIER')
    expect(useBoons.getState().modifiers.critMultiplier).toBe(2.2)
    useBoons.getState().upgradeBoon('CRIT_MULTIPLIER')
    expect(useBoons.getState().modifiers.critMultiplier).toBe(2.4)
    useBoons.getState().upgradeBoon('CRIT_MULTIPLIER')
    expect(useBoons.getState().modifiers.critMultiplier).toBe(2.7)
  })

  // --- PROJECTILE_SPEED ---

  it('PROJECTILE_SPEED — sets projectileSpeedMultiplier at each tier', () => {
    useBoons.getState().addBoon('PROJECTILE_SPEED')
    expect(useBoons.getState().modifiers.projectileSpeedMultiplier).toBeCloseTo(1.15)
    useBoons.getState().upgradeBoon('PROJECTILE_SPEED')
    expect(useBoons.getState().modifiers.projectileSpeedMultiplier).toBeCloseTo(1.30)
    useBoons.getState().upgradeBoon('PROJECTILE_SPEED')
    expect(useBoons.getState().modifiers.projectileSpeedMultiplier).toBeCloseTo(1.50)
  })

  // --- MAX_HP_UP ---

  it('MAX_HP_UP — sets maxHPBonus at each tier', () => {
    useBoons.getState().addBoon('MAX_HP_UP')
    expect(useBoons.getState().modifiers.maxHPBonus).toBe(20)
    useBoons.getState().upgradeBoon('MAX_HP_UP')
    expect(useBoons.getState().modifiers.maxHPBonus).toBe(50)
    useBoons.getState().upgradeBoon('MAX_HP_UP')
    expect(useBoons.getState().modifiers.maxHPBonus).toBe(100)
  })

  // --- HP_REGEN ---

  it('HP_REGEN — sets hpRegenRate at each tier', () => {
    useBoons.getState().addBoon('HP_REGEN')
    expect(useBoons.getState().modifiers.hpRegenRate).toBe(1.0)
    useBoons.getState().upgradeBoon('HP_REGEN')
    expect(useBoons.getState().modifiers.hpRegenRate).toBe(2.0)
    useBoons.getState().upgradeBoon('HP_REGEN')
    expect(useBoons.getState().modifiers.hpRegenRate).toBe(4.0)
  })

  // --- DAMAGE_REDUCTION ---

  it('DAMAGE_REDUCTION — sets damageReduction at each tier', () => {
    useBoons.getState().addBoon('DAMAGE_REDUCTION')
    expect(useBoons.getState().modifiers.damageReduction).toBeCloseTo(0.10)
    useBoons.getState().upgradeBoon('DAMAGE_REDUCTION')
    expect(useBoons.getState().modifiers.damageReduction).toBeCloseTo(0.18)
    useBoons.getState().upgradeBoon('DAMAGE_REDUCTION')
    expect(useBoons.getState().modifiers.damageReduction).toBeCloseTo(0.25)
  })

  // --- XP_GAIN ---

  it('XP_GAIN — sets xpMultiplier at each tier', () => {
    useBoons.getState().addBoon('XP_GAIN')
    expect(useBoons.getState().modifiers.xpMultiplier).toBeCloseTo(1.20)
    useBoons.getState().upgradeBoon('XP_GAIN')
    expect(useBoons.getState().modifiers.xpMultiplier).toBeCloseTo(1.40)
    useBoons.getState().upgradeBoon('XP_GAIN')
    expect(useBoons.getState().modifiers.xpMultiplier).toBeCloseTo(1.75)
  })

  // --- FRAGMENT_GAIN ---

  it('FRAGMENT_GAIN — sets fragmentMultiplier at each tier', () => {
    useBoons.getState().addBoon('FRAGMENT_GAIN')
    expect(useBoons.getState().modifiers.fragmentMultiplier).toBeCloseTo(1.20)
    useBoons.getState().upgradeBoon('FRAGMENT_GAIN')
    expect(useBoons.getState().modifiers.fragmentMultiplier).toBeCloseTo(1.40)
    useBoons.getState().upgradeBoon('FRAGMENT_GAIN')
    expect(useBoons.getState().modifiers.fragmentMultiplier).toBeCloseTo(1.75)
  })

  // --- PICKUP_RADIUS ---

  it('PICKUP_RADIUS — sets pickupRadiusMultiplier at each tier', () => {
    useBoons.getState().addBoon('PICKUP_RADIUS')
    expect(useBoons.getState().modifiers.pickupRadiusMultiplier).toBeCloseTo(1.30)
    useBoons.getState().upgradeBoon('PICKUP_RADIUS')
    expect(useBoons.getState().modifiers.pickupRadiusMultiplier).toBeCloseTo(1.60)
    useBoons.getState().upgradeBoon('PICKUP_RADIUS')
    expect(useBoons.getState().modifiers.pickupRadiusMultiplier).toBeCloseTo(2.00)
  })

  // --- Multiple boon combination ---

  it('multiple different boons combine correctly', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().addBoon('CRIT_MULTIPLIER')
    useBoons.getState().addBoon('HP_REGEN')
    const m = useBoons.getState().modifiers
    expect(m.damageMultiplier).toBe(BOONS.DAMAGE_AMP.tiers[0].effect.damageMultiplier)
    expect(m.critMultiplier).toBe(2.2)
    expect(m.hpRegenRate).toBe(1.0)
    // Unaffected modifiers stay at defaults
    expect(m.speedMultiplier).toBe(1)
    expect(m.damageReduction).toBe(0)
    expect(m.xpMultiplier).toBe(1.0)
  })

  // --- Stacking: tier replaces, not additive ---

  it('tier upgrade replaces previous tier value for critMultiplier', () => {
    useBoons.getState().addBoon('CRIT_MULTIPLIER')
    expect(useBoons.getState().modifiers.critMultiplier).toBe(2.2)
    useBoons.getState().upgradeBoon('CRIT_MULTIPLIER')
    // Should be 2.4, not 2.2 + 2.4
    expect(useBoons.getState().modifiers.critMultiplier).toBe(2.4)
  })

  it('tier upgrade replaces previous tier value for maxHPBonus', () => {
    useBoons.getState().addBoon('MAX_HP_UP')
    expect(useBoons.getState().modifiers.maxHPBonus).toBe(20)
    useBoons.getState().upgradeBoon('MAX_HP_UP')
    // Should be 50, not 20 + 50
    expect(useBoons.getState().modifiers.maxHPBonus).toBe(50)
  })
})
