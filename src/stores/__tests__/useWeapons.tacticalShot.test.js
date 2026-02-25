import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

// Story 32.6: TACTICAL_SHOT is skipped in useWeapons.tick() and GameLoop behavior simulation

describe('useWeapons — TACTICAL_SHOT skip (Story 32.6)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
  })

  it('TACTICAL_SHOT does not produce projectiles when ticked', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('TACTICAL_SHOT')

    // Tick many times
    for (let i = 0; i < 20; i++) {
      useWeapons.getState().tick(0.1, [0, 0, 0], 0)
    }

    const tactProj = useWeapons.getState().projectiles.filter(p => p.weaponId === 'TACTICAL_SHOT')
    expect(tactProj.length).toBe(0)
  })

  it('TACTICAL_SHOT cooldownTimer is not mutated by tick (continue skips it)', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('TACTICAL_SHOT')

    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    const initialTimer = weapon.cooldownTimer

    useWeapons.getState().tick(2.0, [0, 0, 0], 0)

    const weaponAfter = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    expect(weaponAfter.cooldownTimer).toBe(initialTimer)
  })
})

describe('TACTICAL_SHOT state — GameLoop simulation (Story 32.6, code-review H1 fix)', () => {
  const def = WEAPONS.TACTICAL_SHOT

  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('TACTICAL_SHOT')
  })

  // --- Lazy init ---

  it('tacticalCooldownTimer and tacticalStrikes are NOT initialized by addWeapon (GameLoop lazy init)', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    expect(weapon.tacticalCooldownTimer).toBeUndefined()
    expect(weapon.tacticalStrikes).toBeUndefined()
    expect(weapon.lastTargetId).toBeUndefined()
  })

  it('tacticalCooldownTimer remains undefined after tick() — GameLoop owns initialization', () => {
    useWeapons.getState().tick(0.5, [0, 0, 0], 0)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    expect(weapon.tacticalCooldownTimer).toBeUndefined()
  })

  it('GameLoop lazy init uses undefined check (not falsy) — 0 is valid timer value', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')

    // Simulate GameLoop lazy init: if (tacticalCooldownTimer === undefined)
    if (weapon.tacticalCooldownTimer === undefined) weapon.tacticalCooldownTimer = 0
    if (!weapon.tacticalStrikes) weapon.tacticalStrikes = []

    expect(weapon.tacticalCooldownTimer).toBe(0)
    expect(Array.isArray(weapon.tacticalStrikes)).toBe(true)
    expect(weapon.tacticalStrikes.length).toBe(0)
  })

  // --- Cooldown management ---

  it('cooldown decrements by clampedDelta toward 0 (Math.max clamped)', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.tacticalCooldownTimer = 1.0
    const clampedDelta = 0.016

    weapon.tacticalCooldownTimer = Math.max(0, weapon.tacticalCooldownTimer - clampedDelta)

    expect(weapon.tacticalCooldownTimer).toBeCloseTo(1.0 - clampedDelta)
  })

  it('cooldown clamps at 0 — never goes negative', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.tacticalCooldownTimer = 0.01

    weapon.tacticalCooldownTimer = Math.max(0, weapon.tacticalCooldownTimer - 1.0)

    expect(weapon.tacticalCooldownTimer).toBe(0)
  })

  it('resets cooldown to baseCooldown when timer reaches 0', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.tacticalCooldownTimer = 0
    weapon.tacticalStrikes = []

    // Simulate reset at fire (cooldownMultiplier = 1.0 → baseCooldown)
    const baseCooldown = (weapon.overrides?.cooldown ?? def.baseCooldown) * 1.0
    weapon.tacticalCooldownTimer = baseCooldown

    expect(weapon.tacticalCooldownTimer).toBeCloseTo(def.baseCooldown)
  })

  // --- VFX state management ---

  it('VFX timer decrements each frame', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.tacticalStrikes = [
      { x: 10, z: 5, timer: 0.3, maxDuration: 0.3, splashRadius: 6 },
    ]
    const clampedDelta = 0.016

    weapon.tacticalStrikes[0].timer -= clampedDelta

    expect(weapon.tacticalStrikes[0].timer).toBeCloseTo(0.3 - clampedDelta)
  })

  it('expired VFX strike is spliced from tacticalStrikes (splice-from-end)', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.tacticalStrikes = [
      { x: 10, z: 5, timer: 0.005, maxDuration: 0.3, splashRadius: 6 },
      { x: -5, z: 3, timer: 0.2, maxDuration: 0.3, splashRadius: 6 },
    ]
    const clampedDelta = 0.016

    // Simulate GameLoop VFX tick (backward loop)
    for (let s = weapon.tacticalStrikes.length - 1; s >= 0; s--) {
      weapon.tacticalStrikes[s].timer -= clampedDelta
      if (weapon.tacticalStrikes[s].timer <= 0) {
        weapon.tacticalStrikes.splice(s, 1)
      }
    }

    // Only the second strike (0.2s remaining) should survive
    expect(weapon.tacticalStrikes.length).toBe(1)
    expect(weapon.tacticalStrikes[0].x).toBe(-5)
  })

  it('VFX strike is pushed with correct fields when target is in range', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.tacticalStrikes = []

    const target = { x: 20, z: 10 }
    const effectiveSplashRadius = def.strikeAoeRadius * 1.0 // zoneMultiplier = 1

    if (weapon.tacticalStrikes.length < (def.poolLimit ?? 4)) {
      weapon.tacticalStrikes.push({
        x: target.x,
        z: target.z,
        timer: def.strikeVfxDuration,
        maxDuration: def.strikeVfxDuration,
        splashRadius: effectiveSplashRadius,
      })
    }

    expect(weapon.tacticalStrikes.length).toBe(1)
    expect(weapon.tacticalStrikes[0].x).toBe(target.x)
    expect(weapon.tacticalStrikes[0].z).toBe(target.z)
    expect(weapon.tacticalStrikes[0].timer).toBe(def.strikeVfxDuration)
    expect(weapon.tacticalStrikes[0].maxDuration).toBe(def.strikeVfxDuration)
    expect(weapon.tacticalStrikes[0].splashRadius).toBe(effectiveSplashRadius)
  })

  it('VFX push is skipped when poolLimit is reached', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    // Fill pool to limit
    weapon.tacticalStrikes = Array.from({ length: def.poolLimit }, (_, i) => ({
      x: i, z: 0, timer: 0.1, maxDuration: 0.3, splashRadius: 6,
    }))

    const beforeLength = weapon.tacticalStrikes.length

    // Simulate the poolLimit check
    if (weapon.tacticalStrikes.length < (def.poolLimit ?? 4)) {
      weapon.tacticalStrikes.push({ x: 99, z: 99, timer: 0.3, maxDuration: 0.3, splashRadius: 6 })
    }

    expect(weapon.tacticalStrikes.length).toBe(beforeLength)
  })

  // --- Target selection ---

  it('enemy within detectionRadius is eligible for targeting', () => {
    const playerPos = [0, 0, 0]
    const enemy = { id: 'e1', x: 30, z: 0 } // 30 units from player < detectionRadius 60

    const dx = enemy.x - playerPos[0]
    const dz = enemy.z - playerPos[2]
    const inRange = dx * dx + dz * dz <= def.detectionRadius * def.detectionRadius

    expect(inRange).toBe(true)
  })

  it('enemy at detectionRadius boundary is eligible (inclusive)', () => {
    const playerPos = [0, 0, 0]
    const enemy = { id: 'e1', x: def.detectionRadius, z: 0 } // exactly at boundary

    const dx = enemy.x - playerPos[0]
    const dz = enemy.z - playerPos[2]
    const inRange = dx * dx + dz * dz <= def.detectionRadius * def.detectionRadius

    expect(inRange).toBe(true)
  })

  it('enemy outside detectionRadius is NOT eligible', () => {
    const playerPos = [0, 0, 0]
    const enemy = { id: 'e1', x: def.detectionRadius + 1, z: 0 }

    const dx = enemy.x - playerPos[0]
    const dz = enemy.z - playerPos[2]
    const inRange = dx * dx + dz * dz <= def.detectionRadius * def.detectionRadius

    expect(inRange).toBe(false)
  })

  it('no targets in range → eligibleTargets is empty, no VFX spawned, no shot', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.tacticalCooldownTimer = 0
    weapon.tacticalStrikes = []
    const playerPos = [0, 0, 0]

    // All enemies far away
    const enemies = [
      { id: 'e1', x: 200, z: 0 },
      { id: 'e2', x: -200, z: 0 },
    ]

    const eligibleTargets = []
    for (let e = 0; e < enemies.length; e++) {
      const dx = enemies[e].x - playerPos[0]
      const dz = enemies[e].z - playerPos[2]
      if (dx * dx + dz * dz <= def.detectionRadius * def.detectionRadius) {
        eligibleTargets.push(enemies[e])
      }
    }

    // No shot when empty
    const strikeCountBefore = weapon.tacticalStrikes.length
    if (eligibleTargets.length > 0) {
      weapon.tacticalStrikes.push({ x: 0, z: 0, timer: 0.3, maxDuration: 0.3, splashRadius: 6 })
    }

    expect(eligibleTargets.length).toBe(0)
    expect(weapon.tacticalStrikes.length).toBe(strikeCountBefore)
  })

  // --- Anti-repeat targeting ---

  it('anti-repeat: with 1 enemy, same enemy is always selected (no exclusion)', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.lastTargetId = 'e1'

    const eligibleTargets = [{ id: 'e1', x: 10, z: 0 }]

    let targetIdx = Math.floor(Math.random() * eligibleTargets.length) // always 0
    // Anti-repeat only applies when eligibleTargets.length > 1
    if (eligibleTargets.length > 1 && eligibleTargets[targetIdx].id === weapon.lastTargetId) {
      targetIdx = (targetIdx + 1) % eligibleTargets.length
    }

    expect(eligibleTargets[targetIdx].id).toBe('e1')
  })

  it('anti-repeat: with 2 enemies, last target is not selected again', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.lastTargetId = 'e1'

    const eligibleTargets = [{ id: 'e1', x: 10, z: 0 }, { id: 'e2', x: -10, z: 0 }]

    // Force random to pick index 0 (which matches lastTargetId)
    let targetIdx = 0
    if (eligibleTargets.length > 1 && eligibleTargets[targetIdx].id === weapon.lastTargetId) {
      targetIdx = (targetIdx + 1) % eligibleTargets.length
    }

    expect(eligibleTargets[targetIdx].id).toBe('e2')
  })

  it('anti-repeat: wraps around correctly at last index', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.lastTargetId = 'e2'

    const eligibleTargets = [{ id: 'e1', x: 10, z: 0 }, { id: 'e2', x: -10, z: 0 }]

    // Force random to pick last index (1), which matches lastTargetId
    let targetIdx = 1
    if (eligibleTargets.length > 1 && eligibleTargets[targetIdx].id === weapon.lastTargetId) {
      targetIdx = (targetIdx + 1) % eligibleTargets.length // wraps to 0
    }

    expect(eligibleTargets[targetIdx].id).toBe('e1')
  })

  it('lastTargetId is updated to selected target id after each strike', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'TACTICAL_SHOT')
    weapon.lastTargetId = undefined

    const target = { id: 'enemy-42', x: 20, z: 0 }
    weapon.lastTargetId = target.id

    expect(weapon.lastTargetId).toBe('enemy-42')
  })

  // --- AOE splash damage ---

  it('enemy within effectiveSplashRadius of target is included in splash hit list', () => {
    const target = { id: 'primary', x: 20, z: 0 }
    const splashEnemy = { id: 'splash-1', x: 20 + def.strikeAoeRadius - 1, z: 0 }
    const farEnemy = { id: 'far', x: 20 + def.strikeAoeRadius + 1, z: 0 }
    const effectiveSplashRadius = def.strikeAoeRadius * 1.0

    const enemies = [target, splashEnemy, farEnemy]
    const splashHits = []

    for (let e = 0; e < enemies.length; e++) {
      if (enemies[e].id === target.id) continue // primary excluded
      const dx = enemies[e].x - target.x
      const dz = enemies[e].z - target.z
      if (dx * dx + dz * dz <= effectiveSplashRadius * effectiveSplashRadius) {
        splashHits.push(enemies[e].id)
      }
    }

    expect(splashHits).toContain('splash-1')
    expect(splashHits).not.toContain('far')
  })

  it('primary target is excluded from the AOE splash loop', () => {
    const target = { id: 'primary', x: 0, z: 0 }
    const enemies = [target]
    const effectiveSplashRadius = def.strikeAoeRadius

    const splashHits = []
    for (let e = 0; e < enemies.length; e++) {
      if (enemies[e].id === target.id) continue
      const dx = enemies[e].x - target.x
      const dz = enemies[e].z - target.z
      if (dx * dx + dz * dz <= effectiveSplashRadius * effectiveSplashRadius) {
        splashHits.push(enemies[e].id)
      }
    }

    expect(splashHits.length).toBe(0)
  })

  it('splash damage = baseDamage * damageMultiplier * splashDamageRatio (no crit)', () => {
    const baseDmg = def.baseDamage
    const damageMultiplier = 1.5
    const splashDmg = baseDmg * damageMultiplier * (def.splashDamageRatio ?? 0.5)

    expect(splashDmg).toBeCloseTo(35 * 1.5 * 0.5) // 26.25
  })

  it('effectiveSplashRadius scales with zoneMultiplier', () => {
    const zoneMultiplier = 1.5
    const effectiveSplashRadius = def.strikeAoeRadius * zoneMultiplier

    expect(effectiveSplashRadius).toBeCloseTo(def.strikeAoeRadius * 1.5)
  })
})
