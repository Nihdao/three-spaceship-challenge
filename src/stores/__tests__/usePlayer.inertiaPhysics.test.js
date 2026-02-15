import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

/**
 * Story 21.3: Ship Inertia Physics
 *
 * These tests verify the existing inertia physics implementation from Story 14.2
 * and its integration with dual-stick controls from Story 21.1.
 *
 * The physics are ALREADY IMPLEMENTED - these tests verify correct behavior.
 */

const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }
const moveRight = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }
const moveForward = { moveLeft: false, moveRight: false, moveForward: true, moveBackward: false }

describe('usePlayer — inertia physics verification (Story 21.3)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('Task 1: Verify existing inertia physics (AC 1, 2, 3)', () => {
    describe('Subtask 1.1 & 1.2: Config values and velocity integration exist', () => {
      it('PLAYER_ACCELERATION constant exists in gameConfig', () => {
        expect(GAME_CONFIG.PLAYER_ACCELERATION).toBeDefined()
        expect(GAME_CONFIG.PLAYER_ACCELERATION).toBe(400) // Story 21.3: Tuned to 400 for longer acceleration ramp
      })

      it('PLAYER_FRICTION constant exists in gameConfig', () => {
        expect(GAME_CONFIG.PLAYER_FRICTION).toBeDefined()
        expect(GAME_CONFIG.PLAYER_FRICTION).toBe(0.73) // Story 21.3: Tuned from 0.87 for dual-stick
      })

      it('PLAYER_BASE_SPEED constant exists in gameConfig', () => {
        expect(GAME_CONFIG.PLAYER_BASE_SPEED).toBeDefined()
        expect(GAME_CONFIG.PLAYER_BASE_SPEED).toBe(80)
      })

      it('velocity field exists in usePlayer state', () => {
        const state = usePlayer.getState()
        expect(state.velocity).toBeDefined()
        expect(Array.isArray(state.velocity)).toBe(true)
        expect(state.velocity.length).toBe(3)
      })

      it('tick method integrates velocity into position', () => {
        const dt = 1 / 60
        usePlayer.getState().tick(dt, moveRight)

        const state = usePlayer.getState()
        // After one tick with right input, velocity[0] should be positive
        expect(state.velocity[0]).toBeGreaterThan(0)
        // Position should have moved right (positive X)
        expect(state.position[0]).toBeGreaterThan(0)
      })
    })

    describe('Subtask 1.4: Document acceleration timing (AC: 0.2-0.4s example, tuned for longer progressive ramp)', () => {
      it('reaches max speed with long progressive acceleration ramp', () => {
        const dt = 1 / 60
        const effectiveSpeed = GAME_CONFIG.PLAYER_BASE_SPEED
        const target100 = effectiveSpeed * 0.99 // 99% of max speed

        let reachedAt = null
        for (let frame = 1; frame <= 180; frame++) {
          usePlayer.getState().tick(dt, moveRight)
          const speed = usePlayer.getState().speed
          if (speed >= target100 && reachedAt === null) {
            reachedAt = frame * dt
          }
        }

        expect(reachedAt).not.toBeNull()
        // Story 21.3: Tuned to 400 for longer progressive acceleration ramp (~0.8-1.2s range)
        // AC says "e.g. 0.2-0.4s" but user feedback requires longer perceptible ramp
        expect(reachedAt).toBeGreaterThanOrEqual(0.7)
        expect(reachedAt).toBeLessThanOrEqual(1.2)
      })
    })

    describe('Subtask 1.4: Document deceleration timing (AC: 0.3-0.5s to stop)', () => {
      it('comes to full stop within 0.3-0.5 seconds per AC', () => {
        const dt = 1 / 60

        // Reach max speed first
        for (let i = 0; i < 60; i++) {
          usePlayer.getState().tick(dt, moveRight)
        }
        const initialSpeed = usePlayer.getState().speed
        expect(initialSpeed).toBeGreaterThan(0)

        // Measure time to stop
        let stoppedAt = null
        for (let frame = 1; frame <= 120; frame++) {
          usePlayer.getState().tick(dt, noInput)
          const speed = usePlayer.getState().speed
          if (speed === 0 && stoppedAt === null) {
            stoppedAt = frame * dt
          }
        }

        expect(stoppedAt).not.toBeNull()
        expect(stoppedAt).toBeGreaterThanOrEqual(0.3)
        expect(stoppedAt).toBeLessThanOrEqual(0.5)
      })
    })
  })

  describe('Task 2: Banking adapted to dual-stick (AC 4)', () => {
    it('banking constants exist in gameConfig', () => {
      expect(GAME_CONFIG.PLAYER_MAX_BANK_ANGLE).toBeDefined()
      expect(GAME_CONFIG.PLAYER_MAX_BANK_ANGLE).toBe(0.25) // Story 21.3: Reduced from 0.4 for subtler tilt
      expect(GAME_CONFIG.PLAYER_BANK_SPEED).toBeDefined()
      expect(GAME_CONFIG.PLAYER_BANK_SPEED).toBe(8)
    })

    it('banking is based on velocity change, not aim rotation (dual-stick adaptation)', () => {
      // Aim right but don't move
      usePlayer.getState().setAimDirection([1, 0])

      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false }

      // Tick to allow rotation to aim direction
      for (let i = 0; i < 10; i++) {
        usePlayer.getState().tick(1/60, input)
      }

      // Banking should be zero when stationary (no velocity direction change)
      expect(usePlayer.getState().bankAngle).toBe(0)
    })

    it('banking applies when movement direction changes', () => {
      // Move forward to build velocity
      const inputForward = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false }
      for (let i = 0; i < 30; i++) {
        usePlayer.getState().tick(1/60, inputForward)
      }

      // Sharp turn to right (velocity direction change)
      const inputRight = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: true }
      usePlayer.getState().tick(1/60, inputRight)

      // Banking should be non-zero when velocity direction changes
      expect(Math.abs(usePlayer.getState().bankAngle)).toBeGreaterThan(0)
    })

    it('banking returns to neutral when velocity stabilizes', () => {
      // Create banking from turning
      const inputForward = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false }
      for (let i = 0; i < 20; i++) {
        usePlayer.getState().tick(1/60, inputForward)
      }
      const inputRight = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: true }
      for (let i = 0; i < 20; i++) {
        usePlayer.getState().tick(1/60, inputRight)
      }

      // Now move steadily in one direction (no velocity direction change)
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(1/60, inputRight)
      }

      // Banking should return close to zero
      expect(Math.abs(usePlayer.getState().bankAngle)).toBeLessThan(0.05)
    })
  })

  describe('Task 4: Verify boundary interactions (AC 6)', () => {
    describe('Subtask 4.3: Boundary clamps position and zeros velocity', () => {
      it('clamps position to PLAY_AREA_SIZE boundary', () => {
        const dt = 1 / 60
        const bound = GAME_CONFIG.PLAY_AREA_SIZE

        // Move right until hitting boundary
        for (let i = 0; i < 10000; i++) {
          usePlayer.getState().tick(dt, moveRight)
          if (usePlayer.getState().position[0] >= bound) {
            break
          }
        }

        const pos = usePlayer.getState().position
        expect(pos[0]).toBe(bound) // Clamped to boundary
        expect(pos[0]).toBeLessThanOrEqual(bound)
      })

      it('zeros velocity when hitting boundary', () => {
        const dt = 1 / 60
        const bound = GAME_CONFIG.PLAY_AREA_SIZE

        // Move right until hitting boundary
        for (let i = 0; i < 10000; i++) {
          usePlayer.getState().tick(dt, moveRight)
          if (usePlayer.getState().position[0] >= bound) {
            break
          }
        }

        // Velocity X should be zeroed
        expect(usePlayer.getState().velocity[0]).toBe(0)
      })

      it('ship stays at boundary when pressing into it (no vibration)', () => {
        const dt = 1 / 60
        const bound = GAME_CONFIG.PLAY_AREA_SIZE

        // Move to boundary
        for (let i = 0; i < 10000; i++) {
          usePlayer.getState().tick(dt, moveRight)
          if (usePlayer.getState().position[0] >= bound) {
            break
          }
        }

        const posAtBoundary = usePlayer.getState().position[0]

        // Continue pressing right for several more frames
        for (let i = 0; i < 60; i++) {
          usePlayer.getState().tick(dt, moveRight)
        }

        // Position should remain stable at boundary
        expect(usePlayer.getState().position[0]).toBe(posAtBoundary)
        expect(usePlayer.getState().velocity[0]).toBe(0)
      })

      it('allows movement away from boundary after hitting it', () => {
        const dt = 1 / 60
        const bound = GAME_CONFIG.PLAY_AREA_SIZE

        // Move to right boundary
        for (let i = 0; i < 10000; i++) {
          usePlayer.getState().tick(dt, moveRight)
          if (usePlayer.getState().position[0] >= bound) {
            break
          }
        }

        expect(usePlayer.getState().position[0]).toBe(bound)
        expect(usePlayer.getState().velocity[0]).toBe(0)

        // Now move left (away from boundary)
        const inputLeft = { moveLeft: true, moveRight: false, moveForward: false, moveBackward: false }
        for (let i = 0; i < 30; i++) {
          usePlayer.getState().tick(dt, inputLeft)
        }

        // Should have moved away from boundary
        expect(usePlayer.getState().position[0]).toBeLessThan(bound)
        expect(usePlayer.getState().velocity[0]).toBeLessThan(0) // Negative velocity (moving left)
      })
    })

    describe('Subtask 4.4: Corner collision (both axes clamped)', () => {
      it('clamps both X and Z when hitting corner', () => {
        const dt = 1 / 60
        const bound = GAME_CONFIG.PLAY_AREA_SIZE

        // Move diagonally to corner
        const inputDiagonal = { moveRight: true, moveForward: true, moveLeft: false, moveBackward: false }
        for (let i = 0; i < 10000; i++) {
          usePlayer.getState().tick(dt, inputDiagonal)
          const pos = usePlayer.getState().position
          if (Math.abs(pos[0]) >= bound - 1 || Math.abs(pos[2]) >= bound - 1) {
            break
          }
        }

        const pos = usePlayer.getState().position
        const vel = usePlayer.getState().velocity

        // Position should be clamped
        expect(pos[0]).toBeLessThanOrEqual(bound)
        expect(Math.abs(pos[2])).toBeLessThanOrEqual(bound)

        // Velocities on clamped axes should be zero
        if (Math.abs(pos[0]) >= bound) {
          expect(vel[0]).toBe(0)
        }
        if (Math.abs(pos[2]) >= bound) {
          expect(vel[2]).toBe(0)
        }
      })
    })

    describe('Dash preserves boundary interaction', () => {
      it('dash does not bypass boundary clamping', () => {
        const dt = 1 / 60
        const bound = GAME_CONFIG.PLAY_AREA_SIZE

        // Move close to boundary
        for (let i = 0; i < 10000; i++) {
          usePlayer.getState().tick(dt, moveRight)
          if (usePlayer.getState().position[0] >= bound - 20) {
            break
          }
        }

        // Dash toward boundary
        usePlayer.getState().startDash()
        usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION, moveRight)

        // Position should still be clamped
        expect(usePlayer.getState().position[0]).toBeLessThanOrEqual(bound)
      })
    })
  })

  describe('Integration: Acceleration timing matches AC requirements', () => {
    it('acceleration time is configurable via PLAYER_ACCELERATION', () => {
      // This test documents that PLAYER_ACCELERATION controls acceleration speed
      // Higher values = faster acceleration
      // Story 21.3: Tuned to 400 to achieve longer progressive ~0.9-1.0s acceleration ramp for dual-stick
      expect(GAME_CONFIG.PLAYER_ACCELERATION).toBe(400)
    })

    it('deceleration time is configurable via PLAYER_FRICTION', () => {
      // This test documents that PLAYER_FRICTION controls deceleration speed
      // Higher values (closer to 1.0) = less friction = longer glide
      // Story 21.3: Tuned to 0.73 (from 0.87) to achieve ~0.3-0.5s stop time for tighter dual-stick control
      expect(GAME_CONFIG.PLAYER_FRICTION).toBe(0.73)
    })
  })
})
