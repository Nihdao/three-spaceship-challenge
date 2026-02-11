import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import useGame from '../useGame.jsx'
import { SHIPS, getDefaultShipId } from '../../entities/shipDefs.js'

describe('usePlayer — ship selection (Story 9.1)', () => {
  beforeEach(() => {
    usePlayer.getState().setCurrentShipId(getDefaultShipId())
    usePlayer.getState().reset()
    useGame.getState().reset()
  })

  it('has currentShipId field defaulting to first unlocked ship', () => {
    const { currentShipId } = usePlayer.getState()
    expect(currentShipId).toBe(getDefaultShipId())
  })

  it('setCurrentShipId updates the selected ship', () => {
    usePlayer.getState().setCurrentShipId('BALANCED')
    expect(usePlayer.getState().currentShipId).toBe('BALANCED')
  })

  it('setCurrentShipId ignores invalid ship ids', () => {
    usePlayer.getState().setCurrentShipId('BALANCED')
    usePlayer.getState().setCurrentShipId('NONEXISTENT')
    expect(usePlayer.getState().currentShipId).toBe('BALANCED')
  })

  it('reset() initializes HP from selected ship stats', () => {
    usePlayer.getState().setCurrentShipId('BALANCED')
    usePlayer.getState().reset()

    const state = usePlayer.getState()
    const ship = SHIPS.BALANCED
    expect(state.currentHP).toBe(ship.baseHP)
    expect(state.maxHP).toBe(ship.baseHP)
  })

  it('reset() initializes shipBaseSpeed and shipBaseDamageMultiplier from selected ship', () => {
    usePlayer.getState().setCurrentShipId('BALANCED')
    usePlayer.getState().reset()

    const state = usePlayer.getState()
    const ship = SHIPS.BALANCED
    expect(state.shipBaseSpeed).toBe(ship.baseSpeed)
    expect(state.shipBaseDamageMultiplier).toBe(ship.baseDamageMultiplier)
  })

  it('reset() preserves currentShipId', () => {
    usePlayer.getState().setCurrentShipId('BALANCED')
    usePlayer.getState().reset()
    expect(usePlayer.getState().currentShipId).toBe('BALANCED')
  })

  it('reset() uses ship-specific stats when different ships have different values', () => {
    const balanced = SHIPS.BALANCED
    const other = Object.values(SHIPS).find(s => s.baseHP !== balanced.baseHP)
    if (!other) return

    usePlayer.getState().setCurrentShipId(other.id)
    usePlayer.getState().reset()

    const state = usePlayer.getState()
    expect(state.currentHP).toBe(other.baseHP)
    expect(state.maxHP).toBe(other.baseHP)
    expect(state.shipBaseSpeed).toBe(other.baseSpeed)
    expect(state.shipBaseDamageMultiplier).toBe(other.baseDamageMultiplier)
  })

  it('phase transition: menu → shipSelect → gameplay works', () => {
    useGame.getState().setPhase('shipSelect')
    expect(useGame.getState().phase).toBe('shipSelect')

    usePlayer.getState().setCurrentShipId('BALANCED')
    useGame.getState().startGameplay()
    expect(useGame.getState().phase).toBe('gameplay')
  })
})
