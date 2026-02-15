import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { STORAGE_KEY_UPGRADES } from '../../utils/upgradesStorage.js'

// Mock localStorage for Node test environment
const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}

beforeEach(() => {
  globalThis.localStorage = mockLocalStorage
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

const { default: usePlayer } = await import('../usePlayer.jsx')
const { default: useUpgrades } = await import('../useUpgrades.jsx')

describe('usePlayer — meta stat charges (Story 20.5)', () => {
  beforeEach(() => {
    useUpgrades.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
  })

  describe('initial state', () => {
    it('has revivalCharges field defaulting to 0', () => {
      expect(usePlayer.getState().revivalCharges).toBe(0)
    })

    it('has rerollCharges field defaulting to 0', () => {
      expect(usePlayer.getState().rerollCharges).toBe(0)
    })

    it('has skipCharges field defaulting to 0', () => {
      expect(usePlayer.getState().skipCharges).toBe(0)
    })

    it('has banishCharges field defaulting to 0', () => {
      expect(usePlayer.getState().banishCharges).toBe(0)
    })
  })

  describe('initializeRunStats — meta charges', () => {
    it('sets revivalCharges from permanent bonuses', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('REVIVAL')
      useUpgrades.getState().purchaseUpgrade('REVIVAL')

      usePlayer.getState().reset()
      const bonuses = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses)

      expect(usePlayer.getState().revivalCharges).toBe(2)
    })

    it('sets rerollCharges from permanent bonuses', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('REROLL')
      useUpgrades.getState().purchaseUpgrade('REROLL')
      useUpgrades.getState().purchaseUpgrade('REROLL')

      usePlayer.getState().reset()
      const bonuses = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses)

      expect(usePlayer.getState().rerollCharges).toBe(3)
    })

    it('sets skipCharges from permanent bonuses', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('SKIP')

      usePlayer.getState().reset()
      const bonuses = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses)

      expect(usePlayer.getState().skipCharges).toBe(1)
    })

    it('sets banishCharges from permanent bonuses', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('BANISH')
      useUpgrades.getState().purchaseUpgrade('BANISH')

      usePlayer.getState().reset()
      const bonuses = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses)

      expect(usePlayer.getState().banishCharges).toBe(2)
    })

    it('sets all charges to 0 when no meta upgrades purchased', () => {
      usePlayer.getState().reset()
      const bonuses = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses)

      expect(usePlayer.getState().revivalCharges).toBe(0)
      expect(usePlayer.getState().rerollCharges).toBe(0)
      expect(usePlayer.getState().skipCharges).toBe(0)
      expect(usePlayer.getState().banishCharges).toBe(0)
    })

    it('stores meta bonuses in permanentUpgradeBonuses', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('REVIVAL')

      usePlayer.getState().reset()
      const bonuses = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses)

      expect(usePlayer.getState().permanentUpgradeBonuses.revival).toBe(1)
      expect(usePlayer.getState().permanentUpgradeBonuses.reroll).toBe(0)
      expect(usePlayer.getState().permanentUpgradeBonuses.skip).toBe(0)
      expect(usePlayer.getState().permanentUpgradeBonuses.banish).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears all meta charge fields to 0', () => {
      usePlayer.setState({
        revivalCharges: 2,
        rerollCharges: 3,
        skipCharges: 1,
        banishCharges: 2,
      })
      usePlayer.getState().reset()

      expect(usePlayer.getState().revivalCharges).toBe(0)
      expect(usePlayer.getState().rerollCharges).toBe(0)
      expect(usePlayer.getState().skipCharges).toBe(0)
      expect(usePlayer.getState().banishCharges).toBe(0)
    })

    it('clears permanentUpgradeBonuses meta fields to defaults', () => {
      usePlayer.setState({
        permanentUpgradeBonuses: {
          attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0,
          magnet: 1.0, luck: 0.0, expBonus: 1.0, curse: 0.0,
          revival: 2, reroll: 3, skip: 1, banish: 2,
        },
      })
      usePlayer.getState().reset()

      const bonuses = usePlayer.getState().permanentUpgradeBonuses
      expect(bonuses.revival).toBe(0)
      expect(bonuses.reroll).toBe(0)
      expect(bonuses.skip).toBe(0)
      expect(bonuses.banish).toBe(0)
    })
  })

  describe('system transition preservation', () => {
    it('resetForNewSystem does NOT reset meta charges (preserved across systems)', () => {
      usePlayer.setState({
        revivalCharges: 2,
        rerollCharges: 3,
        skipCharges: 1,
        banishCharges: 2,
      })
      usePlayer.getState().resetForNewSystem()

      // Meta charges should be preserved like other run-scoped progression
      expect(usePlayer.getState().revivalCharges).toBe(2)
      expect(usePlayer.getState().rerollCharges).toBe(3)
      expect(usePlayer.getState().skipCharges).toBe(1)
      expect(usePlayer.getState().banishCharges).toBe(2)
    })
  })

  describe('integration — purchase to charge flow', () => {
    it('purchasing REVIVAL upgrades → revivalCharges increases at next run start', () => {
      // Purchase revival upgrades
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('REVIVAL') // +1

      // Simulate new run
      usePlayer.getState().reset()
      const bonuses = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses)

      expect(usePlayer.getState().revivalCharges).toBe(1)

      // Purchase another level
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('REVIVAL') // +1 more

      // Simulate another new run
      usePlayer.getState().reset()
      const bonuses2 = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses2)

      expect(usePlayer.getState().revivalCharges).toBe(2)
    })

    it('charges persist across run resets (upgrades persist, charges reset to computed value)', () => {
      usePlayer.setState({ fragments: 5000 })
      useUpgrades.getState().purchaseUpgrade('REROLL')
      useUpgrades.getState().purchaseUpgrade('SKIP')
      useUpgrades.getState().purchaseUpgrade('BANISH')

      // Run 1
      usePlayer.getState().reset()
      const bonuses1 = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses1)

      expect(usePlayer.getState().rerollCharges).toBe(1)
      expect(usePlayer.getState().skipCharges).toBe(1)
      expect(usePlayer.getState().banishCharges).toBe(1)

      // Run 2 — charges reset to computed value (not accumulated)
      usePlayer.getState().reset()
      const bonuses2 = useUpgrades.getState().getComputedBonuses()
      usePlayer.getState().initializeRunStats(bonuses2)

      expect(usePlayer.getState().rerollCharges).toBe(1)
      expect(usePlayer.getState().skipCharges).toBe(1)
      expect(usePlayer.getState().banishCharges).toBe(1)
    })
  })

  describe('Epic 22 readiness', () => {
    it('exposes revivalCharges for Epic 22.1 consumption', () => {
      usePlayer.setState({ revivalCharges: 2 })
      expect(usePlayer.getState().revivalCharges).toBe(2)
    })

    it('exposes rerollCharges, skipCharges, banishCharges for Epic 22.2 consumption', () => {
      usePlayer.setState({ rerollCharges: 3, skipCharges: 2, banishCharges: 1 })
      const state = usePlayer.getState()
      expect(state.rerollCharges).toBe(3)
      expect(state.skipCharges).toBe(2)
      expect(state.banishCharges).toBe(1)
    })
  })
})
