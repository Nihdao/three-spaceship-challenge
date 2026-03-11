import { describe, it, expect, beforeEach } from 'vitest'
import useBoons from '../useBoons.jsx'

describe('useBoons — rarity integration (Story 22.3)', () => {
  beforeEach(() => {
    useBoons.getState().reset()
  })

  it('addBoon stores rarity on boon', () => {
    useBoons.getState().addBoon('DAMAGE_AMP', 'RARE')
    const boon = useBoons.getState().activeBoons.find(b => b.boonId === 'DAMAGE_AMP')
    expect(boon).toBeDefined()
    expect(boon.rarity).toBe('RARE')
  })

  it('addBoon defaults to COMMON when no rarity provided', () => {
    useBoons.getState().addBoon('DAMAGE_AMP')
    const boon = useBoons.getState().activeBoons.find(b => b.boonId === 'DAMAGE_AMP')
    expect(boon.rarity).toBe('COMMON')
  })

  it('upgradeBoon uses the rarity passed to it (rarity does not persist across upgrades)', () => {
    useBoons.getState().addBoon('DAMAGE_AMP', 'LEGENDARY')
    useBoons.getState().upgradeBoon('DAMAGE_AMP', 'COMMON') // Each upgrade is independently rolled
    const boon = useBoons.getState().activeBoons.find(b => b.boonId === 'DAMAGE_AMP')
    expect(boon.rarity).toBe('COMMON')
  })

  it('modifiers are scaled by rarity multiplier after addBoon', () => {
    useBoons.getState().addBoon('DAMAGE_AMP', 'LEGENDARY')
    // LEGENDARY multiplier = 1.50 → delta 0.30 scaled: 1 + 0.30 * 1.50 = 1.45
    const mods = useBoons.getState().modifiers
    expect(mods.damageMultiplier).toBeCloseTo(1.45, 5)
  })

  it('luckBonus in modifiers defaults to 0 (no boon provides luck yet)', () => {
    useBoons.getState().addBoon('DAMAGE_AMP', 'LEGENDARY')
    expect(useBoons.getState().modifiers.luckBonus).toBe(0)
  })

  it('reset clears rarity from boons', () => {
    useBoons.getState().addBoon('DAMAGE_AMP', 'EPIC')
    useBoons.getState().reset()
    expect(useBoons.getState().activeBoons).toHaveLength(0)
    expect(useBoons.getState().modifiers.luckBonus).toBe(0)
  })

  // --- Story 46.3: rarity coverage for all modified boons ---

  it('SPEED_BOOST — LEGENDARY scales speedMultiplier delta correctly', () => {
    useBoons.getState().addBoon('SPEED_BOOST', 'LEGENDARY')
    // tier 1 speedMultiplier = 1.30 → delta 0.30 scaled: 1 + 0.30 * 1.50 = 1.45
    expect(useBoons.getState().modifiers.speedMultiplier).toBeCloseTo(1.45, 5)
  })

  it('COOLDOWN_REDUCTION — LEGENDARY tier 1 scales cooldownMultiplier delta correctly', () => {
    useBoons.getState().addBoon('COOLDOWN_REDUCTION', 'LEGENDARY')
    // tier 1 cooldownMultiplier = 0.75 → delta -0.25 scaled: 1 + (-0.25) * 1.50 = 0.625
    expect(useBoons.getState().modifiers.cooldownMultiplier).toBeCloseTo(0.625, 5)
  })

  it('COOLDOWN_REDUCTION — LEGENDARY tier 3 produces extreme cooldownMultiplier (10x fire rate)', () => {
    useBoons.getState().addBoon('COOLDOWN_REDUCTION', 'LEGENDARY')
    useBoons.getState().upgradeBoon('COOLDOWN_REDUCTION', 'LEGENDARY')
    useBoons.getState().upgradeBoon('COOLDOWN_REDUCTION', 'LEGENDARY')
    // tier 3 cooldownMultiplier = 0.40 → delta -0.60 scaled: 1 + (-0.60) * 1.50 = 0.10
    // NOTE: weapons fire at 10x normal rate — intentional "violence" per Epic 46
    expect(useBoons.getState().modifiers.cooldownMultiplier).toBeCloseTo(0.10, 5)
  })

  it('CRIT_CHANCE — LEGENDARY scales critChance additively (critChance * r)', () => {
    useBoons.getState().addBoon('CRIT_CHANCE', 'LEGENDARY')
    // tier 1 critChance = 0.15, additive formula: 0.15 * 1.50 = 0.225
    expect(useBoons.getState().modifiers.critChance).toBeCloseTo(0.225, 5)
  })

  it('CRIT_MULTIPLIER — LEGENDARY scales from 2.0 baseline correctly', () => {
    useBoons.getState().addBoon('CRIT_MULTIPLIER', 'LEGENDARY')
    // tier 1 critMultiplier = 2.5, formula: 2.0 + (2.5 - 2.0) * 1.50 = 2.75
    expect(useBoons.getState().modifiers.critMultiplier).toBeCloseTo(2.75, 5)
  })

  it('CRIT_MULTIPLIER — LEGENDARY tier 3 scales correctly', () => {
    useBoons.getState().addBoon('CRIT_MULTIPLIER', 'LEGENDARY')
    useBoons.getState().upgradeBoon('CRIT_MULTIPLIER', 'LEGENDARY')
    useBoons.getState().upgradeBoon('CRIT_MULTIPLIER', 'LEGENDARY')
    // tier 3 critMultiplier = 3.8, formula: 2.0 + (3.8 - 2.0) * 1.50 = 4.70
    expect(useBoons.getState().modifiers.critMultiplier).toBeCloseTo(4.70, 5)
  })
})
