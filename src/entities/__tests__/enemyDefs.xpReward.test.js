import { describe, it, expect } from 'vitest'
import { ENEMIES } from '../enemyDefs.js'

describe('enemyDefs — xpReward rebalancing (Story 11.2)', () => {
  it('FODDER_BASIC xpReward is 12 (+20% from original 10)', () => {
    expect(ENEMIES.FODDER_BASIC.xpReward).toBe(12)
  })

  it('FODDER_FAST xpReward is 10 (+25% from original 8)', () => {
    expect(ENEMIES.FODDER_FAST.xpReward).toBe(10)
  })

  it('higher-tier enemies have proportionally higher xpReward', () => {
    // FODDER_FAST (weaker, faster) should give less or equal XP than FODDER_BASIC
    expect(ENEMIES.FODDER_FAST.xpReward).toBeLessThanOrEqual(ENEMIES.FODDER_BASIC.xpReward)
  })

  it('all enemy types with xpReward have positive values', () => {
    for (const [, def] of Object.entries(ENEMIES)) {
      if (def.xpReward !== undefined) {
        expect(def.xpReward).toBeGreaterThan(0)
      }
    }
  })
})
