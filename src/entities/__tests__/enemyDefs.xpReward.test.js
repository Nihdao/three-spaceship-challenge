import { describe, it, expect } from 'vitest'
import { ENEMIES } from '../enemyDefs.js'

describe('enemyDefs — xpReward scaling (Story 16.1)', () => {
  it('FODDER_BASIC xpReward is 12', () => {
    expect(ENEMIES.FODDER_BASIC.xpReward).toBe(12)
  })

  it('FODDER_SWARM has lowest xpReward (weakest enemy)', () => {
    expect(ENEMIES.FODDER_SWARM.xpReward).toBe(5)
  })

  it('higher-tier enemies have proportionally higher xpReward', () => {
    expect(ENEMIES.SNIPER_FIXED.xpReward).toBeGreaterThan(ENEMIES.FODDER_BASIC.xpReward)
    expect(ENEMIES.SNIPER_MOBILE.xpReward).toBeGreaterThan(ENEMIES.FODDER_BASIC.xpReward)
    expect(ENEMIES.TELEPORTER.xpReward).toBeGreaterThan(ENEMIES.FODDER_BASIC.xpReward)
  })

  it('all spawnable enemy types have positive xpReward', () => {
    for (const [key, def] of Object.entries(ENEMIES)) {
      if (def.spawnWeight > 0) {
        expect(def.xpReward, `${key} should have positive xpReward`).toBeGreaterThan(0)
      }
    }
  })
})
