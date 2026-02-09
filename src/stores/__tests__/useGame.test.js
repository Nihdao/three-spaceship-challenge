import { describe, it, expect, beforeEach } from 'vitest'
import useGame from '../useGame.jsx'
import usePlayer from '../usePlayer.jsx'
import useWeapons from '../useWeapons.jsx'
import useBoons from '../useBoons.jsx'

describe('useGame — game over transition (Story 3.5)', () => {
  beforeEach(() => {
    useGame.getState().reset()
    usePlayer.getState().reset()
  })

  it('triggerGameOver sets phase to gameOver and isPaused to true', () => {
    useGame.getState().startGameplay()
    useGame.getState().triggerGameOver()

    const state = useGame.getState()
    expect(state.phase).toBe('gameOver')
    expect(state.isPaused).toBe(true)
  })

  it('triggerGameOver does NOT reset score or systemTimer', () => {
    useGame.getState().startGameplay()
    useGame.setState({ score: 500, systemTimer: 120 })

    useGame.getState().triggerGameOver()

    const state = useGame.getState()
    expect(state.score).toBe(500)
    expect(state.systemTimer).toBe(120)
  })

  it('player stats (level, XP, HP) are preserved after game over', () => {
    usePlayer.getState().addXP(50)
    usePlayer.getState().takeDamage(80)

    useGame.getState().triggerGameOver()

    const playerState = usePlayer.getState()
    expect(playerState.currentXP).toBe(50)
    expect(playerState.currentHP).toBe(20)
    expect(playerState.currentLevel).toBe(1)
  })

  it('weapon state is preserved after game over', () => {
    useWeapons.getState().initializeWeapons()
    const weaponsBefore = useWeapons.getState().weapons

    useGame.getState().triggerGameOver()

    expect(useWeapons.getState().weapons).toEqual(weaponsBefore)
  })

  it('boon state is preserved after game over', () => {
    useBoons.getState().addBoon('SPEED_BOOST')
    const boonsBefore = useBoons.getState().activeBoons

    useGame.getState().triggerGameOver()

    expect(useBoons.getState().activeBoons).toEqual(boonsBefore)
  })

  it('returnToMenu does not reset player stores (reset happens in GameLoop on startGameplay)', () => {
    usePlayer.getState().addXP(50)

    useGame.getState().triggerGameOver()
    useGame.getState().returnToMenu()

    expect(usePlayer.getState().currentXP).toBe(50)
  })
})
