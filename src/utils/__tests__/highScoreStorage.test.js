import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getHighScore, setHighScore, STORAGE_KEY_HIGH_SCORE } from '../highScoreStorage.js'

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

describe('highScoreStorage utilities (Story 8.4, Task 1.1)', () => {
  describe('STORAGE_KEY_HIGH_SCORE', () => {
    it('is a non-empty string', () => {
      expect(typeof STORAGE_KEY_HIGH_SCORE).toBe('string')
      expect(STORAGE_KEY_HIGH_SCORE.length).toBeGreaterThan(0)
    })
  })

  describe('getHighScore', () => {
    it('returns 0 when no high score is stored', () => {
      expect(getHighScore()).toBe(0)
    })

    it('returns stored high score', () => {
      store[STORAGE_KEY_HIGH_SCORE] = '12345'
      expect(getHighScore()).toBe(12345)
    })

    it('returns 0 for invalid stored value', () => {
      store[STORAGE_KEY_HIGH_SCORE] = 'not-a-number'
      expect(getHighScore()).toBe(0)
    })

    it('returns 0 when localStorage throws', () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage unavailable')
      })
      expect(getHighScore()).toBe(0)
    })

    it('returns 0 for negative stored value', () => {
      store[STORAGE_KEY_HIGH_SCORE] = '-100'
      expect(getHighScore()).toBe(0)
    })
  })

  describe('setHighScore', () => {
    it('stores score in localStorage', () => {
      setHighScore(9999)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY_HIGH_SCORE, '9999')
    })

    it('overwrites previous value', () => {
      setHighScore(100)
      setHighScore(200)
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(STORAGE_KEY_HIGH_SCORE, '200')
    })

    it('does not throw when localStorage is unavailable', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('quota exceeded')
      })
      expect(() => setHighScore(100)).not.toThrow()
    })
  })

})
