import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import useLevel from '../useLevel.jsx'
import useGame from '../useGame.jsx'
import { UPGRADES } from '../../entities/upgradeDefs.js'
import { DILEMMAS } from '../../entities/dilemmaDefs.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('Tunnel Hub — Store Integration (Story 13.1)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    usePlayer.setState({ fragments: 0, fragmentsEarnedThisRun: 0 })
    useLevel.getState().reset()
    useGame.getState().reset()
  })

  // === Task 3: TunnelHub interaction bugs ===

  describe('Task 3.1: Upgrade purchase logic', () => {
    it('deducts fragments and marks upgrade as purchased', () => {
      const upgrade = UPGRADES.SPEED_BOOST_1
      usePlayer.setState({ fragments: upgrade.fragmentCost + 10 })
      const result = usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      expect(result).toBe(true)
      expect(usePlayer.getState().fragments).toBe(10)
      expect(usePlayer.getState().permanentUpgrades.SPEED_BOOST_1).toBe(true)
    })

    it('applies stat effect correctly (SPEED_MULT)', () => {
      usePlayer.setState({ fragments: 100 })
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      expect(usePlayer.getState().upgradeStats.speedMult).toBeCloseTo(1.15)
    })

    it('rejects purchase with insufficient fragments', () => {
      usePlayer.setState({ fragments: 5 })
      const result = usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      expect(result).toBe(false)
      expect(usePlayer.getState().fragments).toBe(5)
    })

    it('prevents double-purchase of the same upgrade', () => {
      usePlayer.setState({ fragments: 200 })
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      const fragmentsAfterFirst = usePlayer.getState().fragments
      const result = usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      expect(result).toBe(false)
      expect(usePlayer.getState().fragments).toBe(fragmentsAfterFirst)
    })

    it('enforces prerequisite chain', () => {
      usePlayer.setState({ fragments: 500 })
      // SPEED_BOOST_2 requires SPEED_BOOST_1
      const result = usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_2')
      expect(result).toBe(false)
      // Purchase prerequisite first
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      const result2 = usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_2')
      expect(result2).toBe(true)
    })
  })

  describe('Task 3.2: Dilemma accept/refuse logic', () => {
    it('accepts dilemma and applies bonus + malus', () => {
      const result = usePlayer.getState().acceptDilemma('HIGH_RISK')
      expect(result).toBe(true)
      expect(usePlayer.getState().acceptedDilemmas).toContain('HIGH_RISK')
      // HIGH_RISK: +30% DMG, -20% Max HP
      expect(usePlayer.getState().dilemmaStats.damageMult).toBeCloseTo(1.3)
    })

    it('prevents re-accepting an already accepted dilemma', () => {
      usePlayer.getState().acceptDilemma('HIGH_RISK')
      const result = usePlayer.getState().acceptDilemma('HIGH_RISK')
      expect(result).toBe(false)
    })

    it('returns false for invalid dilemma ID', () => {
      const result = usePlayer.getState().acceptDilemma('NONEXISTENT')
      expect(result).toBe(false)
    })
  })

  describe('Task 3.3: HP sacrifice logic', () => {
    it('deducts fragments and recovers HP', () => {
      usePlayer.setState({
        fragments: GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST + 10,
        currentHP: 50,
        maxHP: 100,
      })
      const result = usePlayer.getState().sacrificeFragmentsForHP()
      expect(result).toBe(true)
      expect(usePlayer.getState().fragments).toBe(10)
      expect(usePlayer.getState().currentHP).toBe(50 + GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY)
    })

    it('rejects sacrifice when fragments insufficient', () => {
      usePlayer.setState({ fragments: GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST - 1, currentHP: 50, maxHP: 100 })
      const result = usePlayer.getState().sacrificeFragmentsForHP()
      expect(result).toBe(false)
    })

    it('rejects sacrifice when HP is already full', () => {
      usePlayer.setState({ fragments: 200, currentHP: 100, maxHP: 100 })
      const result = usePlayer.getState().sacrificeFragmentsForHP()
      expect(result).toBe(false)
    })

    it('caps HP recovery at maxHP', () => {
      usePlayer.setState({ fragments: 200, currentHP: 90, maxHP: 100 })
      usePlayer.getState().sacrificeFragmentsForHP()
      expect(usePlayer.getState().currentHP).toBe(100)
    })
  })

  describe('Task 3.6: Edge cases', () => {
    it('handles 0 fragments gracefully - all upgrades rejected', () => {
      usePlayer.setState({ fragments: 0 })
      Object.keys(UPGRADES).forEach((id) => {
        expect(usePlayer.getState().applyPermanentUpgrade(id)).toBe(false)
      })
    })

    it('handles all upgrades already purchased', () => {
      const allPurchased = {}
      Object.keys(UPGRADES).forEach((id) => { allPurchased[id] = true })
      usePlayer.setState({ permanentUpgrades: allPurchased, fragments: 9999 })
      // No more upgrades should be purchasable
      Object.keys(UPGRADES).forEach((id) => {
        expect(usePlayer.getState().applyPermanentUpgrade(id)).toBe(false)
      })
    })
  })

  // === Task 4: Tunnel exit transition ===

  describe('Task 4.2: advanceSystem increments currentSystem', () => {
    it('increments from 1 to 2', () => {
      expect(useLevel.getState().currentSystem).toBe(1)
      useLevel.getState().advanceSystem()
      expect(useLevel.getState().currentSystem).toBe(2)
    })

    it('caps at MAX_SYSTEMS', () => {
      for (let i = 0; i < GAME_CONFIG.MAX_SYSTEMS + 5; i++) {
        useLevel.getState().advanceSystem()
      }
      expect(useLevel.getState().currentSystem).toBe(GAME_CONFIG.MAX_SYSTEMS)
    })
  })

  describe('Task 4.3: resetForNewSystem preserves permanent progression', () => {
    it('preserves fragments', () => {
      usePlayer.setState({ fragments: 150 })
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().fragments).toBe(150)
    })

    it('preserves permanentUpgrades', () => {
      usePlayer.setState({ permanentUpgrades: { SPEED_BOOST_1: true }, fragments: 100 })
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().permanentUpgrades).toEqual({ SPEED_BOOST_1: true })
    })

    it('preserves acceptedDilemmas', () => {
      usePlayer.setState({ acceptedDilemmas: ['HIGH_RISK'] })
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().acceptedDilemmas).toEqual(['HIGH_RISK'])
    })

    it('preserves HP and maxHP', () => {
      usePlayer.setState({ currentHP: 75, maxHP: 120 })
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().currentHP).toBe(75)
      expect(usePlayer.getState().maxHP).toBe(120)
    })

    it('preserves XP and level across system transition (Story 18.1)', () => {
      usePlayer.setState({ currentXP: 500, currentLevel: 5 })
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().currentXP).toBe(500)
      expect(usePlayer.getState().currentLevel).toBe(5)
    })

    it('resets position within [-1200, 1200] range (Story 34.2)', () => {
      usePlayer.setState({ position: [50, 0, -30] })
      usePlayer.getState().resetForNewSystem()
      const [x, y, z] = usePlayer.getState().position
      expect(y).toBe(0)
      expect(Math.abs(x)).toBeLessThanOrEqual(1200)
      expect(Math.abs(z)).toBeLessThanOrEqual(1200)
    })
  })

  describe('Task 4.4: setPhase transitions correctly', () => {
    it('transitions to gameplay', () => {
      useGame.setState({ phase: 'tunnel' })
      useGame.getState().setPhase('gameplay')
      expect(useGame.getState().phase).toBe('gameplay')
    })
  })

  // === Task 5: State pollution across tunnel visits ===

  describe('Task 5: Multi-visit state persistence', () => {
    it('purchased upgrades persist across advanceSystem calls', () => {
      usePlayer.setState({ fragments: 500 })
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      expect(usePlayer.getState().permanentUpgrades.SPEED_BOOST_1).toBe(true)

      // Simulate tunnel exit sequence
      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()

      expect(usePlayer.getState().permanentUpgrades.SPEED_BOOST_1).toBe(true)
    })

    it('accepted dilemmas persist and prevent re-acceptance', () => {
      usePlayer.getState().acceptDilemma('HIGH_RISK')
      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()

      // Should not be able to accept HIGH_RISK again
      const result = usePlayer.getState().acceptDilemma('HIGH_RISK')
      expect(result).toBe(false)
      expect(usePlayer.getState().acceptedDilemmas.filter(d => d === 'HIGH_RISK')).toHaveLength(1)
    })

    it('fragments persist across system transitions', () => {
      usePlayer.setState({ fragments: 200 })
      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()
      expect(usePlayer.getState().fragments).toBe(200)
    })

    it('upgradeStats persist across system transitions', () => {
      usePlayer.setState({ fragments: 500 })
      usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      const statsAfterUpgrade = { ...usePlayer.getState().upgradeStats }

      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()

      expect(usePlayer.getState().upgradeStats).toEqual(statsAfterUpgrade)
    })

    it('dilemmaStats persist across system transitions', () => {
      usePlayer.getState().acceptDilemma('SLOW_TANK')
      const statsAfterDilemma = { ...usePlayer.getState().dilemmaStats }

      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()

      expect(usePlayer.getState().dilemmaStats).toEqual(statsAfterDilemma)
    })

    it('full reset clears all permanent progression', () => {
      usePlayer.setState({ fragments: 500 })
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      usePlayer.getState().acceptDilemma('HIGH_RISK')

      usePlayer.getState().reset()

      expect(usePlayer.getState().fragments).toBe(470) // 500 - 30 (SPEED_BOOST_1 cost); fragments persist across run resets
      expect(usePlayer.getState().permanentUpgrades).toEqual({})
      expect(usePlayer.getState().acceptedDilemmas).toEqual([])
    })

    it('simulates full multi-tunnel flow without state corruption', () => {
      // System 1 boss defeated → tunnel 1
      usePlayer.setState({ fragments: 300, currentXP: 350, currentLevel: 6, xpToNextLevel: 900 })
      useGame.setState({ phase: 'tunnel' })

      // Buy an upgrade in tunnel 1
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      usePlayer.getState().acceptDilemma('HIGH_RISK')
      const fragmentsAfterTunnel1 = usePlayer.getState().fragments

      // Exit tunnel 1
      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()
      useGame.getState().setPhase('gameplay')

      expect(useLevel.getState().currentSystem).toBe(2)
      expect(usePlayer.getState().fragments).toBe(fragmentsAfterTunnel1)
      expect(usePlayer.getState().permanentUpgrades.SPEED_BOOST_1).toBe(true)
      expect(usePlayer.getState().acceptedDilemmas).toContain('HIGH_RISK')
      // Story 18.1: XP and level persist across system transitions
      expect(usePlayer.getState().currentXP).toBe(350)
      expect(usePlayer.getState().currentLevel).toBe(6)

      // System 2 boss defeated → tunnel 2
      usePlayer.setState({ fragments: usePlayer.getState().fragments + 100 })
      useGame.setState({ phase: 'tunnel' })

      // Buy another upgrade in tunnel 2
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_2')
      // HIGH_RISK should not be re-acceptable
      expect(usePlayer.getState().acceptDilemma('HIGH_RISK')).toBe(false)
      // But a new dilemma should work
      usePlayer.getState().acceptDilemma('SLOW_TANK')

      // Exit tunnel 2
      useLevel.getState().advanceSystem()
      usePlayer.getState().resetForNewSystem()
      useGame.getState().setPhase('gameplay')

      expect(useLevel.getState().currentSystem).toBe(3)
      expect(usePlayer.getState().permanentUpgrades.SPEED_BOOST_1).toBe(true)
      expect(usePlayer.getState().permanentUpgrades.SPEED_BOOST_2).toBe(true)
      expect(usePlayer.getState().acceptedDilemmas).toContain('HIGH_RISK')
      expect(usePlayer.getState().acceptedDilemmas).toContain('SLOW_TANK')
      // XP/level still preserved after second transition
      expect(usePlayer.getState().currentXP).toBe(350)
      expect(usePlayer.getState().currentLevel).toBe(6)
    })
  })
})
