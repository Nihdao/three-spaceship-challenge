import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'

describe('usePlayer — damage actions', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('takeDamage', () => {
    it('reduces currentHP by damage amount', () => {
      usePlayer.getState().takeDamage(25)
      expect(usePlayer.getState().currentHP).toBe(75)
    })

    it('clamps HP to 0 minimum (never negative)', () => {
      usePlayer.getState().takeDamage(150)
      expect(usePlayer.getState().currentHP).toBe(0)
    })

    it('sets lastDamageTime', () => {
      const before = Date.now()
      usePlayer.getState().takeDamage(10)
      const after = Date.now()
      const { lastDamageTime } = usePlayer.getState()
      expect(lastDamageTime).toBeGreaterThanOrEqual(before)
      expect(lastDamageTime).toBeLessThanOrEqual(after)
    })

    it('sets contactDamageCooldown when applying damage', () => {
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().contactDamageCooldown).toBeGreaterThan(0)
    })

    it('does not apply damage when contactDamageCooldown > 0', () => {
      usePlayer.getState().takeDamage(10) // sets cooldown
      expect(usePlayer.getState().currentHP).toBe(90)

      usePlayer.getState().takeDamage(10) // should be blocked by cooldown
      expect(usePlayer.getState().currentHP).toBe(90) // unchanged
    })

    it('applies damage when cooldown has expired (decremented by tick)', () => {
      usePlayer.getState().takeDamage(10) // sets cooldown ~0.5s
      expect(usePlayer.getState().currentHP).toBe(90)

      // Simulate enough time passing via tick to expire cooldown
      usePlayer.getState().tick(1.0, { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false })

      usePlayer.getState().takeDamage(10) // cooldown expired, should apply
      expect(usePlayer.getState().currentHP).toBe(80)
    })

    it('does not apply damage when isInvulnerable is true', () => {
      usePlayer.setState({ isInvulnerable: true })
      usePlayer.getState().takeDamage(50)
      expect(usePlayer.getState().currentHP).toBe(100) // unchanged
    })
  })

  describe('contactDamageCooldown in tick', () => {
    it('decrements contactDamageCooldown by delta each tick', () => {
      usePlayer.getState().takeDamage(10) // sets cooldown to 0.5
      const cooldownBefore = usePlayer.getState().contactDamageCooldown

      usePlayer.getState().tick(0.2, { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false })

      const cooldownAfter = usePlayer.getState().contactDamageCooldown
      expect(cooldownAfter).toBeCloseTo(cooldownBefore - 0.2, 5)
    })

    it('does not go below 0', () => {
      usePlayer.getState().takeDamage(10)

      // Tick with a large delta to overshoot cooldown
      usePlayer.getState().tick(2.0, { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false })

      expect(usePlayer.getState().contactDamageCooldown).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears damage-related state', () => {
      usePlayer.getState().takeDamage(30)
      usePlayer.getState().reset()

      const state = usePlayer.getState()
      expect(state.currentHP).toBe(100)
      expect(state.lastDamageTime).toBe(0)
      expect(state.contactDamageCooldown).toBe(0)
    })
  })
})
