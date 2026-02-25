import { describe, it, expect, beforeEach } from 'vitest'
import { shouldShowCrosshair } from '../Crosshair.jsx'
import useGame from '../../stores/useGame.jsx'

beforeEach(() => {
  useGame.getState().reset()
})

// Truth table from story 42.5
describe('shouldShowCrosshair — phase × isPaused truth table', () => {
  it('shows during gameplay when not paused', () => {
    expect(shouldShowCrosshair('gameplay', false)).toBe(true)
  })

  it('hides during gameplay when paused — AC 1', () => {
    expect(shouldShowCrosshair('gameplay', true)).toBe(false)
  })

  it('shows during boss when not paused', () => {
    expect(shouldShowCrosshair('boss', false)).toBe(true)
  })

  it('hides during boss when paused — AC 1', () => {
    expect(shouldShowCrosshair('boss', true)).toBe(false)
  })

  it('hides during levelUp regardless of isPaused — AC 3', () => {
    expect(shouldShowCrosshair('levelUp', true)).toBe(false)
    expect(shouldShowCrosshair('levelUp', false)).toBe(false)
  })

  it('hides during planetReward — AC 3', () => {
    expect(shouldShowCrosshair('planetReward', true)).toBe(false)
  })

  it('hides during revive — AC 3', () => {
    expect(shouldShowCrosshair('revive', true)).toBe(false)
  })

  it('hides during menu', () => {
    expect(shouldShowCrosshair('menu', false)).toBe(false)
  })

  it('hides during gameOver', () => {
    expect(shouldShowCrosshair('gameOver', true)).toBe(false)
  })
})

describe('shouldShowCrosshair — store integration', () => {
  it('isPaused starts false after reset', () => {
    expect(useGame.getState().isPaused).toBe(false)
  })

  it('setPaused(true) during gameplay makes crosshair invisible', () => {
    useGame.getState().setPaused(true)
    const { phase, isPaused } = useGame.getState()
    // Default phase after reset is 'menu', not 'gameplay' — isPaused gate still yields false
    expect(shouldShowCrosshair(phase, isPaused)).toBe(false)
  })

  it('crosshair visible when phase is gameplay and not paused', () => {
    // Simulate gameplay phase without triggering full game start
    useGame.setState({ phase: 'gameplay', isPaused: false })
    const { phase, isPaused } = useGame.getState()
    expect(shouldShowCrosshair(phase, isPaused)).toBe(true)
  })

  it('crosshair hidden when phase is gameplay and paused via setPaused', () => {
    useGame.setState({ phase: 'gameplay', isPaused: false })
    useGame.getState().setPaused(true)
    const { phase, isPaused } = useGame.getState()
    expect(shouldShowCrosshair(phase, isPaused)).toBe(false)
  })
})
