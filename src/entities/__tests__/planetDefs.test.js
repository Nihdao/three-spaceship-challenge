import { describe, it, expect } from 'vitest'
import { PLANETS } from '../planetDefs.js'

describe('planetDefs — planet tier definitions', () => {
  const requiredFields = ['id', 'name', 'tier', 'scanTime', 'color', 'emissiveColor', 'scale', 'modelKey', 'scanRadius']

  it('defines exactly 3 planet types', () => {
    expect(Object.keys(PLANETS)).toHaveLength(3)
  })

  it('has PLANET_CINDER, PLANET_PULSE, PLANET_VOID keys', () => {
    expect(PLANETS).toHaveProperty('PLANET_CINDER')
    expect(PLANETS).toHaveProperty('PLANET_PULSE')
    expect(PLANETS).toHaveProperty('PLANET_VOID')
  })

  it.each(Object.entries(PLANETS))('%s has all required fields', (key, def) => {
    for (const field of requiredFields) {
      expect(def, `${key} missing field: ${field}`).toHaveProperty(field)
    }
  })

  it('tier hierarchy: CINDER scanTime < PULSE scanTime < VOID scanTime', () => {
    expect(PLANETS.PLANET_CINDER.scanTime).toBeLessThan(PLANETS.PLANET_PULSE.scanTime)
    expect(PLANETS.PLANET_PULSE.scanTime).toBeLessThan(PLANETS.PLANET_VOID.scanTime)
  })

  it('each planet has a 3-element scale array', () => {
    for (const [key, def] of Object.entries(PLANETS)) {
      expect(def.scale, `${key} scale`).toHaveLength(3)
      expect(def.scale[0], `${key} scale[0]`).toBeGreaterThan(0)
    }
  })

  it('tiers are standard, rare, legendary respectively', () => {
    expect(PLANETS.PLANET_CINDER.tier).toBe('standard')
    expect(PLANETS.PLANET_PULSE.tier).toBe('rare')
    expect(PLANETS.PLANET_VOID.tier).toBe('legendary')
  })

  it('modelKeys map to distinct planet models', () => {
    const keys = Object.values(PLANETS).map((d) => d.modelKey)
    expect(new Set(keys).size).toBe(3)
  })

})
