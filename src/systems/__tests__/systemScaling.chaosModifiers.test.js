import { describe, it, expect } from 'vitest'
import { buildSystemScaling } from '../systemScaling.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { GALAXIES } from '../../entities/galaxyDefs.js'

// Story 52.2: unit tests for buildSystemScaling (chaos enemy stat modifiers)

const chaosGalaxy  = GALAXIES.find(g => g.id === 'andromeda_inferno')
const normalGalaxy = GALAXIES.find(g => g.id === 'andromeda_reach')

describe('buildSystemScaling — chaos modifiers (Story 52.2)', () => {

  // AC #1: chaosEnemyMult.hp/damage/speed multiplied into systemScaling
  it('applies chaosEnemyMult.hp and .damage at system 1 (index 0)', () => {
    const { scaling } = buildSystemScaling(chaosGalaxy, 0)
    const c = chaosGalaxy.chaosEnemyMult
    // At index 0: pow(x, 0) = 1 → result = 1 * chaos
    expect(scaling.hp).toBeCloseTo(c.hp)
    expect(scaling.damage).toBeCloseTo(c.damage)
  })

  // AC #1 stacked with inter-system scaling at system 2 (index 1)
  it('stacks chaosEnemyMult with difficultyScalingPerSystem at system 2 (index 1)', () => {
    const { scaling } = buildSystemScaling(chaosGalaxy, 1)
    const s = chaosGalaxy.difficultyScalingPerSystem
    const c = chaosGalaxy.chaosEnemyMult
    expect(scaling.hp).toBeCloseTo(s.hp * c.hp)
    expect(scaling.damage).toBeCloseTo(s.damage * c.damage)
  })

  // AC #3: speed formula = pow(speed_scaling, si) * enemySpeedMult * chaosEnemyMult.speed
  it('speed formula matches AC #3: pow(speedBase, si) × enemySpeedMult × chaosSpeed', () => {
    const em = chaosGalaxy.enemySpeedMult ?? 1.0
    const cs = chaosGalaxy.chaosEnemyMult.speed
    const sb = chaosGalaxy.difficultyScalingPerSystem.speed

    const { scaling: s1 } = buildSystemScaling(chaosGalaxy, 0)
    const { scaling: s2 } = buildSystemScaling(chaosGalaxy, 1)

    expect(s1.speed).toBeCloseTo(1.0 * em * cs)      // pow(sb, 0) = 1
    expect(s2.speed).toBeCloseTo(sb  * em * cs)       // pow(sb, 1) = sb
  })

  // AC #2: chaosSpawnMult extracted from chaosEnemyMult.spawnRate
  it('returns chaosSpawnMult equal to chaosEnemyMult.spawnRate', () => {
    const { chaosSpawnMult } = buildSystemScaling(chaosGalaxy, 0)
    expect(chaosSpawnMult).toBe(chaosGalaxy.chaosEnemyMult.spawnRate)
  })

  // AC #4: galaxy without chaosEnemyMult returns 1.0 fallback (no-ops)
  it('returns 1.0 no-ops for galaxy without chaosEnemyMult (andromeda_reach at system 1)', () => {
    const { scaling, chaosSpawnMult } = buildSystemScaling(normalGalaxy, 0)
    // At index 0: pow(x, 0) = 1 × 1 (chaos fallback) = 1
    expect(scaling.hp).toBeCloseTo(1.0)
    expect(scaling.damage).toBeCloseTo(1.0)
    expect(chaosSpawnMult).toBe(1.0)
  })

  // M3 fix: else branch (no difficultyScalingPerSystem) also applies chaos mults
  it('applies chaos mults in else branch (no difficultyScalingPerSystem)', () => {
    const fakeChaoGalaxy = {
      id: 'test_chaos_nodiff',
      chaosEnemyMult: { hp: 1.30, damage: 1.30, speed: 1.30, spawnRate: 1.30 },
      // no difficultyScalingPerSystem
    }
    const { scaling, chaosSpawnMult } = buildSystemScaling(fakeChaoGalaxy, 0) // system 1 = index 0

    const base = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
    expect(scaling.hp).toBeCloseTo(base.hp * 1.30)
    expect(scaling.damage).toBeCloseTo(base.damage * 1.30)
    expect(scaling.speed).toBeCloseTo(base.speed * 1.30)
    expect(chaosSpawnMult).toBe(1.30)
  })

  // Null galaxy falls back gracefully (e.g. galaxy not found)
  it('handles null gc gracefully (all 1.0 no-ops)', () => {
    const { scaling, chaosSpawnMult } = buildSystemScaling(null, 0)
    const base = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
    expect(scaling.hp).toBe(base.hp)
    expect(chaosSpawnMult).toBe(1.0)
  })
})
