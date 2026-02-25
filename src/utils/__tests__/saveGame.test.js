import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveGameState } from '../saveGame.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import usePlayer from '../../stores/usePlayer.jsx'
import useLevel from '../../stores/useLevel.jsx'
import useGame from '../../stores/useGame.jsx'
import useWeapons from '../../stores/useWeapons.jsx'
import useBoons from '../../stores/useBoons.jsx'

// Mock localStorage for Node test environment
const store = {}
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = value }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
}

beforeEach(() => {
  globalThis.localStorage = mockLocalStorage
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.getItem.mockClear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

describe('saveGameState (Story 7.1)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    usePlayer.setState({ fragments: 0, fragmentsEarnedThisRun: 0 })
    useLevel.getState().reset()
    useGame.getState().reset()
    useWeapons.getState().reset()
    useBoons.getState().reset()
  })

  it('saves game state to localStorage under the correct key', () => {
    usePlayer.getState().addFragments(150)
    useLevel.setState({ currentSystem: 2 })
    useGame.setState({ kills: 42, systemTimer: 300 })

    saveGameState()

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      GAME_CONFIG.TUNNEL_AUTOSAVE_KEY,
      expect.any(String)
    )
    const autosaveCall = mockLocalStorage.setItem.mock.calls.find(([key]) => key === GAME_CONFIG.TUNNEL_AUTOSAVE_KEY)
    const data = JSON.parse(autosaveCall[1])
    expect(data.version).toBe(1)
    expect(data.currentSystem).toBe(2)
    expect(data.fragments).toBe(150)
    expect(data.playerHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    expect(data.playerMaxHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    expect(data.totalKills).toBe(42)
    expect(data.currentSystemTime).toBe(300)
    expect(data.timestamp).toBeGreaterThan(0)
  })

  it('saves weapons and boons', () => {
    useWeapons.getState().initializeWeapons()
    useBoons.getState().addBoon('DAMAGE_AMP')

    saveGameState()

    const data = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
    expect(data.weapons.length).toBe(1)
    expect(data.weapons[0].id).toBe('LASER_FRONT')
    expect(data.weapons[0].level).toBe(1)
    expect(data.boons.length).toBe(1)
    expect(data.boons[0].id).toBe('DAMAGE_AMP')
  })

  it('handles save gracefully when localStorage throws', () => {
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => saveGameState()).not.toThrow()
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })
})
