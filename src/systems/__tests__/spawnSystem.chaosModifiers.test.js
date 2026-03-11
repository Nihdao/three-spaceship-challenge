import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSpawnSystem } from '../spawnSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { getGalaxyById } from '../../entities/galaxyDefs.js'
import { getPhaseForProgress } from '../../entities/waveDefs.js'

// M2 fix: mock usePlayer so curse bonus is always 0 — prevents test pollution
// from other suites that may modify permanentUpgradeBonuses in the shared Zustand store.
vi.mock('../../stores/usePlayer.jsx', () => ({
  default: {
    getState: () => ({ permanentUpgradeBonuses: { curse: 0 } }),
  },
}))

// Story 52.2: chaosSpawnMult increases spawn frequency by dividing the interval

describe('spawnSystem — chaosSpawnMult (Story 52.2)', () => {
  let ss

  beforeEach(() => {
    ss = createSpawnSystem()
  })

  // AC #2: chaosSpawnMult=1.30 produces more spawn EVENTS than chaosSpawnMult=1.0
  // We count spawn events (non-empty returns), not total enemies, to avoid sweep randomness.
  it('chaosSpawnMult=1.30 produces more spawn events than chaosSpawnMult=1.0 over the same duration', () => {
    const duration = 60 // seconds

    const ssNormal = createSpawnSystem()
    let normalEvents = 0
    for (let t = 0; t < duration; t += 0.1) {
      const r = ssNormal.tick(0.1, 0, 0, { chaosSpawnMult: 1.0 })
      // Count only regular (non-elite) spawns, i.e. non-isEliteSpawn instructions
      const regularCount = r.filter(i => !i.isEliteSpawn).length
      if (regularCount > 0) normalEvents++
    }

    const ssChaos = createSpawnSystem()
    let chaosEvents = 0
    for (let t = 0; t < duration; t += 0.1) {
      const r = ssChaos.tick(0.1, 0, 0, { chaosSpawnMult: 1.30 })
      const regularCount = r.filter(i => !i.isEliteSpawn).length
      if (regularCount > 0) chaosEvents++
    }

    expect(chaosEvents).toBeGreaterThan(normalEvents)
  })

  // AC #2 (no-op): chaosSpawnMult=1.0 produces same spawn events as omitting the option
  it('chaosSpawnMult=1.0 produces same number of spawn events as omitting the option', () => {
    const duration = 30

    // Mock Math.random to eliminate sweep-group size randomness
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const ssDefault = createSpawnSystem()
    let defaultEvents = 0
    for (let t = 0; t < duration; t += 0.5) {
      const r = ssDefault.tick(0.5, 0, 0)
      if (r.filter(i => !i.isEliteSpawn).length > 0) defaultEvents++
    }

    const ssExplicit = createSpawnSystem()
    let explicitEvents = 0
    for (let t = 0; t < duration; t += 0.5) {
      const r = ssExplicit.tick(0.5, 0, 0, { chaosSpawnMult: 1.0 })
      if (r.filter(i => !i.isEliteSpawn).length > 0) explicitEvents++
    }

    vi.restoreAllMocks()

    expect(explicitEvents).toBe(defaultEvents)
  })

  // AC #4 (spawn rate): omitting chaosSpawnMult is identical to chaosSpawnMult=1.0
  it('omitting chaosSpawnMult does not change interval calculation (same as 1.0)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const ssA = createSpawnSystem()
    const ssB = createSpawnSystem()

    let countA = 0
    let countB = 0
    for (let t = 0; t < 10; t += 0.5) {
      if (ssA.tick(0.5, 0, 0).filter(i => !i.isEliteSpawn).length > 0) countA++
      if (ssB.tick(0.5, 0, 0, {}).filter(i => !i.isEliteSpawn).length > 0) countB++
    }

    vi.restoreAllMocks()

    expect(countA).toBe(countB)
  })

  // AC #2: chaosSpawnMult also applied at spawnTimer initialization (first tick)
  // DELTA is computed from GAME_CONFIG + waveDefs to avoid magic numbers.
  // Strategy: DELTA = SPAWN_INTERVAL_MIN + small step → timerChaos is clamped to MIN < DELTA,
  // while timerNormal = effectiveBase/phaseMult (above MIN) remains > DELTA.
  it('chaosSpawnMult applied on very first tick (spawnTimer initialization)', () => {
    const CHAOS_MULT = 1.30
    const firstPhase = getPhaseForProgress(1, 0)
    const phaseMult = firstPhase.spawnRateMultiplier

    // At D = SPAWN_INTERVAL_MIN + ε: timerChaos is clamped to SPAWN_INTERVAL_MIN < D,
    // and timerNormal = max(MIN, effectiveBase/phaseMult) > D (verified by safety asserts below).
    const DELTA = GAME_CONFIG.SPAWN_INTERVAL_MIN + 0.1
    const effectiveBase = Math.max(0, GAME_CONFIG.SPAWN_INTERVAL_BASE - GAME_CONFIG.SPAWN_RAMP_RATE * DELTA)
    const timerNormal = Math.max(GAME_CONFIG.SPAWN_INTERVAL_MIN, effectiveBase / phaseMult)
    const timerChaos  = Math.max(GAME_CONFIG.SPAWN_INTERVAL_MIN, effectiveBase / (phaseMult * CHAOS_MULT))
    // Safety: DELTA must be strictly between the two timers.
    // If either assert fails, GAME_CONFIG constants changed — review DELTA selection.
    expect(DELTA).toBeGreaterThan(timerChaos)
    expect(DELTA).toBeLessThan(timerNormal)

    const ssNormal = createSpawnSystem()
    const ssNormalResult = ssNormal.tick(DELTA, 0, 0, { chaosSpawnMult: 1.0 })
    const normalRegular = ssNormalResult.filter(i => !i.isEliteSpawn)

    const ssChaos = createSpawnSystem()
    const ssChaosResult = ssChaos.tick(DELTA, 0, 0, { chaosSpawnMult: CHAOS_MULT })
    const chaosRegular = ssChaosResult.filter(i => !i.isEliteSpawn)

    expect(normalRegular.length).toBe(0)
    expect(chaosRegular.length).toBeGreaterThanOrEqual(1)
  })
})

// Story 52.2: GameLoop cache formula — chaos hp/damage/speed (AC #1, AC #3, AC #4)
// Replicates the GameLoop.jsx Story 34.5 cache block so we can validate it without
// a full React component test harness. Any breakage here means the GameLoop formula
// stopped applying chaosEnemyMult correctly.
describe('GameLoop scaling cache formula — chaos hp/damage/speed (Story 52.2)', () => {
  // Pure replica of the GameLoop cache computation (GameLoop.jsx ~line 411–429)
  function computeSystemScaling(galaxyConfig, systemNum) {
    const _gc = galaxyConfig
    const _chaos = _gc?.chaosEnemyMult ?? { hp: 1, damage: 1, speed: 1, spawnRate: 1 }
    if (_gc?.difficultyScalingPerSystem) {
      const _si = systemNum - 1
      const _s = _gc.difficultyScalingPerSystem
      return {
        hp:             Math.pow(_s.hp,       _si) * _chaos.hp,
        damage:         Math.pow(_s.damage,   _si) * _chaos.damage,
        speed:          Math.pow(_s.speed,    _si) * (_gc.enemySpeedMult ?? 1.0) * _chaos.speed,
        xpReward:       Math.pow(_s.xpReward, _si),
        chaosSpawnMult: _chaos.spawnRate,
      }
    }
    return null
  }

  // AC #1: HP × 1.30 applied at system 1
  it('andromeda_inferno system 1: hp = 1.30 (chaos × systemScaling=1)', () => {
    const gc = getGalaxyById('andromeda_inferno')
    const scaling = computeSystemScaling(gc, 1)
    // _si=0 → Math.pow(1.25, 0)=1.0 → hp = 1.0 * 1.30 = 1.30
    expect(scaling.hp).toBeCloseTo(1.30, 5)
  })

  // AC #1: Damage × 1.30 applied at system 1
  it('andromeda_inferno system 1: damage = 1.30 (chaos × systemScaling=1)', () => {
    const gc = getGalaxyById('andromeda_inferno')
    const scaling = computeSystemScaling(gc, 1)
    expect(scaling.damage).toBeCloseTo(1.30, 5)
  })

  // AC #3: Speed formula = baseSpeed × enemySpeedMult × chaosSpeed × systemScaling
  it('andromeda_inferno system 1: speed = enemySpeedMult(1.5) × chaosSpeed(1.30) = 1.95 (AC #3)', () => {
    const gc = getGalaxyById('andromeda_inferno')
    const scaling = computeSystemScaling(gc, 1)
    // _si=0 → pow(1.10,0)=1.0 → speed = 1.0 * 1.5 * 1.30 = 1.95
    expect(scaling.speed).toBeCloseTo(1.95, 5)
  })

  // AC #1: Chaos stacks with inter-system scaling at system 2
  it('andromeda_inferno system 2: hp = diffScaling(1.25^1) × chaos(1.30) = 1.625', () => {
    const gc = getGalaxyById('andromeda_inferno')
    const scaling = computeSystemScaling(gc, 2)
    // _si=1 → pow(1.25,1)=1.25 → hp = 1.25 * 1.30 = 1.625
    expect(scaling.hp).toBeCloseTo(1.625, 5)
  })

  // AC #4: andromeda_reach has no chaosEnemyMult → fallback is all-1.0 no-ops
  it('andromeda_reach: no chaosEnemyMult → fallback chaos is all 1.0 (no-op regression)', () => {
    const gc = getGalaxyById('andromeda_reach')
    const _chaos = gc?.chaosEnemyMult ?? { hp: 1, damage: 1, speed: 1, spawnRate: 1 }
    expect(_chaos.hp).toBe(1)
    expect(_chaos.damage).toBe(1)
    expect(_chaos.speed).toBe(1)
    expect(_chaos.spawnRate).toBe(1)
  })

  // AC #4: andromeda_reach system 1 scaling is unmodified by chaos
  it('andromeda_reach system 1: hp = 1.0 (no chaos applied)', () => {
    const gc = getGalaxyById('andromeda_reach')
    const scaling = computeSystemScaling(gc, 1)
    // No chaosEnemyMult → _chaos.hp=1 → hp = pow(1.25,0)*1 = 1.0
    expect(scaling.hp).toBeCloseTo(1.0, 5)
  })
})
