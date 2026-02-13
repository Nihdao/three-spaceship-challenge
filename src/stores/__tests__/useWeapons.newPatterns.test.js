import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

describe('useWeapons — new weapon firing patterns (Story 11.3)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
  })

  // --- SHOTGUN (pellet pattern) ---
  describe('SHOTGUN — pellet pattern', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'SHOTGUN', level: 1, cooldownTimer: 0 }],
        projectiles: [],
      })
    })

    it('fires pelletCount projectiles per shot', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      expect(projs.length).toBe(WEAPONS.SHOTGUN.pelletCount)
    })

    it('all pellets are SHOTGUN weaponId', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      projs.forEach(p => expect(p.weaponId).toBe('SHOTGUN'))
    })

    it('pellets spread within defined angle range', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      const spreadAngle = WEAPONS.SHOTGUN.spreadAngle
      // All projectile directions should be within ±spreadAngle of forward
      projs.forEach(p => {
        const angle = Math.atan2(p.dirX, -p.dirZ) // direction angle
        expect(Math.abs(angle)).toBeLessThanOrEqual(spreadAngle + 0.01)
      })
    })

    it('pellets have correct damage and stats', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      projs.forEach(p => {
        expect(p.damage).toBe(WEAPONS.SHOTGUN.baseDamage)
        expect(p.speed).toBe(WEAPONS.SHOTGUN.baseSpeed)
        expect(p.color).toBe(WEAPONS.SHOTGUN.projectileColor)
      })
    })
  })

  // --- TRI_SHOT (uses existing spread pattern) ---
  describe('TRI_SHOT — spread pattern with tighter cone', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'TRI_SHOT', level: 1, cooldownTimer: 0 }],
        projectiles: [],
      })
    })

    it('fires 3 projectiles (same as spread pattern)', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBe(3)
    })

    it('uses TRI_SHOT spreadAngle (tighter than SPREAD_SHOT)', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      // Center projectile faces forward
      expect(projs[1].dirZ).toBeCloseTo(-1, 1)
      // Side projectiles should be closer together than SPREAD_SHOT
      const leftAngle = Math.atan2(projs[0].dirX, -projs[0].dirZ)
      const rightAngle = Math.atan2(projs[2].dirX, -projs[2].dirZ)
      const totalSpread = rightAngle - leftAngle
      expect(totalSpread).toBeCloseTo(WEAPONS.TRI_SHOT.spreadAngle * 2, 1)
    })
  })

  // --- RAILGUN (piercing — fires single forward projectile) ---
  describe('RAILGUN — forward fire with piercing flag', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'RAILGUN', level: 1, cooldownTimer: 0 }],
        projectiles: [],
      })
    })

    it('fires 1 projectile forward', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBe(1)
    })

    it('projectile carries piercing flag from definition', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.piercing).toBe(true)
      expect(p.pierceCount).toBe(WEAPONS.RAILGUN.pierceCount)
    })

    it('has high base damage', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.damage).toBe(WEAPONS.RAILGUN.baseDamage)
    })
  })

  // --- EXPLOSIVE_ROUND (forward fire with explosion flag) ---
  describe('EXPLOSIVE_ROUND — forward fire with explosion data', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'EXPLOSIVE_ROUND', level: 1, cooldownTimer: 0 }],
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
  })

  // --- SATELLITE (orbital — fires from orbital position) ---
  describe('SATELLITE — orbital firing', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'SATELLITE', level: 1, cooldownTimer: 0 }],
        projectiles: [],
      })
    })

    it('fires projectile(s) when cooldown expires', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBeGreaterThanOrEqual(1)
    })

    it('projectiles have correct weapon stats', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[0]
      expect(p.weaponId).toBe('SATELLITE')
      expect(p.damage).toBe(WEAPONS.SATELLITE.baseDamage)
    })
  })

  // --- DRONE (fires from offset position) ---
  describe('DRONE — offset firing', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'DRONE', level: 1, cooldownTimer: 0 }],
        projectiles: [],
      })
    })

    it('fires projectile(s) when cooldown expires', () => {
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      expect(useWeapons.getState().projectiles.length).toBeGreaterThanOrEqual(1)
    })

    it('projectile spawns at offset position from player', () => {
      const playerPos = [50, 0, 50]
      useWeapons.getState().tick(0.01, playerPos, 0)
      const p = useWeapons.getState().projectiles[0]
      const offset = WEAPONS.DRONE.followOffset
      // Projectile should be offset from player position
      expect(p.x).toBeCloseTo(playerPos[0] + offset[0], 0)
      expect(p.z).toBeCloseTo(playerPos[2] + offset[2], 0)
    })
  })

  // --- BEAM (rapid fire forward, acts like continuous damage) ---
  describe('BEAM — rapid fire continuous damage pattern', () => {
    beforeEach(() => {
      useWeapons.setState({
        activeWeapons: [{ weaponId: 'BEAM', level: 1, cooldownTimer: 0 }],
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

  // --- Multi-weapon with new weapons ---
  describe('Multi-weapon firing with new weapons', () => {
    it('fires all 4 weapons independently', () => {
      useWeapons.setState({
        activeWeapons: [
          { weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0 },
          { weaponId: 'RAILGUN', level: 1, cooldownTimer: 0 },
          { weaponId: 'SHOTGUN', level: 1, cooldownTimer: 0 },
          { weaponId: 'TRI_SHOT', level: 1, cooldownTimer: 0 },
        ],
        projectiles: [],
      })
      useWeapons.getState().tick(0.01, [0, 0, 0], 0)
      const projs = useWeapons.getState().projectiles
      // LASER: 1, RAILGUN: 1, SHOTGUN: 7, TRI_SHOT: 3 = 12
      expect(projs.length).toBe(12)
    })
  })
})
