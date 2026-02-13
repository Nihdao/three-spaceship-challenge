import { describe, it, expect } from 'vitest'
import { WEAPONS } from '../weaponDefs.js'

const REQUIRED_FIELDS = [
  'id', 'name', 'description', 'baseDamage', 'baseCooldown', 'baseSpeed',
  'projectileType', 'projectileRadius', 'projectileLifetime',
  'projectileColor', 'projectileMeshScale', 'sfxKey', 'slot', 'upgrades',
]

const NEW_WEAPON_IDS = [
  'RAILGUN', 'TRI_SHOT', 'SATELLITE', 'DRONE', 'BEAM', 'EXPLOSIVE_ROUND', 'SHOTGUN',
]

const ALL_EXPECTED_IDS = [
  'LASER_FRONT', 'SPREAD_SHOT', 'MISSILE_HOMING', 'PLASMA_BOLT',
  ...NEW_WEAPON_IDS,
]

describe('weaponDefs — weapon roster (Story 11.3)', () => {
  it('has at least 8 unique weapon types defined', () => {
    expect(Object.keys(WEAPONS).length).toBeGreaterThanOrEqual(8)
  })

  it('includes all expected weapon IDs', () => {
    for (const id of ALL_EXPECTED_IDS) {
      expect(WEAPONS).toHaveProperty(id)
    }
  })

  describe.each(ALL_EXPECTED_IDS)('%s — required fields', (weaponId) => {
    it('has all required fields', () => {
      const def = WEAPONS[weaponId]
      for (const field of REQUIRED_FIELDS) {
        expect(def, `${weaponId} missing field: ${field}`).toHaveProperty(field)
      }
    })

    it('id matches its object key', () => {
      expect(WEAPONS[weaponId].id).toBe(weaponId)
    })

    it('has 8 upgrade tiers (levels 2-9)', () => {
      const upgrades = WEAPONS[weaponId].upgrades
      expect(upgrades.length).toBe(8)
      upgrades.forEach((u, i) => {
        expect(u.level).toBe(i + 2)
        expect(u.damage).toBeGreaterThan(0)
        expect(u.cooldown).toBeGreaterThan(0)
        expect(typeof u.statPreview).toBe('string')
      })
    })

    it('has monotonically increasing damage curve', () => {
      const def = WEAPONS[weaponId]
      let prevDamage = def.baseDamage
      for (const u of def.upgrades) {
        expect(u.damage).toBeGreaterThanOrEqual(prevDamage)
        prevDamage = u.damage
      }
    })

    it('has monotonically decreasing cooldown curve', () => {
      const def = WEAPONS[weaponId]
      let prevCooldown = def.baseCooldown
      for (const u of def.upgrades) {
        expect(u.cooldown).toBeLessThanOrEqual(prevCooldown)
        prevCooldown = u.cooldown
      }
    })

    it('has projectileMeshScale as array of 3 numbers', () => {
      const scale = WEAPONS[weaponId].projectileMeshScale
      expect(Array.isArray(scale)).toBe(true)
      expect(scale.length).toBe(3)
      scale.forEach(v => expect(typeof v).toBe('number'))
    })

    it('slot is "any" or "fixed"', () => {
      expect(['any', 'fixed']).toContain(WEAPONS[weaponId].slot)
    })
  })

  // Archetype-specific tests
  describe('RAILGUN — Frontal/Piercing archetype', () => {
    it('has pierceCount field', () => {
      expect(WEAPONS.RAILGUN.pierceCount).toBeGreaterThan(0)
    })

    it('has projectilePattern "piercing"', () => {
      expect(WEAPONS.RAILGUN.projectilePattern).toBe('piercing')
    })

    it('has high base damage and slow cooldown (sniper profile)', () => {
      expect(WEAPONS.RAILGUN.baseDamage).toBeGreaterThanOrEqual(30)
      expect(WEAPONS.RAILGUN.baseCooldown).toBeGreaterThanOrEqual(1.0)
    })
  })

  describe('TRI_SHOT — Spread archetype', () => {
    it('has projectilePattern "spread"', () => {
      expect(WEAPONS.TRI_SHOT.projectilePattern).toBe('spread')
    })

    it('has spreadAngle defined', () => {
      expect(WEAPONS.TRI_SHOT.spreadAngle).toBeGreaterThan(0)
    })

    it('has tighter spread than SPREAD_SHOT', () => {
      expect(WEAPONS.TRI_SHOT.spreadAngle).toBeLessThan(WEAPONS.SPREAD_SHOT.spreadAngle)
    })
  })

  describe('SHOTGUN — Spread/Pellet archetype', () => {
    it('has projectilePattern "pellet"', () => {
      expect(WEAPONS.SHOTGUN.projectilePattern).toBe('pellet')
    })

    it('has pelletCount >= 5', () => {
      expect(WEAPONS.SHOTGUN.pelletCount).toBeGreaterThanOrEqual(5)
    })

    it('has wide spreadAngle', () => {
      expect(WEAPONS.SHOTGUN.spreadAngle).toBeGreaterThanOrEqual(0.3)
    })

    it('has short projectile lifetime (close range)', () => {
      expect(WEAPONS.SHOTGUN.projectileLifetime).toBeLessThanOrEqual(1.5)
    })
  })

  describe('SATELLITE — Orbital archetype', () => {
    it('has projectilePattern "orbital"', () => {
      expect(WEAPONS.SATELLITE.projectilePattern).toBe('orbital')
    })

    it('has orbitalRadius > 0', () => {
      expect(WEAPONS.SATELLITE.orbitalRadius).toBeGreaterThan(0)
    })

    it('has orbitalSpeed > 0', () => {
      expect(WEAPONS.SATELLITE.orbitalSpeed).toBeGreaterThan(0)
    })
  })

  describe('DRONE — Orbital/Follow archetype', () => {
    it('has projectilePattern "drone"', () => {
      expect(WEAPONS.DRONE.projectilePattern).toBe('drone')
    })

    it('has followOffset as array of 3 numbers', () => {
      const offset = WEAPONS.DRONE.followOffset
      expect(Array.isArray(offset)).toBe(true)
      expect(offset.length).toBe(3)
    })
  })

  describe('BEAM — Continuous damage archetype', () => {
    it('has projectilePattern "beam"', () => {
      expect(WEAPONS.BEAM.projectilePattern).toBe('beam')
    })

    it('has beamDuration > 0', () => {
      expect(WEAPONS.BEAM.beamDuration).toBeGreaterThan(0)
    })

    it('has beamRange > 0', () => {
      expect(WEAPONS.BEAM.beamRange).toBeGreaterThan(0)
    })
  })

  describe('EXPLOSIVE_ROUND — Area damage archetype', () => {
    it('has projectilePattern "explosion"', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.projectilePattern).toBe('explosion')
    })

    it('has explosionRadius > 0', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.explosionRadius).toBeGreaterThan(0)
    })

    it('has explosionDamage > 0', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.explosionDamage).toBeGreaterThan(0)
    })
  })

  // Visual distinction test
  it('all weapons have unique projectile colors', () => {
    const colors = Object.values(WEAPONS).map(w => w.projectileColor)
    const unique = new Set(colors)
    expect(unique.size).toBe(colors.length)
  })

  // All new weapons use slot "any"
  it('all new weapons use slot "any"', () => {
    for (const id of NEW_WEAPON_IDS) {
      expect(WEAPONS[id].slot).toBe('any')
    }
  })
})
