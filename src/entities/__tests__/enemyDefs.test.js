import { describe, it, expect } from 'vitest'
import { ENEMIES } from '../enemyDefs.js'

describe('enemyDefs — collision radii proportional to meshScale', () => {
  it('FODDER_BASIC radius is proportional to meshScale', () => {
    const def = ENEMIES.FODDER_BASIC
    // Radius should be approximately half the meshScale (visual half-width)
    const expectedMinRadius = def.meshScale[0] * 0.4
    const expectedMaxRadius = def.meshScale[0] * 0.6
    expect(def.radius).toBeGreaterThanOrEqual(expectedMinRadius)
    expect(def.radius).toBeLessThanOrEqual(expectedMaxRadius)
  })

  it('FODDER_FAST radius is proportional to meshScale', () => {
    const def = ENEMIES.FODDER_FAST
    const expectedMinRadius = def.meshScale[0] * 0.4
    const expectedMaxRadius = def.meshScale[0] * 0.6
    expect(def.radius).toBeGreaterThanOrEqual(expectedMinRadius)
    expect(def.radius).toBeLessThanOrEqual(expectedMaxRadius)
  })

  it('all enemy types have radius > 0.5', () => {
    for (const [, def] of Object.entries(ENEMIES)) {
      expect(def.radius).toBeGreaterThan(0.5)
    }
  })
})
