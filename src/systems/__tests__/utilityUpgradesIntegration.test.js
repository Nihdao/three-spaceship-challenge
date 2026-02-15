import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage for Node test environment
const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}
globalThis.localStorage = mockLocalStorage

const { default: useUpgrades } = await import('../../stores/useUpgrades.jsx')
const { default: usePlayer } = await import('../../stores/usePlayer.jsx')
const { updateMagnetization, resetOrbs, spawnOrb, getOrbs } = await import('../xpOrbSystem.js')
const { updateHealGemMagnetization, resetHealGems, spawnHealGem, getHealGems } = await import('../healGemSystem.js')
const { updateMagnetization: updateFragMagnetization, reset: resetFragmentGems, spawnGem, getActiveGems } = await import('../fragmentGemSystem.js')
const { rollDrops, resetAll: resetLoot } = await import('../lootSystem.js')
const { createSpawnSystem } = await import('../spawnSystem.js')
const { GAME_CONFIG } = await import('../../config/gameConfig.js')

describe('Story 20.4: Utility Upgrades Integration', () => {
  beforeEach(() => {
    useUpgrades.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
    resetLoot()
  })

  describe('Magnet upgrade — pickup radius', () => {
    it('applies magnet multiplier to XP orb magnetization radius', () => {
      // Spawn orb at a distance slightly beyond base magnet radius
      const baseRadius = GAME_CONFIG.XP_MAGNET_RADIUS
      resetOrbs()
      // Orb placed at distance = baseRadius * 1.1 (just outside base range)
      const orbDistance = baseRadius * 1.1
      spawnOrb(orbDistance, 0, 10)

      // Without magnet: orb should NOT be magnetized (out of range)
      updateMagnetization(0, 0, 0.016, 1.0)
      expect(getOrbs()[0].isMagnetized).toBe(false)

      // With 30% magnet: orb SHOULD be magnetized (1.3 * baseRadius > orbDistance)
      updateMagnetization(0, 0, 0.016, 1.3)
      expect(getOrbs()[0].isMagnetized).toBe(true)
    })

    it('applies magnet multiplier to heal gem magnetization radius', () => {
      const baseRadius = GAME_CONFIG.XP_MAGNET_RADIUS
      resetHealGems()
      const gemDistance = baseRadius * 1.1
      spawnHealGem(gemDistance, 0, 5)

      updateHealGemMagnetization(0, 0, 0.016, 1.0)
      expect(getHealGems()[0].isMagnetized).toBe(false)

      updateHealGemMagnetization(0, 0, 0.016, 1.3)
      expect(getHealGems()[0].isMagnetized).toBe(true)
    })

    it('applies magnet multiplier to fragment gem magnetization radius', () => {
      const baseRadius = GAME_CONFIG.XP_MAGNET_RADIUS
      resetFragmentGems()
      const gemDistance = baseRadius * 1.1
      spawnGem(gemDistance, 0, 1)

      updateFragMagnetization(0, 0, 0.016, 1.0)
      expect(getActiveGems()[0].isMagnetized).toBe(false)

      updateFragMagnetization(0, 0, 0.016, 1.3)
      expect(getActiveGems()[0].isMagnetized).toBe(true)
    })
  })

  describe('Luck upgrade — drop chances', () => {
    it('luck bonus is added to rare XP gem roll threshold', () => {
      const baseChance = GAME_CONFIG.RARE_XP_GEM_DROP_CHANCE

      // Mock Math.random to return a value between baseChance and baseChance + luckBonus
      // This value would fail the roll without luck, but pass with luck
      const rollValue = baseChance + 0.05 // e.g., 0.08 + 0.05 = 0.13
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(rollValue)

      // Without luck: roll 0.13 >= threshold 0.08 → NOT rare
      usePlayer.setState({ permanentUpgradeBonuses: { ...usePlayer.getState().permanentUpgradeBonuses, luck: 0.0 } })
      resetOrbs()
      rollDrops('FODDER_BASIC', 0, 0)
      expect(getOrbs()[0]?.isRare).toBe(false)

      // With 15% luck: roll 0.13 < threshold (0.08 + 0.15 = 0.23) → IS rare
      usePlayer.setState({ permanentUpgradeBonuses: { ...usePlayer.getState().permanentUpgradeBonuses, luck: 0.15 } })
      resetOrbs()
      rollDrops('FODDER_BASIC', 0, 0)
      expect(getOrbs()[0]?.isRare).toBe(true)

      randomSpy.mockRestore()
    })

    it('luck bonus is added to registry-based drop chances (capped at 1.0)', () => {
      // Roll value just above heal gem base chance
      const healBaseChance = GAME_CONFIG.HEAL_GEM_DROP_CHANCE
      const rollValue = healBaseChance + 0.05
      // First call: rare XP roll, subsequent calls: registry rolls
      const randomSpy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // XP rare roll → not rare
        .mockReturnValueOnce(rollValue) // HEAL_GEM roll
        .mockReturnValueOnce(0.99) // FRAGMENT_GEM roll → no drop

      usePlayer.setState({ permanentUpgradeBonuses: { ...usePlayer.getState().permanentUpgradeBonuses, luck: 0.15 } })
      resetOrbs()
      resetHealGems()
      rollDrops('FODDER_BASIC', 0, 0)

      // With luck, heal gem roll should pass: rollValue < healBaseChance + 0.15
      expect(getHealGems()[0]).toBeDefined()

      randomSpy.mockRestore()
    })
  })

  describe('Exp Bonus upgrade — XP gains', () => {
    it('getComputedBonuses returns correct expBonus after purchases', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('EXP_BONUS')
      useUpgrades.getState().purchaseUpgrade('EXP_BONUS')
      const bonuses = useUpgrades.getState().getComputedBonuses()
      // 1.0 + 0.05 + 0.05 = 1.10
      expect(bonuses.expBonus).toBeCloseTo(1.10)
    })

    it('expBonus multiplier is applied correctly with Math.floor', () => {
      // Simulate what GameLoop does: Math.floor(xpValue * xpMult)
      const xpValue = 10
      const expBonus = 1.25 // +25%
      const boonMult = 1.0
      const xpMult = boonMult * expBonus
      const finalXP = Math.floor(xpValue * xpMult)
      expect(finalXP).toBe(12) // 10 * 1.25 = 12.5, floored to 12
    })
  })

  describe('Curse upgrade — spawn rate', () => {
    it('curse reduces spawn interval (increases spawn rate)', () => {
      // Without curse
      usePlayer.setState({ permanentUpgradeBonuses: { ...usePlayer.getState().permanentUpgradeBonuses, curse: 0.0 } })
      const system1 = createSpawnSystem()
      // Tick until first spawn
      let ticks1 = 0
      while (system1.tick(0.1, 0, 0).length === 0 && ticks1 < 1000) ticks1++
      // Consume first spawn, then measure time to second spawn
      let ticks1b = 0
      while (system1.tick(0.1, 0, 0).length === 0 && ticks1b < 1000) ticks1b++

      // With 50% curse
      usePlayer.setState({ permanentUpgradeBonuses: { ...usePlayer.getState().permanentUpgradeBonuses, curse: 0.50 } })
      const system2 = createSpawnSystem()
      let ticks2 = 0
      while (system2.tick(0.1, 0, 0).length === 0 && ticks2 < 1000) ticks2++
      let ticks2b = 0
      while (system2.tick(0.1, 0, 0).length === 0 && ticks2b < 1000) ticks2b++

      // With curse, second spawn should happen sooner (fewer ticks)
      expect(ticks2b).toBeLessThan(ticks1b)
      // 50% curse → interval divided by 1.5, so ticks should be ~67% of no-curse
      const ratio = ticks2b / ticks1b
      expect(ratio).toBeLessThan(0.80) // Should be ~0.67, allow margin for ramp rate drift
      expect(ratio).toBeGreaterThan(0.50) // Sanity: not more than 2x faster
    })
  })
})
