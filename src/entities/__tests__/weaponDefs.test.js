import { describe, it, expect } from 'vitest'
import { WEAPONS } from '../weaponDefs.js'

const REQUIRED_FIELDS = [
  'id', 'name', 'description', 'baseDamage', 'baseCooldown', 'baseSpeed',
  'projectileType', 'projectileRadius', 'projectileLifetime',
  'projectileColor', 'projectileMeshScale', 'sfxKey', 'knockbackStrength', 'slot',
  'baseArea', 'critChance', 'poolLimit', 'rarityWeight',
]

// Story 32.3: DIAGONALS moved from STUB_IDS to RETAINED_IDS (implemented: false removed after QA)
const RETAINED_IDS = ['LASER_FRONT', 'SPREAD_SHOT', 'BEAM', 'EXPLOSIVE_ROUND', 'DIAGONALS']
// Story 32.2: MAGNETIC_FIELD moved to NON_PROJECTILE_IDS (new weaponType schema)
// Story 32.4: SHOCKWAVE moved to NON_PROJECTILE_IDS (new weaponType: 'shockwave' schema)
// Story 32.6: TACTICAL_SHOT moved to NON_PROJECTILE_IDS (new weaponType: 'tactical_shot' schema)
const STUB_IDS = []
const NON_PROJECTILE_IDS = ['LASER_CROSS', 'AURA', 'SHOCKWAVE', 'MINE_AROUND', 'TACTICAL_SHOT'] // Story 32.1-32.6: use weaponType, not projectileType
const ALL_EXPECTED_IDS = [...RETAINED_IDS, ...STUB_IDS, ...NON_PROJECTILE_IDS]
// Only projectile weapons are checked against the REQUIRED_FIELDS schema
const PROJECTILE_WEAPON_IDS = [...RETAINED_IDS, ...STUB_IDS]

const REMOVED_IDS = ['MISSILE_HOMING', 'PLASMA_BOLT', 'RAILGUN', 'TRI_SHOT', 'SHOTGUN', 'SATELLITE', 'DRONE']

// Story 32.9: weaponType taxonomy (code-review fix — validate values, not just type)
const EXPECTED_WEAPON_TYPES = {
  LASER_FRONT:     'projectile',
  SPREAD_SHOT:     'projectile',
  BEAM:            'beam_continuous',
  EXPLOSIVE_ROUND: 'projectile_explosion',
  DIAGONALS:       'projectile',
  LASER_CROSS:     'laser_cross',
  AURA:            'aura',
  SHOCKWAVE:       'shockwave',
  MINE_AROUND:     'mine_around',
  TACTICAL_SHOT:   'tactical_shot',
}

// Story 31.1: color family assignments
const EXPECTED_COLORS = {
  LASER_FRONT:     '#00e5ff',  // COLD
  BEAM:            '#0096c7',  // COLD
  DIAGONALS:       '#d8f0ff',  // COLD — near-white for glowing ray appearance
  LASER_CROSS:     '#9b5de5',  // ARCANE
  AURA:            '#c084fc',  // ARCANE
  SPREAD_SHOT:     '#ffd60a',  // VOLATILE
  SHOCKWAVE:       '#f9e547',  // VOLATILE
  EXPLOSIVE_ROUND: '#f4c430',  // VOLATILE
  MINE_AROUND:     '#06d6a0',  // BIO
  TACTICAL_SHOT:   '#2dc653',  // BIO
}

describe('weaponDefs — weapon roster (Story 31.1)', () => {
  it('has exactly 10 weapon types defined', () => {
    expect(Object.keys(WEAPONS).length).toBe(10)
  })

  it('includes all expected weapon IDs', () => {
    for (const id of ALL_EXPECTED_IDS) {
      expect(WEAPONS).toHaveProperty(id)
    }
  })

  it('removed 7 obsolete weapons', () => {
    for (const id of REMOVED_IDS) {
      expect(WEAPONS).not.toHaveProperty(id)
    }
  })

  // Story 32.8: upgrades[] and rarityDamageMultipliers removed from all weapons (dead code)
  it('no weapon has upgrades[] array (procedural upgrade system handles all upgrades)', () => {
    for (const [id, def] of Object.entries(WEAPONS)) {
      expect(def, `${id} should not have upgrades field`).not.toHaveProperty('upgrades')
    }
  })

  it('no weapon has rarityDamageMultipliers field (removed dead code)', () => {
    for (const [id, def] of Object.entries(WEAPONS)) {
      expect(def, `${id} should not have rarityDamageMultipliers field`).not.toHaveProperty('rarityDamageMultipliers')
    }
  })

  // Story 32.1: Only projectile weapons are checked against the REQUIRED_FIELDS schema
  // LASER_CROSS uses a different schema (weaponType, armLength, etc.) — tested in weaponDefs.laserCross.test.js
  describe.each(PROJECTILE_WEAPON_IDS)('%s — required fields', (weaponId) => {
    it('has all required fields', () => {
      const def = WEAPONS[weaponId]
      for (const field of REQUIRED_FIELDS) {
        expect(def, `${weaponId} missing field: ${field}`).toHaveProperty(field)
      }
    })

    it('id matches its object key', () => {
      expect(WEAPONS[weaponId].id).toBe(weaponId)
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

  // critChance floor (AC #5) — only applies to projectile weapons (non-projectile weapons use composedWeaponMods.critChance)
  it('all projectile weapons have critChance >= 0.015', () => {
    for (const id of PROJECTILE_WEAPON_IDS) {
      const def = WEAPONS[id]
      expect(def.critChance, `${id} critChance below 0.015 floor`).toBeGreaterThanOrEqual(0.015)
    }
  })

  // Stubs — Story 32.6: TACTICAL_SHOT → non-projectile; 0 remaining projectile stubs
  it('no remaining projectile stubs (all moved to non-projectile)', () => {
    expect(STUB_IDS.length).toBe(0)
  })

  // Story 32.8: implemented flag removed from all weapons
  it('no weapon has implemented field', () => {
    for (const [id, def] of Object.entries(WEAPONS)) {
      expect(def, `${id} should not have implemented field`).not.toHaveProperty('implemented')
    }
  })

  // Story 32.9: every weapon must have the correct weaponType per taxonomy (code-review: value validation)
  it('every weapon has the correct weaponType per taxonomy', () => {
    for (const [id, def] of Object.entries(WEAPONS)) {
      expect(def, `${id} missing weaponType field`).toHaveProperty('weaponType')
      expect(def.weaponType, `${id} weaponType mismatch`).toBe(EXPECTED_WEAPON_TYPES[id])
    }
  })

  // Color compliance (AC #6)
  it('all 10 weapon projectileColor values match expected hex (family compliance)', () => {
    for (const [id, expectedColor] of Object.entries(EXPECTED_COLORS)) {
      expect(WEAPONS[id].projectileColor, `${id} wrong color`).toBe(expectedColor)
    }
  })

  it('all weapons have unique projectile colors', () => {
    const colors = Object.values(WEAPONS).map(w => w.projectileColor)
    const unique = new Set(colors)
    expect(unique.size).toBe(colors.length)
  })

  it('all projectileColor values are valid hex colors', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/
    for (const [id, def] of Object.entries(WEAPONS)) {
      expect(def.projectileColor, `${id} has invalid hex color`).toMatch(hexRegex)
    }
  })

  it('no weapon color overlaps the enemy spectrum (#ef233c / #ff4f1f)', () => {
    function hexToRgb(hex) {
      const val = parseInt(hex.slice(1), 16)
      return [(val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff]
    }
    function colorDistance(hex1, hex2) {
      const [r1, g1, b1] = hexToRgb(hex1)
      const [r2, g2, b2] = hexToRgb(hex2)
      return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
    }
    const MIN_DISTANCE = 80
    const ENEMY_COLORS = ['#ef233c', '#ff4f1f']
    for (const [id, def] of Object.entries(WEAPONS)) {
      for (const enemyColor of ENEMY_COLORS) {
        const dist = colorDistance(def.projectileColor, enemyColor)
        expect(dist, `${id} (${def.projectileColor}) too close to enemy ${enemyColor} — distance ${dist.toFixed(0)}`).toBeGreaterThanOrEqual(MIN_DISTANCE)
      }
    }
  })

  // Archetype tests for retained weapons
  describe('BEAM — Continuous damage archetype (AC #7)', () => {
    it('has projectilePattern "beam"', () => {
      expect(WEAPONS.BEAM.projectilePattern).toBe('beam')
    })

    it('has beamDuration > 0', () => {
      expect(WEAPONS.BEAM.beamDuration).toBeGreaterThan(0)
    })

    it('has beamRange > 0', () => {
      expect(WEAPONS.BEAM.beamRange).toBeGreaterThan(0)
    })

    it('has COLD family color #0096c7', () => {
      expect(WEAPONS.BEAM.projectileColor).toBe('#0096c7')
    })

    it('has thin mesh scale [0.12, 0.12, 8.0]', () => {
      expect(WEAPONS.BEAM.projectileMeshScale).toEqual([0.12, 0.12, 8.0])
    })
  })

  describe('EXPLOSIVE_ROUND — Area damage archetype (AC #8)', () => {
    it('has projectilePattern "explosion"', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.projectilePattern).toBe('explosion')
    })

    it('has explosionRadius > 0', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.explosionRadius).toBeGreaterThan(0)
    })

    it('has explosionDamage > 0', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.explosionDamage).toBeGreaterThan(0)
    })

    it('has VOLATILE family color #f4c430', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.projectileColor).toBe('#f4c430')
    })

    it('has mesh scale [1.4, 1.4, 1.4]', () => {
      expect(WEAPONS.EXPLOSIVE_ROUND.projectileMeshScale).toEqual([1.4, 1.4, 1.4])
    })
  })

  describe('SPREAD_SHOT — Spread archetype', () => {
    it('has projectilePattern "spread"', () => {
      expect(WEAPONS.SPREAD_SHOT.projectilePattern).toBe('spread')
    })

    it('has spreadAngle defined', () => {
      expect(WEAPONS.SPREAD_SHOT.spreadAngle).toBeGreaterThan(0)
    })
  })

  it('all weapons use slot "any"', () => {
    for (const id of ALL_EXPECTED_IDS) {
      expect(WEAPONS[id].slot).toBe('any')
    }
  })
})
