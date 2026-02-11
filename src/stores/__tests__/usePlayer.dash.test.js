import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }

describe('usePlayer — dash mechanics (Story 5.1)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('startDash', () => {
    it('sets isDashing to true and dashTimer to DASH_DURATION', () => {
      usePlayer.getState().startDash()
      const state = usePlayer.getState()
      expect(state.isDashing).toBe(true)
      expect(state.dashTimer).toBe(GAME_CONFIG.DASH_DURATION)
    })

    it('sets isInvulnerable to true', () => {
      usePlayer.getState().startDash()
      expect(usePlayer.getState().isInvulnerable).toBe(true)
    })

    it('does nothing when already dashing', () => {
      usePlayer.getState().startDash()
      const timerAfterFirst = usePlayer.getState().dashTimer

      // Tick a little to partially consume dash
      usePlayer.getState().tick(0.1, noInput)
      const timerAfterTick = usePlayer.getState().dashTimer
      expect(timerAfterTick).toBeLessThan(timerAfterFirst)

      // Try to start again while dashing — should not reset timer
      usePlayer.getState().startDash()
      expect(usePlayer.getState().dashTimer).toBe(timerAfterTick)
    })

    it('does nothing when cooldown is active', () => {
      // Start and complete a dash to trigger cooldown
      usePlayer.getState().startDash()
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + 0.01, noInput)
      expect(usePlayer.getState().isDashing).toBe(false)
      expect(usePlayer.getState().dashCooldownTimer).toBeGreaterThan(0)

      // Attempt another dash during cooldown
      usePlayer.getState().startDash()
      expect(usePlayer.getState().isDashing).toBe(false)
    })
  })

  describe('dash timer decay in tick', () => {
    it('decrements dashTimer by delta during dash', () => {
      usePlayer.getState().startDash()
      usePlayer.getState().tick(0.1, noInput)
      expect(usePlayer.getState().dashTimer).toBeCloseTo(GAME_CONFIG.DASH_DURATION - 0.1, 5)
    })

    it('transitions from dashing to cooldown when dashTimer reaches 0', () => {
      usePlayer.getState().startDash()
      const overshoot = 0.01
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + overshoot, noInput)

      const state = usePlayer.getState()
      expect(state.isDashing).toBe(false)
      expect(state.dashTimer).toBe(0)
      // Leftover delta after dash ends is applied to cooldown
      expect(state.dashCooldownTimer).toBeCloseTo(GAME_CONFIG.DASH_COOLDOWN - overshoot, 5)
    })

    it('ends invulnerability when dash ends and no damage i-frames active', () => {
      usePlayer.getState().startDash()
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + 0.01, noInput)

      expect(usePlayer.getState().isInvulnerable).toBe(false)
    })

    it('preserves invulnerability when dash ends but damage i-frames still active', () => {
      // Take damage first to set damage invulnerability
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().isInvulnerable).toBe(true)

      // Start dash while damage i-frames active
      // Need to clear cooldown for startDash to work, but keep invulnerability
      // Actually, startDash checks isDashing and dashCooldownTimer, not invulnerability
      usePlayer.getState().startDash()
      expect(usePlayer.getState().isDashing).toBe(true)

      // Tick just enough to end dash (0.3s) but NOT enough to expire damage i-frames (0.5s)
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + 0.01, noInput)
      expect(usePlayer.getState().isDashing).toBe(false)

      // Invulnerability should persist from damage i-frames (invulnerabilityTimer still > 0)
      expect(usePlayer.getState().isInvulnerable).toBe(true)
    })
  })

  describe('dash cooldown timer in tick', () => {
    it('decrements dashCooldownTimer when not dashing', () => {
      // Trigger and complete a dash
      usePlayer.getState().startDash()
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + 0.01, noInput)
      const cooldownBefore = usePlayer.getState().dashCooldownTimer

      usePlayer.getState().tick(1.0, noInput)
      expect(usePlayer.getState().dashCooldownTimer).toBeCloseTo(cooldownBefore - 1.0, 5)
    })

    it('clamps dashCooldownTimer to 0', () => {
      usePlayer.getState().startDash()
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + 0.01, noInput)

      // Tick way past cooldown
      usePlayer.getState().tick(10.0, noInput)
      expect(usePlayer.getState().dashCooldownTimer).toBe(0)
    })

    it('allows new dash after cooldown expires', () => {
      usePlayer.getState().startDash()
      // Complete dash + full cooldown
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + GAME_CONFIG.DASH_COOLDOWN + 0.1, noInput)
      expect(usePlayer.getState().dashCooldownTimer).toBe(0)

      usePlayer.getState().startDash()
      expect(usePlayer.getState().isDashing).toBe(true)
    })
  })

  describe('damage blocked during dash', () => {
    it('takeDamage does nothing during dash (invulnerable)', () => {
      usePlayer.getState().startDash()
      usePlayer.getState().takeDamage(50)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    })
  })

  describe('reset', () => {
    it('clears all dash state', () => {
      usePlayer.getState().startDash()
      usePlayer.getState().tick(GAME_CONFIG.DASH_DURATION + 0.01, noInput)

      usePlayer.getState().reset()
      const state = usePlayer.getState()
      expect(state.isDashing).toBe(false)
      expect(state.dashTimer).toBe(0)
      expect(state.dashCooldownTimer).toBe(0)
    })
  })
})
