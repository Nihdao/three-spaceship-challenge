import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSpawnSystem } from '../spawnSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

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
    // Tick enough time to pass the initial spawn interval (2.0s)
    const result = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0)
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0]).toHaveProperty('typeId')
    expect(result[0]).toHaveProperty('x')
    expect(result[0]).toHaveProperty('z')
  })

  it('should decrease spawn interval over elapsed time (difficulty ramp)', () => {
    // Advance time significantly to ramp difficulty
    ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0) // first spawn

    // After 50 seconds, interval should be shorter
    // We need to accumulate time by ticking many times
    let spawnCount = 0
    // Simulate 50 seconds of gameplay in small steps
    for (let t = 0; t < 50; t += 0.1) {
      const result = ss.tick(0.1, 0, 0)
      spawnCount += result.length
    }

    // With difficulty ramp, should have spawned more than baseline
    // (50s / SPAWN_INTERVAL_BASE without ramp)
    const baselineSpawns = Math.floor(50 / GAME_CONFIG.SPAWN_INTERVAL_BASE)
    expect(spawnCount).toBeGreaterThan(baselineSpawns)
  })

  it('should never let spawn interval go below SPAWN_INTERVAL_MIN', () => {
    // Advance time a LOT to ensure interval hits minimum
    // At ramp rate 0.02/s, to go from 2.0 to 0.3 = 85 seconds
    // Tick 200 seconds worth
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

    // Last intervals should be close to SPAWN_INTERVAL_MIN
    const lastIntervals = intervals.slice(-5)
    for (const interval of lastIntervals) {
      expect(interval).toBeGreaterThanOrEqual(GAME_CONFIG.SPAWN_INTERVAL_MIN - 0.06)
    }
  })

  it('should pick valid enemy types from weighted random', () => {
    const validTypeIds = Object.keys(ENEMIES).filter(k => ENEMIES[k].spawnWeight > 0)
    const result = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0)
    for (const inst of result) {
      expect(validTypeIds).toContain(inst.typeId)
    }
  })

  it('should spawn at correct distance from player', () => {
    const px = 100
    const pz = -50
    const result = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, px, pz)

    for (const inst of result) {
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

    // Spawn many times to get variety
    let allInBounds = true
    for (let i = 0; i < 50; i++) {
      ss.reset()
      const result = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, px, pz)
      for (const inst of result) {
        if (Math.abs(inst.x) > bound || Math.abs(inst.z) > bound) {
          allInBounds = false
        }
      }
    }
    expect(allInBounds).toBe(true)
  })

  it('should increase batch size over time', () => {
    // At start, batch size parameter is SPAWN_BATCH_SIZE_BASE (1)
    // Note: sweep group spawning can inflate instruction count (3-5 per pick)
    const result1 = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0)
    const initialCount = result1.length
    expect(initialCount).toBeGreaterThanOrEqual(GAME_CONFIG.SPAWN_BATCH_SIZE_BASE)

    // After SPAWN_BATCH_RAMP_INTERVAL seconds, batch should increase
    // Advance time past the ramp interval
    for (let t = 0; t < GAME_CONFIG.SPAWN_BATCH_RAMP_INTERVAL; t += 0.1) {
      ss.tick(0.1, 0, 0)
    }
    // Force a spawn by waiting past interval — batch size parameter has increased
    const result2 = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0)
    expect(result2.length).toBeGreaterThanOrEqual(GAME_CONFIG.SPAWN_BATCH_SIZE_BASE + 1)
  })

  it('should reset all internal state', () => {
    // Advance time
    ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0)
    ss.tick(10, 0, 0)

    // Reset
    ss.reset()

    // After reset, should behave like fresh system
    const result = ss.tick(0.5, 0, 0)
    expect(result).toEqual([])
  })

  // Story 18.3: scaling object pass-through
  it('should pass scaling object through to spawn instructions', () => {
    const scaling = { hp: 1.6, damage: 1.5, speed: 1.3, xpReward: 1.4 }
    const result = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0, scaling)
    expect(result.length).toBeGreaterThanOrEqual(1)
    for (const inst of result) {
      expect(inst.scaling).toBe(scaling)
    }
  })

  it('should pass null scaling when no scaling argument provided', () => {
    const result = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0)
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].scaling).toBeNull()
  })

  // Story 16.2: Sweep group spawning
  describe('sweep group spawning', () => {
    it('should spawn sweep enemies with shared sweepDirection', () => {
      // Spawn many batches to ensure we hit a sweep type
      let sweepInstructions = []
      for (let attempt = 0; attempt < 200; attempt++) {
        ss.reset()
        const result = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0)
        const sweeps = result.filter(r => r.typeId === 'FODDER_SWARM')
        if (sweeps.length > 0) {
          sweepInstructions = sweeps
          break
        }
      }

      if (sweepInstructions.length > 0) {
        // All sweep enemies in a group share the same sweepDirection
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
})
