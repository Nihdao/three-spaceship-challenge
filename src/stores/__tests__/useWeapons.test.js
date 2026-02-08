import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useWeapons store', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
  })

  it('should have correct initial state', () => {
    const state = useWeapons.getState()
    expect(state.activeWeapons).toEqual([])
    expect(state.projectiles).toEqual([])
  })

  it('should initialize with LASER_FRONT in slot 0', () => {
    useWeapons.getState().initializeWeapons()
    const state = useWeapons.getState()

    expect(state.activeWeapons.length).toBe(1)
    expect(state.activeWeapons[0].weaponId).toBe('LASER_FRONT')
    expect(state.activeWeapons[0].level).toBe(1)
    expect(state.activeWeapons[0].cooldownTimer).toBe(0)
    expect(state.projectiles).toEqual([])
  })

  it('should fire projectile when cooldown expires (timer starts at 0)', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const state = useWeapons.getState()
    expect(state.projectiles.length).toBe(1)
  })

  it('should not fire before cooldown expires', () => {
    useWeapons.getState().initializeWeapons()
    // Fire first shot (timer = 0)
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    // Try again immediately — cooldown was just reset to 0.5
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const state = useWeapons.getState()
    expect(state.projectiles.length).toBe(1) // still only 1
  })

  it('should fire again after cooldown resets', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0) // first shot
    useWeapons.getState().tick(WEAPONS.LASER_FRONT.baseCooldown + 0.01, [0, 0, 0], 0) // second shot

    const state = useWeapons.getState()
    expect(state.projectiles.length).toBe(2)
  })

  it('should create projectile at player position with forward offset', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [100, 0, -50], 0)

    const p = useWeapons.getState().projectiles[0]
    const fwd = GAME_CONFIG.PROJECTILE_SPAWN_FORWARD_OFFSET
    // rotation=0 → dirX=sin(0)=0, dirZ=-cos(0)=-1
    expect(p.x).toBeCloseTo(100, 5)
    expect(p.z).toBeCloseTo(-50 + (-1) * fwd, 5)
  })

  it('should create projectile with Y offset from config', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const p = useWeapons.getState().projectiles[0]
    expect(p.y).toBe(GAME_CONFIG.PROJECTILE_SPAWN_Y_OFFSET)
  })

  it('should apply forward offset along ship facing direction (rotation PI/2)', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [10, 0, 20], Math.PI / 2)

    const p = useWeapons.getState().projectiles[0]
    const fwd = GAME_CONFIG.PROJECTILE_SPAWN_FORWARD_OFFSET
    // rotation=PI/2 → dirX=sin(PI/2)=1, dirZ=-cos(PI/2)≈0
    expect(p.x).toBeCloseTo(10 + fwd, 3)
    expect(p.z).toBeCloseTo(20, 3)
  })

  it('should set correct direction for rotation 0 (facing -Z)', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const p = useWeapons.getState().projectiles[0]
    expect(p.dirX).toBeCloseTo(0, 5)
    expect(p.dirZ).toBeCloseTo(-1, 5)
  })

  it('should set correct direction for rotation PI/2 (facing +X)', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], Math.PI / 2)

    const p = useWeapons.getState().projectiles[0]
    expect(p.dirX).toBeCloseTo(1, 5)
    expect(p.dirZ).toBeCloseTo(0, 3)
  })

  it('should set correct direction for rotation PI (facing +Z)', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], Math.PI)

    const p = useWeapons.getState().projectiles[0]
    expect(p.dirX).toBeCloseTo(0, 3)
    expect(p.dirZ).toBeCloseTo(1, 3)
  })

  it('should create projectile with correct weapon stats', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const p = useWeapons.getState().projectiles[0]
    const def = WEAPONS.LASER_FRONT
    expect(p.speed).toBe(def.baseSpeed)
    expect(p.damage).toBe(def.baseDamage)
    expect(p.radius).toBe(def.projectileRadius)
    expect(p.lifetime).toBe(def.projectileLifetime)
    expect(p.color).toBe(def.projectileColor)
    expect(p.meshScale).toEqual(def.projectileMeshScale)
    expect(p.active).toBe(true)
    expect(p.elapsedTime).toBe(0)
    expect(p.weaponId).toBe('LASER_FRONT')
  })

  it('should generate unique projectile IDs', () => {
    useWeapons.getState().initializeWeapons()

    // Fire multiple shots
    for (let i = 0; i < 5; i++) {
      useWeapons.getState().tick(WEAPONS.LASER_FRONT.baseCooldown + 0.01, [0, 0, 0], 0)
    }

    const ids = useWeapons.getState().projectiles.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('should respect MAX_PROJECTILES cap', () => {
    useWeapons.getState().initializeWeapons()

    // Fire enough to reach cap
    for (let i = 0; i < GAME_CONFIG.MAX_PROJECTILES + 10; i++) {
      useWeapons.getState().tick(WEAPONS.LASER_FRONT.baseCooldown + 0.01, [0, 0, 0], 0)
    }

    expect(useWeapons.getState().projectiles.length).toBeLessThanOrEqual(GAME_CONFIG.MAX_PROJECTILES)
  })

  it('should cleanup inactive projectiles', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    useWeapons.getState().tick(WEAPONS.LASER_FRONT.baseCooldown + 0.01, [0, 0, 0], 0)

    expect(useWeapons.getState().projectiles.length).toBe(2)

    // Mark one inactive
    useWeapons.getState().projectiles[0].active = false
    useWeapons.getState().cleanupInactive()

    expect(useWeapons.getState().projectiles.length).toBe(1)
    expect(useWeapons.getState().projectiles[0].active).toBe(true)
  })

  it('should not call set() when no inactive projectiles', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const before = useWeapons.getState().projectiles
    useWeapons.getState().cleanupInactive()
    const after = useWeapons.getState().projectiles

    expect(after).toBe(before) // same reference — no unnecessary set() call
  })

  it('should reset all weapons and projectiles', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    useWeapons.getState().reset()

    const state = useWeapons.getState()
    expect(state.activeWeapons).toEqual([])
    expect(state.projectiles).toEqual([])
  })

  it('should handle tick with no active weapons gracefully', () => {
    // No initializeWeapons called — tick should not throw
    useWeapons.getState().tick(0.5, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles).toEqual([])
  })

  it('should have projectile fields required by collision system', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const p = useWeapons.getState().projectiles[0]
    expect(p).toHaveProperty('id')
    expect(p).toHaveProperty('x')
    expect(p).toHaveProperty('z')
    expect(p).toHaveProperty('radius')
    expect(typeof p.id).toBe('string')
    expect(typeof p.x).toBe('number')
    expect(typeof p.z).toBe('number')
    expect(typeof p.radius).toBe('number')
  })
})
