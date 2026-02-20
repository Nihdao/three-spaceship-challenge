import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import useDamageNumbers from '../useDamageNumbers.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('usePlayer — damage actions', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
    useDamageNumbers.getState().reset()
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
      expect(state.currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
      expect(state.lastDamageTime).toBe(0)
      expect(state.contactDamageCooldown).toBe(0)
    })

    it('restores HP to PLAYER_BASE_HP from gameConfig', () => {
      usePlayer.getState().takeDamage(50)
      usePlayer.getState().reset()
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
      expect(usePlayer.getState().maxHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    })

    it('clears invulnerability state', () => {
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().isInvulnerable).toBe(true)

      usePlayer.getState().reset()
      expect(usePlayer.getState().isInvulnerable).toBe(false)
      expect(usePlayer.getState().invulnerabilityTimer).toBe(0)
    })
  })

  describe('HP initialization (Story 3.5)', () => {
    it('initializes currentHP from GAME_CONFIG.PLAYER_BASE_HP', () => {
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    })

    it('initializes maxHP from GAME_CONFIG.PLAYER_BASE_HP', () => {
      expect(usePlayer.getState().maxHP).toBe(GAME_CONFIG.PLAYER_BASE_HP)
    })
  })

  describe('invulnerability timer (Story 3.5)', () => {
    const noInput = { moveLeft: false, moveRight: false, moveForward: false, moveBackward: false }

    it('takeDamage sets isInvulnerable and invulnerabilityTimer', () => {
      usePlayer.getState().takeDamage(10)
      const state = usePlayer.getState()
      expect(state.isInvulnerable).toBe(true)
      expect(state.invulnerabilityTimer).toBe(GAME_CONFIG.INVULNERABILITY_DURATION)
    })

    it('blocks damage during invulnerability window', () => {
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP - 10)

      // Tick a short time — not enough to expire invulnerability
      usePlayer.getState().tick(0.1, noInput)
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP - 10) // unchanged
    })

    it('invulnerability expires after INVULNERABILITY_DURATION via tick', () => {
      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().isInvulnerable).toBe(true)

      // Tick enough to expire both invulnerability and contact cooldown
      usePlayer.getState().tick(GAME_CONFIG.INVULNERABILITY_DURATION + 0.1, noInput)
      expect(usePlayer.getState().isInvulnerable).toBe(false)
      expect(usePlayer.getState().invulnerabilityTimer).toBe(0)
    })

    it('allows damage again after invulnerability expires', () => {
      usePlayer.getState().takeDamage(10)
      // Expire both invulnerability and cooldown
      usePlayer.getState().tick(1.0, noInput)
      expect(usePlayer.getState().isInvulnerable).toBe(false)
      expect(usePlayer.getState().contactDamageCooldown).toBe(0)

      usePlayer.getState().takeDamage(10)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP - 20)
    })

    it('invulnerability timer decrements correctly per tick', () => {
      usePlayer.getState().takeDamage(10)
      const timerBefore = usePlayer.getState().invulnerabilityTimer

      usePlayer.getState().tick(0.1, noInput)
      expect(usePlayer.getState().invulnerabilityTimer).toBeCloseTo(timerBefore - 0.1, 5)
    })

    it('invulnerability timer does not go below 0', () => {
      usePlayer.getState().takeDamage(10)
      usePlayer.getState().tick(5.0, noInput)
      expect(usePlayer.getState().invulnerabilityTimer).toBe(0)
    })
  })

  describe('death detection (Story 3.5)', () => {
    it('HP reaches exactly 0 when damage equals currentHP', () => {
      usePlayer.getState().takeDamage(GAME_CONFIG.PLAYER_BASE_HP)
      expect(usePlayer.getState().currentHP).toBe(0)
    })

    it('HP stays at 0 when damage exceeds currentHP', () => {
      usePlayer.getState().takeDamage(GAME_CONFIG.PLAYER_BASE_HP + 50)
      expect(usePlayer.getState().currentHP).toBe(0)
    })
  })

  describe('red damage number spawn (Story 27.5)', () => {
    it('spawns a damage number when player takes damage', () => {
      usePlayer.getState().takeDamage(25)
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers).toHaveLength(1)
    })

    it('spawns damage number with isPlayerDamage: true', () => {
      usePlayer.getState().takeDamage(30)
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers[0].isPlayerDamage).toBe(true)
    })

    it('spawns damage number with red color', () => {
      usePlayer.getState().takeDamage(20)
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers[0].color).toBe(GAME_CONFIG.DAMAGE_NUMBERS.PLAYER_COLOR)
    })

    it('spawns damage number at player position', () => {
      usePlayer.setState({ position: [7, 0, -4] })
      usePlayer.getState().takeDamage(10)
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers[0].worldX).toBeCloseTo(7)
      expect(damageNumbers[0].worldZ).toBeCloseTo(-4)
    })

    it('spawns damage number with the actual damage amount taken', () => {
      usePlayer.getState().takeDamage(40)
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers[0].damage).toBe(40)
    })

    it('does NOT spawn a damage number when invulnerable', () => {
      usePlayer.setState({ isInvulnerable: true })
      usePlayer.getState().takeDamage(25)
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers).toHaveLength(0)
    })

    it('does NOT spawn a damage number when contactDamageCooldown > 0', () => {
      usePlayer.getState().takeDamage(10) // spawns first number + sets cooldown
      useDamageNumbers.getState().reset()   // clear to count fresh

      usePlayer.getState().takeDamage(10)   // blocked by cooldown
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers).toHaveLength(0)
    })

    it('does NOT spawn a damage number when _godMode is active', () => {
      usePlayer.setState({ _godMode: true })
      usePlayer.getState().takeDamage(25)
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(0)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP) // HP unchanged
    })

    it('spawns damage number showing the reduced amount when damageReduction is applied', () => {
      usePlayer.getState().takeDamage(100, 0.5) // 50% reduction → 50 damage
      const { damageNumbers } = useDamageNumbers.getState()
      expect(damageNumbers).toHaveLength(1)
      expect(damageNumbers[0].damage).toBe(50)
      expect(usePlayer.getState().currentHP).toBe(GAME_CONFIG.PLAYER_BASE_HP - 50)
    })

    it('does NOT spawn a damage number when damage is fully reduced to zero', () => {
      usePlayer.getState().takeDamage(10, 1.0) // 100% reduction → 0 damage
      expect(useDamageNumbers.getState().damageNumbers).toHaveLength(0)
    })
  })
})
