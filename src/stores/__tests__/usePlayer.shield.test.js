import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'

const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }

describe('usePlayer — shield timer (Story 44.5)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  it('activateShield sets shieldTimer and isInvulnerable', () => {
    usePlayer.getState().activateShield(5)
    const state = usePlayer.getState()
    expect(state.shieldTimer).toBe(5)
    expect(state.isInvulnerable).toBe(true)
  })

  it('tick(3) decrements shieldTimer, remains invulnerable', () => {
    usePlayer.getState().activateShield(5)
    usePlayer.getState().tick(3, noInput)
    const state = usePlayer.getState()
    expect(state.shieldTimer).toBeCloseTo(2)
    expect(state.isInvulnerable).toBe(true)
  })

  it('tick(3) after shieldTimer=2 → shieldTimer=0, isInvulnerable=false', () => {
    usePlayer.getState().activateShield(5)
    usePlayer.getState().tick(3, noInput) // shieldTimer = 2
    usePlayer.getState().tick(3, noInput) // shieldTimer = 0 → invulnerable off
    const state = usePlayer.getState()
    expect(state.shieldTimer).toBe(0)
    expect(state.isInvulnerable).toBe(false)
  })

  it('reset() zeroes shieldTimer', () => {
    usePlayer.getState().activateShield(5)
    usePlayer.getState().reset()
    expect(usePlayer.getState().shieldTimer).toBe(0)
  })

  it('resetForNewSystem() zeroes shieldTimer', () => {
    usePlayer.getState().activateShield(5)
    usePlayer.getState().resetForNewSystem()
    expect(usePlayer.getState().shieldTimer).toBe(0)
  })
})
