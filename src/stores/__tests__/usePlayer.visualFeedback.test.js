import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }

describe('usePlayer — visual damage feedback (Story 4.6)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('damageFlashTimer', () => {
    it('initializes to 0', () => {
      expect(usePlayer.getState().damageFlashTimer).toBe(0)
    })

    it('takeDamage sets damageFlashTimer to DAMAGE_FLASH_DURATION', () => {
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().damageFlashTimer).toBe(GAME_CONFIG.DAMAGE_FLASH_DURATION)
    })

    it('tick decrements damageFlashTimer by delta', () => {
      usePlayer.getState().takeDamage(10)
      const before = usePlayer.getState().damageFlashTimer
      usePlayer.getState().tick(0.05, noInput)
      expect(usePlayer.getState().damageFlashTimer).toBeCloseTo(before - 0.05, 5)
    })

    it('damageFlashTimer does not go below 0', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().tick(5.0, noInput)
      expect(usePlayer.getState().damageFlashTimer).toBe(0)
    })

    it('reset clears damageFlashTimer to 0', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().reset()
      expect(usePlayer.getState().damageFlashTimer).toBe(0)
    })

    it('does not set damageFlashTimer when invulnerable', () => {
      usePlayer.setState({ isInvulnerable: true })
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().damageFlashTimer).toBe(0)
    })

    it('does not set damageFlashTimer when contactDamageCooldown > 0', () => {
      usePlayer.getState().takeDamage(10) // sets cooldown + invulnerability
      // Reset flash and invulnerability to isolate cooldown guard
      usePlayer.setState({ damageFlashTimer: 0, isInvulnerable: false, invulnerabilityTimer: 0 })
      usePlayer.getState().takeDamage(10) // blocked by cooldown only
      expect(usePlayer.getState().damageFlashTimer).toBe(0)
    })

    it('takeDamage during active flash restarts timer to max duration', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().tick(0.05, noInput) // partially decay the timer
      expect(usePlayer.getState().damageFlashTimer).toBeLessThan(GAME_CONFIG.DAMAGE_FLASH_DURATION)
      // Clear guards to allow another takeDamage
      usePlayer.setState({ isInvulnerable: false, invulnerabilityTimer: 0, contactDamageCooldown: 0 })
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().damageFlashTimer).toBe(GAME_CONFIG.DAMAGE_FLASH_DURATION)
    })
  })

  describe('cameraShakeTimer', () => {
    it('initializes to 0', () => {
      expect(usePlayer.getState().cameraShakeTimer).toBe(0)
    })

    it('takeDamage sets cameraShakeTimer to CAMERA_SHAKE_DURATION', () => {
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().cameraShakeTimer).toBe(GAME_CONFIG.CAMERA_SHAKE_DURATION)
    })

    it('tick decrements cameraShakeTimer by delta', () => {
      usePlayer.getState().takeDamage(10)
      const before = usePlayer.getState().cameraShakeTimer
      usePlayer.getState().tick(0.05, noInput)
      expect(usePlayer.getState().cameraShakeTimer).toBeCloseTo(before - 0.05, 5)
    })

    it('cameraShakeTimer does not go below 0', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().tick(5.0, noInput)
      expect(usePlayer.getState().cameraShakeTimer).toBe(0)
    })

    it('reset clears cameraShakeTimer to 0', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().reset()
      expect(usePlayer.getState().cameraShakeTimer).toBe(0)
    })

    it('does not set cameraShakeTimer when invulnerable', () => {
      usePlayer.setState({ isInvulnerable: true })
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().cameraShakeTimer).toBe(0)
    })

    it('does not set cameraShakeTimer when contactDamageCooldown > 0', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.setState({ cameraShakeTimer: 0, isInvulnerable: false, invulnerabilityTimer: 0 })
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().cameraShakeTimer).toBe(0)
    })
  })

  describe('cameraShakeIntensity', () => {
    it('initializes to 0', () => {
      expect(usePlayer.getState().cameraShakeIntensity).toBe(0)
    })

    it('takeDamage sets cameraShakeIntensity to CAMERA_SHAKE_AMPLITUDE', () => {
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().cameraShakeIntensity).toBe(GAME_CONFIG.CAMERA_SHAKE_AMPLITUDE)
    })

    it('cameraShakeIntensity resets to 0 when cameraShakeTimer expires', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().tick(5.0, noInput) // expire the timer
      expect(usePlayer.getState().cameraShakeIntensity).toBe(0)
    })

    it('reset clears cameraShakeIntensity to 0', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().reset()
      expect(usePlayer.getState().cameraShakeIntensity).toBe(0)
    })
  })
})
