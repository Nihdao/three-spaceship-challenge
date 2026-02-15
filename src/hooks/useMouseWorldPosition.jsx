import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControlsStore } from '../stores/useControlsStore.jsx'

// Reusable objects to avoid allocations in the render loop
const _raycaster = new THREE.Raycaster()
const _ndcVec = new THREE.Vector2()
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const _intersection = new THREE.Vector3()

/**
 * Converts Normalized Device Coordinates (NDC) to world coordinates on the Y=0 plane.
 *
 * @param {number} ndcX - X coordinate in NDC space (-1 to 1)
 * @param {number} ndcY - Y coordinate in NDC space (-1 to 1)
 * @param {THREE.Camera} camera - Three.js camera
 * @returns {[number, number] | null} World position [x, z] or null if no intersection
 */
export function screenToWorldCoords(ndcX, ndcY, camera) {
  if (!camera) return null

  _ndcVec.set(ndcX, ndcY)
  _raycaster.setFromCamera(_ndcVec, camera)

  const intersects = _raycaster.ray.intersectPlane(_plane, _intersection)
  if (!intersects) return null

  return [_intersection.x, _intersection.z]
}

/**
 * React hook that tracks mouse position and converts it to world coordinates.
 * Stores NDC on pointermove, then recalculates world coords every frame
 * so aiming stays accurate even when the camera moves with the player.
 */
export function useMouseWorldPosition() {
  const { camera, gl } = useThree()

  useEffect(() => {
    if (!gl?.domElement || !camera) return

    const handlePointerMove = (event) => {
      const canvas = gl.domElement
      const rect = canvas.getBoundingClientRect()

      // Convert screen coordinates to NDC (-1 to 1)
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Store NDC coords - world coords will be recalculated every frame
      useControlsStore.getState().setMouseNDC([ndcX, ndcY])

      // Story 21.2: Also store screen pixel coordinates for crosshair display
      useControlsStore.getState().setMouseScreenPos(event.clientX, event.clientY)
    }

    gl.domElement.addEventListener('pointermove', handlePointerMove)

    return () => {
      gl.domElement?.removeEventListener('pointermove', handlePointerMove)
    }
  }, [camera, gl])

  // Recalculate world coordinates every frame from stored NDC
  // This ensures aim stays correct when camera moves with the player
  useFrame(() => {
    const { mouseNDC, mouseActive } = useControlsStore.getState()
    if (!mouseActive || !mouseNDC) return

    const worldPos = screenToWorldCoords(mouseNDC[0], mouseNDC[1], camera)
    useControlsStore.getState().setMouseWorldPos(worldPos)
  })
}
