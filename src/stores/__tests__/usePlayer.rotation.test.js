import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — rotation responsiveness (Story 2.8)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('90° turn completes in < 0.2s', () => {
    it('reaches 90% of target yaw within 0.2s when turning right', () => {
      // Start facing forward (rotation = 0, which is -Z direction)
      // Press right to target yaw = Math.atan2(1, 0) = π/2
      const targetYaw = Math.PI / 2
      const dt = 1 / 60 // 60fps frame time
      const maxFrames = Math.ceil(0.2 / dt) // 12 frames = 0.2s at 60fps

      const rightInput = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }

      for (let i = 0; i < maxFrames; i++) {
        usePlayer.getState().tick(dt, rightInput)
      }

      const rotation = usePlayer.getState().rotation
      const reached = Math.abs(rotation) / Math.abs(targetYaw)
      expect(reached).toBeGreaterThanOrEqual(0.9)
    })

    it('reaches 90% of target yaw within 0.2s when turning left', () => {
      const targetYaw = -Math.PI / 2
      const dt = 1 / 60
      const maxFrames = Math.ceil(0.2 / dt)

      const leftInput = { moveLeft: true, moveRight: false, moveForward: false, moveBackward: false }

      for (let i = 0; i < maxFrames; i++) {
        usePlayer.getState().tick(dt, leftInput)
      }

      const rotation = usePlayer.getState().rotation
      const reached = Math.abs(rotation) / Math.abs(targetYaw)
      expect(reached).toBeGreaterThanOrEqual(0.9)
    })

    it('reaches 90% of target yaw within 0.2s at 30fps', () => {
      const targetYaw = Math.PI / 2
      const dt = 1 / 30
      const maxFrames = Math.ceil(0.2 / dt) // 6 frames = 0.2s at 30fps

      const rightInput = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }

      for (let i = 0; i < maxFrames; i++) {
        usePlayer.getState().tick(dt, rightInput)
      }

      const rotation = usePlayer.getState().rotation
      const reached = Math.abs(rotation) / Math.abs(targetYaw)
      expect(reached).toBeGreaterThanOrEqual(0.9)
    })
  })

  describe('smooth lerp preserved (no instant snapping)', () => {
    it('does not reach target yaw after a single frame', () => {
      const dt = 1 / 60
      const rightInput = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }

      usePlayer.getState().tick(dt, rightInput)

      const rotation = usePlayer.getState().rotation
      const targetYaw = Math.PI / 2
      // After one frame, should NOT be at the target — lerp should be gradual
      expect(Math.abs(rotation)).toBeLessThan(Math.abs(targetYaw) * 0.9)
    })

    it('rotation progresses gradually over multiple frames', () => {
      const dt = 1 / 60
      const rightInput = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }
      const rotations = []

      for (let i = 0; i < 6; i++) {
        usePlayer.getState().tick(dt, rightInput)
        rotations.push(usePlayer.getState().rotation)
      }

      // Each frame should get closer to target — monotonically increasing for right turn
      for (let i = 1; i < rotations.length; i++) {
        expect(rotations[i]).toBeGreaterThan(rotations[i - 1])
      }
    })
  })

  describe('banking animation preserved', () => {
    it('produces non-zero bank angle during rotation', () => {
      const dt = 1 / 60
      const rightInput = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }

      // Several frames of turning should produce bank
      for (let i = 0; i < 5; i++) {
        usePlayer.getState().tick(dt, rightInput)
      }

      const bankAngle = usePlayer.getState().bankAngle
      expect(Math.abs(bankAngle)).toBeGreaterThan(0)
    })

    it('bank angle stays within PLAYER_MAX_BANK_ANGLE', () => {
      const dt = 1 / 60
      const rightInput = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }

      // Many frames of turning
      for (let i = 0; i < 30; i++) {
        usePlayer.getState().tick(dt, rightInput)
      }

      const bankAngle = Math.abs(usePlayer.getState().bankAngle)
      expect(bankAngle).toBeLessThanOrEqual(GAME_CONFIG.PLAYER_MAX_BANK_ANGLE + 0.01)
    })
  })

  describe('config value', () => {
    it('PLAYER_ROTATION_SPEED is configured for snappy rotation', () => {
      // Must be high enough for < 0.2s 90° turn
      expect(GAME_CONFIG.PLAYER_ROTATION_SPEED).toBeGreaterThanOrEqual(15)
    })
  })
})
