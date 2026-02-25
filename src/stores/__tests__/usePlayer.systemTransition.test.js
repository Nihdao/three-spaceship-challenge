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

  it('resets position to a random spawn within [-1200, 1200] (Story 34.2)', () => {
    usePlayer.setState({ position: [100, 0, -200] })
    usePlayer.getState().resetForNewSystem()
    const [px, py, pz] = usePlayer.getState().position
    expect(py).toBe(0)
    expect(Math.abs(px)).toBeLessThanOrEqual(1200)
    expect(Math.abs(pz)).toBeLessThanOrEqual(1200)
  })

  it('preserves XP and level across system transition (Story 18.1)', () => {
    usePlayer.setState({ currentXP: 450, currentLevel: 8, xpToNextLevel: 1200 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().currentXP).toBe(450)
    expect(usePlayer.getState().currentLevel).toBe(8)
    expect(usePlayer.getState().xpToNextLevel).toBe(1200)
  })

  it('preserves pendingLevelUps across system transition (Story 18.1)', () => {
    usePlayer.setState({ pendingLevelUps: 2, levelsGainedThisBatch: 2 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().pendingLevelUps).toBe(2)
    expect(usePlayer.getState().levelsGainedThisBatch).toBe(2)
  })

  it('preserves _appliedMaxHPBonus across system transition (Story 18.1)', () => {
    usePlayer.setState({ _appliedMaxHPBonus: 15 })
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState()._appliedMaxHPBonus).toBe(15)
  })

  it('full reset() still clears XP and level to defaults (Story 18.1)', () => {
    usePlayer.setState({ currentXP: 450, currentLevel: 8, xpToNextLevel: 1200, pendingLevelUps: 2 })
    usePlayer.getState().reset()
    expect(usePlayer.getState().currentXP).toBe(0)
    expect(usePlayer.getState().currentLevel).toBe(1)
    expect(usePlayer.getState().xpToNextLevel).toBe(GAME_CONFIG.XP_LEVEL_CURVE[0])
    expect(usePlayer.getState().pendingLevelUps).toBe(0)
  })

  it('full transition flow: XP continues accumulating from preserved state (Story 18.1)', () => {
    // Simulate System 1: player earns XP and reaches level 5
    usePlayer.setState({ currentXP: 300, currentLevel: 5, xpToNextLevel: 800 })
    // System transition
    usePlayer.getState().resetForNewSystem()
    // In System 2, player collects more XP
    usePlayer.getState().addXP(200)
    expect(usePlayer.getState().currentXP).toBe(500)
    expect(usePlayer.getState().currentLevel).toBe(5)
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

describe('usePlayer — random spawn (Story 34.2)', () => {
  it('reset() sets position within [-1200, 1200] range', () => {
    usePlayer.getState().reset()
    const [x, y, z] = usePlayer.getState().position
    expect(y).toBe(0)
    expect(Math.abs(x)).toBeLessThanOrEqual(1200)
    expect(Math.abs(z)).toBeLessThanOrEqual(1200)
  })

  it('reset() does not always spawn at [0, 0, 0] (10 iterations)', () => {
    const positions = []
    for (let i = 0; i < 10; i++) {
      usePlayer.getState().reset()
      positions.push([...usePlayer.getState().position])
    }
    const allAtOrigin = positions.every(([x, , z]) => x === 0 && z === 0)
    expect(allAtOrigin).toBe(false)
  })

  it('resetForNewSystem() sets position within [-1200, 1200] range', () => {
    usePlayer.getState().resetForNewSystem()
    const [x, y, z] = usePlayer.getState().position
    expect(y).toBe(0)
    expect(Math.abs(x)).toBeLessThanOrEqual(1200)
    expect(Math.abs(z)).toBeLessThanOrEqual(1200)
  })
})
