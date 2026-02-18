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
    // LEGENDARY multiplier = 1.50 → delta 0.15 scaled: 1 + 0.15 * 1.50 = 1.225
    const mods = useBoons.getState().modifiers
    expect(mods.damageMultiplier).toBeCloseTo(1.225, 5)
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
})
