import { describe, it, expect, beforeEach } from 'vitest'
import { useControlsStore } from '../useControlsStore.jsx'

describe('useControlsStore - mouseScreenPos (Story 21.2)', () => {
  beforeEach(() => {
    useControlsStore.getState().resetControls()
  })

  describe('Task 2: Mouse screen position tracking', () => {
    it('Subtask 2.1: should have mouseScreenPos field initialized', () => {
      const state = useControlsStore.getState()
      expect(state.mouseScreenPos).toBeDefined()
      expect(Array.isArray(state.mouseScreenPos)).toBe(true)
    })

    it('Subtask 2.1: should initialize mouseScreenPos to center of typical screen', () => {
      const state = useControlsStore.getState()
      // Default should be reasonable center position
      expect(state.mouseScreenPos[0]).toBeGreaterThan(0)
      expect(state.mouseScreenPos[1]).toBeGreaterThan(0)
    })

    it('Subtask 2.2: should have setMouseScreenPos action', () => {
      const state = useControlsStore.getState()
      expect(state.setMouseScreenPos).toBeDefined()
      expect(typeof state.setMouseScreenPos).toBe('function')
    })

    it('Subtask 2.2: should update mouseScreenPos when setMouseScreenPos is called', () => {
      const { setMouseScreenPos } = useControlsStore.getState()
      setMouseScreenPos(500, 300)

      const state = useControlsStore.getState()
      expect(state.mouseScreenPos[0]).toBe(500)
      expect(state.mouseScreenPos[1]).toBe(300)
    })

    it('should handle multiple updates to mouseScreenPos', () => {
      const { setMouseScreenPos } = useControlsStore.getState()

      setMouseScreenPos(100, 200)
      expect(useControlsStore.getState().mouseScreenPos).toEqual([100, 200])

      setMouseScreenPos(400, 500)
      expect(useControlsStore.getState().mouseScreenPos).toEqual([400, 500])

      setMouseScreenPos(800, 600)
      expect(useControlsStore.getState().mouseScreenPos).toEqual([800, 600])
    })

    it('should reset mouseScreenPos when resetControls is called', () => {
      const { setMouseScreenPos, resetControls } = useControlsStore.getState()

      setMouseScreenPos(999, 888)
      expect(useControlsStore.getState().mouseScreenPos).toEqual([999, 888])

      resetControls()
      const state = useControlsStore.getState()
      // Should reset to default center position
      expect(state.mouseScreenPos).toBeDefined()
      expect(Array.isArray(state.mouseScreenPos)).toBe(true)
    })

    it('should work independently of mouseWorldPos and mouseNDC', () => {
      const { setMouseScreenPos, setMouseNDC, setMouseWorldPos } = useControlsStore.getState()

      setMouseScreenPos(300, 400)
      setMouseNDC([0.5, 0.5])
      setMouseWorldPos([10, 0, 10])

      const state = useControlsStore.getState()
      expect(state.mouseScreenPos).toEqual([300, 400])
      expect(state.mouseNDC).toEqual([0.5, 0.5])
      expect(state.mouseWorldPos).toEqual([10, 0, 10])
    })
  })
})
