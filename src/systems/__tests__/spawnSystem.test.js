import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

  // Story 16.3: Time-Gated Enemy Spawning
  describe('time-gated spawning', () => {
    let mockRandom

    beforeEach(() => {
      mockRandom = vi.spyOn(Math, 'random')
    })

    afterEach(() => {
      mockRandom.mockRestore()
    })

    describe('Task 4.1: Only FODDER_BASIC and FODDER_TANK spawn at t=0', () => {
      it('should only spawn FODDER_BASIC and FODDER_TANK at elapsedTime=0', () => {
        const delta = GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1

        // Force random to select first available enemy type
        mockRandom.mockReturnValue(0.01)

        const instructions = ss.tick(delta, 0, 0, 1.0)

        expect(instructions.length).toBeGreaterThan(0)
        const spawnedTypes = instructions.map(inst => inst.typeId)

        // Only FODDER_BASIC and FODDER_TANK should be possible
        const allowedTypes = ['FODDER_BASIC', 'FODDER_TANK']
        spawnedTypes.forEach(typeId => {
          expect(allowedTypes).toContain(typeId)
        })
      })

      it('should NOT spawn advanced types at t=0', () => {
        const delta = GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1

        // Try many spawns to ensure no advanced types appear
        const allSpawnedTypes = new Set()
        for (let i = 0; i < 50; i++) {
          ss.reset()
          mockRandom.mockReturnValue(Math.random())
          const instructions = ss.tick(delta, 0, 0, 1.0)
          instructions.forEach(inst => allSpawnedTypes.add(inst.typeId))
        }

        const forbiddenTypes = ['FODDER_SWARM', 'SHOCKWAVE_BLOB', 'SNIPER_MOBILE', 'SNIPER_FIXED', 'TELEPORTER']
        forbiddenTypes.forEach(typeId => {
          expect(allSpawnedTypes.has(typeId)).toBe(false)
        })
      })
    })

    describe('Task 4.2: FODDER_SWARM becomes available at t=60', () => {
      it('should NOT spawn FODDER_SWARM at t=59', () => {
        // Create fresh spawn system
        const testSS = createSpawnSystem()

        // Advance to 54s, leaving room for one spawn interval
        testSS.tick(54, 0, 0, 1.0)

        // Force a spawn - adds SPAWN_INTERVAL_BASE (~5s), total = 59s < 60s
        const instructions = testSS.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0, 1.0)

        const spawnedTypes = instructions.map(inst => inst.typeId)
        expect(spawnedTypes.includes('FODDER_SWARM')).toBe(false)
      })

      it('should spawn FODDER_SWARM at t=60', () => {
        // Advance time to 60 seconds
        ss.tick(60, 0, 0, 1.0)

        // Trigger spawn - force FODDER_SWARM selection
        const delta = GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1

        // Calculate weight range for FODDER_SWARM
        // Total weight at t=60 = 100 + 60 + 40 = 200
        // FODDER_SWARM range: 160-200 / 200 = 0.8-1.0
        mockRandom.mockReturnValue(0.85) // Should select FODDER_SWARM

        const instructions = ss.tick(delta, 0, 0, 1.0)

        const spawnedTypes = instructions.map(inst => inst.typeId)
        expect(spawnedTypes.some(typeId => typeId === 'FODDER_SWARM')).toBe(true)
      })
    })

    describe('Task 4.3: SHOCKWAVE_BLOB becomes available at t=120', () => {
      it('should NOT spawn SHOCKWAVE_BLOB before t=120', () => {
        // Create fresh spawn system
        const testSS = createSpawnSystem()

        // Advance to 114s, leaving room for one spawn interval (~5s)
        testSS.tick(114, 0, 0, 1.0)

        // Force a spawn - adds SPAWN_INTERVAL_BASE (~5s), total = 119s < 120s
        const instructions = testSS.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.01, 0, 0, 1.0)

        const spawnedTypes = instructions.map(inst => inst.typeId)
        expect(spawnedTypes.includes('SHOCKWAVE_BLOB')).toBe(false)
      })

      it('should spawn SHOCKWAVE_BLOB at t=120', () => {
        ss.tick(120, 0, 0, 1.0)

        // Total weight at t=120 = 100 + 60 + 40 + 30 = 230
        // SHOCKWAVE_BLOB range: 200-230 / 230 = 0.87-1.0
        mockRandom.mockReturnValue(0.90)

        const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
        const spawnedTypes = instructions.map(inst => inst.typeId)

        expect(spawnedTypes.some(typeId => typeId === 'SHOCKWAVE_BLOB')).toBe(true)
      })
    })

    describe('Task 4.4: SNIPER_MOBILE becomes available at t=180', () => {
      it('should spawn SNIPER_MOBILE at t=180 or later', () => {
        ss.tick(180, 0, 0, 1.0)

        // Total weight at t=180 = 100 + 60 + 40 + 30 + 25 = 255
        // SNIPER_MOBILE range: 230-255 / 255 = 0.902-1.0
        mockRandom.mockReturnValue(0.95)

        const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
        const spawnedTypes = instructions.map(inst => inst.typeId)

        expect(spawnedTypes.some(typeId => typeId === 'SNIPER_MOBILE')).toBe(true)
      })
    })

    describe('Task 4.5: SNIPER_FIXED becomes available at t=300', () => {
      it('should spawn SNIPER_FIXED at t=300 or later', () => {
        ss.tick(300, 0, 0, 1.0)

        // Total weight at t=300 = 100 + 60 + 40 + 30 + 25 + 10 = 265
        // SNIPER_FIXED range: 255-265 / 265 = 0.962-1.0
        mockRandom.mockReturnValue(0.98)

        const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
        const spawnedTypes = instructions.map(inst => inst.typeId)

        expect(spawnedTypes.some(typeId => typeId === 'SNIPER_FIXED')).toBe(true)
      })
    })

    describe('Task 4.6: TELEPORTER becomes available at t=360', () => {
      it('should spawn TELEPORTER at t=360 or later', () => {
        ss.tick(360, 0, 0, 1.0)

        // Total weight at t=360 = 100 + 60 + 40 + 30 + 25 + 10 + 20 = 285
        // TELEPORTER range: 265-285 / 285 = 0.930-1.0
        mockRandom.mockReturnValue(0.96)

        const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
        const spawnedTypes = instructions.map(inst => inst.typeId)

        expect(spawnedTypes.some(typeId => typeId === 'TELEPORTER')).toBe(true)
      })
    })

    describe('Task 4.7: All types remain available once unlocked', () => {
      it('should keep all early types available at t=360+', () => {
        // Restore real Math.random for this test since we need true randomness
        mockRandom.mockRestore()

        ss.tick(360, 0, 0, 1.0)

        const allSpawnedTypes = new Set()

        // Run many spawns to collect all possible types (increase iterations for better coverage)
        for (let i = 0; i < 300; i++) {
          const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
          instructions.forEach(inst => allSpawnedTypes.add(inst.typeId))
        }

        // All 7 spawnable types should be possible
        const expectedTypes = ['FODDER_BASIC', 'FODDER_TANK', 'FODDER_SWARM', 'SHOCKWAVE_BLOB',
                              'SNIPER_MOBILE', 'SNIPER_FIXED', 'TELEPORTER']

        expectedTypes.forEach(typeId => {
          expect(allSpawnedTypes.has(typeId)).toBe(true)
        })
      })

      it('should never spawn BOSS_SENTINEL through spawn system', () => {
        ss.tick(360, 0, 0, 1.0)

        const allSpawnedTypes = new Set()
        for (let i = 0; i < 100; i++) {
          mockRandom.mockReturnValue(Math.random())
          const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
          instructions.forEach(inst => allSpawnedTypes.add(inst.typeId))
        }

        expect(allSpawnedTypes.has('BOSS_SENTINEL')).toBe(false)
      })
    })

    describe('Task 4.8: Weighted random selection distributes proportionally', () => {
      it('should select types based on their spawnWeight proportions at t=0', () => {
        // Restore real Math.random for this statistical test
        mockRandom.mockRestore()

        const spawnCounts = {
          FODDER_BASIC: 0,
          FODDER_TANK: 0,
        }

        // Run many spawns and count type distribution
        for (let i = 0; i < 1000; i++) {
          ss.reset()
          const instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
          instructions.forEach(inst => {
            if (spawnCounts[inst.typeId] !== undefined) {
              spawnCounts[inst.typeId]++
            }
          })
        }

        const total = spawnCounts.FODDER_BASIC + spawnCounts.FODDER_TANK
        const basicRatio = spawnCounts.FODDER_BASIC / total
        const tankRatio = spawnCounts.FODDER_TANK / total

        // Expected: FODDER_BASIC (100) vs FODDER_TANK (60) = 100/160 vs 60/160 = 0.625 vs 0.375
        // Allow 10% margin of error due to randomness
        expect(basicRatio).toBeGreaterThan(0.56) // 0.625 - 0.065
        expect(basicRatio).toBeLessThan(0.69)    // 0.625 + 0.065
        expect(tankRatio).toBeGreaterThan(0.31)  // 0.375 - 0.065
        expect(tankRatio).toBeLessThan(0.44)     // 0.375 + 0.065
      })
    })

    describe('Reset functionality with time gates', () => {
      it('should reset elapsedTime and return to t=0 spawn behavior', () => {
        // Advance to late game
        ss.tick(360, 0, 0, 1.0)

        // Verify advanced types are available
        mockRandom.mockReturnValue(0.96)
        let instructions = ss.tick(GAME_CONFIG.SPAWN_INTERVAL_BASE + 0.1, 0, 0, 1.0)
        let spawnedTypes = instructions.map(inst => inst.typeId)
        expect(spawnedTypes.some(typeId => typeId === 'TELEPORTER')).toBe(true)

        // Reset and restore real random
        ss.reset()
        mockRandom.mockRestore()

        // Verify only early types spawn after reset
        // Use small time steps to stay under 60s threshold
        const allTypesAfterReset = new Set()
        // Advance by small amounts (total < 60s to prevent FODDER_SWARM unlock)
        for (let i = 0; i < 10; i++) {
          // Tick 5s at a time = 50s total, staying under 60s threshold
          instructions = ss.tick(5.0, 0, 0, 1.0)
          instructions.forEach(inst => allTypesAfterReset.add(inst.typeId))
        }

        const allowedTypes = ['FODDER_BASIC', 'FODDER_TANK']
        const forbiddenTypes = ['FODDER_SWARM', 'SHOCKWAVE_BLOB', 'SNIPER_MOBILE', 'SNIPER_FIXED', 'TELEPORTER']

        forbiddenTypes.forEach(typeId => {
          expect(allTypesAfterReset.has(typeId)).toBe(false)
        })
      })
    })
  })
})
