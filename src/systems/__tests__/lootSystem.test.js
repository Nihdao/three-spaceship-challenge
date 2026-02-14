import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rollDrops, resetAll } from '../lootSystem.js'
import * as xpOrbSystem from '../xpOrbSystem.js'
import * as healGemSystem from '../healGemSystem.js'
import * as fragmentGemSystem from '../fragmentGemSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

// Mock subsystem spawn functions
vi.mock('../xpOrbSystem.js', () => ({
  spawnOrb: vi.fn(),
  resetOrbs: vi.fn(),
}))

vi.mock('../healGemSystem.js', () => ({
  spawnHealGem: vi.fn(),
  resetHealGems: vi.fn(),
}))

vi.mock('../fragmentGemSystem.js', () => ({
  spawnGem: vi.fn(),
  reset: vi.fn(),
}))

describe('lootSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rollDrops', () => {
    it('always spawns standard XP orb when xpReward > 0 and rare roll fails', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // All rolls fail

      rollDrops('FODDER_BASIC', 10, 20)

      const expectedXP = ENEMIES.FODDER_BASIC.xpReward
      expect(xpOrbSystem.spawnOrb).toHaveBeenCalledWith(10, 20, expectedXP, false)
      expect(xpOrbSystem.spawnOrb).toHaveBeenCalledTimes(1)
    })

    it('spawns rare XP gem (3x value, isRare=true) when rare roll succeeds, replacing standard orb', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // Rare XP roll succeeds
        .mockReturnValue(0.99) // Other rolls fail

      rollDrops('FODDER_BASIC', 10, 20)

      const expectedXP = ENEMIES.FODDER_BASIC.xpReward * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER
      expect(xpOrbSystem.spawnOrb).toHaveBeenCalledWith(10, 20, expectedXP, true)
      expect(xpOrbSystem.spawnOrb).toHaveBeenCalledTimes(1)
    })

    it('spawns heal gem when heal roll succeeds (independent of other rolls)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.01) // Heal gem succeeds
        .mockReturnValue(0.99) // Fragment fails

      rollDrops('FODDER_BASIC', 10, 20)

      expect(healGemSystem.spawnHealGem).toHaveBeenCalledWith(10, 20, GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT)
      expect(healGemSystem.spawnHealGem).toHaveBeenCalledTimes(1)
    })

    it('spawns fragment gem when fragment roll succeeds (independent of other rolls)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.99) // Heal gem fails
        .mockReturnValueOnce(0.01) // Fragment succeeds

      rollDrops('FODDER_BASIC', 10, 20)

      expect(fragmentGemSystem.spawnGem).toHaveBeenCalledWith(10, 20, GAME_CONFIG.FRAGMENT_DROP_AMOUNT)
      expect(fragmentGemSystem.spawnGem).toHaveBeenCalledTimes(1)
    })

    it('can spawn multiple loot types from one enemy death (rare XP + heal + fragment)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // Rare XP succeeds
        .mockReturnValueOnce(0.01) // Heal gem succeeds
        .mockReturnValueOnce(0.01) // Fragment succeeds

      rollDrops('FODDER_BASIC', 10, 20)

      expect(xpOrbSystem.spawnOrb).toHaveBeenCalledTimes(1)
      expect(healGemSystem.spawnHealGem).toHaveBeenCalledTimes(1)
      expect(fragmentGemSystem.spawnGem).toHaveBeenCalledTimes(1)
    })

    it('can spawn both heal and fragment without rare XP', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.01) // Heal gem succeeds
        .mockReturnValueOnce(0.01) // Fragment succeeds

      rollDrops('FODDER_BASIC', 10, 20)

      // Standard XP orb should still spawn
      const expectedXP = ENEMIES.FODDER_BASIC.xpReward
      expect(xpOrbSystem.spawnOrb).toHaveBeenCalledWith(10, 20, expectedXP, false)
      expect(healGemSystem.spawnHealGem).toHaveBeenCalledTimes(1)
      expect(fragmentGemSystem.spawnGem).toHaveBeenCalledTimes(1)
    })

    it('handles unknown enemyTypeId gracefully (defaults to 0 xpReward)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01) // All rolls succeed

      rollDrops('UNKNOWN_ENEMY', 10, 20)

      // No XP orb should spawn if xpReward is 0
      expect(xpOrbSystem.spawnOrb).not.toHaveBeenCalled()
      // But heal and fragment can still drop
      expect(healGemSystem.spawnHealGem).toHaveBeenCalledTimes(1)
      expect(fragmentGemSystem.spawnGem).toHaveBeenCalledTimes(1)
    })

    it('does not spawn XP orb when enemy has 0 xpReward', () => {
      // Find an enemy with 0 xpReward or mock one
      vi.spyOn(Math, 'random').mockReturnValue(0.01)

      // Create a temporary mock for this test
      const originalEnemy = ENEMIES.FODDER_BASIC
      ENEMIES.TEST_NO_XP = { ...originalEnemy, xpReward: 0 }

      rollDrops('TEST_NO_XP', 10, 20)

      expect(xpOrbSystem.spawnOrb).not.toHaveBeenCalled()

      // Cleanup
      delete ENEMIES.TEST_NO_XP
    })
  })

  describe('resetAll', () => {
    it('calls all subsystem resets', () => {
      resetAll()

      expect(xpOrbSystem.resetOrbs).toHaveBeenCalledTimes(1)
      expect(healGemSystem.resetHealGems).toHaveBeenCalledTimes(1)
      expect(fragmentGemSystem.reset).toHaveBeenCalledTimes(1)
    })
  })
})
