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

describe('usePlayer — permanent upgrade bonuses integration', () => {
  beforeEach(() => {
    useUpgrades.getState().reset()
    usePlayer.getState().reset()
    mockLocalStorage.clear()
  })

  it('initializeRunStats applies maxHP bonus from permanent upgrades', () => {
    usePlayer.setState({ fragments: 5000 })
    useUpgrades.getState().purchaseUpgrade('MAX_HP') // +10 HP (level 1)
    useUpgrades.getState().purchaseUpgrade('MAX_HP') // +20 HP (level 2)

    // Reset simulates new run
    usePlayer.getState().reset()
    const bonuses = useUpgrades.getState().getComputedBonuses()
    usePlayer.getState().initializeRunStats(bonuses)

    const state = usePlayer.getState()
    // Default BALANCED ship has 100 baseHP, +30 from permanent upgrades (10+20)
    expect(state.maxHP).toBe(130)
    expect(state.currentHP).toBe(130)
  })

  it('initializeRunStats stores bonuses for gameplay reference', () => {
    usePlayer.setState({ fragments: 5000 })
    useUpgrades.getState().purchaseUpgrade('ATTACK_POWER')
    useUpgrades.getState().purchaseUpgrade('ARMOR')

    usePlayer.getState().reset()
    const bonuses = useUpgrades.getState().getComputedBonuses()
    usePlayer.getState().initializeRunStats(bonuses)

    const state = usePlayer.getState()
    expect(state.permanentUpgradeBonuses.attackPower).toBeCloseTo(1.05)
    expect(state.permanentUpgradeBonuses.armor).toBe(1)
  })

  it('reset clears permanentUpgradeBonuses to defaults', () => {
    usePlayer.setState({
      permanentUpgradeBonuses: { attackPower: 1.25, armor: 5, maxHP: 30, regen: 0.6, attackSpeed: 0.85, zone: 1.3 },
    })
    usePlayer.getState().reset()
    const state = usePlayer.getState()
    expect(state.permanentUpgradeBonuses.attackPower).toBe(1.0)
    expect(state.permanentUpgradeBonuses.armor).toBe(0)
    expect(state.permanentUpgradeBonuses.maxHP).toBe(0)
    expect(state.permanentUpgradeBonuses.regen).toBe(0)
    expect(state.permanentUpgradeBonuses.attackSpeed).toBe(1.0)
    expect(state.permanentUpgradeBonuses.zone).toBe(1.0)
  })

  it('initializeRunStats with no upgrades does not change HP', () => {
    usePlayer.getState().reset()
    const baseMaxHP = usePlayer.getState().maxHP
    const bonuses = useUpgrades.getState().getComputedBonuses()
    usePlayer.getState().initializeRunStats(bonuses)

    expect(usePlayer.getState().maxHP).toBe(baseMaxHP)
    expect(usePlayer.getState().currentHP).toBe(baseMaxHP)
  })

  it('permanentUpgradeBonuses preserved across system transitions', () => {
    usePlayer.setState({
      permanentUpgradeBonuses: { attackPower: 1.15, armor: 3, maxHP: 20, regen: 0.4, attackSpeed: 0.90, zone: 1.2 },
    })
    usePlayer.getState().resetForNewSystem()
    const state = usePlayer.getState()
    // permanentUpgradeBonuses should be preserved (not in resetForNewSystem)
    expect(state.permanentUpgradeBonuses.attackPower).toBeCloseTo(1.15)
    expect(state.permanentUpgradeBonuses.armor).toBe(3)
  })
})
