import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSpawnSystem } from '../spawnSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'
import { WAVE_PROFILES } from '../../entities/waveDefs.js'

// After MED-3 fix, spawnTimer is initialized to the wave-phase interval on first tick.
// system1 Easy Start: interval = SPAWN_INTERVAL_BASE / 1.0 = 2.0s. Use this to trigger first spawn.
const FIRST_SPAWN_TRIGGER = GAME_CONFIG.SPAWN_INTERVAL_BASE / WAVE_PROFILES.system1[0].spawnRateMultiplier + 0.01

describe('spawnSystem', () => {
  let ss

  beforeEach(() => {
    ss = createSpawnSystem()
  })

  it('should create a spawn system with tick and reset methods', () => {
    expect(ss.tick).toBeTypeOf('function')
    expect(ss.reset).toBeTypeOf('function')
  })

  it('should return empty array before first spawn timer expires', () => {
    const result = ss.tick(0.5, 0, 0)
    expect(result).toEqual([])
  })

  it('should return spawn instructions when timer expires', () => {
    // spawnTimer initializes to Easy Start wave-phase interval (~2.0s); tick past it to trigger first spawn
    const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0]).toHaveProperty('typeId')
    expect(result[0]).toHaveProperty('x')
    expect(result[0]).toHaveProperty('z')
  })

  it('should spawn more enemies during a hard-spike phase than an easy-start phase', () => {
    // Easy Start (system1, 0-20%): spawnRateMultiplier=1.0 → interval=2.0s
    // Hard Spike 1 (system1, 20-35%): spawnRateMultiplier=2.5 → interval=0.8s (at min)
    let easyCount = 0
    for (let t = 0; t < 30; t += 0.1) {
      easyCount += ss.tick(0.1, 0, 0).length
    }

    const ssHard = createSpawnSystem()
    ssHard.tick(150, 0, 0) // advance to Hard Spike 1 (25% of 600s)
    let hardCount = 0
    for (let t = 0; t < 30; t += 0.1) {
      hardCount += ssHard.tick(0.1, 0, 0).length
    }

    expect(hardCount).toBeGreaterThan(easyCount)
  })

  it('should never let spawn interval go below SPAWN_INTERVAL_MIN', () => {
    let prevSpawnTime = 0
    let intervals = []
    let totalTime = 0

    for (let t = 0; t < 200; t += 0.05) {
      const result = ss.tick(0.05, 0, 0)
      totalTime += 0.05
      if (result.length > 0) {
        if (prevSpawnTime > 0) {
          intervals.push(totalTime - prevSpawnTime)
        }
        prevSpawnTime = totalTime
      }
    }

    const lastIntervals = intervals.slice(-5)
    for (const interval of lastIntervals) {
      expect(interval).toBeGreaterThanOrEqual(GAME_CONFIG.SPAWN_INTERVAL_MIN - 0.06)
    }
  })

  it('should pick valid enemy types from weighted random', () => {
    const validTypeIds = Object.keys(ENEMIES).filter(k => ENEMIES[k].spawnWeight > 0)
    const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
    for (const inst of result) {
      expect(validTypeIds).toContain(inst.typeId)
    }
  })

  it('should spawn at correct distance from player', () => {
    const px = 100
    const pz = -50
    const result = ss.tick(FIRST_SPAWN_TRIGGER, px, pz)

    for (const inst of result) {
      // Sweep enemies use a line-formation offset that can exceed SPAWN_DISTANCE_MAX — skip them
      if (inst.sweepDirection) continue
      const dx = inst.x - px
      const dz = inst.z - pz
      const dist = Math.sqrt(dx * dx + dz * dz)
      // Allow some margin for clamping to play area
      expect(dist).toBeLessThanOrEqual(GAME_CONFIG.SPAWN_DISTANCE_MAX + 1)
    }
  })

  it('should clamp spawn positions to play area bounds', () => {
    const bound = GAME_CONFIG.PLAY_AREA_SIZE
    // Place player near edge so spawn could go out of bounds
    const px = bound - 10
    const pz = bound - 10

    let allInBounds = true
    for (let i = 0; i < 50; i++) {
      ss.reset()
      const result = ss.tick(FIRST_SPAWN_TRIGGER, px, pz)
      for (const inst of result) {
        if (Math.abs(inst.x) > bound || Math.abs(inst.z) > bound) {
          allInBounds = false
        }
      }
    }
    expect(allInBounds).toBe(true)
  })

  it('should increase batch size over time', () => {
    // At start, batch size = SPAWN_BATCH_SIZE_BASE (1)
    const result1 = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
    const initialCount = result1.length
    expect(initialCount).toBeGreaterThanOrEqual(GAME_CONFIG.SPAWN_BATCH_SIZE_BASE)

    // Advance past SPAWN_BATCH_RAMP_INTERVAL (20s); still in Easy Start phase (0-120s)
    for (let t = 0; t < GAME_CONFIG.SPAWN_BATCH_RAMP_INTERVAL; t += 0.1) {
      ss.tick(0.1, 0, 0)
    }

    // Easy Start interval = 2.0s. Use delta > 2.0s to guarantee a spawn triggers
    const result2 = ss.tick(15, 0, 0)
    expect(result2.length).toBeGreaterThanOrEqual(GAME_CONFIG.SPAWN_BATCH_SIZE_BASE + 1)
  })

  it('should reset all internal state', () => {
    ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
    ss.tick(10, 0, 0)

    ss.reset()

    // After reset, should behave like a fresh system
    const result = ss.tick(0.5, 0, 0)
    expect(result).toEqual([])
  })

  // Story 18.3 / Story 23.1: scaling object pass-through via options.systemScaling
  it('should pass scaling object through to spawn instructions', () => {
    const scaling = { hp: 1.6, damage: 1.5, speed: 1.3, xpReward: 1.4 }
    const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemScaling: scaling })
    expect(result.length).toBeGreaterThanOrEqual(1)
    for (const inst of result) {
      expect(inst.scaling).toBe(scaling)
    }
  })

  it('should pass null scaling when no options provided', () => {
    const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].scaling).toBeNull()
  })

  it('should never spawn BOSS_SENTINEL or BOSS_SPACESHIP through the wave system', () => {
    // Run many spawns at late game where all tiers are active
    ss.tick(360, 0, 0) // advance past most time gates
    const allSpawnedTypes = new Set()
    for (let i = 0; i < 100; i++) {
      const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0)
      instructions.forEach(inst => allSpawnedTypes.add(inst.typeId))
    }

    expect(allSpawnedTypes.has('BOSS_SENTINEL')).toBe(false)
    expect(allSpawnedTypes.has('BOSS_SPACESHIP')).toBe(false)
  })

  it('should be able to spawn all 7 wave-eligible enemy types at late game (Pre-Boss Calm)', () => {
    ss.tick(570, 0, 0) // 95% = Pre-Boss Calm: FODDER/SKIRMISHER/ASSAULT all weighted

    const allSpawnedTypes = new Set()
    for (let i = 0; i < 300; i++) {
      const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0)
      instructions.forEach(inst => allSpawnedTypes.add(inst.typeId))
    }

    const expectedTypes = [
      'FODDER_BASIC', 'FODDER_TANK', 'FODDER_SWARM',
      'SHOCKWAVE_BLOB', 'SNIPER_MOBILE',
      'SNIPER_FIXED', 'TELEPORTER',
    ]
    expectedTypes.forEach(typeId => {
      expect(allSpawnedTypes.has(typeId), `${typeId} should be spawnableAt Pre-Boss Calm`).toBe(true)
    })
  })

  // Story 16.2: Sweep group spawning
  describe('sweep group spawning', () => {
    it('should spawn sweep enemies with shared sweepDirection', () => {
      // FODDER_SWARM is now FODDER tier — spawns from t=0 in Easy Start
      let sweepInstructions = []
      for (let attempt = 0; attempt < 200; attempt++) {
        ss.reset()
        const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
        const sweeps = result.filter(r => r.typeId === 'FODDER_SWARM')
        if (sweeps.length > 0) {
          sweepInstructions = sweeps
          break
        }
      }

      if (sweepInstructions.length > 0) {
        const dir = sweepInstructions[0].sweepDirection
        expect(dir).toBeDefined()
        expect(dir).toHaveProperty('x')
        expect(dir).toHaveProperty('z')
        for (const inst of sweepInstructions) {
          expect(inst.sweepDirection).toBe(dir)
        }
        // Group size 3-5
        expect(sweepInstructions.length).toBeGreaterThanOrEqual(3)
        expect(sweepInstructions.length).toBeLessThanOrEqual(5)
      }
    })
  })

  // Enemy definition integrity
  describe('enemy definitions', () => {
    it('all wave-eligible enemies should have spawnWeight > 0 and be defined in ENEMIES', () => {
      const waveEligibleTypes = [
        'FODDER_BASIC', 'FODDER_TANK', 'FODDER_SWARM',
        'SHOCKWAVE_BLOB', 'SNIPER_MOBILE',
        'SNIPER_FIXED', 'TELEPORTER',
      ]

      waveEligibleTypes.forEach(typeId => {
        expect(ENEMIES[typeId], `${typeId} must exist in ENEMIES`).toBeDefined()
        expect(ENEMIES[typeId].id).toBe(typeId)
        expect(ENEMIES[typeId].spawnWeight, `${typeId} must have spawnWeight > 0`).toBeGreaterThan(0)
      })
    })

    it('boss enemies should have spawnWeight = 0 (excluded from wave system)', () => {
      expect(ENEMIES.BOSS_SENTINEL.spawnWeight).toBe(0)
      expect(ENEMIES.BOSS_SPACESHIP.spawnWeight).toBe(0)
    })

    it('all wave-eligible enemies should have a tier field', () => {
      const validTiers = ['FODDER', 'SKIRMISHER', 'ASSAULT', 'ELITE']
      const waveEligibleTypes = Object.values(ENEMIES).filter(e => e.spawnWeight > 0)

      for (const enemy of waveEligibleTypes) {
        expect(validTiers, `${enemy.id} must have a valid tier`).toContain(enemy.tier)
      }
    })
  })

  // Story 43.6 — phase cache (getAvailableEnemyTypes memoization)
  describe('phase cache (Story 43.6)', () => {
    it('cache hit: available types not recomputed for consecutive same-phase spawns', () => {
      const realValues = Object.values.bind(Object)
      let enemiesLookups = 0
      const spy = vi.spyOn(Object, 'values').mockImplementation((obj) => {
        if (obj === ENEMIES) enemiesLookups++
        return realValues(obj)
      })

      // First spawn: cache miss — getAvailableEnemyTypes must iterate ENEMIES
      ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
      expect(enemiesLookups).toBe(1)

      enemiesLookups = 0

      // Second spawn in same phase (Easy Start): cache HIT — no recomputation
      ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
      expect(enemiesLookups).toBe(0)

      spy.mockRestore()
    })

    it('reset() clears cache — recomputes available types on post-reset spawn', () => {
      const realValues = Object.values.bind(Object)
      let enemiesLookups = 0
      const spy = vi.spyOn(Object, 'values').mockImplementation((obj) => {
        if (obj === ENEMIES) enemiesLookups++
        return realValues(obj)
      })

      // First spawn populates cache
      ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
      expect(enemiesLookups).toBe(1)

      ss.reset()
      enemiesLookups = 0

      // Post-reset spawn: cache cleared → must recompute
      ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
      expect(enemiesLookups).toBe(1)

      spy.mockRestore()
    })

    it('cache invalidates when systemNum changes', () => {
      const realValues = Object.values.bind(Object)
      let enemiesLookups = 0
      const spy = vi.spyOn(Object, 'values').mockImplementation((obj) => {
        if (obj === ENEMIES) enemiesLookups++
        return realValues(obj)
      })

      // Spawn with systemNum=1 populates cache for system1 phase object
      ss.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemNum: 1 })
      expect(enemiesLookups).toBe(1)

      ss.reset()
      enemiesLookups = 0

      // Spawn with systemNum=2: different WAVE_PROFILES entry → different phase object → cache miss
      ss.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemNum: 2 })
      expect(enemiesLookups).toBe(1)

      spy.mockRestore()
    })
  })
})
