import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'

const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }
const moveRight = { moveLeft: false, moveRight: true, moveForward: false, moveBackward: false }

describe('usePlayer — conditional set() & stable references (Story 41.2)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    // Normalize to origin for deterministic tests
    usePlayer.setState({ position: [0, 0, 0], velocity: [0, 0, 0] })
  })

  describe('AC 1: set() skipped when nothing changes', () => {
    it('does not emit Zustand notification when ship is stationary with no active timers', () => {
      // Ensure all timers are 0 and ship is at rest
      usePlayer.setState({
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        speed: 0,
        damageFlashTimer: 0,
        cameraShakeTimer: 0,
        cameraShakeIntensity: 0,
        invulnerabilityTimer: 0,
        contactDamageCooldown: 0,
        isDashing: false,
        dashTimer: 0,
        dashCooldownTimer: 0,
        bankAngle: 0,
        rotation: 0,
        aimDirection: null,
        _prevVelAngle: 0,
      })

      let updates = 0
      const unsub = usePlayer.subscribe(() => updates++)
      usePlayer.getState().tick(1 / 60, noInput)
      unsub()

      expect(updates).toBe(0)
    })
  })

  describe('AC 2: stable position/velocity references', () => {
    it('position array is mutated in-place (same reference after tick)', () => {
      const posBefore = usePlayer.getState().position
      usePlayer.getState().tick(1 / 60, moveRight)
      const posAfter = usePlayer.getState().position
      // Same array reference — no [px, 0, pz] allocation
      expect(posAfter).toBe(posBefore)
    })

    it('velocity array is mutated in-place (same reference after tick)', () => {
      const velBefore = usePlayer.getState().velocity
      usePlayer.getState().tick(1 / 60, moveRight)
      const velAfter = usePlayer.getState().velocity
      // Same array reference
      expect(velAfter).toBe(velBefore)
    })

    it('position values update correctly despite in-place mutation', () => {
      usePlayer.getState().tick(1 / 60, moveRight)
      const pos = usePlayer.getState().position
      // Should have moved right (positive X)
      expect(pos[0]).toBeGreaterThan(0)
      expect(pos[1]).toBe(0)
    })

    it('set() is called with changed fields only when position changes', () => {
      let updates = 0
      const unsub = usePlayer.subscribe(() => updates++)
      // Moving tick — should call set() because position changes
      usePlayer.getState().tick(1 / 60, moveRight)
      unsub()
      expect(updates).toBe(1)
    })
  })
})
