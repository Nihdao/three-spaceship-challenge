// Story 31.2: Removed dead weapon refs (SHOTGUN, TRI_SHOT, RAILGUN, SATELLITE, DRONE removed in 31.1)
// Retained: EXPLOSIVE_ROUND (explosion pattern), BEAM (rapid fire), SPREAD_SHOT (spread)
import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

describe('useWeapons — weapon firing patterns (Story 11.3, updated 31.2)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
  })

  // --- EXPLOSIVE_ROUND (forward fire with explosion flag) ---
  describe('EXPLOSIVE_ROUND — forward fire with explosion data', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } }],
        projectiles: [],
      })
    })

    it('fires 1 projectile forward', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBe(1)
    })

    it('projectile carries explosion data', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.explosionRadius).toBe(WEAPONS.EXPLOSIVE_ROUND.explosionRadius)
      expect(p.explosionDamage).toBe(WEAPONS.EXPLOSIVE_ROUND.explosionDamage)
    })

    it('projectile uses def color (no upgradeVisuals)', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.color).toBe(WEAPONS.EXPLOSIVE_ROUND.projectileColor)
    })
  })

  // --- BEAM (rapid fire continuous damage pattern) ---
  describe('BEAM — rapid fire continuous damage pattern', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'BEAM', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } }],
        projectiles: [],
      })
    })

    it('fires projectile with very low cooldown', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBe(1)
      // Fire again after base cooldown
      useWeapons.getState().tick(WEAPONS.BEAM.baseCooldown + 0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBe(2)
    })

    it('projectiles have correct beam stats', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.weaponId).toBe('BEAM')
      expect(p.damage).toBe(WEAPONS.BEAM.baseDamage)
    })
  })

  // --- SPREAD_SHOT ---
  describe('SPREAD_SHOT — spread pattern', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } }],
        projectiles: [],
      })
    })

    it('fires 3 projectiles in spread', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBe(3)
    })

    it('all projectiles are SPREAD_SHOT weaponId', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      useWeapons.getState().projectiles.forEach(p => expect(p.weaponId).toBe('SPREAD_SHOT'))
    })
  })

  // --- Multi-weapon with implemented weapons ---
  describe('Multi-weapon firing with current weapons', () => {
    it('fires all 4 weapons independently', () => {
      useWeapons.setState({
        activeWeapons: [
          { weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } },
          { weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } },
          { weaponId: 'BEAM', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } },
          { weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } },
        ],
        projectiles: [],
      })
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      // LASER: 1, SPREAD: 3, BEAM: 1, EXPLOSIVE_ROUND: 1 = 6
      expect(projs.length).toBe(6)
    })
  })

  // --- DIAGONALS (Story 32.3: X pattern, cursor-tracked) ---
  describe('DIAGONALS — 4-projectile X burst pattern', () => {
    const mkDiagonals = () => ({
      weaponId: 'DIAGONALS',
      level: 1,
      cooldownTimer: 0,
      multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 },
    })

    beforeEach(() => {
      useWeapons.setState({ activeWeapons: [mkDiagonals()], projectiles: [] })
    })

    it('fires exactly 4 projectiles per burst', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBe(4)
    })

    it('all 4 projectiles have weaponId DIAGONALS', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      useWeapons.getState().projectiles.forEach(p => expect(p.weaponId).toBe('DIAGONALS'))
    })

    it('4 projectile directions form an X (angles ±45° and ±135° from fireAngle)', () => {
      const fireAngle = 0 // ship faces forward (rotation 0)
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      // atan2 wraps to [-π, π]; normalize expected the same way
      const normalizeAngle = a => Math.atan2(Math.sin(a), Math.cos(a))
      const angles = projs.map(p => Math.atan2(p.dirX, -p.dirZ)).sort()
      const expected = [
        fireAngle + Math.PI * 0.25,
        fireAngle + Math.PI * 0.75,
        fireAngle + Math.PI * 1.25,
        fireAngle + Math.PI * 1.75,
      ].map(normalizeAngle).sort()
      angles.forEach((a, i) => expect(a).toBeCloseTo(expected[i], 5))
    })

    it('X pattern rotates with aimDirection (cursor direction)', () => {
      const aimDir = [1, 0] // aim right → fireAngle = Math.atan2(1, 0) = π/2
      useWeapons.getState().tick(0.01, [0, 0, 0], 0, {}, aimDir)
      const projs = useWeapons.getState().projectiles
      const normalizeAngle = a => Math.atan2(Math.sin(a), Math.cos(a))
      const angles = projs.map(p => Math.atan2(p.dirX, -p.dirZ)).sort()
      const fireAngle = Math.atan2(aimDir[0], -aimDir[1])
      const expected = [
        fireAngle + Math.PI * 0.25,
        fireAngle + Math.PI * 0.75,
        fireAngle + Math.PI * 1.25,
        fireAngle + Math.PI * 1.75,
      ].map(normalizeAngle).sort()
      angles.forEach((a, i) => expect(a).toBeCloseTo(expected[i], 5))
    })

    it('projectiles carry DIAGONALS def color', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      useWeapons.getState().projectiles.forEach(p =>
        expect(p.color).toBe(WEAPONS.DIAGONALS.projectileColor)
      )
    })

    it('each projectile in a burst gets an independent crit roll (Story 32.3 AC#1)', () => {
      // Mock Math.random to alternate: 0.9 (no crit), 0.1 (crit), 0.9, 0.1
      // With critChance=0.5 → totalCritChance ≈ 0.58 → 0.9 > 0.58 = no crit, 0.1 < 0.58 = crit
      let callIdx = 0
      const mockValues = [0.9, 0.1, 0.9, 0.1]
      const origRandom = Math.random
      Math.random = () => mockValues[callIdx++ % mockValues.length]

      useWeapons.getState().tick(0.01, [0, 0, 0], 0, { critChance: 0.5, critMultiplier: 2.0 })

      Math.random = origRandom

      const projs = useWeapons.getState().projectiles
      expect(projs.length).toBe(4)
      const critCount = projs.filter(p => p.isCrit).length
      // 2 crits and 2 non-crits expected — proves rolls are independent
      expect(critCount).toBe(2)
      projs.filter(p => p.isCrit).forEach(p =>
        expect(p.damage).toBeCloseTo(WEAPONS.DIAGONALS.baseDamage * 2.0, 5)
      )
      projs.filter(p => !p.isCrit).forEach(p =>
        expect(p.damage).toBeCloseTo(WEAPONS.DIAGONALS.baseDamage, 5)
      )
    })
  })

  // --- DIAGONALS pool eviction (Story 32.3: poolLimit enforcement) ---
  describe('DIAGONALS — per-weapon poolLimit eviction', () => {
    it('active DIAGONALS projectiles never exceed poolLimit', () => {
      const poolLimit = WEAPONS.DIAGONALS.poolLimit
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'DIAGONALS', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } }],
        projectiles: [],
      })
      // Fire many bursts with cooldown=0 each time
      const cd = WEAPONS.DIAGONALS.baseCooldown
      for (let burst = 0; burst < 8; burst++) {
        useWeapons.getState().tick(cd + 0.01, [0, 0, 0], 0)
        // reset cooldown between ticks so each tick fires
        const aws = useWeapons.getState().activeWeapons.map(w => ({ ...w, cooldownTimer: 0 }))
        useWeapons.setState({ activeWeapons: aws })
      }
      const active = useWeapons.getState().projectiles.filter(p => p.weaponId === 'DIAGONALS' && p.active)
      expect(active.length).toBeLessThanOrEqual(poolLimit)
    })
  })

  // --- Story 31.2: Always use def color (no upgradeVisuals) ---
  describe('projectile color always from def (no upgradeVisuals after 31.2)', () => {
    it('color is always def.projectileColor regardless of upgrade level', () => {
      useWeapons.getState().initializeWeapons()
      // Upgrade multiple times
      for (let i = 0; i < 4; i++) {
        useWeapons.getState().upgradeWeapon('LASER_FRONT', { stat: 'damage', finalMagnitude: 8, rarity: 'COMMON' })
      }
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.color).toBe(WEAPONS.LASER_FRONT.projectileColor)
    })

    it('meshScale is always def.projectileMeshScale regardless of upgrade level', () => {
      useWeapons.getState().initializeWeapons()
      for (let i = 0; i < 7; i++) {
        useWeapons.getState().upgradeWeapon('LASER_FRONT', { stat: 'area', finalMagnitude: 6, rarity: 'COMMON' })
      }
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.meshScale).toEqual(WEAPONS.LASER_FRONT.projectileMeshScale)
    })
  })
})
