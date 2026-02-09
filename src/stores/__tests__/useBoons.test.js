import { describe, it, expect, beforeEach } from 'vitest'
import useBoons from '../useBoons.jsx'
import { BOONS } from '../../entities/boonDefs.js'

describe('useBoons store', () => {
  beforeEach(() => {
    useBoons.getState().reset()
  })

  it('should start with empty activeBoons', () => {
    expect(useBoons.getState().activeBoons).toEqual([])
  })

  it('should start with default modifiers', () => {
    const m = useBoons.getState().modifiers
    expect(m.damageMultiplier).toBe(1)
    expect(m.speedMultiplier).toBe(1)
    expect(m.cooldownMultiplier).toBe(1)
    expect(m.critChance).toBe(0)
  })

  it('should add a boon via addBoon with level 1', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    expect(useBoons.getState().activeBoons.length).toBe(1)
    expect(useBoons.getState().activeBoons[0].boonId).toBe('DAMAGE_AMP')
    expect(useBoons.getState().activeBoons[0].level).toBe(1)
  })

  it('should not add duplicate boon', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().addBoon('DAMAGE_AMP')
    expect(useBoons.getState().activeBoons.length).toBe(1)
  })

  it('should cap at 3 boons', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().addBoon('SPEED_BOOST')
    useBoons.getState().addBoon('COOLDOWN_REDUCTION')
    useBoons.getState().addBoon('CRIT_CHANCE')
    expect(useBoons.getState().activeBoons.length).toBe(3)
  })

  it('getEquippedBoonIds returns array of IDs', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().addBoon('SPEED_BOOST')
    expect(useBoons.getState().getEquippedBoonIds()).toEqual(['DAMAGE_AMP', 'SPEED_BOOST'])
  })

  it('getEquippedBoons returns array of { boonId, level }', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().addBoon('SPEED_BOOST')
    expect(useBoons.getState().getEquippedBoons()).toEqual([
      { boonId: 'DAMAGE_AMP', level: 1 },
      { boonId: 'SPEED_BOOST', level: 1 },
    ])
  })

  it('should reset to empty', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().reset()
    expect(useBoons.getState().activeBoons).toEqual([])
    expect(useBoons.getState().modifiers.damageMultiplier).toBe(1)
  })

  // --- computeModifiers tests (Task 2 / AC #4) ---

  it('computeModifiers — DAMAGE_AMP boon sets damageMultiplier', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    const m = useBoons.getState().modifiers
    expect(m.damageMultiplier).toBe(BOONS.DAMAGE_AMP.tiers[0].effect.damageMultiplier)
  })

  it('computeModifiers — multiple boons computed correctly', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().addBoon('COOLDOWN_REDUCTION')
    const m = useBoons.getState().modifiers
    expect(m.damageMultiplier).toBe(BOONS.DAMAGE_AMP.tiers[0].effect.damageMultiplier)
    expect(m.cooldownMultiplier).toBe(BOONS.COOLDOWN_REDUCTION.tiers[0].effect.cooldownMultiplier)
    expect(m.speedMultiplier).toBe(1) // not affected
  })

  it('computeModifiers — crit chance at max level equals tier 3 value', () => {
    useBoons.getState().addBoon('CRIT_CHANCE')
    useBoons.getState().upgradeBoon('CRIT_CHANCE')
    useBoons.getState().upgradeBoon('CRIT_CHANCE')
    const m = useBoons.getState().modifiers
    expect(m.critChance).toBe(BOONS.CRIT_CHANCE.tiers[2].effect.critChance)
  })

  it('computeModifiers — crit chance is capped at 1.0 when exceeding limit', () => {
    // Bypass slot cap and duplicate guard to force crit total > 1.0
    useBoons.setState({
      activeBoons: [
        { boonId: 'CRIT_CHANCE', level: 3 },
        { boonId: 'CRIT_CHANCE', level: 3 },
        { boonId: 'CRIT_CHANCE', level: 3 },
        { boonId: 'CRIT_CHANCE', level: 3 },
      ],
    })
    useBoons.getState().computeModifiers()
    const m = useBoons.getState().modifiers
    // 4 × 0.30 = 1.20, should be capped at 1.0
    expect(m.critChance).toBe(1.0)
  })

  it('computeModifiers auto-called after addBoon', () => {
    // Before add, modifiers should be default
    expect(useBoons.getState().modifiers.damageMultiplier).toBe(1)
    useBoons.getState().addBoon('DAMAGE_AMP')
    // After add, modifiers should be updated
    expect(useBoons.getState().modifiers.damageMultiplier).toBe(BOONS.DAMAGE_AMP.tiers[0].effect.damageMultiplier)
  })

  it('computeModifiers auto-called after upgradeBoon', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    const m1 = useBoons.getState().modifiers.damageMultiplier
    useBoons.getState().upgradeBoon('DAMAGE_AMP')
    const m2 = useBoons.getState().modifiers.damageMultiplier
    expect(m2).toBe(BOONS.DAMAGE_AMP.tiers[1].effect.damageMultiplier)
    expect(m2).not.toBe(m1)
  })

  // --- upgradeBoon tests (Task 3 / AC #3) ---

  it('upgradeBoon — increments boon level', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().upgradeBoon('DAMAGE_AMP')
    expect(useBoons.getState().activeBoons[0].level).toBe(2)
  })

  it('upgradeBoon — updates modifiers to level 2 values', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().upgradeBoon('DAMAGE_AMP')
    const m = useBoons.getState().modifiers
    expect(m.damageMultiplier).toBe(BOONS.DAMAGE_AMP.tiers[1].effect.damageMultiplier)
  })

  it('upgradeBoon — caps at maxLevel', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    useBoons.getState().upgradeBoon('DAMAGE_AMP') // level 2
    useBoons.getState().upgradeBoon('DAMAGE_AMP') // level 3 (max)
    useBoons.getState().upgradeBoon('DAMAGE_AMP') // should be rejected
    expect(useBoons.getState().activeBoons[0].level).toBe(3)
  })

  it('upgradeBoon — does nothing for non-equipped boon', () => {
    useBoons.getState().upgradeBoon('DAMAGE_AMP')
    expect(useBoons.getState().activeBoons.length).toBe(0)
  })
})
