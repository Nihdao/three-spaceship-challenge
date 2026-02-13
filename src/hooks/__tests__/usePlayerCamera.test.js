import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import { computeCameraFrame } from '../usePlayerCamera.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayerCamera — top-down mode (Story 14.1)', () => {
  let camera
  let smoothedPosition

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera()
    smoothedPosition = new THREE.Vector3(0, 120, 0)
  })

  describe('Subtask 1.1: No rotation tied to player facing', () => {
    it('camera rotation stays fixed regardless of player state', () => {
      computeCameraFrame(camera, smoothedPosition, { position: [10, 0, 20], cameraShakeTimer: 0, cameraShakeIntensity: 0 }, 1 / 60, 120, 20, 0)
      expect(camera.rotation.x).toBeCloseTo(-Math.PI / 2)
      expect(camera.rotation.y).toBeCloseTo(0)
      expect(camera.rotation.z).toBeCloseTo(0)
    })
  })

  describe('Subtask 1.2: Camera looks straight down at player XZ', () => {
    it('camera is positioned directly above player (no Z offset)', () => {
      for (let i = 0; i < 300; i++) {
        computeCameraFrame(camera, smoothedPosition, { position: [50, 0, -30], cameraShakeTimer: 0, cameraShakeIntensity: 0 }, 1 / 60, 60, 20, 0)
      }
      expect(camera.position.x).toBeCloseTo(50, 1)
      expect(camera.position.y).toBeCloseTo(60, 1)
      expect(camera.position.z).toBeCloseTo(-30, 1)
    })
  })

  describe('Subtask 1.3: Smooth XZ following with configurable height', () => {
    it('camera smoothly interpolates toward player position', () => {
      computeCameraFrame(camera, smoothedPosition, { position: [100, 0, 100], cameraShakeTimer: 0, cameraShakeIntensity: 0 }, 1 / 60, 80, 5, 0)

      // After one frame, camera should have moved toward player but not reached it
      expect(camera.position.x).toBeGreaterThan(0)
      expect(camera.position.x).toBeLessThan(100)
      expect(camera.position.z).toBeGreaterThan(0)
      expect(camera.position.z).toBeLessThan(100)
      // Y interpolates toward offsetY (80) from initial (120)
      expect(camera.position.y).toBeGreaterThanOrEqual(80)
      expect(camera.position.y).toBeLessThan(120)
    })
  })

  describe('Subtask 1.4: No velocity-based look-ahead', () => {
    it('camera position is unaffected by velocity in player state', () => {
      // computeCameraFrame destructures only position, cameraShakeTimer, cameraShakeIntensity
      // — velocity is ignored by design. This test confirms extra fields don't leak in.
      for (let i = 0; i < 300; i++) {
        computeCameraFrame(camera, smoothedPosition, { position: [0, 0, 0], velocity: [100, 0, 100], cameraShakeTimer: 0, cameraShakeIntensity: 0 }, 1 / 60, 120, 20, 0)
      }
      expect(camera.position.x).toBeCloseTo(0, 1)
      expect(camera.position.y).toBeCloseTo(120, 1)
      expect(camera.position.z).toBeCloseTo(0, 1)
    })
  })

  describe('Camera shake still works', () => {
    it('camera shake displaces position when active', () => {
      computeCameraFrame(camera, smoothedPosition, { position: [0, 0, 0], cameraShakeTimer: 0.1, cameraShakeIntensity: 1.5 }, 1 / 60, 120, 20, 5.0)

      const distFromCenter = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2)
      expect(distFromCenter).toBeGreaterThan(0)
    })

    it('camera rotation stays fixed during shake (M2)', () => {
      computeCameraFrame(camera, smoothedPosition, { position: [0, 0, 0], cameraShakeTimer: GAME_CONFIG.CAMERA_SHAKE_DURATION, cameraShakeIntensity: 2.0 }, 1 / 60, 120, 20, 10.0)

      expect(camera.rotation.x).toBeCloseTo(-Math.PI / 2)
      expect(camera.rotation.y).toBeCloseTo(0)
      expect(camera.rotation.z).toBeCloseTo(0)
    })
  })
})
