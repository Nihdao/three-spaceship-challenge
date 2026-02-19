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
  mockLocalStorage.clear()
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()
})

afterEach(() => {
  mockLocalStorage.clear()
})

// Dynamic import after localStorage mock is set up
const { default: useArmory } = await import('../useArmory.jsx')

describe('useArmory — discovery state (Story 25.4)', () => {
  beforeEach(() => {
    useArmory.getState().reset()
    mockLocalStorage.clear()
  })

  describe('initial state', () => {
    it('starts with empty discovered weapons', () => {
      const state = useArmory.getState()
      expect(state.discovered.weapons.size).toBe(0)
    })

    it('starts with empty discovered boons', () => {
      const state = useArmory.getState()
      expect(state.discovered.boons.size).toBe(0)
    })
  })

  describe('markDiscovered()', () => {
    it('marks a weapon as discovered', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      expect(useArmory.getState().discovered.weapons.has('LASER_FRONT')).toBe(true)
    })

    it('marks a boon as discovered', () => {
      useArmory.getState().markDiscovered('boons', 'DAMAGE_AMP')
      expect(useArmory.getState().discovered.boons.has('DAMAGE_AMP')).toBe(true)
    })

    it('can mark multiple weapons as discovered', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      useArmory.getState().markDiscovered('weapons', 'SPREAD_SHOT')
      expect(useArmory.getState().discovered.weapons.size).toBe(2)
    })

    it('marking same item twice does not duplicate', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      expect(useArmory.getState().discovered.weapons.size).toBe(1)
    })

    it('saves to localStorage on markDiscovered', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('isDiscovered()', () => {
    it('returns true for a discovered weapon', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      expect(useArmory.getState().isDiscovered('weapons', 'LASER_FRONT')).toBe(true)
    })

    it('returns false for an undiscovered weapon', () => {
      expect(useArmory.getState().isDiscovered('weapons', 'RAILGUN')).toBe(false)
    })

    it('returns true for a discovered boon', () => {
      useArmory.getState().markDiscovered('boons', 'SPEED_BOOST')
      expect(useArmory.getState().isDiscovered('boons', 'SPEED_BOOST')).toBe(true)
    })

    it('returns false for an undiscovered boon', () => {
      expect(useArmory.getState().isDiscovered('boons', 'CRIT_CHANCE')).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    it('saves discovered weapons to localStorage', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      const saved = JSON.parse(mockLocalStorage.setItem.mock.calls.at(-1)[1])
      expect(saved.weapons).toContain('LASER_FRONT')
    })

    it('saves discovered boons to localStorage', () => {
      useArmory.getState().markDiscovered('boons', 'DAMAGE_AMP')
      const saved = JSON.parse(mockLocalStorage.setItem.mock.calls.at(-1)[1])
      expect(saved.boons).toContain('DAMAGE_AMP')
    })

    it('saves state in format that can be reloaded (weapons array in localStorage)', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      useArmory.getState().markDiscovered('weapons', 'SPREAD_SHOT')
      const saved = JSON.parse(store['armory-discovery'])
      // Should be stored as an array (not a Set) for JSON serialization
      expect(Array.isArray(saved.weapons)).toBe(true)
      expect(saved.weapons).toContain('LASER_FRONT')
      expect(saved.weapons).toContain('SPREAD_SHOT')
    })
  })

  describe('reset()', () => {
    it('clears discovered weapons', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      useArmory.getState().reset()
      expect(useArmory.getState().discovered.weapons.size).toBe(0)
    })

    it('clears discovered boons', () => {
      useArmory.getState().markDiscovered('boons', 'DAMAGE_AMP')
      useArmory.getState().reset()
      expect(useArmory.getState().discovered.boons.size).toBe(0)
    })

    it('removes armory-discovery from localStorage on reset', () => {
      useArmory.getState().markDiscovered('weapons', 'LASER_FRONT')
      useArmory.getState().reset()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('armory-discovery')
    })
  })
})
