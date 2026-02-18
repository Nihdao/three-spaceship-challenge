import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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
  mockLocalStorage.clear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

const {
  STORAGE_KEY_SHIP_PROGRESSION,
  STORAGE_KEY_SHIP_LEVELS,
  getPersistedShipProgression,
  setPersistedShipProgression,
} = await import('../shipProgressionStorage.js')

describe('shipProgressionStorage (Story 25.2)', () => {
  describe('STORAGE_KEY constants', () => {
    it('STORAGE_KEY_SHIP_PROGRESSION is defined', () => {
      expect(STORAGE_KEY_SHIP_PROGRESSION).toBe('SPACESHIP_SHIP_PROGRESSION')
    })

    it('STORAGE_KEY_SHIP_LEVELS is kept for migration', () => {
      expect(STORAGE_KEY_SHIP_LEVELS).toBe('SPACESHIP_SHIP_LEVELS')
    })
  })

  describe('getPersistedShipProgression', () => {
    it('returns default structure when localStorage is empty', () => {
      const result = getPersistedShipProgression()
      expect(result.shipLevels).toEqual({ BALANCED: 1, GLASS_CANNON: 1, TANK: 1 })
      expect(result.selectedSkins).toEqual({ BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' })
    })

    it('returns stored data from new format', () => {
      const data = {
        shipLevels: { BALANCED: 5, GLASS_CANNON: 2, TANK: 1 },
        selectedSkins: { BALANCED: 'nebula', GLASS_CANNON: 'default', TANK: 'default' },
      }
      store[STORAGE_KEY_SHIP_PROGRESSION] = JSON.stringify(data)

      const result = getPersistedShipProgression()
      expect(result.shipLevels.BALANCED).toBe(5)
      expect(result.selectedSkins.BALANCED).toBe('nebula')
    })

    it('fills missing selectedSkins with defaults when not present in stored data', () => {
      const data = { shipLevels: { BALANCED: 3, GLASS_CANNON: 1, TANK: 1 } }
      store[STORAGE_KEY_SHIP_PROGRESSION] = JSON.stringify(data)

      const result = getPersistedShipProgression()
      expect(result.selectedSkins).toEqual({ BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' })
    })

    it('fills missing shipLevels with defaults when not present in stored data', () => {
      const data = { selectedSkins: { BALANCED: 'azure', GLASS_CANNON: 'default', TANK: 'default' } }
      store[STORAGE_KEY_SHIP_PROGRESSION] = JSON.stringify(data)

      const result = getPersistedShipProgression()
      expect(result.shipLevels).toEqual({ BALANCED: 1, GLASS_CANNON: 1, TANK: 1 })
    })
  })

  describe('migration from old format (Story 25.1 → Story 25.2)', () => {
    it('migrates old flat { BALANCED: 1, ... } format into new { shipLevels, selectedSkins } format', () => {
      // Old format from Story 25.1
      const oldData = { BALANCED: 5, GLASS_CANNON: 2, TANK: 1 }
      store[STORAGE_KEY_SHIP_LEVELS] = JSON.stringify(oldData)

      const result = getPersistedShipProgression()
      expect(result.shipLevels).toEqual(oldData)
      expect(result.selectedSkins).toEqual({ BALANCED: 'default', GLASS_CANNON: 'default', TANK: 'default' })
    })

    it('prefers new format over old format when both keys exist', () => {
      const newData = {
        shipLevels: { BALANCED: 9, GLASS_CANNON: 1, TANK: 1 },
        selectedSkins: { BALANCED: 'sovereign', GLASS_CANNON: 'default', TANK: 'default' },
      }
      const oldData = { BALANCED: 3, GLASS_CANNON: 1, TANK: 1 }
      store[STORAGE_KEY_SHIP_PROGRESSION] = JSON.stringify(newData)
      store[STORAGE_KEY_SHIP_LEVELS] = JSON.stringify(oldData)

      const result = getPersistedShipProgression()
      expect(result.shipLevels.BALANCED).toBe(9) // new format wins
      expect(result.selectedSkins.BALANCED).toBe('sovereign')
    })
  })

  describe('setPersistedShipProgression', () => {
    it('saves data to localStorage with new key', () => {
      const data = {
        shipLevels: { BALANCED: 3, GLASS_CANNON: 1, TANK: 1 },
        selectedSkins: { BALANCED: 'azure', GLASS_CANNON: 'default', TANK: 'default' },
      }
      setPersistedShipProgression(data)

      const stored = JSON.parse(store[STORAGE_KEY_SHIP_PROGRESSION])
      expect(stored.shipLevels.BALANCED).toBe(3)
      expect(stored.selectedSkins.BALANCED).toBe('azure')
    })

    it('persists both shipLevels and selectedSkins together', () => {
      const data = {
        shipLevels: { BALANCED: 6, GLASS_CANNON: 3, TANK: 9 },
        selectedSkins: { BALANCED: 'nebula', GLASS_CANNON: 'crimson', TANK: 'titan' },
      }
      setPersistedShipProgression(data)

      const stored = JSON.parse(store[STORAGE_KEY_SHIP_PROGRESSION])
      expect(stored.shipLevels).toEqual(data.shipLevels)
      expect(stored.selectedSkins).toEqual(data.selectedSkins)
    })
  })

  describe('round-trip', () => {
    it('data survives a save/load cycle', () => {
      const original = {
        shipLevels: { BALANCED: 7, GLASS_CANNON: 4, TANK: 2 },
        selectedSkins: { BALANCED: 'sovereign', GLASS_CANNON: 'void', TANK: 'phantom' },
      }
      setPersistedShipProgression(original)

      const result = getPersistedShipProgression()
      expect(result.shipLevels).toEqual(original.shipLevels)
      expect(result.selectedSkins).toEqual(original.selectedSkins)
    })
  })
})
