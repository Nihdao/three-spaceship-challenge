import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — Permanent Upgrades (Story 7.2)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('initial state', () => {
    it('starts with empty permanentUpgrades', () => {
      expect(usePlayer.getState().permanentUpgrades).toEqual({})
    })

    it('starts with default upgradeStats', () => {
      const { upgradeStats } = usePlayer.getState()
      expect(upgradeStats.damageMult).toBe(1.0)
      expect(upgradeStats.speedMult).toBe(1.0)
      expect(upgradeStats.hpMaxBonus).toBe(0)
      expect(upgradeStats.cooldownMult).toBe(1.0)
      expect(upgradeStats.fragmentMult).toBe(1.0)
    })
  })

  describe('applyPermanentUpgrade', () => {
    it('purchases ATTACK_BOOST_1 with sufficient fragments', () => {
      usePlayer.setState({ fragments: 100 })
      const result = usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      const state = usePlayer.getState()
      expect(result).toBe(true)
      expect(state.fragments).toBe(50)
      expect(state.permanentUpgrades.ATTACK_BOOST_1).toBe(true)
      expect(state.upgradeStats.damageMult).toBeCloseTo(1.1)
    })

    it('rejects purchase with insufficient fragments', () => {
      usePlayer.setState({ fragments: 30 })
      const result = usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      const state = usePlayer.getState()
      expect(result).toBe(false)
      expect(state.fragments).toBe(30)
      expect(state.permanentUpgrades.ATTACK_BOOST_1).toBeUndefined()
    })

    it('rejects duplicate purchase', () => {
      usePlayer.setState({ fragments: 200 })
      usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      const result = usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      expect(result).toBe(false)
      expect(usePlayer.getState().fragments).toBe(150) // Only deducted once
    })

    it('rejects purchase with unmet prerequisite', () => {
      usePlayer.setState({ fragments: 200 })
      const result = usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_2')
      expect(result).toBe(false)
      expect(usePlayer.getState().fragments).toBe(200)
    })

    it('allows purchase when prerequisite is met', () => {
      usePlayer.setState({ fragments: 200 })
      usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      const result = usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_2')
      expect(result).toBe(true)
      expect(usePlayer.getState().fragments).toBe(50) // 200 - 50 - 100
      expect(usePlayer.getState().upgradeStats.damageMult).toBeCloseTo(1.1 * 1.2)
    })

    it('HP_MAX_BONUS increases maxHP and currentHP', () => {
      usePlayer.setState({ fragments: 100 })
      const hpBefore = usePlayer.getState().currentHP
      const maxBefore = usePlayer.getState().maxHP
      usePlayer.getState().applyPermanentUpgrade('HP_MAX_BOOST_1')
      const state = usePlayer.getState()
      expect(state.maxHP).toBe(maxBefore + 20)
      expect(state.currentHP).toBe(hpBefore + 20)
      expect(state.upgradeStats.hpMaxBonus).toBe(20)
    })

    it('SPEED_BOOST updates speedMult', () => {
      usePlayer.setState({ fragments: 100 })
      usePlayer.getState().applyPermanentUpgrade('SPEED_BOOST_1')
      expect(usePlayer.getState().upgradeStats.speedMult).toBeCloseTo(1.15)
    })

    it('COOLDOWN_REDUCTION updates cooldownMult', () => {
      usePlayer.setState({ fragments: 100 })
      usePlayer.getState().applyPermanentUpgrade('COOLDOWN_REDUCTION_1')
      expect(usePlayer.getState().upgradeStats.cooldownMult).toBeCloseTo(0.9)
    })

    it('FRAGMENT_BOOST updates fragmentMult', () => {
      usePlayer.setState({ fragments: 100 })
      usePlayer.getState().applyPermanentUpgrade('FRAGMENT_BOOST_1')
      expect(usePlayer.getState().upgradeStats.fragmentMult).toBeCloseTo(1.5)
    })

    it('rejects invalid upgrade ID', () => {
      usePlayer.setState({ fragments: 100 })
      const result = usePlayer.getState().applyPermanentUpgrade('NONEXISTENT')
      expect(result).toBe(false)
    })
  })

  describe('addFragments with fragmentMult', () => {
    it('applies fragment multiplier to rewards', () => {
      usePlayer.setState({ fragments: 100 })
      usePlayer.getState().applyPermanentUpgrade('FRAGMENT_BOOST_1')
      // fragments after purchase: 100 - 70 = 30
      expect(usePlayer.getState().fragments).toBe(30)
      // Now add 100 fragments with 1.5x multiplier = 150
      usePlayer.getState().addFragments(100)
      expect(usePlayer.getState().fragments).toBe(180) // 30 + 150
    })
  })

  describe('reset', () => {
    it('clears permanentUpgrades and upgradeStats', () => {
      usePlayer.setState({ fragments: 200 })
      usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      usePlayer.getState().reset()
      const state = usePlayer.getState()
      expect(state.permanentUpgrades).toEqual({})
      expect(state.upgradeStats.damageMult).toBe(1.0)
      expect(state.upgradeStats.speedMult).toBe(1.0)
      expect(state.upgradeStats.hpMaxBonus).toBe(0)
      expect(state.upgradeStats.cooldownMult).toBe(1.0)
      expect(state.upgradeStats.fragmentMult).toBe(1.0)
    })
  })

  describe('resetForNewSystem', () => {
    it('preserves permanentUpgrades and upgradeStats', () => {
      usePlayer.setState({ fragments: 200 })
      usePlayer.getState().applyPermanentUpgrade('ATTACK_BOOST_1')
      usePlayer.getState().resetForNewSystem()
      const state = usePlayer.getState()
      expect(state.permanentUpgrades.ATTACK_BOOST_1).toBe(true)
      expect(state.upgradeStats.damageMult).toBeCloseTo(1.1)
    })
  })
})
