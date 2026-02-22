import { describe, it, expect } from 'vitest'
import { CREDITS_SECTIONS } from '../modals/CreditsModal.jsx'

describe('CreditsModal data', () => {
  it('exports CREDITS_SECTIONS with required categories', () => {
    const categories = CREDITS_SECTIONS.map((s) => s.category)
    expect(categories).toContain('Music')
    expect(categories).toContain('Sound Effects')
    expect(categories).toContain('3D Models')
  })

  it('each section has a category, credit, and items field', () => {
    for (const section of CREDITS_SECTIONS) {
      expect(section).toHaveProperty('category')
      expect(section).toHaveProperty('credit')
      expect(section).toHaveProperty('items')
      expect(typeof section.category).toBe('string')
      expect(typeof section.credit).toBe('string')
      expect(Array.isArray(section.items)).toBe(true)
      expect(section.category.length).toBeGreaterThan(0)
      expect(section.credit.length).toBeGreaterThan(0)
    }
  })

  it('has 3 asset categories', () => {
    expect(CREDITS_SECTIONS).toHaveLength(3)
  })

  it('Music section has Main Menu and Combat sub-groups', () => {
    const music = CREDITS_SECTIONS.find((s) => s.category === 'Music')
    const labels = music.items.map((g) => g.label)
    expect(labels).toContain('Main Menu')
    expect(labels).toContain('Combat')
  })

  it('Combat has 3 tracks', () => {
    const music = CREDITS_SECTIONS.find((s) => s.category === 'Music')
    const combat = music.items.find((g) => g.label === 'Combat')
    expect(combat.entries).toHaveLength(3)
  })

  it('Sound Effects credits Shapeforms Audio', () => {
    const sfx = CREDITS_SECTIONS.find((s) => s.category === 'Sound Effects')
    expect(sfx.credit).toContain('Shapeforms Audio')
  })

  it('3D Models credits PolyPizza artists', () => {
    const models = CREDITS_SECTIONS.find((s) => s.category === '3D Models')
    expect(models.credit).toContain('Quaternius')
    expect(models.credit).toContain('Mastjie')
  })
})
