import { describe, it, expect } from 'vitest'
import { ENEMIES } from '../enemyDefs.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('enemyDefs — damage values (Story 46.4: Enemy Damage x2)', () => {
  describe('contact damage — non-boss enemies doubled', () => {
    it('FODDER_BASIC contact damage is 6', () => {
      expect(ENEMIES.FODDER_BASIC.damage).toBe(6)
    })

    it('FODDER_TANK contact damage is 6', () => {
      expect(ENEMIES.FODDER_TANK.damage).toBe(6)
    })

    it('FODDER_SWARM contact damage is 4', () => {
      expect(ENEMIES.FODDER_SWARM.damage).toBe(4)
    })

    it('SHOCKWAVE_BLOB contact damage is 6', () => {
      expect(ENEMIES.SHOCKWAVE_BLOB.damage).toBe(6)
    })

    it('TELEPORTER contact damage is 6', () => {
      expect(ENEMIES.TELEPORTER.damage).toBe(6)
    })

    it('ELITE_BRUISER contact damage is 4', () => {
      expect(ENEMIES.ELITE_BRUISER.damage).toBe(4)
    })

    it('ELITE_BRUISER hp is 50 (Story 49.2: x2 from 25)', () => {
      expect(ENEMIES.ELITE_BRUISER.hp).toBe(50)
    })

    it('SNIPER_MOBILE contact damage stays 0 (no melee by design)', () => {
      expect(ENEMIES.SNIPER_MOBILE.damage).toBe(0)
    })

    it('SNIPER_FIXED contact damage stays 0 (no melee by design)', () => {
      expect(ENEMIES.SNIPER_FIXED.damage).toBe(0)
    })
  })

  describe('projectile damage doubled', () => {
    it('SNIPER_MOBILE projectileDamage is 12', () => {
      expect(ENEMIES.SNIPER_MOBILE.projectileDamage).toBe(12)
    })

    it('SNIPER_FIXED projectileDamage is 24', () => {
      expect(ENEMIES.SNIPER_FIXED.projectileDamage).toBe(24)
    })

    it('TELEPORTER burstProjectileDamage is 6', () => {
      expect(ENEMIES.TELEPORTER.burstProjectileDamage).toBe(6)
    })
  })

  describe('shockwave damage doubled', () => {
    it('SHOCKWAVE_BLOB shockwaveDamage is 10', () => {
      expect(ENEMIES.SHOCKWAVE_BLOB.shockwaveDamage).toBe(10)
    })
  })

  describe('ELITE_SHOOTER — new elite ranged type (Story 49.2)', () => {
    it('ELITE_SHOOTER exists in ENEMIES', () => {
      expect(ENEMIES.ELITE_SHOOTER).toBeDefined()
    })
    it('ELITE_SHOOTER has isElite: true', () => {
      expect(ENEMIES.ELITE_SHOOTER.isElite).toBe(true)
    })
    it('ELITE_SHOOTER behavior is sniper_mobile', () => {
      expect(ENEMIES.ELITE_SHOOTER.behavior).toBe('sniper_mobile')
    })
    it('ELITE_SHOOTER contact damage is 0 (ranged only)', () => {
      expect(ENEMIES.ELITE_SHOOTER.damage).toBe(0)
    })
    it('ELITE_SHOOTER projectileDamage is 18', () => {
      expect(ENEMIES.ELITE_SHOOTER.projectileDamage).toBe(18)
    })
  })

  describe('boss damage intentionally untouched', () => {
    it('BOSS_SPACESHIP damage is 20 (hardcoded, not doubled)', () => {
      expect(ENEMIES.BOSS_SPACESHIP.damage).toBe(20)
    })

    it('BOSS_SENTINEL damage references GAME_CONFIG (not doubled)', () => {
      expect(ENEMIES.BOSS_SENTINEL.damage).toBe(GAME_CONFIG.BOSS_CONTACT_DAMAGE)
    })
  })
})
