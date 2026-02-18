import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'
import { getPhaseForProgress } from '../entities/waveDefs.js'
import usePlayer from '../stores/usePlayer.jsx'

// Sweep group size range
const SWEEP_GROUP_MIN = 3
const SWEEP_GROUP_MAX = 5
// Spacing between sweep enemies in line formation (perpendicular to sweep direction)
const SWEEP_LINE_SPACING = 5
// Sniper fixed spawn distance (far from player, outside visible area)
const SNIPER_FIXED_SPAWN_DISTANCE_MIN = 150
const SNIPER_FIXED_SPAWN_DISTANCE_MAX = 200

// Story 23.1: Infer enemy tier from ID prefix when no explicit tier field exists
function inferTierFromId(enemyId) {
  if (enemyId.startsWith('FODDER_')) return 'FODDER'
  if (enemyId.startsWith('SKIRMISHER_')) return 'SKIRMISHER'
  if (enemyId.startsWith('ASSAULT_')) return 'ASSAULT'
  if (enemyId.startsWith('ELITE_')) return 'ELITE'
  return 'FODDER' // Default fallback for unclassified enemies
}

// Story 23.1: Get enemy types available for the given wave phase using tier weights.
// Returns enemies with an adjustedWeight = spawnWeight * tierWeight for weighted random selection.
function getAvailableEnemyTypes(phase) {
  const tierWeights = phase.enemyTierWeights
  const available = []

  for (const enemy of Object.values(ENEMIES)) {
    if (enemy.spawnWeight <= 0) continue
    const tier = enemy.tier || inferTierFromId(enemy.id)
    const tierWeight = tierWeights[tier]
    if (!tierWeight || tierWeight <= 0) continue
    available.push({ ...enemy, adjustedWeight: enemy.spawnWeight * tierWeight })
  }

  return available
}

export function createSpawnSystem() {
  let spawnTimer = null // Initialized on first tick using wave-phase interval (MED-3 fix)
  let elapsedTime = 0

  // Story 23.1: Pick an enemy type from a pre-computed available pool (MED-1: called once per batch).
  // `available` is the result of getAvailableEnemyTypes(phase), hoisted out of the batch loop.
  function pickEnemyType(available) {
    if (available.length === 0) {
      const fallback = Object.values(ENEMIES).find(e => e.spawnWeight > 0)
      return fallback ? fallback.id : 'FODDER_BASIC'
    }

    const totalWeight = available.reduce((sum, e) => sum + e.adjustedWeight, 0)
    let roll = Math.random() * totalWeight

    for (const enemy of available) {
      roll -= enemy.adjustedWeight
      if (roll <= 0) return enemy.id
    }

    return available[available.length - 1].id
  }

  // Story 23.1: tick now accepts an options object for wave system parameters.
  //   options.systemNum      — 1-indexed system number (default: 1)
  //   options.systemTimer    — total system duration in seconds (default: SPAWN_INTERVAL_BASE * …)
  //   options.systemScaling  — per-stat difficulty scaling object passed to spawn instructions
  //
  // Curse multiplier is read internally from usePlayer.permanentUpgradeBonuses.curse (Story 20.4).
  function tick(delta, playerX, playerZ, options = {}) {
    const {
      systemNum = 1,
      systemTimer = GAME_CONFIG.SYSTEM_TIMER,
      systemScaling = null,
    } = options

    elapsedTime += delta

    // MED-3 fix: Initialize spawnTimer on first call (after create or reset) using the wave-phase
    // interval rather than SPAWN_INTERVAL_BASE, so the very first spawn respects the active phase.
    if (spawnTimer === null) {
      const initProgress = Math.min(elapsedTime / systemTimer, 1.0)
      const initPhase = getPhaseForProgress(systemNum, initProgress)
      const initCurseBonus = usePlayer.getState().permanentUpgradeBonuses?.curse ?? 0
      spawnTimer = Math.max(
        GAME_CONFIG.SPAWN_INTERVAL_MIN,
        GAME_CONFIG.SPAWN_INTERVAL_BASE / (initPhase.spawnRateMultiplier * (1.0 + initCurseBonus)),
      )
    }

    spawnTimer -= delta

    if (spawnTimer > 0) return []

    // Compute time progress (0.0–1.0) and resolve active wave phase
    const timeProgress = Math.min(elapsedTime / systemTimer, 1.0)
    const phase = getPhaseForProgress(systemNum, timeProgress)

    // Story 20.4: Curse reduces spawn interval (increases spawn rate), stacks with wave multiplier
    // MED-2 fix: null-guard prevents NaN propagation if curse field is not yet initialized.
    const curseBonus = usePlayer.getState().permanentUpgradeBonuses?.curse ?? 0
    const curseMultiplier = 1.0 + curseBonus

    // Story 23.1: Phase-based interval — higher spawnRateMultiplier = shorter interval = more enemies
    const interval = Math.max(
      GAME_CONFIG.SPAWN_INTERVAL_MIN,
      GAME_CONFIG.SPAWN_INTERVAL_BASE / (phase.spawnRateMultiplier * curseMultiplier),
    )
    spawnTimer = interval

    // Batch size ramp is unchanged (linear over elapsed time)
    const batchSize = GAME_CONFIG.SPAWN_BATCH_SIZE_BASE + Math.floor(elapsedTime / GAME_CONFIG.SPAWN_BATCH_RAMP_INTERVAL)

    // MED-1 fix: Build available enemy pool ONCE per batch, not once per individual pick.
    const available = getAvailableEnemyTypes(phase)

    const instructions = []
    for (let i = 0; i < batchSize; i++) {
      const typeId = pickEnemyType(available)
      const def = ENEMIES[typeId]

      if (def && def.behavior === 'sweep') {
        // Spawn sweep enemies as a group with shared direction
        const groupSize = SWEEP_GROUP_MIN + Math.floor(Math.random() * (SWEEP_GROUP_MAX - SWEEP_GROUP_MIN + 1))
        const sweepAngle = Math.random() * Math.PI * 2
        const sweepDirection = { x: Math.cos(sweepAngle), z: Math.sin(sweepAngle) }

        // Perpendicular vector for line formation
        const perpX = -sweepDirection.z
        const perpZ = sweepDirection.x

        // Spawn position: at edge of play area, perpendicular to sweep direction
        const spawnAngle = Math.random() * Math.PI * 2
        const distance = GAME_CONFIG.SPAWN_DISTANCE_MIN +
          Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)
        const baseX = playerX + Math.cos(spawnAngle) * distance
        const baseZ = playerZ + Math.sin(spawnAngle) * distance

        for (let g = 0; g < groupSize; g++) {
          const offset = (g - (groupSize - 1) / 2) * SWEEP_LINE_SPACING
          const bound = GAME_CONFIG.PLAY_AREA_SIZE
          const x = Math.max(-bound, Math.min(bound, baseX + perpX * offset))
          const z = Math.max(-bound, Math.min(bound, baseZ + perpZ * offset))
          instructions.push({ typeId, x, z, scaling: systemScaling, sweepDirection })
        }
        // Count sweep group toward batch size
        i += groupSize - 1
      } else {
        // Sniper fixed: spawn far from player (outside visible area)
        const isSniperFixed = def && def.behavior === 'sniper_fixed'
        const minDist = isSniperFixed ? SNIPER_FIXED_SPAWN_DISTANCE_MIN : GAME_CONFIG.SPAWN_DISTANCE_MIN
        const maxDist = isSniperFixed ? SNIPER_FIXED_SPAWN_DISTANCE_MAX : GAME_CONFIG.SPAWN_DISTANCE_MAX

        const angle = Math.random() * Math.PI * 2
        const distance = minDist + Math.random() * (maxDist - minDist)

        let x = playerX + Math.cos(angle) * distance
        let z = playerZ + Math.sin(angle) * distance

        // Clamp to play area bounds
        const bound = GAME_CONFIG.PLAY_AREA_SIZE
        x = Math.max(-bound, Math.min(bound, x))
        z = Math.max(-bound, Math.min(bound, z))

        instructions.push({ typeId, x, z, scaling: systemScaling })
      }
    }

    return instructions
  }

  function reset() {
    spawnTimer = null // Recomputed on next tick using wave-phase interval
    elapsedTime = 0
  }

  return { tick, reset }
}
