import { describe, it, expect } from 'vitest'
import { PLANETS } from '../planetDefs.js'

describe('planetDefs — planet tier definitions', () => {
  const requiredFields = ['id', 'name', 'tier', 'scanTime', 'color', 'emissiveColor', 'scale', 'modelKey', 'scanRadius']

  it('defines exactly 3 planet types', () => {
    expect(Object.keys(PLANETS)).toHaveLength(3)
  })

  it('has PLANET_SILVER, PLANET_GOLD, PLANET_PLATINUM keys', () => {
    expect(PLANETS).toHaveProperty('PLANET_SILVER')
    expect(PLANETS).toHaveProperty('PLANET_GOLD')
    expect(PLANETS).toHaveProperty('PLANET_PLATINUM')
  })

  it.each(Object.entries(PLANETS))('%s has all required fields', (key, def) => {
    for (const field of requiredFields) {
      expect(def, `${key} missing field: ${field}`).toHaveProperty(field)
    }
  })

  it('tier hierarchy: silver scanTime < gold scanTime < platinum scanTime', () => {
    expect(PLANETS.PLANET_SILVER.scanTime).toBeLessThan(PLANETS.PLANET_GOLD.scanTime)
    expect(PLANETS.PLANET_GOLD.scanTime).toBeLessThan(PLANETS.PLANET_PLATINUM.scanTime)
  })

  it('each planet has a 3-element scale array', () => {
    for (const [key, def] of Object.entries(PLANETS)) {
      expect(def.scale, `${key} scale`).toHaveLength(3)
      expect(def.scale[0], `${key} scale[0]`).toBeGreaterThan(0)
    }
  })

  it('tiers are silver, gold, platinum respectively', () => {
    expect(PLANETS.PLANET_SILVER.tier).toBe('silver')
    expect(PLANETS.PLANET_GOLD.tier).toBe('gold')
    expect(PLANETS.PLANET_PLATINUM.tier).toBe('platinum')
  })

  it('modelKeys map to distinct planet models', () => {
    const keys = Object.values(PLANETS).map((d) => d.modelKey)
    expect(new Set(keys).size).toBe(3)
  })
})
