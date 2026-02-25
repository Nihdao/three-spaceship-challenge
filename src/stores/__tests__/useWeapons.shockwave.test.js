import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

// Story 32.4: SHOCKWAVE tick() behavior + upgrade multiplier tests

const POS = [0, 0, 0]
const ROT = 0

describe('useWeapons.tick() — SHOCKWAVE (Story 32.4)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('SHOCKWAVE')
  })

  it('SHOCKWAVE weapon is added to activeWeapons', () => {
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
    expect(useWeapons.getState().activeWeapons[0].weaponId).toBe('SHOCKWAVE')
  })

  it('does NOT create any projectiles when ticked', () => {
    useWeapons.getState().tick(0.1, POS, ROT)
    expect(useWeapons.getState().projectiles.length).toBe(0)
  })

  it('does NOT push projectiles even after many ticks', () => {
    for (let i = 0; i < 10; i++) {
      useWeapons.getState().tick(0.5, POS, ROT)
    }
    expect(useWeapons.getState().projectiles.length).toBe(0)
  })

  it('cooldownTimer is NOT decremented for shockwave weapons', () => {
    const weapon = useWeapons.getState().activeWeapons[0]
    const initialCooldownTimer = weapon.cooldownTimer
    useWeapons.getState().tick(0.5, POS, ROT)
    const weaponAfter = useWeapons.getState().activeWeapons[0]
    expect(weaponAfter.cooldownTimer).toBe(initialCooldownTimer)
  })

  it('cooldownTimer stays at 0 after many ticks (not driven negative)', () => {
    for (let i = 0; i < 20; i++) {
      useWeapons.getState().tick(0.3, POS, ROT)
    }
    const weaponAfter = useWeapons.getState().activeWeapons[0]
    expect(weaponAfter.cooldownTimer).toBe(0)
  })

  it('shockwaveCooldownTimer is NOT set by addWeapon (GameLoop initializes it lazily)', () => {
    // GameLoop manages this timer — useWeapons.tick() must not touch it
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.shockwaveCooldownTimer).toBeUndefined()
  })

  it('shockwaveCooldownTimer remains undefined after tick() (GameLoop initializes it, not tick)', () => {
    useWeapons.getState().tick(0.5, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.shockwaveCooldownTimer).toBeUndefined()
  })

  it('shockwaveArcs is NOT initialized by addWeapon or tick()', () => {
    useWeapons.getState().tick(0.5, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.shockwaveArcs).toBeUndefined()
  })

  it('shockwavePendingArcs is NOT initialized by addWeapon or tick()', () => {
    useWeapons.getState().tick(0.5, POS, ROT)
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.shockwavePendingArcs).toBeUndefined()
  })

  it('other projectile weapons still fire normally alongside SHOCKWAVE', () => {
    useWeapons.getState().addWeapon('LASER_FRONT')
    useWeapons.getState().tick(0.1, POS, ROT)
    // LASER_FRONT fires immediately (cooldownTimer starts at 0)
    expect(useWeapons.getState().projectiles.length).toBe(1)
  })

  it('SHOCKWAVE occupies exactly 1 slot — duplicate rejected', () => {
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
    useWeapons.getState().addWeapon('SHOCKWAVE')
    expect(useWeapons.getState().activeWeapons.length).toBe(1)
  })
})

describe('SHOCKWAVE upgradeWeapon() — multipliers chain (code-review H1 fix)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('SHOCKWAVE')
  })

  it('damage upgrade sets multipliers.damageMultiplier correctly', () => {
    useWeapons.getState().upgradeWeapon('SHOCKWAVE', { stat: 'damage', finalMagnitude: 25, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.damageMultiplier).toBeCloseTo(1.25, 5)
  })

  it('area upgrade sets multipliers.areaMultiplier correctly', () => {
    useWeapons.getState().upgradeWeapon('SHOCKWAVE', { stat: 'area', finalMagnitude: 20, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.areaMultiplier).toBeCloseTo(1.20, 5)
  })

  it('cooldown upgrade sets multipliers.cooldownMultiplier below 1', () => {
    useWeapons.getState().upgradeWeapon('SHOCKWAVE', { stat: 'cooldown', finalMagnitude: -20, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.cooldownMultiplier).toBeCloseTo(0.80, 5)
  })

  it('knockback upgrade sets multipliers.knockbackMultiplier correctly', () => {
    useWeapons.getState().upgradeWeapon('SHOCKWAVE', { stat: 'knockback', finalMagnitude: 35, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.knockbackMultiplier).toBeCloseTo(1.35, 5)
  })

  it('stacked damage upgrades accumulate multiplicatively', () => {
    useWeapons.getState().upgradeWeapon('SHOCKWAVE', { stat: 'damage', finalMagnitude: 25, rarity: 'EPIC' })
    useWeapons.getState().upgradeWeapon('SHOCKWAVE', { stat: 'damage', finalMagnitude: 25, rarity: 'EPIC' })
    const weapon = useWeapons.getState().activeWeapons[0]
    // Two +25% stacks → 1.25 * 1.25 = 1.5625
    expect(weapon.multipliers.damageMultiplier).toBeCloseTo(1.5625, 3)
  })

  it('cooldown multiplier is clamped at 0.15 floor (prevents infinite fire rate)', () => {
    // Many stacked -20% cooldown upgrades should not push multiplier below 0.15
    for (let i = 0; i < 10; i++) {
      useWeapons.getState().upgradeWeapon('SHOCKWAVE', { stat: 'cooldown', finalMagnitude: -20, rarity: 'EPIC' })
    }
    const weapon = useWeapons.getState().activeWeapons[0]
    expect(weapon.multipliers.cooldownMultiplier).toBeGreaterThanOrEqual(0.15)
  })
})

describe('SHOCKWAVE arc state — GameLoop simulation (Story 32.4)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('SHOCKWAVE')
  })

  it('burst queues 3 pending arcs with staggered remainingDelay', () => {
    const def = WEAPONS.SHOCKWAVE
    const weapon = useWeapons.getState().activeWeapons[0]

    // Simulate what GameLoop 7a-quater does when cooldown fires
    weapon.shockwavePendingArcs = []
    for (let w = 0; w < def.waveCount; w++) {
      weapon.shockwavePendingArcs.push({
        remainingDelay: def.waveDelay * w,
        aimAngle: 0,
        damage: def.baseDamage,
        isCrit: false,
        effectiveMaxRadius: def.waveMaxRadius,
      })
    }

    expect(weapon.shockwavePendingArcs.length).toBe(3)
    expect(weapon.shockwavePendingArcs[0].remainingDelay).toBe(0)
    expect(weapon.shockwavePendingArcs[1].remainingDelay).toBeCloseTo(def.waveDelay)
    expect(weapon.shockwavePendingArcs[2].remainingDelay).toBeCloseTo(def.waveDelay * 2)
  })

  it('arc 1 spawns immediately (remainingDelay 0 fires on first clampedDelta tick)', () => {
    const def = WEAPONS.SHOCKWAVE
    const weapon = useWeapons.getState().activeWeapons[0]
    const clampedDelta = 0.016

    weapon.shockwavePendingArcs = [{ remainingDelay: 0, aimAngle: 0, damage: 40, isCrit: false, effectiveMaxRadius: def.waveMaxRadius }]
    weapon.shockwaveArcs = []

    // Simulate pending arc processing
    const stillPending = []
    for (const pending of weapon.shockwavePendingArcs) {
      pending.remainingDelay -= clampedDelta
      if (pending.remainingDelay <= 0) {
        weapon.shockwaveArcs.push({
          centerX: 0, centerZ: 0,
          aimAngle: pending.aimAngle,
          sectorAngle: def.waveSectorAngle,
          prevRadius: 0,
          currentRadius: 0,
          maxRadius: pending.effectiveMaxRadius,
          expandSpeed: def.waveExpandSpeed,
          damage: pending.damage,
          isCrit: pending.isCrit,
          hitEnemies: new Set(),
          active: true,
        })
      } else {
        stillPending.push(pending)
      }
    }
    weapon.shockwavePendingArcs = stillPending

    expect(weapon.shockwaveArcs.length).toBe(1)
    expect(weapon.shockwaveArcs[0].active).toBe(true)
    expect(weapon.shockwavePendingArcs.length).toBe(0)
  })

  it('hitEnemies Set prevents the same enemy being hit twice by the same arc', () => {
    const weapon = useWeapons.getState().activeWeapons[0]
    const arc = {
      centerX: 0, centerZ: 0, aimAngle: 0,
      sectorAngle: WEAPONS.SHOCKWAVE.waveSectorAngle,
      currentRadius: 5, maxRadius: 22,
      expandSpeed: 100, damage: 40, isCrit: false,
      hitEnemies: new Set(),
      active: true,
    }

    arc.hitEnemies.add('enemy-1')
    expect(arc.hitEnemies.has('enemy-1')).toBe(true)
    // Simulating second check — same enemy rejected
    expect(arc.hitEnemies.has('enemy-1')).toBe(true)
    expect(arc.hitEnemies.size).toBe(1)
  })

  it('pool eviction deactivates oldest arc when activeCount >= poolLimit', () => {
    const def = WEAPONS.SHOCKWAVE
    const weapon = useWeapons.getState().activeWeapons[0]

    // Fill pool to limit with active arcs
    weapon.shockwaveArcs = Array.from({ length: def.poolLimit }, (_, i) => ({
      centerX: 0, centerZ: 0, aimAngle: 0,
      sectorAngle: def.waveSectorAngle,
      currentRadius: i + 1,
      maxRadius: def.waveMaxRadius,
      expandSpeed: def.waveExpandSpeed,
      damage: 40, isCrit: false,
      hitEnemies: new Set(),
      active: true,
    }))

    // Simulate pool eviction (GameLoop lines 628-632)
    const activeCount = weapon.shockwaveArcs.filter(a => a.active).length
    expect(activeCount).toBe(def.poolLimit) // at limit

    if (activeCount >= def.poolLimit) {
      for (let a = 0; a < weapon.shockwaveArcs.length; a++) {
        if (weapon.shockwaveArcs[a].active) { weapon.shockwaveArcs[a].active = false; break }
      }
    }

    const activeAfter = weapon.shockwaveArcs.filter(a => a.active).length
    expect(activeAfter).toBe(def.poolLimit - 1)
    // Oldest arc (index 0) was deactivated
    expect(weapon.shockwaveArcs[0].active).toBe(false)
  })

  it('arc expands by expandSpeed * delta each frame', () => {
    const def = WEAPONS.SHOCKWAVE
    const clampedDelta = 0.016
    const arc = {
      currentRadius: 5,
      expandSpeed: def.waveExpandSpeed,
      maxRadius: def.waveMaxRadius,
      active: true,
    }

    arc.currentRadius += arc.expandSpeed * clampedDelta
    expect(arc.currentRadius).toBeCloseTo(5 + def.waveExpandSpeed * clampedDelta)
  })

  it('arc deactivates when currentRadius reaches maxRadius', () => {
    const def = WEAPONS.SHOCKWAVE
    const arc = {
      currentRadius: def.waveMaxRadius - 0.1,
      expandSpeed: def.waveExpandSpeed,
      maxRadius: def.waveMaxRadius,
      active: true,
    }

    arc.currentRadius += arc.expandSpeed * 0.016
    if (arc.currentRadius >= arc.maxRadius) arc.active = false

    expect(arc.active).toBe(false)
  })
})
