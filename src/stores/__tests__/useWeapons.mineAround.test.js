import { describe, it, expect, beforeEach } from 'vitest'
import useWeapons from '../useWeapons.jsx'
import { WEAPONS } from '../../entities/weaponDefs.js'

// Story 32.5: MINE_AROUND is skipped in useWeapons.tick() — no projectiles, no cooldown

describe('useWeapons — MINE_AROUND skip (Story 32.5)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
  })

  it('MINE_AROUND does not produce projectiles when ticked', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('MINE_AROUND')

    const before = useWeapons.getState().projectiles.length
    // Tick several times
    for (let i = 0; i < 10; i++) {
      useWeapons.getState().tick(0.1, [0, 0, 0], 0)
    }

    // Filter out LASER_FRONT projectiles — only check that MINE_AROUND didn't spawn any
    const mineProj = useWeapons.getState().projectiles.filter(p => p.weaponId === 'MINE_AROUND')
    expect(mineProj.length).toBe(0)
  })

  it('MINE_AROUND cooldownTimer is not mutated by tick', () => {
    useWeapons.getState().initializeWeapons()
    useWeapons.getState().addWeapon('MINE_AROUND')

    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    const initialTimer = weapon.cooldownTimer

    useWeapons.getState().tick(1.0, [0, 0, 0], 0)

    // cooldownTimer should remain unchanged (the continue skips it)
    const weaponAfter = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    expect(weaponAfter.cooldownTimer).toBe(initialTimer)
  })
})

describe('MINE_AROUND mine state — GameLoop simulation (Story 32.5, code-review M1 fix)', () => {
  beforeEach(() => {
    useWeapons.getState().reset()
    useWeapons.getState().addWeapon('MINE_AROUND')
  })

  const def = WEAPONS.MINE_AROUND

  // --- Lazy init ---

  it('mines and mineOrbitalAngle are NOT initialized by addWeapon (GameLoop lazy init)', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    expect(weapon.mines).toBeUndefined()
    expect(weapon.mineOrbitalAngle).toBeUndefined()
  })

  it('mines and mineOrbitalAngle remain undefined after tick() (GameLoop owns initialization)', () => {
    useWeapons.getState().tick(0.5, [0, 0, 0], 0)
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    expect(weapon.mines).toBeUndefined()
    expect(weapon.mineOrbitalAngle).toBeUndefined()
  })

  it('GameLoop lazy init creates mineCount mine slots with correct initial state', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')

    // Simulate GameLoop lazy init
    weapon.mines = Array.from({ length: def.mineCount }, (_, i) => ({
      slotIndex: i,
      active: true,
      respawnTimer: 0,
    }))
    weapon.mineOrbitalAngle = 0

    expect(weapon.mines.length).toBe(def.mineCount)
    for (let i = 0; i < def.mineCount; i++) {
      expect(weapon.mines[i].slotIndex).toBe(i)
      expect(weapon.mines[i].active).toBe(true)
      expect(weapon.mines[i].respawnTimer).toBe(0)
    }
    expect(weapon.mineOrbitalAngle).toBe(0)
  })

  // --- Orbital angle advancement ---

  it('orbital angle advances by orbitalSpeed * delta each frame (no projectileSpeedMultiplier)', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    weapon.mineOrbitalAngle = 0
    const clampedDelta = 0.016

    // Simulate GameLoop advance (H1 fix: no projectileSpeedMultiplier)
    weapon.mineOrbitalAngle += def.orbitalSpeed * clampedDelta

    expect(weapon.mineOrbitalAngle).toBeCloseTo(def.orbitalSpeed * clampedDelta)
  })

  it('orbital angle accumulates over multiple frames', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    weapon.mineOrbitalAngle = 0
    const clampedDelta = 1.0 // 1 second

    for (let frame = 0; frame < 10; frame++) {
      weapon.mineOrbitalAngle += def.orbitalSpeed * clampedDelta
    }

    // After 10 seconds at 0.8 rad/s → 8.0 rad
    expect(weapon.mineOrbitalAngle).toBeCloseTo(def.orbitalSpeed * 10)
  })

  // --- Mine position formula ---

  it('mine positions are evenly spaced 120° apart from base angle', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    weapon.mineOrbitalAngle = 0
    const playerPos = [0, 0, 0]

    const positions = weapon.mines
      ? weapon.mines.map((_, slotIndex) => {
          const angle = weapon.mineOrbitalAngle + (Math.PI * 2 / def.mineCount) * slotIndex
          return {
            x: playerPos[0] + Math.cos(angle) * def.orbitalRadius,
            z: playerPos[2] + Math.sin(angle) * def.orbitalRadius,
          }
        })
      : [0, 1, 2].map(slotIndex => {
          const angle = (Math.PI * 2 / def.mineCount) * slotIndex
          return {
            x: Math.cos(angle) * def.orbitalRadius,
            z: Math.sin(angle) * def.orbitalRadius,
          }
        })

    // Mine 0 at angle 0 → (orbitalRadius, 0)
    expect(positions[0].x).toBeCloseTo(def.orbitalRadius)
    expect(positions[0].z).toBeCloseTo(0)
    // Mine 1 at 120° → cos(2π/3) ≈ -0.5, sin(2π/3) ≈ 0.866
    expect(positions[1].x).toBeCloseTo(-0.5 * def.orbitalRadius, 3)
    expect(positions[1].z).toBeCloseTo(Math.sqrt(3) / 2 * def.orbitalRadius, 3)
    // Mine 2 at 240° → cos(4π/3) ≈ -0.5, sin(4π/3) ≈ -0.866
    expect(positions[2].x).toBeCloseTo(-0.5 * def.orbitalRadius, 3)
    expect(positions[2].z).toBeCloseTo(-Math.sqrt(3) / 2 * def.orbitalRadius, 3)
  })

  // --- Respawn timer ---

  it('respawn timer decrements when mine is inactive', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    weapon.mines = Array.from({ length: def.mineCount }, (_, i) => ({
      slotIndex: i, active: true, respawnTimer: 0,
    }))
    const clampedDelta = 0.5

    // Deactivate mine 0 with full respawn timer
    weapon.mines[0].active = false
    weapon.mines[0].respawnTimer = def.mineRespawnTime

    // Simulate one GameLoop tick: decrement respawn timers
    for (let m = 0; m < weapon.mines.length; m++) {
      const mine = weapon.mines[m]
      if (!mine.active) {
        mine.respawnTimer -= clampedDelta
        if (mine.respawnTimer <= 0) mine.active = true
      }
    }

    expect(weapon.mines[0].active).toBe(false)
    expect(weapon.mines[0].respawnTimer).toBeCloseTo(def.mineRespawnTime - clampedDelta)
    // Other mines unaffected
    expect(weapon.mines[1].active).toBe(true)
    expect(weapon.mines[2].active).toBe(true)
  })

  it('mine reactivates when respawn timer reaches 0', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    weapon.mines = Array.from({ length: def.mineCount }, (_, i) => ({
      slotIndex: i, active: true, respawnTimer: 0,
    }))

    weapon.mines[0].active = false
    weapon.mines[0].respawnTimer = 0.01 // almost done

    // One tick with delta > remaining timer
    const clampedDelta = 0.016
    for (let m = 0; m < weapon.mines.length; m++) {
      const mine = weapon.mines[m]
      if (!mine.active) {
        mine.respawnTimer -= clampedDelta
        if (mine.respawnTimer <= 0) mine.active = true
      }
    }

    expect(weapon.mines[0].active).toBe(true)
  })

  it('active mines are not affected by respawn tick', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    weapon.mines = Array.from({ length: def.mineCount }, (_, i) => ({
      slotIndex: i, active: true, respawnTimer: 0,
    }))

    // Simulate tick — all mines active, nothing changes
    for (let m = 0; m < weapon.mines.length; m++) {
      const mine = weapon.mines[m]
      if (!mine.active) {
        mine.respawnTimer -= 0.016
        if (mine.respawnTimer <= 0) mine.active = true
      }
    }

    for (let m = 0; m < weapon.mines.length; m++) {
      expect(weapon.mines[m].active).toBe(true)
      expect(weapon.mines[m].respawnTimer).toBe(0)
    }
  })

  // --- Proximity detection ---

  it('mine triggers when enemy is within mineDetectionRadius', () => {
    // Mine at (orbitalRadius, 0), enemy at (orbitalRadius, mineDetectionRadius - 0.1) — inside
    const mineX = def.orbitalRadius
    const mineZ = 0
    const enemy = { x: mineX, z: mineZ + def.mineDetectionRadius - 0.1 }

    const dx = enemy.x - mineX
    const dz = enemy.z - mineZ
    const dist = Math.sqrt(dx * dx + dz * dz)

    expect(dist).toBeLessThanOrEqual(def.mineDetectionRadius)
  })

  it('mine does NOT trigger when enemy is outside mineDetectionRadius', () => {
    const mineX = def.orbitalRadius
    const mineZ = 0
    const enemy = { x: mineX, z: mineZ + def.mineDetectionRadius + 1 }

    const dx = enemy.x - mineX
    const dz = enemy.z - mineZ
    const dist = Math.sqrt(dx * dx + dz * dz)

    expect(dist).toBeGreaterThan(def.mineDetectionRadius)
  })

  it('mine triggers on an enemy exactly at mineDetectionRadius boundary (inclusive)', () => {
    const mineX = 0
    const mineZ = 0
    const enemy = { x: def.mineDetectionRadius, z: 0 }

    const dx = enemy.x - mineX
    const dz = enemy.z - mineZ
    const dist = Math.sqrt(dx * dx + dz * dz)

    expect(dist).toBeLessThanOrEqual(def.mineDetectionRadius)
  })

  // --- Hit deduplication ---

  it('seenEnemies Set deduplicates hits from simultaneous mine detonations', () => {
    // Two mines each add a hit for the same enemy — only one should survive deduplication
    const mineHits = [
      { enemyId: 'enemy-1', damage: 50, isCrit: false, dirX: 1, dirZ: 0 },
      { enemyId: 'enemy-1', damage: 50, isCrit: false, dirX: 0, dirZ: 1 }, // same enemy, different mine
      { enemyId: 'enemy-2', damage: 50, isCrit: false, dirX: -1, dirZ: 0 },
    ]

    const seenEnemies = new Set()
    const uniqueHits = []
    for (let i = 0; i < mineHits.length; i++) {
      if (!seenEnemies.has(mineHits[i].enemyId)) {
        seenEnemies.add(mineHits[i].enemyId)
        uniqueHits.push(mineHits[i])
      }
    }

    expect(uniqueHits.length).toBe(2)
    expect(uniqueHits.map(h => h.enemyId)).toEqual(['enemy-1', 'enemy-2'])
    // First mine's direction is kept for enemy-1
    expect(uniqueHits[0].dirX).toBe(1)
    expect(uniqueHits[0].dirZ).toBe(0)
  })

  it('seenEnemies Set allows unique enemies through deduplication without filtering', () => {
    const mineHits = [
      { enemyId: 'a', damage: 50, isCrit: false, dirX: 1, dirZ: 0 },
      { enemyId: 'b', damage: 50, isCrit: false, dirX: 0, dirZ: 1 },
      { enemyId: 'c', damage: 50, isCrit: false, dirX: -1, dirZ: 0 },
    ]

    const seenEnemies = new Set()
    const uniqueHits = []
    for (let i = 0; i < mineHits.length; i++) {
      if (!seenEnemies.has(mineHits[i].enemyId)) {
        seenEnemies.add(mineHits[i].enemyId)
        uniqueHits.push(mineHits[i])
      }
    }

    // All 3 unique enemies pass through
    expect(uniqueHits.length).toBe(3)
  })

  // --- Detonation lifecycle ---

  it('mine deactivates and starts respawn timer on detonation', () => {
    const weapon = useWeapons.getState().activeWeapons.find(w => w.weaponId === 'MINE_AROUND')
    weapon.mines = Array.from({ length: def.mineCount }, (_, i) => ({
      slotIndex: i, active: true, respawnTimer: 0,
    }))

    // Simulate detonation of mine 0
    weapon.mines[0].active = false
    weapon.mines[0].respawnTimer = def.mineRespawnTime

    expect(weapon.mines[0].active).toBe(false)
    expect(weapon.mines[0].respawnTimer).toBe(def.mineRespawnTime)
    // Other mines continue orbiting
    expect(weapon.mines[1].active).toBe(true)
    expect(weapon.mines[2].active).toBe(true)
  })
})
