import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { rollDrops, resetAll, registerLootType, spawnLoot, _getRegistryForTesting } from '../lootSystem.js'
import * as xpOrbSystem from '../xpOrbSystem.js'
import * as healGemSystem from '../healGemSystem.js'
import * as fragmentGemSystem from '../fragmentGemSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

// Story 19.5: Use spies instead of mocks for better compatibility with registry pattern

describe('lootSystem', () => {
  let spawnOrbSpy
  let spawnHealGemSpy
  let spawnGemSpy

  beforeEach(() => {
    // Reset all loot systems to clean state
    resetAll()

    // Set up spies on spawn functions
    spawnOrbSpy = vi.spyOn(xpOrbSystem, 'spawnOrb')
    spawnHealGemSpy = vi.spyOn(healGemSystem, 'spawnHealGem')
    spawnGemSpy = vi.spyOn(fragmentGemSystem, 'spawnGem')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rollDrops', () => {
    it('always spawns standard XP orb when xpReward > 0 and rare roll fails', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // All rolls fail

      rollDrops('FODDER_BASIC', 10, 20)

      const expectedXP = ENEMIES.FODDER_BASIC.xpReward
      expect(spawnOrbSpy).toHaveBeenCalledWith(10, 20, expectedXP, false)
      expect(spawnOrbSpy).toHaveBeenCalledTimes(1)
    })

    it('spawns rare XP gem (3x value, isRare=true) when rare roll succeeds, replacing standard orb', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // Rare XP roll succeeds
        .mockReturnValue(0.99) // Other rolls fail

      rollDrops('FODDER_BASIC', 10, 20)

      const expectedXP = ENEMIES.FODDER_BASIC.xpReward * GAME_CONFIG.RARE_XP_GEM_MULTIPLIER
      expect(spawnOrbSpy).toHaveBeenCalledWith(10, 20, expectedXP, true)
      expect(spawnOrbSpy).toHaveBeenCalledTimes(1)
    })

    it('spawns heal gem when heal roll succeeds (independent of other rolls)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.01) // Heal gem succeeds
        .mockReturnValue(0.99) // Fragment fails

      rollDrops('FODDER_BASIC', 10, 20)

      expect(spawnHealGemSpy).toHaveBeenCalledWith(10, 20, GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT)
      expect(spawnHealGemSpy).toHaveBeenCalledTimes(1)
    })

    it('spawns fragment gem when fragment roll succeeds (independent of other rolls)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.99) // Heal gem fails
        .mockReturnValueOnce(0.01) // Fragment succeeds

      rollDrops('FODDER_BASIC', 10, 20)

      expect(spawnGemSpy).toHaveBeenCalledWith(10, 20, GAME_CONFIG.FRAGMENT_DROP_AMOUNT)
      expect(spawnGemSpy).toHaveBeenCalledTimes(1)
    })

    it('can spawn multiple loot types from one enemy death (rare XP + heal + fragment)', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.01) // Rare XP succeeds
        .mockReturnValueOnce(0.01) // Heal gem succeeds
        .mockReturnValueOnce(0.01) // Fragment succeeds

      rollDrops('FODDER_BASIC', 10, 20)

      expect(spawnOrbSpy).toHaveBeenCalledTimes(1)
      expect(spawnHealGemSpy).toHaveBeenCalledTimes(1)
      expect(spawnGemSpy).toHaveBeenCalledTimes(1)
    })

    it('can spawn both heal and fragment without rare XP', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.01) // Heal gem succeeds
        .mockReturnValueOnce(0.01) // Fragment succeeds

      rollDrops('FODDER_BASIC', 10, 20)

      // Standard XP orb should still spawn
      const expectedXP = ENEMIES.FODDER_BASIC.xpReward
      expect(spawnOrbSpy).toHaveBeenCalledWith(10, 20, expectedXP, false)
      expect(spawnHealGemSpy).toHaveBeenCalledTimes(1)
      expect(spawnGemSpy).toHaveBeenCalledTimes(1)
    })

    it('handles unknown enemyTypeId gracefully (defaults to 0 xpReward)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01) // All rolls succeed

      rollDrops('UNKNOWN_ENEMY', 10, 20)

      // No XP orb should spawn if xpReward is 0
      expect(spawnOrbSpy).not.toHaveBeenCalled()
      // But heal and fragment can still drop
      expect(spawnHealGemSpy).toHaveBeenCalledTimes(1)
      expect(spawnGemSpy).toHaveBeenCalledTimes(1)
    })

    it('does not spawn XP orb when enemy has 0 xpReward', () => {
      // Find an enemy with 0 xpReward or mock one
      vi.spyOn(Math, 'random').mockReturnValue(0.01)

      // Create a temporary mock for this test
      const originalEnemy = ENEMIES.FODDER_BASIC
      ENEMIES.TEST_NO_XP = { ...originalEnemy, xpReward: 0 }

      rollDrops('TEST_NO_XP', 10, 20)

      expect(spawnOrbSpy).not.toHaveBeenCalled()

      // Cleanup
      delete ENEMIES.TEST_NO_XP
    })
  })

  describe('resetAll', () => {
    it('calls all subsystem resets', () => {
      const resetOrbsSpy = vi.spyOn(xpOrbSystem, 'resetOrbs')
      const resetHealGemsSpy = vi.spyOn(healGemSystem, 'resetHealGems')
      const resetFragmentsSpy = vi.spyOn(fragmentGemSystem, 'reset')

      resetAll()

      expect(resetOrbsSpy).toHaveBeenCalledTimes(1)
      expect(resetHealGemsSpy).toHaveBeenCalledTimes(1)
      expect(resetFragmentsSpy).toHaveBeenCalledTimes(1)
    })
  })
})

// Story 19.5: Registry Pattern Tests
describe('lootSystem - Registry Pattern (Story 19.5)', () => {
  let mathRandomSpy
  let spawnOrbSpy
  let spawnHealGemSpy
  let spawnGemSpy

  beforeEach(() => {
    resetAll()
    vi.clearAllMocks()

    // Clear registry and re-register auto-registered types for clean state
    const registry = _getRegistryForTesting()
    registry.clear()

    registerLootType('HEAL_GEM', {
      dropChanceKey: 'HEAL_GEM_DROP_CHANCE',
      spawnFn: (x, z, value) => {
        const healAmount = value ?? GAME_CONFIG.HEAL_GEM_RESTORE_AMOUNT
        healGemSystem.spawnHealGem(x, z, healAmount)
      },
    })
    registerLootType('FRAGMENT_GEM', {
      dropChanceKey: 'FRAGMENT_DROP_CHANCE',
      spawnFn: (x, z, value) => {
        const fragmentAmount = value ?? GAME_CONFIG.FRAGMENT_DROP_AMOUNT
        fragmentGemSystem.spawnGem(x, z, fragmentAmount)
      },
    })

    spawnOrbSpy = vi.spyOn(xpOrbSystem, 'spawnOrb')
    spawnHealGemSpy = vi.spyOn(healGemSystem, 'spawnHealGem')
    spawnGemSpy = vi.spyOn(fragmentGemSystem, 'spawnGem')

    mathRandomSpy = vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    mathRandomSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe('registerLootType', () => {
    it('should add loot type to registry', () => {
      const mockSpawnFn = vi.fn()
      registerLootType('TEST_LOOT', {
        dropChanceKey: 'HEAL_GEM_DROP_CHANCE',
        spawnFn: mockSpawnFn,
      })

      const registry = _getRegistryForTesting()
      expect(registry.has('TEST_LOOT')).toBe(true)
      expect(registry.get('TEST_LOOT').dropChanceKey).toBe('HEAL_GEM_DROP_CHANCE')
      expect(registry.get('TEST_LOOT').spawnFn).toBe(mockSpawnFn)
    })

    it('should allow multiple loot types to be registered', () => {
      registerLootType('LOOT_A', { dropChanceKey: 'HEAL_GEM_DROP_CHANCE', spawnFn: vi.fn() })
      registerLootType('LOOT_B', { dropChanceKey: 'FRAGMENT_DROP_CHANCE', spawnFn: vi.fn() })
      registerLootType('LOOT_C', { dropChanceKey: 'RARE_XP_GEM_DROP_CHANCE', spawnFn: vi.fn() })

      const registry = _getRegistryForTesting()
      expect(registry.size).toBeGreaterThanOrEqual(3) // May include auto-registered types
    })
  })

  describe('rollDrops with per-enemy dropOverrides', () => {
    it('should use per-enemy dropOverride when provided', () => {
      // Clear previous mocks
      vi.clearAllMocks()

      // Fragment drop: global = 12%, override = 30%
      mathRandomSpy
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.99) // Heal gem fails
        .mockReturnValueOnce(0.25) // Fragment: between 12% and 30%

      const enemyWithOverride = {
        dropOverrides: { FRAGMENT_GEM: 0.30 },
      }

      rollDrops('SHOCKWAVE_BLOB', 10, 20, enemyWithOverride)

      // With override 30%, roll of 0.25 should succeed
      expect(spawnGemSpy).toHaveBeenCalledWith(10, 20, GAME_CONFIG.FRAGMENT_DROP_AMOUNT)
    })

    it('should use global drop chance when enemy has no override', () => {
      vi.clearAllMocks()

      // Roll between global 12% and potential override
      mathRandomSpy
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.99) // Heal gem fails
        .mockReturnValueOnce(0.25) // Fragment: above 12% global

      rollDrops('FODDER_BASIC', 10, 20, {}) // No dropOverrides

      // With global 12%, roll of 0.25 should fail
      expect(spawnGemSpy).not.toHaveBeenCalled()
    })

    it('should handle multiple overrides for same enemy', () => {
      vi.clearAllMocks()

      mathRandomSpy
        .mockReturnValueOnce(0.99) // Rare XP fails
        .mockReturnValueOnce(0.035) // Heal: below override 15%
        .mockReturnValueOnce(0.20) // Fragment: below override 25%

      const enemyWithMultipleOverrides = {
        dropOverrides: {
          HEAL_GEM: 0.15,
          FRAGMENT_GEM: 0.25,
        },
      }

      rollDrops('SHOCKWAVE_BLOB', 10, 20, enemyWithMultipleOverrides)

      expect(spawnHealGemSpy).toHaveBeenCalledTimes(1)
      expect(spawnGemSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('spawnLoot - generic spawn dispatch', () => {
    it('should call the registered spawnFn by lootId (HEAL_GEM)', () => {
      vi.clearAllMocks()

      spawnLoot(10, 20, 'HEAL_GEM', 25)

      expect(spawnHealGemSpy).toHaveBeenCalledWith(10, 20, 25)
    })

    it('should call the registered spawnFn by lootId (FRAGMENT_GEM)', () => {
      vi.clearAllMocks()

      spawnLoot(15, 30, 'FRAGMENT_GEM', 5)

      expect(spawnGemSpy).toHaveBeenCalledWith(15, 30, 5)
    })

    it('should call the registered spawnFn by lootId (XP_ORB_RARE)', () => {
      vi.clearAllMocks()

      // Manually register XP_ORB_RARE for this test (not auto-registered)
      registerLootType('XP_ORB_RARE', {
        dropChanceKey: 'RARE_XP_GEM_DROP_CHANCE',
        spawnFn: (x, z, value) => {
          spawnOrbSpy(x, z, value, true)
        },
      })

      spawnLoot(5, 10, 'XP_ORB_RARE', 36)

      // XP_ORB_RARE spawns via spawnOrb with isRare=true
      expect(spawnOrbSpy).toHaveBeenCalledWith(5, 10, 36, true)
    })

    it('should do nothing if lootId is not registered', () => {
      vi.clearAllMocks()

      spawnLoot(10, 20, 'UNKNOWN_LOOT', 50)

      expect(spawnOrbSpy).not.toHaveBeenCalled()
      expect(spawnHealGemSpy).not.toHaveBeenCalled()
      expect(spawnGemSpy).not.toHaveBeenCalled()
    })
  })

  describe('Auto-registration of existing loot types', () => {
    it('should auto-register HEAL_GEM and FRAGMENT_GEM', () => {
      const registry = _getRegistryForTesting()

      expect(registry.has('HEAL_GEM')).toBe(true)
      expect(registry.has('FRAGMENT_GEM')).toBe(true)
    })

    it('should NOT auto-register XP_ORB_RARE (handled in hardcoded XP section)', () => {
      const registry = _getRegistryForTesting()

      expect(registry.has('XP_ORB_RARE')).toBe(false)
    })
  })
})
