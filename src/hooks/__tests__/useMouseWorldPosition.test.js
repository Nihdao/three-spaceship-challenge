import { describe, it, expect, beforeEach } from 'vitest'
import { useControlsStore } from '../../stores/useControlsStore.jsx'
import { screenToWorldCoords } from '../useMouseWorldPosition.jsx'
import * as THREE from 'three'

describe('useMouseWorldPosition — mouse raycasting (Story 21.1)', () => {
  beforeEach(() => {
    useControlsStore.getState().resetControls()
  })

  describe('Subtask 1.2: Convert screen to world coordinates (raycasting)', () => {
    it('should convert NDC coordinates to world position at Y=0 plane', () => {
      // Create a simple perspective camera looking down at Y=0
      const camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000)
      camera.position.set(0, 60, 0)
      camera.lookAt(0, 0, 0)
      camera.updateMatrixWorld()

      // NDC at screen center (0, 0) should raycast to world (0, 0) at Y=0
      const worldPos = screenToWorldCoords(0, 0, camera)

      expect(worldPos).not.toBeNull()
      expect(worldPos[0]).toBeCloseTo(0, 1)
      expect(worldPos[1]).toBeCloseTo(0, 1)
    })

    it('should return null if ray does not intersect Y=0 plane', () => {
      // Camera looking away from Y=0 plane (looking up)
      const camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000)
      camera.position.set(0, 60, 0)
      camera.lookAt(0, 120, 0) // Looking up, away from Y=0
      camera.updateMatrixWorld()

      const worldPos = screenToWorldCoords(0, 0, camera)

      // Ray going upward will not intersect Y=0 plane
      expect(worldPos).toBeNull()
    })

    it('should handle edge NDC coordinates correctly', () => {
      const camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000)
      camera.position.set(0, 60, 0)
      camera.lookAt(0, 0, 0)
      camera.updateMatrixWorld()

      // Top-right corner of screen (NDC: 1, 1)
      const topRight = screenToWorldCoords(1, 1, camera)
      expect(topRight).not.toBeNull()
      expect(topRight[0]).toBeGreaterThan(0) // Right side
      expect(topRight[1]).toBeLessThan(0)    // Top (negative Z in world)

      // Bottom-left corner (NDC: -1, -1)
      const bottomLeft = screenToWorldCoords(-1, -1, camera)
      expect(bottomLeft).not.toBeNull()
      expect(bottomLeft[0]).toBeLessThan(0)  // Left side
      expect(bottomLeft[1]).toBeGreaterThan(0) // Bottom (positive Z in world)
    })
  })

  describe('Subtask 1.4: Handle edge cases', () => {
    it('should return null if camera is null', () => {
      const worldPos = screenToWorldCoords(0, 0, null)
      expect(worldPos).toBeNull()
    })

    it('should return null if camera is undefined', () => {
      const worldPos = screenToWorldCoords(0, 0, undefined)
      expect(worldPos).toBeNull()
    })
  })
})
