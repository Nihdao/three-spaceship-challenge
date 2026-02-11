import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useGame from '../useGame.jsx'
import usePlayer from '../usePlayer.jsx'
import useWeapons from '../useWeapons.jsx'
import useBoons from '../useBoons.jsx'
import { STORAGE_KEY_HIGH_SCORE } from '../../utils/highScoreStorage.js'

// Mock localStorage for Node test environment
const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}

beforeEach(() => {
  globalThis.localStorage = mockLocalStorage
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

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

describe('useGame — score tracking (Story 8.4, Task 1.2)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('score initialises to 0', () => {
    expect(useGame.getState().score).toBe(0)
  })

  it('addScore adds points to current score', () => {
    useGame.getState().addScore(100)
    expect(useGame.getState().score).toBe(100)

    useGame.getState().addScore(250)
    expect(useGame.getState().score).toBe(350)
  })

  it('startGameplay resets score to 0', () => {
    useGame.getState().addScore(500)
    useGame.getState().startGameplay()
    expect(useGame.getState().score).toBe(0)
  })

  it('triggerGameOver preserves score', () => {
    useGame.getState().addScore(1000)
    useGame.getState().triggerGameOver()
    expect(useGame.getState().score).toBe(1000)
  })

  it('reset clears score to 0', () => {
    useGame.getState().addScore(500)
    useGame.getState().reset()
    expect(useGame.getState().score).toBe(0)
  })
})

describe('useGame — high score persistence (Story 8.4, Task 1.3)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('highScore initialises to 0 when no localStorage data', () => {
    expect(useGame.getState().highScore).toBe(0)
  })

  it('loadHighScore reads from localStorage', () => {
    store[STORAGE_KEY_HIGH_SCORE] = '9999'
    useGame.getState().loadHighScore()
    expect(useGame.getState().highScore).toBe(9999)
  })

  it('updateHighScore saves new high score when current score is higher', () => {
    useGame.setState({ score: 5000, highScore: 1000 })
    useGame.getState().updateHighScore()
    expect(useGame.getState().highScore).toBe(5000)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('updateHighScore does not save when current score is lower', () => {
    useGame.setState({ score: 500, highScore: 1000 })
    useGame.getState().updateHighScore()
    expect(useGame.getState().highScore).toBe(1000)
  })

  it('updateHighScore does not save when score is 0', () => {
    useGame.setState({ score: 0, highScore: 0 })
    useGame.getState().updateHighScore()
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('updateHighScore returns true when new high score achieved', () => {
    useGame.setState({ score: 5000, highScore: 1000 })
    const result = useGame.getState().updateHighScore()
    expect(result).toBe(true)
  })

  it('updateHighScore returns false when no new high score', () => {
    useGame.setState({ score: 500, highScore: 1000 })
    const result = useGame.getState().updateHighScore()
    expect(result).toBe(false)
  })

  it('highScore is included in reset()', () => {
    useGame.setState({ highScore: 9999 })
    useGame.getState().reset()
    expect(useGame.getState().highScore).toBe(0)
  })

  it('startGameplay does not reset highScore', () => {
    useGame.setState({ highScore: 9999 })
    useGame.getState().startGameplay()
    expect(useGame.getState().highScore).toBe(9999)
  })
})

describe('useGame — isNewHighScore flag (Story 8.4, Task 3)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('isNewHighScore defaults to false', () => {
    expect(useGame.getState().isNewHighScore).toBe(false)
  })

  it('updateHighScore sets isNewHighScore to true when new record', () => {
    useGame.setState({ score: 5000, highScore: 1000 })
    useGame.getState().updateHighScore()
    expect(useGame.getState().isNewHighScore).toBe(true)
  })

  it('updateHighScore sets isNewHighScore to false when no new record', () => {
    useGame.setState({ score: 500, highScore: 1000 })
    useGame.getState().updateHighScore()
    expect(useGame.getState().isNewHighScore).toBe(false)
  })

  it('startGameplay resets isNewHighScore', () => {
    useGame.setState({ isNewHighScore: true })
    useGame.getState().startGameplay()
    expect(useGame.getState().isNewHighScore).toBe(false)
  })

  it('reset clears isNewHighScore', () => {
    useGame.setState({ isNewHighScore: true })
    useGame.getState().reset()
    expect(useGame.getState().isNewHighScore).toBe(false)
  })
})

describe('useGame — high score clear save integration (Story 8.4, Task 4)', () => {
  beforeEach(() => {
    useGame.getState().reset()
  })

  it('loadHighScore returns 0 after localStorage is cleared', () => {
    store[STORAGE_KEY_HIGH_SCORE] = '5000'
    useGame.getState().loadHighScore()
    expect(useGame.getState().highScore).toBe(5000)

    // Simulate clear save (OptionsModal does localStorage.clear())
    mockLocalStorage.clear()
    useGame.getState().loadHighScore()
    expect(useGame.getState().highScore).toBe(0)
  })
})
