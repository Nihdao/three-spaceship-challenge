import { describe, it, expect, beforeEach, vi } from 'vitest'
import usePlayer from '../usePlayer.jsx'

describe('usePlayer — strategic charge consumption (Story 22.2, Task 1)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    vi.clearAllTimers()
  })

  describe('consumeReroll action', () => {
    it('decrements rerollCharges by 1', () => {
      usePlayer.setState({ rerollCharges: 3 })

      usePlayer.getState().consumeReroll()

      expect(usePlayer.getState().rerollCharges).toBe(2)
    })

    it('decrements from 1 to 0', () => {
      usePlayer.setState({ rerollCharges: 1 })

      usePlayer.getState().consumeReroll()

      expect(usePlayer.getState().rerollCharges).toBe(0)
    })

    it('does not go below 0 (defensive)', () => {
      usePlayer.setState({ rerollCharges: 0 })

      usePlayer.getState().consumeReroll()

      expect(usePlayer.getState().rerollCharges).toBe(0)
    })

    it('handles multiple consumptions', () => {
      usePlayer.setState({ rerollCharges: 5 })

      usePlayer.getState().consumeReroll()
      usePlayer.getState().consumeReroll()
      usePlayer.getState().consumeReroll()

      expect(usePlayer.getState().rerollCharges).toBe(2)
    })
  })

  describe('consumeSkip action', () => {
    it('decrements skipCharges by 1', () => {
      usePlayer.setState({ skipCharges: 2 })

      usePlayer.getState().consumeSkip()

      expect(usePlayer.getState().skipCharges).toBe(1)
    })

    it('decrements from 1 to 0', () => {
      usePlayer.setState({ skipCharges: 1 })

      usePlayer.getState().consumeSkip()

      expect(usePlayer.getState().skipCharges).toBe(0)
    })

    it('does not go below 0 (defensive)', () => {
      usePlayer.setState({ skipCharges: 0 })

      usePlayer.getState().consumeSkip()

      expect(usePlayer.getState().skipCharges).toBe(0)
    })

    it('handles multiple consumptions', () => {
      usePlayer.setState({ skipCharges: 4 })

      usePlayer.getState().consumeSkip()
      usePlayer.getState().consumeSkip()

      expect(usePlayer.getState().skipCharges).toBe(2)
    })
  })

  describe('consumeBanish action', () => {
    it('decrements banishCharges by 1', () => {
      usePlayer.setState({ banishCharges: 3 })

      usePlayer.getState().consumeBanish()

      expect(usePlayer.getState().banishCharges).toBe(2)
    })

    it('decrements from 1 to 0', () => {
      usePlayer.setState({ banishCharges: 1 })

      usePlayer.getState().consumeBanish()

      expect(usePlayer.getState().banishCharges).toBe(0)
    })

    it('does not go below 0 (defensive)', () => {
      usePlayer.setState({ banishCharges: 0 })

      usePlayer.getState().consumeBanish()

      expect(usePlayer.getState().banishCharges).toBe(0)
    })

    it('handles multiple consumptions', () => {
      usePlayer.setState({ banishCharges: 5 })

      usePlayer.getState().consumeBanish()
      usePlayer.getState().consumeBanish()
      usePlayer.getState().consumeBanish()

      expect(usePlayer.getState().banishCharges).toBe(2)
    })
  })
})
