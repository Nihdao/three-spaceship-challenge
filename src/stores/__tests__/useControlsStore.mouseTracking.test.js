import { describe, it, expect, beforeEach } from 'vitest'
import { useControlsStore } from '../useControlsStore.jsx'

describe('useControlsStore — mouse tracking (Story 21.1)', () => {
  beforeEach(() => {
    useControlsStore.getState().resetControls()
  })

  describe('Subtask 1.3: Store mouse world position in useControlsStore', () => {
    it('should have mouseWorldPos field initialized to null', () => {
      expect(useControlsStore.getState().mouseWorldPos).toBe(null)
    })

    it('should have mouseActive field initialized to false', () => {
      expect(useControlsStore.getState().mouseActive).toBe(false)
    })

    it('should have mouseNDC field initialized to null', () => {
      expect(useControlsStore.getState().mouseNDC).toBe(null)
    })

    it('should update mouseWorldPos when setMouseWorldPos is called', () => {
      useControlsStore.getState().setMouseWorldPos([10, 20])
      expect(useControlsStore.getState().mouseWorldPos).toEqual([10, 20])
    })

    it('should set mouseActive to true when mouseNDC is set', () => {
      useControlsStore.getState().setMouseNDC([0.5, 0.5])
      expect(useControlsStore.getState().mouseActive).toBe(true)
    })

    it('should reset all mouse state when resetControls is called', () => {
      useControlsStore.getState().setMouseNDC([0.5, 0.5])
      useControlsStore.getState().setMouseWorldPos([10, 20])

      expect(useControlsStore.getState().mouseWorldPos).toEqual([10, 20])
      expect(useControlsStore.getState().mouseActive).toBe(true)
      expect(useControlsStore.getState().mouseNDC).toEqual([0.5, 0.5])

      useControlsStore.getState().resetControls()

      expect(useControlsStore.getState().mouseWorldPos).toBe(null)
      expect(useControlsStore.getState().mouseNDC).toBe(null)
      expect(useControlsStore.getState().mouseActive).toBe(false)
    })
  })

  describe('Subtask 1.4: Handle edge cases (initial mouse position)', () => {
    it('should not activate mouse mode until first valid NDC is set', () => {
      expect(useControlsStore.getState().mouseActive).toBe(false)

      // Setting null NDC should not activate mouse
      useControlsStore.getState().setMouseNDC(null)
      expect(useControlsStore.getState().mouseActive).toBe(false)

      // Setting valid NDC activates mouse
      useControlsStore.getState().setMouseNDC([0.5, 0.5])
      expect(useControlsStore.getState().mouseActive).toBe(true)
    })

    it('should keep mouseActive true once activated (session-persistent)', () => {
      useControlsStore.getState().setMouseNDC([0.5, 0.5])
      expect(useControlsStore.getState().mouseActive).toBe(true)

      // Setting to null should keep mouseActive true
      useControlsStore.getState().setMouseNDC(null)
      expect(useControlsStore.getState().mouseActive).toBe(true)
    })
  })

  describe('Regression: keyboard controls unchanged', () => {
    it('should still handle keyboard controls correctly', () => {
      useControlsStore.getState().setControl('moveForward', true)
      expect(useControlsStore.getState().moveForward).toBe(true)

      useControlsStore.getState().setControl('dash', true)
      expect(useControlsStore.getState().dash).toBe(true)

      // Mouse tracking should not interfere with keyboard
      useControlsStore.getState().setMouseNDC([0.5, 0.5])
      expect(useControlsStore.getState().moveForward).toBe(true)
      expect(useControlsStore.getState().dash).toBe(true)
    })
  })
})
