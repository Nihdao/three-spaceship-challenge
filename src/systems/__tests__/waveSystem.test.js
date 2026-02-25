import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSpawnSystem } from '../spawnSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { WAVE_PROFILES } from '../../entities/waveDefs.js'
import usePlayer from '../../stores/usePlayer.jsx'

// After MED-3 fix, spawnTimer is initialized to the wave-phase interval on first tick.
// system1 Easy Start: interval = SPAWN_INTERVAL_BASE / 0.5 = 10s. Use this to trigger first spawn.
const FIRST_SPAWN_TRIGGER = GAME_CONFIG.SPAWN_INTERVAL_BASE / WAVE_PROFILES.system1[0].spawnRateMultiplier + 0.01

// Count spawn instructions over a fixed time window using small ticks
function countSpawns(ss, windowSeconds, options = {}, tickDelta = 0.1) {
  let count = 0
  for (let t = 0; t < windowSeconds; t += tickDelta) {
    count += ss.tick(tickDelta, 0, 0, options).length
  }
  return count
}

describe('waveSystem — spawn rate scaling by phase (Story 23.1)', () => {
  it('Hard Spike 1 spawns more enemies than Easy Start over a 30s window', () => {
    // system1 Easy Start: spawnRateMultiplier=0.5 → interval=10s (~3 spawns/30s)
    // system1 Hard Spike 1: spawnRateMultiplier=1.5 → interval=3.33s (~9 spawns/30s)

    const ssEasy = createSpawnSystem()
    const easyCount = countSpawns(ssEasy, 30)

    // Advance a fresh system to Hard Spike 1 (25% of 600s = 150s)
    const ssHard = createSpawnSystem()
    ssHard.tick(150, 0, 0)
    const hardCount = countSpawns(ssHard, 30)

    expect(hardCount).toBeGreaterThan(easyCount)
  })

  it('Crescendo spawns more enemies than Medium Phase 2 over a 30s window', () => {
    // Medium Phase 2 (65-80%): spawnRateMultiplier=1.2 → interval=4.17s
    // Crescendo (80-95%): spawnRateMultiplier=2.5 → interval=2s

    const ssMed = createSpawnSystem()
    ssMed.tick(420, 0, 0) // 70% = Medium Phase 2
    const medCount = countSpawns(ssMed, 30)

    const ssCres = createSpawnSystem()
    ssCres.tick(510, 0, 0) // 85% = Crescendo
    const cresCount = countSpawns(ssCres, 30)

    expect(cresCount).toBeGreaterThan(medCount)
  })

  it('system2 Easy Start has shorter spawn interval than system1 Easy Start', () => {
    // system1 Easy Start: spawnRateMultiplier=0.5 → interval = 5/0.5 = 10s
    // system2 Easy Start: spawnRateMultiplier=0.6 → interval = 5/0.6 ≈ 8.33s
    // Measure interval between 1st and 2nd spawns with a mock that avoids sweep groups
    function measureSpawnInterval(systemNum) {
      const ss = createSpawnSystem()
      // Mock to always pick FODDER_BASIC (no sweeps — deterministic single-instruction spawns)
      const mock = vi.spyOn(Math, 'random').mockReturnValue(0.01)
      let firstTime = -1
      let interval = Infinity
      for (let t = 0; t <= 25; t += 0.05) {
        if (ss.tick(0.05, 0, 0, { systemNum }).length > 0) {
          if (firstTime < 0) {
            firstTime = t
          } else {
            interval = t - firstTime
            break
          }
        }
      }
      mock.mockRestore()
      return interval
    }

    const interval1 = measureSpawnInterval(1)
    const interval2 = measureSpawnInterval(2)

    // system2 has higher multiplier → shorter interval between spawns
    expect(interval2).toBeLessThan(interval1)
  })

  it('system3 Easy Start spawns more than system1 Easy Start over 30s', () => {
    // At t=10s, effectiveBase=1.75. system1 Easy Start mult=1.0 → interval=1.75s.
    // system3 Easy Start mult=2.5 → interval=max(0.8, 0.7)=0.8s (already at minimum).
    // Mock Math.random for deterministic enemy type selection (always FODDER_BASIC, 1 per event).
    const mock = vi.spyOn(Math, 'random').mockReturnValue(0.01)

    const ss1 = createSpawnSystem()
    ss1.tick(10, 0, 0) // advance 10s into Easy Start
    const count1 = countSpawns(ss1, 30, { systemNum: 1 })

    const ss3 = createSpawnSystem()
    ss3.tick(10, 0, 0)
    const count3 = countSpawns(ss3, 30, { systemNum: 3 })

    mock.mockRestore()
    expect(count3).toBeGreaterThan(count1)
  })
})

describe('waveSystem — enemy tier weight filtering (Story 23.1)', () => {
  it('Easy Start (system1) only spawns FODDER tier enemies', () => {
    const ss = createSpawnSystem()
    const spawnedTypes = new Set()

    for (let i = 0; i < 100; i++) {
      ss.reset()
      const instructions = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)
      instructions.forEach(inst => spawnedTypes.add(inst.typeId))
    }

    // Non-FODDER types must not appear (tier weights are 0.0)
    const nonFodder = ['SHOCKWAVE_BLOB', 'SNIPER_MOBILE', 'SNIPER_FIXED', 'TELEPORTER']
    for (const typeId of nonFodder) {
      expect(spawnedTypes.has(typeId), `${typeId} should not appear in Easy Start`).toBe(false)
    }

    // FODDER_SWARM is FODDER tier: spawns from t=0 (unlike old time-gate at t=60)
    expect(spawnedTypes.has('FODDER_SWARM') ||
      spawnedTypes.has('FODDER_BASIC') ||
      spawnedTypes.has('FODDER_TANK')).toBe(true)
  })

  it('system2 Easy Start includes SKIRMISHER tier (SHOCKWAVE_BLOB or SNIPER_MOBILE)', () => {
    // system2 Easy Start: SKIRMISHER=0.2 > 0 → SKIRMISHER enemies can appear
    const ss = createSpawnSystem()
    const spawnedTypes = new Set()

    for (let i = 0; i < 300; i++) {
      ss.reset()
      const instructions = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemNum: 2 })
      instructions.forEach(inst => spawnedTypes.add(inst.typeId))
    }

    const skirmishers = ['SHOCKWAVE_BLOB', 'SNIPER_MOBILE']
    const hasSkirmisher = skirmishers.some(t => spawnedTypes.has(t))
    expect(hasSkirmisher).toBe(true)
  })

  it('Hard Spike 1 (system1, t=150s) allows SKIRMISHER tier enemies', () => {
    // Hard Spike 1: FODDER=0.7, SKIRMISHER=0.3 → SKIRMISHER enemies spawn
    const ss = createSpawnSystem()
    ss.tick(150, 0, 0) // advance to Hard Spike 1 (25% of 600s)

    const spawnedTypes = new Set()
    for (let i = 0; i < 300; i++) {
      const instructions = ss.tick(20, 0, 0) // large delta to force each spawn
      instructions.forEach(inst => spawnedTypes.add(inst.typeId))
    }

    const skirmishers = ['SHOCKWAVE_BLOB', 'SNIPER_MOBILE']
    const hasSkirmisher = skirmishers.some(t => spawnedTypes.has(t))
    expect(hasSkirmisher).toBe(true)
  })

  it('Hard Spike 2 (system1, t=330s) allows ASSAULT tier enemies', () => {
    // Hard Spike 2: ASSAULT=0.2 → SNIPER_FIXED or TELEPORTER can spawn
    const ss = createSpawnSystem()
    ss.tick(330, 0, 0) // 55% = Hard Spike 2

    const spawnedTypes = new Set()
    for (let i = 0; i < 300; i++) {
      const instructions = ss.tick(20, 0, 0)
      instructions.forEach(inst => spawnedTypes.add(inst.typeId))
    }

    const assault = ['SNIPER_FIXED', 'TELEPORTER']
    const hasAssault = assault.some(t => spawnedTypes.has(t))
    expect(hasAssault).toBe(true)
  })

  it('Crescendo (system1, t=510s) allows all available tiers', () => {
    // Crescendo: FODDER=0.2, SKIRMISHER=0.3, ASSAULT=0.4, ELITE=0.1
    // ELITE enemies don't exist yet, so ASSAULT should definitely appear
    const ss = createSpawnSystem()
    ss.tick(510, 0, 0) // 85% = Crescendo

    const spawnedTypes = new Set()
    for (let i = 0; i < 300; i++) {
      const instructions = ss.tick(20, 0, 0)
      instructions.forEach(inst => spawnedTypes.add(inst.typeId))
    }

    const assault = ['SNIPER_FIXED', 'TELEPORTER']
    const hasAssault = assault.some(t => spawnedTypes.has(t))
    expect(hasAssault).toBe(true)
  })
})

describe('waveSystem — systemScaling and options API (Story 23.1)', () => {
  it('systemScaling from options is forwarded to every spawn instruction', () => {
    const ss = createSpawnSystem()
    const scaling = { hp: 1.6, damage: 1.5, speed: 1.3, xpReward: 1.4 }
    const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemScaling: scaling })

    expect(result.length).toBeGreaterThanOrEqual(1)
    for (const inst of result) {
      expect(inst.scaling).toBe(scaling)
    }
  })

  it('null scaling when options.systemScaling not provided', () => {
    const ss = createSpawnSystem()
    const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0, {})

    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].scaling).toBeNull()
  })

  it('null scaling when no options object provided', () => {
    const ss = createSpawnSystem()
    const result = ss.tick(FIRST_SPAWN_TRIGGER, 0, 0)

    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].scaling).toBeNull()
  })

  it('unknown systemNum falls back to system1 profile without throwing', () => {
    const ss = createSpawnSystem()
    expect(() => {
      ss.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemNum: 99 })
    }).not.toThrow()
  })

  it('systemNum=1 and systemNum=99 produce same first spawn (fallback to system1)', () => {
    // Both should use system1 Easy Start profile
    const ss1 = createSpawnSystem()
    ss1.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemNum: 1 })

    const ss99 = createSpawnSystem()
    ss99.tick(FIRST_SPAWN_TRIGGER, 0, 0, { systemNum: 99 })

    // After identical ticks, both should be in the same phase state
    // Subsequent spawn intervals should match (both at system1 Easy Start interval)
    let sys1NextSpawnTime = 0
    let sys99NextSpawnTime = 0

    // Find next spawn time for each by advancing in small steps
    for (let t = 0; t <= 15; t += 0.1) {
      if (sys1NextSpawnTime === 0 && ss1.tick(0.1, 0, 0).length > 0) sys1NextSpawnTime = t
      if (sys99NextSpawnTime === 0 && ss99.tick(0.1, 0, 0).length > 0) sys99NextSpawnTime = t
    }

    expect(Math.abs(sys1NextSpawnTime - sys99NextSpawnTime)).toBeLessThan(0.2)
  })
})

describe('waveSystem — curse multiplier effect on spawn rate (Story 23.1 AC #3)', () => {
  // Restore original permanentUpgradeBonuses after each test to prevent state pollution
  let savedBonuses

  beforeEach(() => {
    savedBonuses = { ...usePlayer.getState().permanentUpgradeBonuses }
  })

  afterEach(() => {
    usePlayer.setState({ permanentUpgradeBonuses: savedBonuses })
  })

  it('curse bonus=1.0 produces more spawns than no curse over a 30s Easy Start window', () => {
    // system1 Easy Start: interval = SPAWN_INTERVAL_BASE / (0.5 * (1 + curse))
    // curse=0:   interval = 5.0 / (0.5 * 1.0) = 10.0s  → ~2 spawns in 30s
    // curse=1.0: interval = 5.0 / (0.5 * 2.0) = 5.0s   → ~5 spawns in 30s

    usePlayer.setState({ permanentUpgradeBonuses: { ...savedBonuses, curse: 0 } })
    const ssNoCurse = createSpawnSystem()
    const countNoCurse = countSpawns(ssNoCurse, 30)

    usePlayer.setState({ permanentUpgradeBonuses: { ...savedBonuses, curse: 1.0 } })
    const ssCurse = createSpawnSystem()
    const countCurse = countSpawns(ssCurse, 30)

    expect(countCurse).toBeGreaterThan(countNoCurse)
  })

  it('higher curse produces shorter spawn intervals', () => {
    // system1 Easy Start:
    //   curse=0:   interval = 5.0 / (0.5 * 1.0) = 10.0s
    //   curse=1.0: interval = 5.0 / (0.5 * 2.0) = 5.0s  (approximately half)
    function measureIntervalWithCurse(curseBonus) {
      usePlayer.setState({ permanentUpgradeBonuses: { ...savedBonuses, curse: curseBonus } })
      const ss = createSpawnSystem()
      const mock = vi.spyOn(Math, 'random').mockReturnValue(0.01)
      let firstTime = -1
      let interval = Infinity
      for (let t = 0; t <= 25; t += 0.05) {
        if (ss.tick(0.05, 0, 0).length > 0) {
          if (firstTime < 0) firstTime = t
          else { interval = t - firstTime; break }
        }
      }
      mock.mockRestore()
      return interval
    }

    const intervalNoCurse = measureIntervalWithCurse(0)
    const intervalWithCurse = measureIntervalWithCurse(1.0)

    // curse=1.0 → curseMultiplier=2.0 → interval should be approximately half
    expect(intervalWithCurse).toBeLessThan(intervalNoCurse * 0.7)
  })
})
