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

  // --- addWeapon / upgradeWeapon / getters (Story 3.2) ---

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
    useWeapons.getState().addWeapon('MISSILE_HOMING')
    useWeapons.getState().addWeapon('PLASMA_BOLT')
    useWeapons.getState().addWeapon('EXTRA_WEAPON')
    expect(useWeapons.getState().activeWeapons.length).toBe(4)
  })

  it('should upgrade weapon level via upgradeWeapon', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT')
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.level).toBe(2)
  })

  it('should not upgrade weapon beyond level 9', () => {
    useWeapons.getState().initializeWeapons()
    // Force level to 9
    const state = useWeapons.getState()
    state.activeWeapons[0].level = 9
    useWeapons.setState({ activeWeapons: [...state.activeWeapons] })

    useWeapons.getState().upgradeWeapon('LASER_FRONT')
    expect(useWeapons.getState().activeWeapons[0].level).toBe(9)
  })

  it('should not upgrade non-existent weapon', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('NONEXISTENT')
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

  // --- Story 3.3: Upgrade curve tests ---

  it('should have 8 upgrade tiers (levels 2-9) for LASER_FRONT', () => {
    expect(WEAPONS.LASER_FRONT.upgrades.length).toBe(8)
    WEAPONS.LASER_FRONT.upgrades.forEach((u, i) => {
      expect(u.level).toBe(i + 2)
      expect(u.damage).toBeGreaterThan(0)
      expect(u.cooldown).toBeGreaterThan(0)
      expect(typeof u.statPreview).toBe('string')
    })
  })

  it('should have 8 upgrade tiers (levels 2-9) for SPREAD_SHOT', () => {
    expect(WEAPONS.SPREAD_SHOT.upgrades.length).toBe(8)
    WEAPONS.SPREAD_SHOT.upgrades.forEach((u, i) => {
      expect(u.level).toBe(i + 2)
      expect(u.damage).toBeGreaterThan(0)
      expect(u.cooldown).toBeGreaterThan(0)
      expect(typeof u.statPreview).toBe('string')
    })
  })

  it('should have 8 upgrade tiers (levels 2-9) for MISSILE_HOMING', () => {
    expect(WEAPONS.MISSILE_HOMING.upgrades.length).toBe(8)
    WEAPONS.MISSILE_HOMING.upgrades.forEach((u, i) => {
      expect(u.level).toBe(i + 2)
      expect(u.damage).toBeGreaterThan(0)
      expect(u.cooldown).toBeGreaterThan(0)
      expect(typeof u.statPreview).toBe('string')
    })
  })

  it('should have 8 upgrade tiers (levels 2-9) for PLASMA_BOLT', () => {
    expect(WEAPONS.PLASMA_BOLT.upgrades.length).toBe(8)
    WEAPONS.PLASMA_BOLT.upgrades.forEach((u, i) => {
      expect(u.level).toBe(i + 2)
      expect(u.damage).toBeGreaterThan(0)
      expect(u.cooldown).toBeGreaterThan(0)
      expect(typeof u.statPreview).toBe('string')
    })
  })

  it('should have smoothly scaling damage curves (each level >= previous)', () => {
    for (const key of Object.keys(WEAPONS)) {
      const w = WEAPONS[key]
      let prevDamage = w.baseDamage
      for (const u of w.upgrades) {
        expect(u.damage).toBeGreaterThanOrEqual(prevDamage)
        prevDamage = u.damage
      }
    }
  })

  it('should have smoothly decreasing cooldown curves (each level <= previous)', () => {
    for (const key of Object.keys(WEAPONS)) {
      const w = WEAPONS[key]
      let prevCooldown = w.baseCooldown
      for (const u of w.upgrades) {
        expect(u.cooldown).toBeLessThanOrEqual(prevCooldown)
        prevCooldown = u.cooldown
      }
    }
  })

  // --- Story 3.3: Multi-weapon firing tests ---

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
      activeWeapons: [{ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0 }],
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
      activeWeapons: [{ weaponId: 'SPREAD_SHOT', level: 1, cooldownTimer: 0 }],
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

  it('should apply upgrade visual overrides to projectile color at threshold level', () => {
    useWeapons.getState().initializeWeapons()
    // Upgrade LASER_FRONT to level 5 (has upgradeVisuals.color)
    for (let i = 0; i < 4; i++) useWeapons.getState().upgradeWeapon('LASER_FRONT')
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.level).toBe(5)

    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.color).toBe(WEAPONS.LASER_FRONT.upgrades[3].upgradeVisuals.color)
  })

  it('should apply upgrade visual meshScale override at threshold level', () => {
    useWeapons.getState().initializeWeapons()
    // Upgrade LASER_FRONT to level 8 (has upgradeVisuals.meshScale)
    for (let i = 0; i < 7; i++) useWeapons.getState().upgradeWeapon('LASER_FRONT')
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.level).toBe(8)

    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.meshScale).toEqual(WEAPONS.LASER_FRONT.upgrades[6].upgradeVisuals.meshScale)
  })

  it('should scale damage/cooldown correctly through all upgrade levels 1-9', () => {
    useWeapons.getState().initializeWeapons()

    // Verify base stats at level 1
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles[0].damage).toBe(WEAPONS.LASER_FRONT.baseDamage)

    // Upgrade through all levels and verify each
    for (let targetLevel = 2; targetLevel <= 9; targetLevel++) {
      useWeapons.getState().upgradeWeapon('LASER_FRONT')
      const weapon = useWeapons.getState().activeWeapons[0]
      expect(weapon.level).toBe(targetLevel)

      const tier = WEAPONS.LASER_FRONT.upgrades[targetLevel - 2]
      expect(weapon.overrides.damage).toBe(tier.damage)
      expect(weapon.overrides.cooldown).toBe(tier.cooldown)
    }
  })

  it('should persist upgrade visual overrides past non-threshold levels', () => {
    useWeapons.getState().initializeWeapons()
    // Upgrade LASER_FRONT to level 5 (has upgradeVisuals.color: '#44ffff')
    for (let i = 0; i < 4; i++) useWeapons.getState().upgradeWeapon('LASER_FRONT')
    expect(useWeapons.getState().activeWeapons[0].level).toBe(5)

    // Upgrade to level 6 (no upgradeVisuals in tier) — visual should persist
    useWeapons.getState().upgradeWeapon('LASER_FRONT')
    expect(useWeapons.getState().activeWeapons[0].level).toBe(6)

    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    // Color should still be the level 5 override, NOT base color
    expect(p.color).toBe(WEAPONS.LASER_FRONT.upgrades[3].upgradeVisuals.color)
  })

  it('should use base visuals when upgrade tier has no upgradeVisuals', () => {
    useWeapons.getState().initializeWeapons()
    // Upgrade LASER_FRONT to level 2 (no upgradeVisuals)
    useWeapons.getState().upgradeWeapon('LASER_FRONT')

    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.color).toBe(WEAPONS.LASER_FRONT.projectileColor)
    expect(p.meshScale).toEqual(WEAPONS.LASER_FRONT.projectileMeshScale)
  })

  it('should mark homing projectiles with homing flag', () => {
    useWeapons.getState().reset()
    useWeapons.setState({
      activeWeapons: [{ weaponId: 'MISSILE_HOMING', level: 1, cooldownTimer: 0 }],
      projectiles: [],
    })

    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const projs = useWeapons.getState().projectiles
    expect(projs.length).toBe(1)
    expect(projs[0].homing).toBe(true)
  })

  it('should handle tick with no active weapons gracefully', () => {
    // No initializeWeapons called — tick should not throw
    useWeapons.getState().tick(0.5, [0, 0, 0], 0)
    expect(useWeapons.getState().projectiles).toEqual([])
  })

  it('should fire upgraded projectile with overridden damage and cooldown', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT') // level 1 → 2

    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.level).toBe(2)
    expect(weapon.overrides).toBeDefined()
    expect(weapon.overrides.damage).toBe(WEAPONS.LASER_FRONT.upgrades[0].damage)

    // Fire upgraded projectile
    useWeapons.getState().tick(0.01, [0, 0, 0], 0)
    const p = useWeapons.getState().projectiles[0]
    expect(p.damage).toBe(WEAPONS.LASER_FRONT.upgrades[0].damage)
  })

  it('should use upgraded cooldown after weapon upgrade', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT') // level 1 → 2

    const upgradedCooldown = WEAPONS.LASER_FRONT.upgrades[0].cooldown

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

  // --- Story 3.4: Boon modifier integration tests ---

  it('should apply damageMultiplier from boon modifiers to projectile damage', () => {
    useWeapons.getState().initializeWeapons()
    const boonModifiers = { damageMultiplier: 1.5, cooldownMultiplier: 1, critChance: 0 }
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
    expect(p.damage).toBeCloseTo(WEAPONS.LASER_FRONT.baseDamage * 2, 5)
  })

  it('should not double damage when critChance = 0', () => {
    useWeapons.getState().initializeWeapons()
    const boonModifiers = { damageMultiplier: 1, cooldownMultiplier: 1, critChance: 0 }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)

    const p = useWeapons.getState().projectiles[0]
    expect(p.damage).toBe(WEAPONS.LASER_FRONT.baseDamage)
  })

  it('should layer boon damageMultiplier on top of weapon upgrade overrides', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().upgradeWeapon('LASER_FRONT') // level 1 → 2
    const upgradedDamage = WEAPONS.LASER_FRONT.upgrades[0].damage

    const boonModifiers = { damageMultiplier: 1.15, cooldownMultiplier: 1, critChance: 0 }
    useWeapons.getState().tick(0.01, [0, 0, 0], 0, boonModifiers)

    const p = useWeapons.getState().projectiles[0]
    expect(p.damage).toBeCloseTo(upgradedDamage * 1.15, 5)
  })
})
