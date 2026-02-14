import { describe, it, expect, beforeEach } from 'vitest'
import useGame from '../useGame.jsx'
import usePlayer from '../usePlayer.jsx'
import { SHIPS, getDefaultShipId } from '../../entities/shipDefs.js'

describe('Ship selection integration flow (Story 9.1 - Task 9)', () => {
  beforeEach(() => {
    useGame.getState().reset()
    usePlayer.getState().setCurrentShipId(getDefaultShipId())
    usePlayer.getState().reset()
  })

  it('9.1: MainMenu PLAY → ShipSelect → Gameplay flow works end-to-end', () => {
    // Start at menu
    expect(useGame.getState().phase).toBe('menu')

    // PLAY button transitions to shipSelect
    useGame.getState().setPhase('shipSelect')
    expect(useGame.getState().phase).toBe('shipSelect')

    // Select ship and start gameplay
    usePlayer.getState().setCurrentShipId('BALANCED')
    useGame.getState().startGameplay()
    expect(useGame.getState().phase).toBe('systemEntry')
  })

  it('9.2: BACK button returns to MainMenu without breaking state', () => {
    useGame.getState().setPhase('shipSelect')
    expect(useGame.getState().phase).toBe('shipSelect')

    // Go back to menu
    useGame.getState().setPhase('menu')
    expect(useGame.getState().phase).toBe('menu')

    // Can go to shipSelect again
    useGame.getState().setPhase('shipSelect')
    expect(useGame.getState().phase).toBe('shipSelect')
  })

  it('9.3: Selected ship stats apply correctly in gameplay (HP)', () => {
    // Select BALANCED ship
    usePlayer.getState().setCurrentShipId('BALANCED')
    useGame.getState().startGameplay()

    // Simulate GameLoop calling reset (what happens on phase transition)
    usePlayer.getState().reset()

    const state = usePlayer.getState()
    expect(state.currentHP).toBe(SHIPS.BALANCED.baseHP)
    expect(state.maxHP).toBe(SHIPS.BALANCED.baseHP)
  })

  it('9.3: Different ship yields different HP after reset', () => {
    // Use a locked ship for testing (simulate it being unlocked)
    usePlayer.getState().setCurrentShipId('TANK')
    usePlayer.getState().reset()

    const state = usePlayer.getState()
    expect(state.currentHP).toBe(SHIPS.TANK.baseHP)
    expect(state.maxHP).toBe(SHIPS.TANK.baseHP)
  })

  it('9.5: Multiple runs — can reselect ship between runs', () => {
    // First run with BALANCED
    usePlayer.getState().setCurrentShipId('BALANCED')
    useGame.getState().startGameplay()
    usePlayer.getState().reset()
    expect(usePlayer.getState().currentHP).toBe(SHIPS.BALANCED.baseHP)

    // Return to menu
    useGame.getState().returnToMenu()
    expect(useGame.getState().phase).toBe('menu')

    // Go to ship select, pick different ship
    useGame.getState().setPhase('shipSelect')
    usePlayer.getState().setCurrentShipId('GLASS_CANNON')

    // Start second run
    useGame.getState().startGameplay()
    usePlayer.getState().reset()
    expect(usePlayer.getState().currentHP).toBe(SHIPS.GLASS_CANNON.baseHP)
    expect(usePlayer.getState().currentShipId).toBe('GLASS_CANNON')
  })

  it('currentShipId defaults correctly on fresh game', () => {
    const defaultId = getDefaultShipId()
    expect(usePlayer.getState().currentShipId).toBe(defaultId)
    expect(SHIPS[defaultId].locked).toBe(false)
  })
})
