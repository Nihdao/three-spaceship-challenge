import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — resetForNewSystem cross-system preservation (Story 7.3)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  it('preserves fragments across system transition', () => {
    usePlayer.setState({ fragments: 150 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().fragments).toBe(150)
  })

  it('preserves currentHP and maxHP', () => {
    usePlayer.setState({ currentHP: 45, maxHP: 80 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().currentHP).toBe(45)
    expect(usePlayer.getState().maxHP).toBe(80)
  })

  it('preserves permanentUpgrades', () => {
    usePlayer.setState({ permanentUpgrades: { ATK_1: true, SPD_1: true } })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().permanentUpgrades).toEqual({ ATK_1: true, SPD_1: true })
  })

  it('preserves acceptedDilemmas', () => {
    usePlayer.setState({ acceptedDilemmas: ['HIGH_RISK'] })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().acceptedDilemmas).toEqual(['HIGH_RISK'])
  })

  it('preserves upgradeStats', () => {
    const customStats = { damageMult: 1.2, speedMult: 1.0, hpMaxBonus: 20, cooldownMult: 1.0, fragmentMult: 1.0 }
    usePlayer.setState({ upgradeStats: customStats })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().upgradeStats).toEqual(customStats)
  })

  it('preserves dilemmaStats', () => {
    const customStats = { damageMult: 1.3, speedMult: 1.0, hpMaxMult: 0.8, cooldownMult: 1.0 }
    usePlayer.setState({ dilemmaStats: customStats })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().dilemmaStats).toEqual(customStats)
  })

  it('resets position to origin', () => {
    usePlayer.setState({ position: [100, 0, -200] })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().position).toEqual([0, 0, 0])
  })

  it('resets XP and level', () => {
    usePlayer.setState({ currentXP: 500, currentLevel: 5, xpToNextLevel: 1000 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().currentXP).toBe(0)
    expect(usePlayer.getState().currentLevel).toBe(1)
    expect(usePlayer.getState().xpToNextLevel).toBe(GAME_CONFIG.XP_LEVEL_CURVE[0])
  })

  it('resets dash state', () => {
    usePlayer.setState({ isDashing: true, dashTimer: 0.2, dashCooldownTimer: 2.5 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().isDashing).toBe(false)
    expect(usePlayer.getState().dashTimer).toBe(0)
    expect(usePlayer.getState().dashCooldownTimer).toBe(0)
  })

  it('resets invulnerability', () => {
    usePlayer.setState({ isInvulnerable: true, invulnerabilityTimer: 0.3 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().isInvulnerable).toBe(false)
    expect(usePlayer.getState().invulnerabilityTimer).toBe(0)
  })
})
