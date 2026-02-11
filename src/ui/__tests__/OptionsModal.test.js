import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readAudioSettings, saveAudioSettings, clampVolume } from '../modals/OptionsModal.jsx'

// localStorage mock for Node environment
const localStorageMap = new Map()
const localStorageMock = {
  getItem: (key) => localStorageMap.get(key) ?? null,
  setItem: (key, value) => localStorageMap.set(key, String(value)),
  removeItem: (key) => localStorageMap.delete(key),
  clear: () => localStorageMap.clear(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock audioManager to avoid Howler dependency
vi.mock('../../audio/audioManager.js', () => ({
  setMasterVolume: vi.fn(),
  setMusicVolume: vi.fn(),
  setSFXVolume: vi.fn(),
  getMasterVolume: vi.fn(() => 1),
  getMusicVolume: vi.fn(() => 1),
  getSfxVolume: vi.fn(() => 1),
  playSFX: vi.fn(),
  loadAudioSettings: vi.fn(),
}))

beforeEach(() => {
  localStorageMap.clear()
})

describe('OptionsModal logic', () => {
  describe('clampVolume', () => {
    it('clamps values below 0 to 0', () => {
      expect(clampVolume(-10)).toBe(0)
    })

    it('clamps values above 100 to 100', () => {
      expect(clampVolume(150)).toBe(100)
    })

    it('passes through valid values unchanged', () => {
      expect(clampVolume(50)).toBe(50)
    })

    it('returns 100 for NaN input', () => {
      expect(clampVolume('abc')).toBe(100)
    })

    it('returns 100 for undefined input', () => {
      expect(clampVolume(undefined)).toBe(100)
    })

    it('handles string number input', () => {
      expect(clampVolume('75')).toBe(75)
    })

    it('handles boundary values', () => {
      expect(clampVolume(0)).toBe(0)
      expect(clampVolume(100)).toBe(100)
    })
  })

  describe('readAudioSettings', () => {
    it('returns defaults when localStorage is empty', () => {
      const settings = readAudioSettings()
      expect(settings).toEqual({ masterVolume: 100, musicVolume: 100, sfxVolume: 100 })
    })

    it('reads saved settings from localStorage', () => {
      localStorage.setItem('audioSettings', JSON.stringify({
        masterVolume: 75, musicVolume: 50, sfxVolume: 80,
      }))
      const settings = readAudioSettings()
      expect(settings.masterVolume).toBe(75)
      expect(settings.musicVolume).toBe(50)
      expect(settings.sfxVolume).toBe(80)
    })

    it('clamps out-of-range values from localStorage', () => {
      localStorage.setItem('audioSettings', JSON.stringify({
        masterVolume: 200, musicVolume: -10, sfxVolume: 50,
      }))
      const settings = readAudioSettings()
      expect(settings.masterVolume).toBe(100)
      expect(settings.musicVolume).toBe(0)
      expect(settings.sfxVolume).toBe(50)
    })

    it('returns defaults for invalid JSON', () => {
      localStorage.setItem('audioSettings', 'not-json')
      const settings = readAudioSettings()
      expect(settings).toEqual({ masterVolume: 100, musicVolume: 100, sfxVolume: 100 })
    })

    it('defaults missing fields to 100', () => {
      localStorage.setItem('audioSettings', JSON.stringify({ masterVolume: 60 }))
      const settings = readAudioSettings()
      expect(settings.masterVolume).toBe(60)
      expect(settings.musicVolume).toBe(100)
      expect(settings.sfxVolume).toBe(100)
    })
  })

  describe('saveAudioSettings', () => {
    it('writes settings as JSON to localStorage', () => {
      saveAudioSettings({ masterVolume: 75, musicVolume: 50, sfxVolume: 80 })
      const stored = JSON.parse(localStorage.getItem('audioSettings'))
      expect(stored.masterVolume).toBe(75)
      expect(stored.musicVolume).toBe(50)
      expect(stored.sfxVolume).toBe(80)
    })

    it('roundtrips correctly with readAudioSettings', () => {
      const original = { masterVolume: 42, musicVolume: 0, sfxVolume: 100 }
      saveAudioSettings(original)
      const loaded = readAudioSettings()
      expect(loaded).toEqual(original)
    })
  })

  describe('clearAllLocalStorage', () => {
    it('localStorage.clear() removes all keys including audioSettings', () => {
      localStorage.setItem('highScore', '5000')
      saveAudioSettings({ masterVolume: 50, musicVolume: 50, sfxVolume: 50 })

      localStorage.clear()

      expect(localStorage.getItem('highScore')).toBeNull()
      expect(localStorage.getItem('audioSettings')).toBeNull()
    })

    it('readAudioSettings returns defaults after clear', () => {
      saveAudioSettings({ masterVolume: 25, musicVolume: 25, sfxVolume: 25 })
      localStorage.clear()
      const settings = readAudioSettings()
      expect(settings).toEqual({ masterVolume: 100, musicVolume: 100, sfxVolume: 100 })
    })
  })
})
