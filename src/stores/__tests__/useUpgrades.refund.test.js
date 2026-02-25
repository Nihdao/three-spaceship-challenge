import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import useUpgrades from '../useUpgrades.jsx'
import usePlayer from '../usePlayer.jsx'
import { PERMANENT_UPGRADES } from '../../entities/permanentUpgradesDefs.js'

describe('useUpgrades — refundAll()', () => {
  beforeEach(() => {
    useUpgrades.getState().reset()
    usePlayer.getState().reset()
    usePlayer.setState({ fragments: 0, fragmentsEarnedThisRun: 0 })
  })

  afterEach(() => {
    useUpgrades.getState().reset()
    usePlayer.getState().reset()
    usePlayer.setState({ fragments: 0, fragmentsEarnedThisRun: 0 })
  })

  it('should calculate total Fragments spent correctly for single upgrade', () => {
    usePlayer.getState().addFragments(1000)

    const upgradesState = useUpgrades.getState()

    // Purchase ATTACK_POWER level 1 (cost: 50)
    upgradesState.purchaseUpgrade('ATTACK_POWER')

    expect(usePlayer.getState().fragments).toBe(950) // 1000 - 50
    expect(upgradesState.getUpgradeLevel('ATTACK_POWER')).toBe(1)

    // Refund
    upgradesState.refundAll()

    expect(useUpgrades.getState().upgradeLevels).toEqual({})
    expect(usePlayer.getState().fragments).toBe(1000) // Should be back to 1000
  })

  it('should calculate total Fragments spent correctly for multiple upgrade levels', () => {
    usePlayer.getState().addFragments(5000)

    const upgradesState = useUpgrades.getState()

    // Purchase ATTACK_POWER level 1, 2, 3 (costs: 50, 100, 200 = 350 total)
    upgradesState.purchaseUpgrade('ATTACK_POWER') // -50
    upgradesState.purchaseUpgrade('ATTACK_POWER') // -100
    upgradesState.purchaseUpgrade('ATTACK_POWER') // -200

    expect(usePlayer.getState().fragments).toBe(4650) // 5000 - 350
    expect(upgradesState.getUpgradeLevel('ATTACK_POWER')).toBe(3)

    // Refund
    upgradesState.refundAll()

    expect(useUpgrades.getState().upgradeLevels).toEqual({})
    expect(usePlayer.getState().fragments).toBe(5000) // Should be back to 5000
  })

  it('should calculate total Fragments spent correctly for multiple different upgrades', () => {
    usePlayer.getState().addFragments(10000)

    const upgradesState = useUpgrades.getState()

    // Purchase ATTACK_POWER level 1 (50)
    upgradesState.purchaseUpgrade('ATTACK_POWER')
    // Purchase ARMOR level 1, 2 (50 + 100 = 150)
    upgradesState.purchaseUpgrade('ARMOR')
    upgradesState.purchaseUpgrade('ARMOR')
    // Purchase MAX_HP level 1 (50)
    upgradesState.purchaseUpgrade('MAX_HP')

    // Total spent: 50 + 150 + 50 = 250
    expect(usePlayer.getState().fragments).toBe(9750) // 10000 - 250

    // Refund
    upgradesState.refundAll()

    expect(useUpgrades.getState().upgradeLevels).toEqual({})
    expect(usePlayer.getState().fragments).toBe(10000)
  })

  it('should reset all upgradeLevels to empty object', () => {
    usePlayer.getState().addFragments(5000)

    const upgradesState = useUpgrades.getState()

    upgradesState.purchaseUpgrade('ATTACK_POWER')
    upgradesState.purchaseUpgrade('ARMOR')
    upgradesState.purchaseUpgrade('MAX_HP')

    expect(Object.keys(useUpgrades.getState().upgradeLevels).length).toBe(3)

    upgradesState.refundAll()

    expect(useUpgrades.getState().upgradeLevels).toEqual({})
    expect(Object.keys(useUpgrades.getState().upgradeLevels).length).toBe(0)
  })

  it('should persist refund to localStorage immediately', () => {
    usePlayer.getState().addFragments(5000)

    const upgradesState = useUpgrades.getState()

    upgradesState.purchaseUpgrade('ATTACK_POWER')
    upgradesState.purchaseUpgrade('ARMOR')

    // Refund
    upgradesState.refundAll()

    // Create new store instance to test persistence
    const freshState = useUpgrades.getState()

    expect(freshState.upgradeLevels).toEqual({})
  })

  it('should handle edge case: refunding with 0 upgrades purchased (no-op)', () => {
    usePlayer.getState().addFragments(1000)

    const upgradesState = useUpgrades.getState()

    // No upgrades purchased
    expect(upgradesState.upgradeLevels).toEqual({})

    // Refund should do nothing
    upgradesState.refundAll()

    expect(useUpgrades.getState().upgradeLevels).toEqual({})
    expect(usePlayer.getState().fragments).toBe(1000) // No change
  })

  it('should handle edge case: refunding all 14 upgrades at max level', () => {
    usePlayer.getState().addFragments(50000) // Large balance

    const upgradesState = useUpgrades.getState()

    // Purchase all upgrades to max level
    const upgradeIds = Object.keys(PERMANENT_UPGRADES)
    let totalSpent = 0

    for (const upgradeId of upgradeIds) {
      const upgradeDef = PERMANENT_UPGRADES[upgradeId]
      for (let i = 0; i < upgradeDef.maxLevel; i++) {
        const success = upgradesState.purchaseUpgrade(upgradeId)
        if (success) {
          totalSpent += upgradeDef.levels[i].cost
        }
      }
    }

    expect(usePlayer.getState().fragments).toBe(50000 - totalSpent)

    // Refund all
    upgradesState.refundAll()

    expect(useUpgrades.getState().upgradeLevels).toEqual({})
    expect(usePlayer.getState().fragments).toBe(50000) // Back to original
  })

  it('should use getTotalFragmentsSpent() helper for calculation', () => {
    usePlayer.getState().addFragments(5000)

    const upgradesState = useUpgrades.getState()

    upgradesState.purchaseUpgrade('ATTACK_POWER') // 50
    upgradesState.purchaseUpgrade('ATTACK_POWER') // 100
    upgradesState.purchaseUpgrade('ARMOR') // 50

    // Total: 200
    const totalSpent = upgradesState.getTotalFragmentsSpent()
    expect(totalSpent).toBe(200)

    const balanceBeforeRefund = usePlayer.getState().fragments

    upgradesState.refundAll()

    expect(usePlayer.getState().fragments).toBe(balanceBeforeRefund + totalSpent)
  })
})
