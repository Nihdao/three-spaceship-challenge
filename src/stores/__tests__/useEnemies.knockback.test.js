import { describe, it, expect, beforeEach } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { applyKnockbackImpulse } from '../../systems/knockbackSystem.js'

describe('useEnemies — knockback (Story 27.4)', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
  })

  // ─── gameConfig constants ──────────────────────────────────────────────────
  describe('gameConfig — knockback constants', () => {
    it('GAME_CONFIG has BOSS_KNOCKBACK_RESISTANCE defined', () => {
      expect(GAME_CONFIG.BOSS_KNOCKBACK_RESISTANCE).toBeDefined()
      expect(typeof GAME_CONFIG.BOSS_KNOCKBACK_RESISTANCE).toBe('number')
      expect(GAME_CONFIG.BOSS_KNOCKBACK_RESISTANCE).toBeGreaterThan(0)
      expect(GAME_CONFIG.BOSS_KNOCKBACK_RESISTANCE).toBeLessThan(1)
    })

    it('BOSS_KNOCKBACK_RESISTANCE is 0.9 — boss takes only 10% knockback', () => {
      expect(GAME_CONFIG.BOSS_KNOCKBACK_RESISTANCE).toBe(0.9)
    })

    it('GAME_CONFIG does not have KNOCKBACK_DECAY_RATE (velocity approach removed)', () => {
      expect(GAME_CONFIG.KNOCKBACK_DECAY_RATE).toBeUndefined()
    })

    it('GAME_CONFIG does not have KNOCKBACK_MIN_THRESHOLD (velocity approach removed)', () => {
      expect(GAME_CONFIG.KNOCKBACK_MIN_THRESHOLD).toBeUndefined()
    })
  })

  // ─── weaponDefs — knockbackStrength on all weapons ────────────────────────
  describe('weaponDefs — knockbackStrength', () => {
    const weaponIds = Object.keys(WEAPONS)

    weaponIds.forEach((weaponId) => {
      it(`WEAPONS.${weaponId} has knockbackStrength defined`, () => {
        expect(WEAPONS[weaponId].knockbackStrength).toBeDefined()
        expect(typeof WEAPONS[weaponId].knockbackStrength).toBe('number')
        expect(WEAPONS[weaponId].knockbackStrength).toBeGreaterThanOrEqual(0)
      })
    })

    it('EXPLOSIVE_ROUND has higher knockback than LASER_FRONT', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.knockbackStrength).toBeGreaterThan(WEAPONS.LASER_FRONT.knockbackStrength)
    })

    it('EXPLOSIVE_ROUND has higher knockback than SPREAD_SHOT', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.knockbackStrength).toBeGreaterThan(WEAPONS.SPREAD_SHOT.knockbackStrength)
    })

    it('BEAM has minimal knockback (beam weapons push gently)', () => {
      expect(WEAPONS.BEAM.knockbackStrength).toBeLessThan(WEAPONS.EXPLOSIVE_ROUND.knockbackStrength)
    })

    it('EXPLOSIVE_ROUND has significant knockback (explosive weapon)', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.knockbackStrength).toBeGreaterThan(WEAPONS.LASER_FRONT.knockbackStrength)
    })
  })

  // ─── Enemy spawn — no velocity fields ─────────────────────────────────────
  describe('spawnEnemy() — no knockback velocity fields (direct displacement approach)', () => {
    it('spawnEnemy() does not add knockbackVelocityX', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.knockbackVelocityX).toBeUndefined()
    })

    it('spawnEnemy() does not add knockbackVelocityZ', () => {
      useEnemies.getState().spawnEnemy('FODDER_BASIC', 10, 20)
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.knockbackVelocityZ).toBeUndefined()
    })

    it('spawnEnemies() does not add knockbackVelocityX', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 10, z: 20 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.knockbackVelocityX).toBeUndefined()
    })

    it('spawnEnemies() does not add knockbackVelocityZ', () => {
      useEnemies.getState().spawnEnemies([{ typeId: 'FODDER_BASIC', x: 10, z: 20 }])
      const enemy = useEnemies.getState().enemies[0]
      expect(enemy.knockbackVelocityZ).toBeUndefined()
    })
  })

  // ─── applyKnockbackImpulse() — physics behavior ───────────────────────────
  describe('applyKnockbackImpulse() — position displacement', () => {
    it('displaces enemy in the +X direction when projectile travels +X', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'LASER_FRONT', dirX: 1, dirZ: 0 })
      expect(enemies[0].x).toBeGreaterThan(0)
      expect(enemies[0].z).toBe(0)
    })

    it('displaces enemy in the -Z direction when projectile travels -Z', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'LASER_FRONT', dirX: 0, dirZ: -1 })
      expect(enemies[0].x).toBe(0)
      expect(enemies[0].z).toBeLessThan(0)
    })

    it('displaces by exactly knockbackStrength units for a unit direction vector', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      const strength = WEAPONS.LASER_FRONT.knockbackStrength
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'LASER_FRONT', dirX: 1, dirZ: 0 })
      expect(enemies[0].x).toBeCloseTo(strength)
    })

    it('displaces diagonally (both x and z change) for a diagonal projectile', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      const invSqrt2 = 1 / Math.sqrt(2)
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'EXPLOSIVE_ROUND', dirX: invSqrt2, dirZ: invSqrt2 })
      expect(enemies[0].x).toBeGreaterThan(0)
      expect(enemies[0].z).toBeGreaterThan(0)
      expect(enemies[0].x).toBeCloseTo(enemies[0].z)
    })

    it('does nothing when enemyId is not found in the array', () => {
      const enemies = [{ id: 'e1', x: 5, z: 5, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'nonexistent', { weaponId: 'LASER_FRONT', dirX: 1, dirZ: 0 })
      expect(enemies[0].x).toBe(5)
      expect(enemies[0].z).toBe(5)
    })

    it('does nothing when weapon has knockbackStrength of 0', () => {
      const zeroKbWeapon = 'LASER_FRONT'
      const originalStrength = WEAPONS[zeroKbWeapon].knockbackStrength
      WEAPONS[zeroKbWeapon].knockbackStrength = 0
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: zeroKbWeapon, dirX: 1, dirZ: 0 })
      expect(enemies[0].x).toBe(0)
      WEAPONS[zeroKbWeapon].knockbackStrength = originalStrength // restore
    })

    it('does nothing when projectile has zero direction vector (dirX=0, dirZ=0)', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'LASER_FRONT', dirX: 0, dirZ: 0 })
      expect(enemies[0].x).toBe(0)
      expect(enemies[0].z).toBe(0)
    })

    it('does nothing when dirX/dirZ are undefined', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'LASER_FRONT' })
      expect(enemies[0].x).toBe(0)
      expect(enemies[0].z).toBe(0)
    })
  })

  // ─── applyKnockbackImpulse() — boundary clamping ─────────────────────────
  describe('applyKnockbackImpulse() — boundary clamping', () => {
    it('clamps enemy to +PLAY_AREA_SIZE when knockback would push beyond +X bound', () => {
      const bound = GAME_CONFIG.PLAY_AREA_SIZE
      const enemies = [{ id: 'e1', x: bound - 0.1, z: 0, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'RAILGUN', dirX: 1, dirZ: 0 })
      expect(enemies[0].x).toBeLessThanOrEqual(bound)
    })

    it('clamps enemy to -PLAY_AREA_SIZE when knockback would push beyond -X bound', () => {
      const bound = GAME_CONFIG.PLAY_AREA_SIZE
      const enemies = [{ id: 'e1', x: -(bound - 0.1), z: 0, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'RAILGUN', dirX: -1, dirZ: 0 })
      expect(enemies[0].x).toBeGreaterThanOrEqual(-bound)
    })

    it('clamps enemy to +PLAY_AREA_SIZE when knockback would push beyond +Z bound', () => {
      const bound = GAME_CONFIG.PLAY_AREA_SIZE
      const enemies = [{ id: 'e1', x: 0, z: bound - 0.1, typeId: 'FODDER_BASIC' }]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'RAILGUN', dirX: 0, dirZ: 1 })
      expect(enemies[0].z).toBeLessThanOrEqual(bound)
    })
  })

  // ─── applyKnockbackImpulse() — boss resistance ────────────────────────────
  describe('applyKnockbackImpulse() — boss resistance', () => {
    it('applies full knockback to regular enemy', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      const strength = WEAPONS.EXPLOSIVE_ROUND.knockbackStrength
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'EXPLOSIVE_ROUND', dirX: 1, dirZ: 0 })
      expect(enemies[0].x).toBeCloseTo(strength)
    })

    it('applies reduced knockback (10% of base) to enemy with isBoss flag', () => {
      // BOSS_SPACESHIP has isBoss: true in ENEMIES
      const enemies = [{ id: 'boss1', x: 0, z: 0, typeId: 'BOSS_SPACESHIP' }]
      const strength = WEAPONS.EXPLOSIVE_ROUND.knockbackStrength
      applyKnockbackImpulse(enemies, 'boss1', { weaponId: 'EXPLOSIVE_ROUND', dirX: 1, dirZ: 0 })
      const expectedReduced = strength * (1 - GAME_CONFIG.BOSS_KNOCKBACK_RESISTANCE)
      expect(enemies[0].x).toBeCloseTo(expectedReduced)
    })

    it('boss receives significantly less knockback than regular enemy from the same weapon', () => {
      const regularEnemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      const bossEnemies = [{ id: 'boss1', x: 0, z: 0, typeId: 'BOSS_SPACESHIP' }]
      const proj = { weaponId: 'EXPLOSIVE_ROUND', dirX: 1, dirZ: 0 }
      applyKnockbackImpulse(regularEnemies, 'e1', proj)
      applyKnockbackImpulse(bossEnemies, 'boss1', proj)
      expect(bossEnemies[0].x).toBeLessThan(regularEnemies[0].x)
    })
  })

  // ─── applyKnockbackImpulse() — multi-enemy independence ──────────────────
  describe('applyKnockbackImpulse() — multi-enemy independence', () => {
    it('only moves the targeted enemy, leaves others unchanged', () => {
      const enemies = [
        { id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' },
        { id: 'e2', x: 10, z: 10, typeId: 'FODDER_BASIC' },
      ]
      applyKnockbackImpulse(enemies, 'e1', { weaponId: 'LASER_FRONT', dirX: 1, dirZ: 0 })
      expect(enemies[0].x).toBeGreaterThan(0)
      expect(enemies[1].x).toBe(10) // unchanged
      expect(enemies[1].z).toBe(10) // unchanged
    })

    it('multiple calls accumulate knockback on the same enemy', () => {
      const enemies = [{ id: 'e1', x: 0, z: 0, typeId: 'FODDER_BASIC' }]
      const proj = { weaponId: 'LASER_FRONT', dirX: 1, dirZ: 0 }
      applyKnockbackImpulse(enemies, 'e1', proj)
      const afterFirst = enemies[0].x
      applyKnockbackImpulse(enemies, 'e1', proj)
      expect(enemies[0].x).toBeGreaterThan(afterFirst)
    })
  })
})
