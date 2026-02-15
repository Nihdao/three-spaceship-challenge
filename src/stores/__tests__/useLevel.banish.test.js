import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'

describe('useLevel — banish tracking (Story 22.2, Task 1)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  describe('initial state', () => {
    it('has banishedItems array defaulting to empty', () => {
      expect(useLevel.getState().banishedItems).toEqual([])
    })
  })

  describe('addBanishedItem action', () => {
    it('adds weapon to banish list', () => {
      useLevel.getState().addBanishedItem('laser', 'weapon')

      const { banishedItems } = useLevel.getState()
      expect(banishedItems).toHaveLength(1)
      expect(banishedItems[0]).toEqual({ itemId: 'laser', type: 'weapon' })
    })

    it('adds boon to banish list', () => {
      useLevel.getState().addBanishedItem('attack_speed', 'boon')

      const { banishedItems } = useLevel.getState()
      expect(banishedItems).toHaveLength(1)
      expect(banishedItems[0]).toEqual({ itemId: 'attack_speed', type: 'boon' })
    })

    it('adds multiple items to banish list', () => {
      useLevel.getState().addBanishedItem('laser', 'weapon')
      useLevel.getState().addBanishedItem('attack_speed', 'boon')
      useLevel.getState().addBanishedItem('shotgun', 'weapon')

      const { banishedItems } = useLevel.getState()
      expect(banishedItems).toHaveLength(3)
      expect(banishedItems[0]).toEqual({ itemId: 'laser', type: 'weapon' })
      expect(banishedItems[1]).toEqual({ itemId: 'attack_speed', type: 'boon' })
      expect(banishedItems[2]).toEqual({ itemId: 'shotgun', type: 'weapon' })
    })

    it('does not add duplicate to banish list (same itemId and type)', () => {
      useLevel.getState().addBanishedItem('laser', 'weapon')
      useLevel.getState().addBanishedItem('laser', 'weapon')

      const { banishedItems } = useLevel.getState()
      expect(banishedItems).toHaveLength(1)
    })

    it('allows same itemId with different type (edge case: weapon and boon share name)', () => {
      useLevel.getState().addBanishedItem('damage', 'weapon')
      useLevel.getState().addBanishedItem('damage', 'boon')

      const { banishedItems } = useLevel.getState()
      expect(banishedItems).toHaveLength(2)
      expect(banishedItems[0]).toEqual({ itemId: 'damage', type: 'weapon' })
      expect(banishedItems[1]).toEqual({ itemId: 'damage', type: 'boon' })
    })
  })

  describe('clearBanishedItems action', () => {
    it('clears all banished items', () => {
      useLevel.getState().addBanishedItem('laser', 'weapon')
      useLevel.getState().addBanishedItem('attack_speed', 'boon')

      useLevel.getState().clearBanishedItems()

      expect(useLevel.getState().banishedItems).toEqual([])
    })

    it('works on empty list (no-op)', () => {
      useLevel.getState().clearBanishedItems()

      expect(useLevel.getState().banishedItems).toEqual([])
    })
  })

  describe('reset', () => {
    it('clears banished items on reset (new run starts with clean slate)', () => {
      useLevel.getState().addBanishedItem('laser', 'weapon')
      useLevel.getState().addBanishedItem('attack_speed', 'boon')

      useLevel.getState().reset()

      expect(useLevel.getState().banishedItems).toEqual([])
    })
  })

  describe('advanceSystem', () => {
    it('preserves banished items when advancing to next system (same run)', () => {
      useLevel.getState().addBanishedItem('laser', 'weapon')
      useLevel.getState().addBanishedItem('attack_speed', 'boon')

      useLevel.getState().advanceSystem()

      const { banishedItems } = useLevel.getState()
      expect(banishedItems).toHaveLength(2)
      expect(banishedItems).toContainEqual({ itemId: 'laser', type: 'weapon' })
      expect(banishedItems).toContainEqual({ itemId: 'attack_speed', type: 'boon' })
    })
  })
})
