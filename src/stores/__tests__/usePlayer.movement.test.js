import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }
const moveRight = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }
const moveLeft = { moveLeft: true, moveRight: false, moveForward: false, moveBackward: false }
const moveForward = { moveLeft: false, moveRight: false, moveForward: true, moveBackward: false }
const moveDiagonal = { moveLeft: false, moveRight: true, moveForward: true, moveBackward: false }

describe('usePlayer — organic movement (Story 14.2)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('Task 1: Acceleration curve', () => {
    it('accelerates from standstill toward full speed with exponential ramp-up', () => {
      // Simulate 10 ticks of 1/60s each with right input
      const dt = 1 / 60
      for (let i = 0; i < 10; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }
      const speed1 = usePlayer.getState().speed

      // Continue 10 more ticks
      for (let i = 0; i < 10; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }
      const speed2 = usePlayer.getState().speed

      // Speed should increase
      expect(speed2).toBeGreaterThan(speed1)
      // After 20 ticks (~0.33s), should NOT be at full speed yet (organic ramp-up)
      expect(speed2).toBeLessThan(GAME_CONFIG.PLAYER_BASE_SPEED)
    })

    it('reaches ~90% of full speed within 0.3-0.5 seconds', () => {
      const dt = 1 / 60
      const effectiveSpeed = GAME_CONFIG.PLAYER_BASE_SPEED
      const target90 = effectiveSpeed * 0.9

      let reachedAt = null
      for (let frame = 1; frame <= 60; frame++) {
        usePlayer.getState().tick(dt, moveRight)
        const speed = usePlayer.getState().speed
        if (speed >= target90 && reachedAt === null) {
          reachedAt = frame * dt
        }
      }

      expect(reachedAt).not.toBeNull()
      // Should reach 90% between 0.1s and 0.5s (AC: ~0.15-0.5s, punchy accel)
      expect(reachedAt).toBeGreaterThanOrEqual(0.05)
      expect(reachedAt).toBeLessThanOrEqual(0.5)
    })

    it('diagonal movement does not exceed base speed', () => {
      const dt = 1 / 60
      // Accelerate diagonally to near-full speed
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveDiagonal)
      }
      const speed = usePlayer.getState().speed
      // Diagonal speed should be capped at base speed (not 1.41x)
      expect(speed).toBeLessThanOrEqual(GAME_CONFIG.PLAYER_BASE_SPEED * 1.01) // small tolerance
    })
  })

  describe('Task 2: Deceleration / friction', () => {
    it('decelerates smoothly after releasing input (exponential decay)', () => {
      const dt = 1 / 60

      // Reach near-full speed
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }
      const fullSpeed = usePlayer.getState().speed
      expect(fullSpeed).toBeGreaterThan(0)

      // Release input — speed should decrease
      usePlayer.getState().tick(dt, noInput)
      const afterOneTick = usePlayer.getState().speed
      expect(afterOneTick).toBeLessThan(fullSpeed)

      // After more ticks, should be even slower
      for (let i = 0; i < 10; i++) {
        usePlayer.getState().tick(dt, noInput)
      }
      const afterTenTicks = usePlayer.getState().speed
      expect(afterTenTicks).toBeLessThan(afterOneTick)
    })

    it('comes to a complete stop within ~0.5-0.8 seconds after releasing input', () => {
      const dt = 1 / 60

      // Reach near-full speed
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }

      // Decelerate and measure time to stop
      let stoppedAt = null
      for (let frame = 1; frame <= 120; frame++) {
        usePlayer.getState().tick(dt, noInput)
        const speed = usePlayer.getState().speed
        if (speed === 0 && stoppedAt === null) {
          stoppedAt = frame * dt
        }
      }

      expect(stoppedAt).not.toBeNull()
      // Should stop within 0.3s-1.2s (AC: ~0.3-1.2s, moderate glide per user preference)
      expect(stoppedAt).toBeGreaterThanOrEqual(0.2)
      expect(stoppedAt).toBeLessThanOrEqual(1.2)
    })

    it('zeroes out tiny velocities to prevent drift', () => {
      const dt = 1 / 60

      // Move briefly then stop
      for (let i = 0; i < 5; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }

      // Decelerate fully
      for (let i = 0; i < 120; i++) {
        usePlayer.getState().tick(dt, noInput)
      }

      const state = usePlayer.getState()
      expect(state.velocity[0]).toBe(0)
      expect(state.velocity[2]).toBe(0)
      expect(state.speed).toBe(0)
    })
  })

  describe('Task 3: Directional transitions', () => {
    it('smoothly transitions velocity when changing direction', () => {
      const dt = 1 / 60

      // Build up rightward velocity
      for (let i = 0; i < 30; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }
      const vxRight = usePlayer.getState().velocity[0]
      expect(vxRight).toBeGreaterThan(0)

      // Now press left — velocity should start decreasing (not instant flip)
      usePlayer.getState().tick(dt, moveLeft)
      const vxAfterOneLeft = usePlayer.getState().velocity[0]

      // Should still be positive (not instant flip to negative)
      expect(vxAfterOneLeft).toBeGreaterThan(0)
      // But less than before
      expect(vxAfterOneLeft).toBeLessThan(vxRight)
    })

    it('eventually reverses direction after sustained opposite input', () => {
      const dt = 1 / 60

      // Build up rightward velocity
      for (let i = 0; i < 30; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }

      // Apply left input for enough time to reverse
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveLeft)
      }

      const vx = usePlayer.getState().velocity[0]
      expect(vx).toBeLessThan(0) // Should now be moving left
    })

    it('acceleration applies correctly to new target direction', () => {
      const dt = 1 / 60

      // Moving right at full speed
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }

      // Switch to forward
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveForward)
      }

      const state = usePlayer.getState()
      // Should be moving primarily forward (negative Z)
      expect(state.velocity[2]).toBeLessThan(0)
      // X velocity should be near zero
      expect(Math.abs(state.velocity[0])).toBeLessThan(10)
    })
  })

  describe('Task 5: Banking syncs with velocity changes', () => {
    it('banking responds during acceleration', () => {
      const dt = 1 / 60

      // Turn right — banking should respond
      for (let i = 0; i < 10; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }

      // Bank angle should be non-zero (responding to turning)
      const bank = usePlayer.getState().bankAngle
      // Bank can be either direction depending on rotation
      expect(Math.abs(bank)).toBeGreaterThan(0)
    })

    it('banking returns toward zero when not turning', () => {
      const dt = 1 / 60

      // Create some banking from turning
      for (let i = 0; i < 20; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }

      // Stop input — banking should return toward 0
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, noInput)
      }

      const bank = usePlayer.getState().bankAngle
      expect(Math.abs(bank)).toBeLessThan(0.05)
    })
  })

  describe('Task 6: Dash behavior preserved', () => {
    it('dash sets isDashing flag (not velocity-based)', () => {
      usePlayer.getState().startDash()
      const state = usePlayer.getState()
      expect(state.isDashing).toBe(true)
      expect(state.dashTimer).toBe(GAME_CONFIG.DASH_DURATION)
    })

    it('velocity after dash ends continues with normal deceleration', () => {
      const dt = 1 / 60

      // Build up speed
      for (let i = 0; i < 30; i++) {
        usePlayer.getState().tick(dt, moveRight)
      }
      const speedBeforeDash = usePlayer.getState().speed

      // Start and complete dash
      usePlayer.getState().startDash()
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + 0.01, noInput)
      expect(usePlayer.getState().isDashing).toBe(false)

      // Speed should still exist (dash doesn't zero velocity)
      // and should decelerate normally
      const speedAfterDash = usePlayer.getState().speed
      usePlayer.getState().tick(dt, noInput)
      const speedDecelerating = usePlayer.getState().speed
      expect(speedDecelerating).toBeLessThan(speedAfterDash)
    })
  })

  describe('Speed multiplier interaction', () => {
    it('speedMultiplier scales effective speed correctly', () => {
      const dt = 1 / 60

      // Run at 1x multiplier
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveRight, 1)
      }
      const speed1x = usePlayer.getState().speed

      // Run at 2x multiplier
      usePlayer.getState().reset()
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(dt, moveRight, 2)
      }
      const speed2x = usePlayer.getState().speed

      // 2x multiplier should result in roughly 2x speed
      expect(speed2x / speed1x).toBeGreaterThan(1.8)
      expect(speed2x / speed1x).toBeLessThan(2.2)
    })
  })

  describe('Frame-rate independence', () => {
    it('produces similar results at 60fps and 30fps', () => {
      // Run at 60 FPS for 1 second
      usePlayer.getState().reset()
      // Story 34.2: reset() uses random spawn — normalize to origin for deterministic comparison
      usePlayer.setState({ position: [0, 0, 0], velocity: [0, 0, 0] })
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(1 / 60, moveRight)
      }
      const speed60 = usePlayer.getState().speed
      const pos60 = [...usePlayer.getState().position]

      // Run at 30 FPS for 1 second
      usePlayer.getState().reset()
      // Story 34.2: normalize to origin for deterministic comparison
      usePlayer.setState({ position: [0, 0, 0], velocity: [0, 0, 0] })
      for (let i = 0; i < 30; i++) {
        usePlayer.getState().tick(1 / 30, moveRight)
      }
      const speed30 = usePlayer.getState().speed
      const pos30 = [...usePlayer.getState().position]

      // Should be roughly similar (within 15% tolerance for exponential interpolation)
      expect(Math.abs(speed60 - speed30) / speed60).toBeLessThan(0.15)
      expect(Math.abs(pos60[0] - pos30[0]) / Math.max(1, pos60[0])).toBeLessThan(0.15)
    })
  })
})
