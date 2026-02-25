import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

// Helper: create a mock upgradeResult for tests that just need level increment
const mockUpgrade = (stat = 'damage', finalMagnitude = 8, rarity = 'COMMON') => ({ stat, finalMagnitude, rarity })

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
    // Try again immediately — cooldown was just reset
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

  it('should create projectile with correct base weapon stats (no upgrades)', () => {
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

  // --- addWeapon / upgradeWeapon / getters ---

  it('should add a new weapon via addWeapon', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('SPREAD_SHOT')
    const weapons = useWeapons.getState().activeWeapons
    expect(weapons.length).toBe(2)
    expect(weapons[1].weaponId).toBe('SPREAD_SHOT')
    expect(weapons[1].level).toBe(1)
  })

  it('should not add duplicate weapon via addWeapon', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('LASER_FRONT')
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
  })

  it('should cap at 4 weapons via addWeapon', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('SPREAD_SHOT')
    useWeapons.getState().addWeapon('BEAM')
    useWeapons.getState().addWeapon('EXPLOSIVE_ROUND')
    useWeapons.getState().addWeapon('LASER_CROSS') // 5th — should be ignored
    expect(useWeapons.getState().activeWeapons.length).toBe(4)
  })

  it('should upgrade weapon level via upgradeWeapon', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade())
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.level).toBe(2)
  })

  it('should not upgrade weapon beyond level 9', () => {
    useWeapons.getState().initializeWeapons()
    // Force level to 9
    const state = useWeapons.getState()
    state.activeWeapons[0].level = 9
    useWeapons.setState({ activeWeapons: [...state.activeWeapons] })

    useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade())
    expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
  })

  it('should not upgrade non-existent weapon', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('NONEXISTENT', mockUpgrade())
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
    expect(useWeapons.getState().activeWeapons[0].level).toBe(1)
  })

  it('getEquippedWeaponIds returns array of IDs', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('SPREAD_SHOT')
    expect(useWeapons.getState().getEquippedWeaponIds()).toEqual(['LASER_FRONT', 'SPREAD_SHOT'])
  })

  it('getWeaponLevel returns level for equipped weapon', () => {
    useWeapons.getState().initializeWeapons()
    expect(useWeapons.getState().getWeaponLevel('LASER_FRONT')).toBe(1)
  })

  it('getWeaponLevel returns 0 for non-equipped weapon', () => {
    useWeapons.getState().initializeWeapons()
    expect(useWeapons.getState().getWeaponLevel('SPREAD_SHOT')).toBe(0)
  })

  // --- Story 31.2: Multiplier-based damage/cooldown ---

  it('damage scales via multiplier after upgrade (not fixed overrides)', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade('damage', 8))

    useWeapons.getState().tick(0.01, [0, 0, 0], 0, { critChance: -1 })
    const p = useWeapons.getState().projectiles[0]
    const def = WEAPONS.LASER_FRONT
    expect(p.damage).toBeCloseTo(def.baseDamage * 1.08, 4)
  })

  it('upgraded cooldown is shorter using multiplier', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade('cooldown', -6))

    const upgradedCooldown = WEAPONS.LASER_FRONT.baseCooldown * 0.94

    // First shot (timer was 0)
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles.length).toBe(1)

    // Tick with just under upgraded cooldown — should NOT fire
    useWeapons.getState().tick(upgradedCooldown - 0.02, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles.length).toBe(1)

    // Tick to pass upgraded cooldown — should fire
    useWeapons.getState().tick(0.03, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles.length).toBe(2)
  })

  it('color is always def.projectileColor regardless of upgrade', () => {
    useWeapons.getState().initializeWeapons()
    // Multiple upgrades
    for (let i = 0; i < 4; i++) {
      useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade())
    }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.color).toBe(WEAPONS.LASER_FRONT.projectileColor)
    expect(p.meshScale).toEqual(WEAPONS.LASER_FRONT.projectileMeshScale)
  })

  // --- Multi-weapon firing tests ---

  it('should fire both weapons independently with their own cooldowns', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('SPREAD_SHOT')

    // Both fire on first tick (cooldown starts at 0)
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    // LASER fires 1 projectile, SPREAD fires 3 (spread pattern)
    const count = useWeapons.getState().projectiles.length
    expect(count).toBe(4) // 1 laser + 3 spread
  })

  it('should produce 3 projectiles for SPREAD_SHOT per fire event', () => {
    useWeapons.getState().reset()
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } }],
      projectiles: [],
    })

    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    expect(projs.length).toBe(3)
    // All should be SPREAD_SHOT
    projs.forEach(p => expect(p.weaponId).toBe('SPREAD_SHOT'))
  })

  it('should spread projectiles at correct angles', () => {
    useWeapons.getState().reset()
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0, multipliers: { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: 0 } }],
      projectiles: [],
    })

    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    // Center projectile should go straight forward (dirX ~ 0, dirZ ~ -1)
    expect(projs[1].dirX).toBeCloseTo(0, 1)
    expect(projs[1].dirZ).toBeCloseTo(-1, 1)
    // Left and right should have offset dirX
    expect(projs[0].dirX).toBeLessThan(projs[1].dirX)
    expect(projs[2].dirX).toBeGreaterThan(projs[1].dirX)
  })

  it('should carry correct color and meshScale from weapon definition', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.color).toBe(WEAPONS.LASER_FRONT.projectileColor)
    expect(p.meshScale).toEqual(WEAPONS.LASER_FRONT.projectileMeshScale)
  })

  it('should handle tick with no active weapons gracefully', () => {
    // No initializeWeapons called — tick should not throw
    useWeapons.getState().tick(0.5, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles).toEqual([])
  })

  // --- Story 3.4: Boon modifier integration tests ---

  it('should apply damageMultiplier from boon modifiers to projectile damage', () => {
    useWeapons.getState().initializeWeapons()
    const boonModifiers = { damageMultiplier: 1.5, cooldownMultiplier: 1, critChance: -1 }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)

    const p = useWeapons.getState().projectiles[0]
    expect(p.damage).toBeCloseTo(WEAPONS.LASER_FRONT.baseDamage * 1.5, 5)
  })

  it('should apply cooldownMultiplier from boon modifiers to weapon cooldown', () => {
    useWeapons.getState().initializeWeapons()
    const boonModifiers = { damageMultiplier: 1, cooldownMultiplier: 0.5, critChance: 0 }

    // First shot (timer starts at 0)
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)
    expect(useWeapons.getState().projectiles.length).toBe(1)

    // Cooldown should be baseCooldown * 0.5
    const effectiveCooldown = WEAPONS.LASER_FRONT.baseCooldown * 0.5

    // Tick with just under effective cooldown — should NOT fire
    useWeapons.getState().tick(effectiveCooldown - 0.02, [0, 0, 0], 0, boonModifiers)
    expect(useWeapons.getState().projectiles.length).toBe(1)

    // Tick past effective cooldown — should fire
    useWeapons.getState().tick(0.03, [0, 0, 0], 0, boonModifiers)
    expect(useWeapons.getState().projectiles.length).toBe(2)
  })

  it('should not modify damage or cooldown when no boon modifiers passed', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    const p = useWeapons.getState().projectiles[0]
    expect(p.damage).toBe(WEAPONS.LASER_FRONT.baseDamage)
  })

  it('should double damage on crit when critChance = 1 (guaranteed crit)', () => {
    useWeapons.getState().initializeWeapons()
    const boonModifiers = { damageMultiplier: 1, cooldownMultiplier: 1, critChance: 1 }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)

    const p = useWeapons.getState().projectiles[0]
    // critChance=1 guarantees crit; base damage * 2
    expect(p.damage).toBeCloseTo(WEAPONS.LASER_FRONT.baseDamage * 2, 5)
  })

  it('should not double damage when critChance = 0 and no weapon critBonus', () => {
    useWeapons.getState().initializeWeapons()
    // Override weapon multipliers to zero out critBonus to avoid def.critChance triggering
    useWeapons.getState().activeWeapons[0].multipliers = { damageMultiplier: 1.0, areaMultiplier: 1.0, cooldownMultiplier: 1.0, knockbackMultiplier: 1.0, critBonus: -1.0 }
    const boonModifiers = { damageMultiplier: 1, cooldownMultiplier: 1, critChance: 0 }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)

    const p = useWeapons.getState().projectiles[0]
    expect(p.damage).toBe(WEAPONS.LASER_FRONT.baseDamage)
  })

  // --- Story 18.1: System transition weapon persistence ---

  it('clearProjectiles should clear projectiles but preserve activeWeapons', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('SPREAD_SHOT')
    // Fire some projectiles
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles.length).toBeGreaterThan(0)
    expect(useWeapons.getState().activeWeapons.length).toBe(2)

    useWeapons.getState().clearProjectiles()

    expect(useWeapons.getState().projectiles).toEqual([])
    expect(useWeapons.getState().activeWeapons.length).toBe(2)
    expect(useWeapons.getState().activeWeapons[0].weaponId).toBe('LASER_FRONT')
    expect(useWeapons.getState().activeWeapons[1].weaponId).toBe('SPREAD_SHOT')
  })

  it('clearProjectiles should reset projectile ID counter', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    useWeapons.getState().clearProjectiles()
    // Fire again — IDs should restart from 0
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles[0].id).toBe('proj_0')
  })

  it('clearProjectiles should preserve weapon levels and multipliers', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('SPREAD_SHOT')
    // Upgrade LASER_FRONT to level 5
    for (let i = 0; i < 4; i++) useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade('damage', 8))
    // Fire some projectiles
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)

    useWeapons.getState().clearProjectiles()

    const weapons = useWeapons.getState().activeWeapons
    expect(weapons[0].level).toBe(5)
    expect(weapons[0].multipliers).toBeDefined()
    expect(weapons[0].multipliers.damageMultiplier).toBeCloseTo(1.08 ** 4, 4)
    expect(weapons[1].weaponId).toBe('SPREAD_SHOT')
    expect(weapons[1].level).toBe(1)
  })

  it('clearProjectiles should reset weapon cooldown timers for clean start', () => {
    useWeapons.getState().initializeWeapons()
    // Fire to set cooldown
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    expect(useWeapons.getState().activeWeapons[0].cooldownTimer).toBeGreaterThan(0)

    useWeapons.getState().clearProjectiles()

    // Cooldown timers reset so weapons fire immediately in new system
    expect(useWeapons.getState().activeWeapons[0].cooldownTimer).toBe(0)
  })

  it('clearProjectiles should preserve upgraded weapons through system transition flow', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('BEAM')
    // Upgrade LASER_FRONT to level 3
    useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade('damage', 8))
    useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade('damage', 8))
    // Upgrade BEAM to level 2
    useWeapons.getState().upgradeWeapon('BEAM', mockUpgrade('area', 6))
    // Fire projectiles
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles.length).toBeGreaterThan(0)

    // Simulate system transition: clearProjectiles (not reset)
    useWeapons.getState().clearProjectiles()

    expect(useWeapons.getState().projectiles).toEqual([])
    const weapons = useWeapons.getState().activeWeapons
    expect(weapons.length).toBe(2)
    expect(weapons[0].weaponId).toBe('LASER_FRONT')
    expect(weapons[0].level).toBe(3)
    expect(weapons[0].multipliers.damageMultiplier).toBeCloseTo(1.08 * 1.08, 5)
    expect(weapons[1].weaponId).toBe('BEAM')
    expect(weapons[1].level).toBe(2)

    // Weapons should fire immediately in new system (cooldown reset to 0)
    // Force no crit to make damage check deterministic (LASER_FRONT has def.critChance=0.05)
    useWeapons.getState().activeWeapons[0].multipliers.critBonus = -(WEAPONS.LASER_FRONT.critChance ?? 0)
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    expect(projs.length).toBeGreaterThan(0)
    // Upgraded damage applied to fired projectiles
    const laserProj = projs.find(p => p.weaponId === 'LASER_FRONT')
    expect(laserProj.damage).toBeCloseTo(WEAPONS.LASER_FRONT.baseDamage * 1.08 * 1.08, 4)
  })

  it('should layer boon damageMultiplier on top of weapon upgrade multiplier', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT', mockUpgrade('damage', 8))
    // Force no crit: LASER_FRONT has def.critChance=0.05 which makes this test non-deterministic
    useWeapons.getState().activeWeapons[0].multipliers.critBonus = -(WEAPONS.LASER_FRONT.critChance ?? 0)
    const upgradedBaseDamage = WEAPONS.LASER_FRONT.baseDamage * 1.08

    const boonModifiers = { damageMultiplier: 1.15, cooldownMultiplier: 1, critChance: 0 }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)

    const p = useWeapons.getState().projectiles[0]
    expect(p.damage).toBeCloseTo(upgradedBaseDamage * 1.15, 4)
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

  // --- Story 31.2: crit via weapon def + critBonus ---

  it('weapon def critChance contributes to totalCritChance', () => {
    // LASER_FRONT has critChance = 0.05 — with guaranteed boon crit 0.95+ we should get 100% crit
    useWeapons.getState().initializeWeapons()
    const boonModifiers = { damageMultiplier: 1, cooldownMultiplier: 1, critChance: 0.95, critMultiplier: 2 }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)

    const p = useWeapons.getState().projectiles[0]
    // totalCritChance = 0.05 + 0 + 0.95 = 1.0 → guaranteed crit
    expect(p.damage).toBeCloseTo(WEAPONS.LASER_FRONT.baseDamage * 2, 4)
    expect(p.isCrit).toBe(true)
  })

  it('critBonus from upgrade adds to totalCritChance', () => {
    useWeapons.getState().initializeWeapons()
    // Add enough crit upgrade to guarantee crits (critBonus large)
    const upgradeResult = { stat: 'crit', finalMagnitude: 90, rarity: 'LEGENDARY' } // +0.90 critBonus
    useWeapons.getState().upgradeWeapon('LASER_FRONT', upgradeResult)

    // 100 shots to check that at least some are crits (high probability)
    let critCount = 0
    for (let i = 0; i < 20; i++) {
      useWeapons.getState().clearProjectiles()
      useWeapons.getState().tick(WEAPONS.LASER_FRONT.baseCooldown + 0.01, [0, 0, 0], 0)
      const p = useWeapons.getState().projectiles[useWeapons.getState().projectiles.length - 1]
      if (p?.isCrit) critCount++
    }
    // With totalCritChance ~= 0.95+, nearly all shots should crit
    expect(critCount).toBeGreaterThan(15)
  })
})
