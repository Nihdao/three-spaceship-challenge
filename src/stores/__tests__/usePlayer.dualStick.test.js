import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — dual-stick controls (Story 21.1)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('Subtask 2.1: Add aimDirection field to usePlayer state', () => {
    it('should have aimDirection field initialized to null', () => {
      const state = usePlayer.getState()
      expect(state.aimDirection).toBe(null)
    })

    it('should update aimDirection when setAimDirection is called', () => {
      usePlayer.getState().setAimDirection([1, 0])

      expect(usePlayer.getState().aimDirection).toEqual([1, 0])
    })

    it('should clear aimDirection when set to null', () => {
      usePlayer.getState().setAimDirection([1, 0])
      expect(usePlayer.getState().aimDirection).toEqual([1, 0])

      usePlayer.getState().setAimDirection(null)
      expect(usePlayer.getState().aimDirection).toBe(null)
    })
  })

  describe('Subtask 2.2: Rotation uses aimDirection when mouse is active', () => {
    it('should rotate toward aimDirection when aimDirection is set', () => {
      // Set aim direction pointing right (positive X)
      usePlayer.getState().setAimDirection([1, 0])

      // Move forward (does not affect rotation in dual-stick mode)
      const input = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

      // Tick multiple times to allow rotation to converge
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(1/60, input)
      }

      const finalRotation = usePlayer.getState().rotation

      // Aiming right (X=1, Z=0) should result in rotation ≈ Math.PI/2
      expect(finalRotation).toBeCloseTo(Math.PI / 2, 1)
    })

    it('should rotate toward aimDirection even when moving in different direction', () => {
      // Aim left (negative X)
      usePlayer.getState().setAimDirection([-1, 0])

      // Move forward (positive Z direction)
      const input = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

      // Tick multiple times
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(1/60, input)
      }

      const finalRotation = usePlayer.getState().rotation

      // Aiming left (X=-1, Z=0) should result in rotation ≈ -Math.PI/2
      expect(finalRotation).toBeCloseTo(-Math.PI / 2, 1)
    })
  })

  describe('Subtask 2.3: Fallback to movement direction when aimDirection is null', () => {
    it('should rotate toward movement direction when aimDirection is null (legacy behavior)', () => {
      // No aim direction set (null)
      expect(usePlayer.getState().aimDirection).toBe(null)

      // Move right
      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: true, dash: false }

      // Tick multiple times
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(1/60, input)
      }

      const finalRotation = usePlayer.getState().rotation

      // Moving right should rotate toward right (≈ Math.PI/2)
      expect(finalRotation).toBeCloseTo(Math.PI / 2, 1)
    })

    it('should use movement direction when aimDirection is null even if mouse was previously active', () => {
      // Set aim direction, then clear it
      usePlayer.getState().setAimDirection([0, -1])
      usePlayer.getState().setAimDirection(null)

      // Move forward
      const input = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

      // Tick multiple times
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(1/60, input)
      }

      const finalRotation = usePlayer.getState().rotation

      // Moving forward (Z=-1) should rotate toward forward (≈ 0)
      expect(finalRotation).toBeCloseTo(0, 1)
    })
  })

  describe('Subtask 2.4: Preserve smooth rotation interpolation', () => {
    it('should smoothly interpolate rotation toward aimDirection over time', () => {
      // Start facing forward (rotation = 0)
      expect(usePlayer.getState().rotation).toBe(0)

      // Aim right (90 degrees)
      usePlayer.getState().setAimDirection([1, 0])

      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

      // After 1 tick, rotation should have moved but not reached target
      usePlayer.getState().tick(1/60, input)
      const rot1 = usePlayer.getState().rotation
      expect(rot1).toBeGreaterThan(0)
      expect(rot1).toBeLessThan(Math.PI / 2)

      // After many ticks, rotation should converge to target
      for (let i = 0; i < 200; i++) {
        usePlayer.getState().tick(1/60, input)
      }
      const rotFinal = usePlayer.getState().rotation
      expect(rotFinal).toBeCloseTo(Math.PI / 2, 1)
    })

    it('should reach 90-degree rotation within PLAYER_ROTATION_SPEED threshold', () => {
      // Start facing forward
      usePlayer.getState().setAimDirection([1, 0]) // Aim right (90 degrees)

      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

      // Tick until rotation converges (should take < 0.2s for 90 degrees per story AC)
      const maxTicks = Math.ceil(0.2 * 60) // 0.2 seconds at 60 FPS
      for (let i = 0; i < maxTicks; i++) {
        usePlayer.getState().tick(1/60, input)
      }

      const finalRotation = usePlayer.getState().rotation
      expect(finalRotation).toBeCloseTo(Math.PI / 2, 0.1) // Within 0.1 radians (~6 degrees)
    })
  })

  describe('Banking based on velocity direction change (not rotation)', () => {
    it('should NOT bank when only rotating to aim (stationary)', () => {
      // Aim right (will cause rotation)
      usePlayer.getState().setAimDirection([1, 0])

      const input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

      // Tick once to start rotation
      usePlayer.getState().tick(1/60, input)

      // Banking should be zero when not moving (velocity direction unchanged)
      const bankAngle = usePlayer.getState().bankAngle
      expect(Math.abs(bankAngle)).toBe(0)
    })

    it('should apply banking when movement direction changes', () => {
      // Move forward to build up velocity
      const inputForward = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false, dash: false }
      for (let i = 0; i < 30; i++) {
        usePlayer.getState().tick(1/60, inputForward)
      }

      // Change to moving right (sharp turn in velocity direction)
      const inputRight = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: true, dash: false }
      usePlayer.getState().tick(1/60, inputRight)

      // Banking should be active (non-zero) when velocity direction changes
      const bankAngle = usePlayer.getState().bankAngle
      expect(Math.abs(bankAngle)).toBeGreaterThan(0)
    })
  })

  describe('Regression: Movement still works independently of rotation', () => {
    it('should move in WASD direction regardless of aim direction', () => {
      // Aim right
      usePlayer.getState().setAimDirection([1, 0])

      // Move forward (negative Z in world)
      const input = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

      // Tick multiple times
      for (let i = 0; i < 60; i++) {
        usePlayer.getState().tick(1/60, input)
      }

      const pos = usePlayer.getState().position

      // Should have moved forward (negative Z) despite aiming right
      expect(pos[2]).toBeLessThan(0) // Moved forward (negative Z)
      expect(Math.abs(pos[0])).toBeLessThan(1) // Minimal X movement
    })
  })
})
