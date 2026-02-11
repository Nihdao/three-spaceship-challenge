import { describe, it, expect } from 'vitest'
import { CREDITS_SECTIONS } from '../modals/CreditsModal.jsx'

describe('CreditsModal data', () => {
  it('exports CREDITS_SECTIONS with required asset categories', () => {
    const categories = CREDITS_SECTIONS.map((s) => s.category)
    expect(categories).toContain('3D Models')
    expect(categories).toContain('Sound Effects')
    expect(categories).toContain('Music')
    expect(categories).toContain('Textures')
  })

  it('each section has a category and credit field', () => {
    for (const section of CREDITS_SECTIONS) {
      expect(section).toHaveProperty('category')
      expect(section).toHaveProperty('credit')
      expect(typeof section.category).toBe('string')
      expect(typeof section.credit).toBe('string')
      expect(section.category.length).toBeGreaterThan(0)
      expect(section.credit.length).toBeGreaterThan(0)
    }
  })

  it('has exactly 4 asset categories', () => {
    expect(CREDITS_SECTIONS).toHaveLength(4)
  })
})
