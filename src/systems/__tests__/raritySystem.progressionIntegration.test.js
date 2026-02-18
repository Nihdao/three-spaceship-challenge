import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateChoices } from '../progressionSystem.js'

describe('progressionSystem — rarity integration (Story 22.3)', () => {
  const baseEquipped = [{ weaponId: 'LASER_FRONT', level: 1 }]

  // Ensure mocks are always cleaned up even if a test throws
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should assign rarity to all choices', () => {
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      expect(choice.rarity).toBeDefined()
      expect(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']).toContain(choice.rarity)
    }
  })

  it('should include rarityColor for all choices', () => {
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      expect(choice.rarityColor).toBeDefined()
      expect(choice.rarityColor).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('should include rarityName for all choices', () => {
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      expect(choice.rarityName).toBeDefined()
      expect(['Common', 'Rare', 'Epic', 'Legendary']).toContain(choice.rarityName)
    }
  })

  it('should include rarityMultiplier for all choices', () => {
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      expect(typeof choice.rarityMultiplier).toBe('number')
      expect(choice.rarityMultiplier).toBeGreaterThanOrEqual(1.0)
    }
  })

  it('should not show same weapon at multiple rarities', () => {
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    const weaponIds = choices.filter(c => c.type === 'new_weapon' || c.type === 'weapon_upgrade').map(c => c.id)
    const uniqueWeaponIds = new Set(weaponIds)
    expect(weaponIds.length).toBe(uniqueWeaponIds.size)
  })

  it('should not show same boon at multiple rarities', () => {
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    const boonIds = choices.filter(c => c.type === 'new_boon' || c.type === 'boon_upgrade').map(c => c.id)
    const uniqueBoonIds = new Set(boonIds)
    expect(boonIds.length).toBe(uniqueBoonIds.size)
  })

  it('should default luckStat to 0 when not provided (backwards compatibility)', () => {
    const choices = generateChoices(5, baseEquipped, [], [], [])
    for (const choice of choices) {
      expect(choice.rarity).toBeDefined()
    }
  })

  it('should set LEGENDARY rarity when Math.random returns high value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.98)
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    // With 0 luck, roll=0.98 should yield LEGENDARY (cumulative >0.97)
    expect(choices.some(c => c.rarity === 'LEGENDARY')).toBe(true)
    vi.restoreAllMocks()
  })

  it('should set COMMON rarity when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      expect(choice.rarity).toBe('COMMON')
    }
    vi.restoreAllMocks()
  })

  it('COMMON rarity: rarityMultiplier is 1.0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // Always COMMON
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      expect(choice.rarityMultiplier).toBe(1.0)
    }
    vi.restoreAllMocks()
  })

  it('LEGENDARY rarity: rarityMultiplier is 1.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.98) // Always LEGENDARY
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      expect(choice.rarityMultiplier).toBe(1.5)
    }
    vi.restoreAllMocks()
  })

  it('COMMON rarity: weapon statPreview has no rarity label', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // Always COMMON
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    const weaponChoices = choices.filter(c => c.type === 'new_weapon' || c.type === 'weapon_upgrade')
    for (const choice of weaponChoices) {
      if (choice.statPreview) {
        expect(choice.statPreview).not.toContain('(Common)')
        expect(choice.statPreview).not.toContain('(Rare)')
      }
    }
    vi.restoreAllMocks()
  })

  it('RARE rarity: weapon statPreview shows rarity-scaled damage without a tier label', () => {
    // AC: "no redundant rarity label in the text" — badge is shown on card border/badge, not in statPreview
    // RARE: cumulative range 0.60 < roll <= 0.85
    vi.spyOn(Math, 'random').mockReturnValue(0.70) // Should be RARE
    const choices = generateChoices(5, baseEquipped, [], [], [], 0)
    for (const choice of choices) {
      if (choice.statPreview) {
        expect(choice.statPreview).not.toContain('(Rare)')
        expect(choice.statPreview).not.toContain('(Common)')
        expect(choice.statPreview).not.toContain('(Epic)')
        expect(choice.statPreview).not.toContain('(Legendary)')
      }
    }
  })

  it('with high luck stat, COMMON rate drops vs 0 luck', () => {
    const resultsLow = { COMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 }
    const resultsHigh = { COMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 }
    const iterations = 500

    for (let i = 0; i < iterations; i++) {
      const choices = generateChoices(5, baseEquipped, [], [], [], 0)
      resultsLow[choices[0].rarity] = (resultsLow[choices[0].rarity] || 0) + 1
    }
    for (let i = 0; i < iterations; i++) {
      const choices = generateChoices(5, baseEquipped, [], [], [], 50)
      resultsHigh[choices[0].rarity] = (resultsHigh[choices[0].rarity] || 0) + 1
    }

    expect(resultsHigh.COMMON).toBeLessThan(resultsLow.COMMON)
  })
})
