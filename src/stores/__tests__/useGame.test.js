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

describe('useGame — kill counter (Story 4.1)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('kills initialises to 0', () => {
    expect(useGame.getState().kills).toBe(0)
  })

  it('incrementKills increments by 1', () => {
    useGame.getState().incrementKills()
    expect(useGame.getState().kills).toBe(1)

    useGame.getState().incrementKills()
    useGame.getState().incrementKills()
    expect(useGame.getState().kills).toBe(3)
  })

  it('startGameplay resets kills to 0', () => {
    useGame.getState().incrementKills()
    useGame.getState().incrementKills()
    expect(useGame.getState().kills).toBe(2)

    useGame.getState().startGameplay()
    expect(useGame.getState().kills).toBe(0)
  })

  it('triggerGameOver preserves kills', () => {
    useGame.getState().startGameplay()
    useGame.getState().incrementKills()
    useGame.getState().incrementKills()
    useGame.getState().incrementKills()

    useGame.getState().triggerGameOver()
    expect(useGame.getState().kills).toBe(3)
  })

  it('reset clears kills to 0', () => {
    useGame.getState().incrementKills()
    useGame.getState().reset()
    expect(useGame.getState().kills).toBe(0)
  })
})

describe('useGame — planet reward phase (Story 5.3)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('triggerPlanetReward sets phase to planetReward and stores tier', () => {
    useGame.getState().startGameplay()
    useGame.getState().triggerPlanetReward('gold')

    const state = useGame.getState()
    expect(state.phase).toBe('planetReward')
    expect(state.isPaused).toBe(true)
    expect(state.rewardTier).toBe('gold')
  })

  it('resumeGameplay returns to gameplay from planetReward', () => {
    useGame.getState().startGameplay()
    useGame.getState().triggerPlanetReward('silver')
    useGame.getState().resumeGameplay()

    const state = useGame.getState()
    expect(state.phase).toBe('gameplay')
    expect(state.isPaused).toBe(false)
  })

  it('rewardTier included in reset()', () => {
    useGame.getState().triggerPlanetReward('platinum')
    expect(useGame.getState().rewardTier).toBe('platinum')

    useGame.getState().reset()
    expect(useGame.getState().rewardTier).toBeNull()
  })

  it('rewardTier defaults to null', () => {
    expect(useGame.getState().rewardTier).toBeNull()
  })
})

describe('useGame — system timer (Story 4.1)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('systemTimer initialises to 0', () => {
    expect(useGame.getState().systemTimer).toBe(0)
  })

  it('setSystemTimer updates the timer value', () => {
    useGame.getState().setSystemTimer(42.5)
    expect(useGame.getState().systemTimer).toBe(42.5)
  })

  it('startGameplay resets systemTimer to 0', () => {
    useGame.getState().setSystemTimer(300)
    useGame.getState().startGameplay()
    expect(useGame.getState().systemTimer).toBe(0)
  })

  it('triggerGameOver preserves systemTimer', () => {
    useGame.getState().startGameplay()
    useGame.getState().setSystemTimer(450)
    useGame.getState().triggerGameOver()
    expect(useGame.getState().systemTimer).toBe(450)
  })
})
