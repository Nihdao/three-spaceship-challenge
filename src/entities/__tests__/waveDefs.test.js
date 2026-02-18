import { describe, it, expect } from 'vitest'
import { WAVE_PROFILES, getPhaseForProgress } from '../waveDefs.js'

const SYSTEMS = ['system1', 'system2', 'system3']
const TIER_KEYS = ['FODDER', 'SKIRMISHER', 'ASSAULT', 'ELITE']

describe('waveDefs — profile structure validation (Story 23.1)', () => {
  it('exports WAVE_PROFILES with system1, system2, system3 keys', () => {
    expect(WAVE_PROFILES).toBeDefined()
    expect(WAVE_PROFILES.system1).toBeInstanceOf(Array)
    expect(WAVE_PROFILES.system2).toBeInstanceOf(Array)
    expect(WAVE_PROFILES.system3).toBeInstanceOf(Array)
  })

  it.each(SYSTEMS)('%s has exactly 7 phases', (system) => {
    expect(WAVE_PROFILES[system]).toHaveLength(7)
  })

  it.each(SYSTEMS)('%s phases cover 0.0–1.0 with no gaps', (system) => {
    const phases = WAVE_PROFILES[system]
    expect(phases[0].startPercent).toBe(0.0)
    expect(phases[phases.length - 1].endPercent).toBe(1.0)
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i].startPercent).toBeCloseTo(phases[i - 1].endPercent, 5)
    }
  })

  it.each(SYSTEMS)('%s all phases have spawnRateMultiplier > 0', (system) => {
    for (const phase of WAVE_PROFILES[system]) {
      expect(phase.spawnRateMultiplier, `${phase.name} multiplier`).toBeGreaterThan(0)
    }
  })

  it.each(SYSTEMS)('%s all phases have all tier weight keys', (system) => {
    for (const phase of WAVE_PROFILES[system]) {
      for (const tier of TIER_KEYS) {
        expect(phase.enemyTierWeights[tier], `${phase.name}.${tier}`).toBeTypeOf('number')
      }
    }
  })

  it.each(SYSTEMS)('%s all phases have total tier weight > 0', (system) => {
    for (const phase of WAVE_PROFILES[system]) {
      const total = Object.values(phase.enemyTierWeights).reduce((s, v) => s + v, 0)
      expect(total, `${phase.name} total tier weight`).toBeGreaterThan(0)
    }
  })

  it.each(SYSTEMS)('%s all phases have non-negative tier weights', (system) => {
    for (const phase of WAVE_PROFILES[system]) {
      for (const [tier, weight] of Object.entries(phase.enemyTierWeights)) {
        expect(weight, `${phase.name}.${tier}`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('system2 Easy Start has higher spawnRateMultiplier than system1 Easy Start', () => {
    expect(WAVE_PROFILES.system2[0].spawnRateMultiplier).toBeGreaterThan(WAVE_PROFILES.system1[0].spawnRateMultiplier)
  })

  it('system3 Crescendo has higher spawnRateMultiplier than system1 Crescendo', () => {
    const crescendo1 = WAVE_PROFILES.system1.find(p => p.name === 'Crescendo')
    const crescendo3 = WAVE_PROFILES.system3.find(p => p.name === 'Crescendo')
    expect(crescendo3.spawnRateMultiplier).toBeGreaterThan(crescendo1.spawnRateMultiplier)
  })

  it('system2 Hard Spike 1 has higher spawnRateMultiplier than system1 Hard Spike 1', () => {
    const hs1 = WAVE_PROFILES.system1.find(p => p.name === 'Hard Spike 1')
    const hs2 = WAVE_PROFILES.system2.find(p => p.name === 'Hard Spike 1')
    expect(hs2.spawnRateMultiplier).toBeGreaterThan(hs1.spawnRateMultiplier)
  })

  it('system1 Easy Start only has FODDER tier (others are 0)', () => {
    const easyStart = WAVE_PROFILES.system1[0]
    expect(easyStart.enemyTierWeights.FODDER).toBeGreaterThan(0)
    expect(easyStart.enemyTierWeights.SKIRMISHER).toBe(0)
    expect(easyStart.enemyTierWeights.ASSAULT).toBe(0)
    expect(easyStart.enemyTierWeights.ELITE).toBe(0)
  })

  it('system1 Crescendo includes ELITE tier', () => {
    const crescendo = WAVE_PROFILES.system1.find(p => p.name === 'Crescendo')
    expect(crescendo.enemyTierWeights.ELITE).toBeGreaterThan(0)
  })

  it('system1 Hard Spike 2 includes ASSAULT tier', () => {
    const hs2 = WAVE_PROFILES.system1.find(p => p.name === 'Hard Spike 2')
    expect(hs2.enemyTierWeights.ASSAULT).toBeGreaterThan(0)
  })
})

describe('waveDefs — getPhaseForProgress (Story 23.1)', () => {
  it('returns Easy Start at 0.0 progress', () => {
    const phase = getPhaseForProgress(1, 0.0)
    expect(phase.name).toBe('Easy Start')
  })

  it('returns Easy Start at 0.1 (10%) progress for system1', () => {
    const phase = getPhaseForProgress(1, 0.1)
    expect(phase.name).toBe('Easy Start')
    expect(phase.spawnRateMultiplier).toBe(0.5)
  })

  it('returns Hard Spike 1 at 0.25 (25%) progress for system1', () => {
    const phase = getPhaseForProgress(1, 0.25)
    expect(phase.name).toBe('Hard Spike 1')
    expect(phase.spawnRateMultiplier).toBe(1.5)
  })

  it('returns Hard Spike 1 exactly at startPercent 0.2', () => {
    // Boundary: 0.2 is the START of Hard Spike 1, not end of Easy Start
    const phase = getPhaseForProgress(1, 0.2)
    expect(phase.name).toBe('Hard Spike 1')
  })

  it('returns Crescendo at 0.85 (85%) progress for system1', () => {
    const phase = getPhaseForProgress(1, 0.85)
    expect(phase.name).toBe('Crescendo')
  })

  it('returns Pre-Boss Calm at 0.97 (97%) progress for system1', () => {
    const phase = getPhaseForProgress(1, 0.97)
    expect(phase.name).toBe('Pre-Boss Calm')
  })

  it('returns last phase when timeProgress >= 1.0 (edge case)', () => {
    const phase = getPhaseForProgress(1, 1.0)
    expect(phase.name).toBe('Pre-Boss Calm')
  })

  it('returns last phase for timeProgress > 1.0 (overrun edge case)', () => {
    const phase = getPhaseForProgress(1, 1.5)
    expect(phase.name).toBe('Pre-Boss Calm')
  })

  it('uses system2 profile for systemNum=2', () => {
    const phase1 = getPhaseForProgress(1, 0.1)
    const phase2 = getPhaseForProgress(2, 0.1)
    // System 2 Easy Start has a higher multiplier
    expect(phase2.spawnRateMultiplier).toBeGreaterThan(phase1.spawnRateMultiplier)
  })

  it('uses system3 profile for systemNum=3', () => {
    const phase3 = getPhaseForProgress(3, 0.1)
    const phase1 = getPhaseForProgress(1, 0.1)
    expect(phase3.spawnRateMultiplier).toBeGreaterThan(phase1.spawnRateMultiplier)
  })

  it('falls back to system1 for unknown systemNum', () => {
    const phaseUnknown = getPhaseForProgress(99, 0.1)
    const phase1 = getPhaseForProgress(1, 0.1)
    expect(phaseUnknown).toBe(phase1)
  })

  it('Hard Spike phases have higher multiplier than adjacent Easy/Medium phases in system1', () => {
    const easyStart = getPhaseForProgress(1, 0.1)   // Easy Start
    const hardSpike1 = getPhaseForProgress(1, 0.25)  // Hard Spike 1
    const medium1 = getPhaseForProgress(1, 0.4)      // Medium Phase 1
    const hardSpike2 = getPhaseForProgress(1, 0.55)  // Hard Spike 2
    const medium2 = getPhaseForProgress(1, 0.7)      // Medium Phase 2

    expect(hardSpike1.spawnRateMultiplier).toBeGreaterThan(easyStart.spawnRateMultiplier)
    expect(hardSpike1.spawnRateMultiplier).toBeGreaterThan(medium1.spawnRateMultiplier)
    expect(hardSpike2.spawnRateMultiplier).toBeGreaterThan(medium1.spawnRateMultiplier)
    expect(hardSpike2.spawnRateMultiplier).toBeGreaterThan(medium2.spawnRateMultiplier)
  })
})
