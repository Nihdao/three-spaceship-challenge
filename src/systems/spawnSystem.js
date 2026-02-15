import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'
import usePlayer from '../stores/usePlayer.jsx'

// Sweep group size range
const SWEEP_GROUP_MIN = 3
const SWEEP_GROUP_MAX = 5
// Spacing between sweep enemies in line formation (perpendicular to sweep direction)
const SWEEP_LINE_SPACING = 5
// Sniper fixed spawn distance (far from player, outside visible area)
const SNIPER_FIXED_SPAWN_DISTANCE_MIN = 150
const SNIPER_FIXED_SPAWN_DISTANCE_MAX = 200

// Story 16.3: Get enemy types available at current elapsed time
function getAvailableEnemyTypes(elapsedTime) {
  const schedule = GAME_CONFIG.TIME_GATED_SPAWN_SCHEDULE
  const availableIds = new Set()

  for (const entry of schedule) {
    if (elapsedTime >= entry.minTime) {
      availableIds.add(entry.typeId)
    }
  }

  return Object.values(ENEMIES).filter(
    e => e.spawnWeight > 0 && availableIds.has(e.id)
  )
}

export function createSpawnSystem() {
  let spawnTimer = GAME_CONFIG.SPAWN_INTERVAL_BASE
  let elapsedTime = 0

  // Story 16.3 Task 2.4: Accept elapsedTime parameter for testability and clarity
  function pickEnemyType(currentElapsedTime) {
    const available = getAvailableEnemyTypes(currentElapsedTime)
    if (available.length === 0) {
      // Fallback to basic enemy if schedule is empty (shouldn't happen in normal gameplay)
      const fallback = Object.values(ENEMIES).find(e => e.spawnWeight > 0)
      return fallback ? fallback.id : 'FODDER_BASIC'
    }

    const totalWeight = available.reduce((sum, e) => sum + e.spawnWeight, 0)
    let roll = Math.random() * totalWeight

    for (const enemy of available) {
      roll -= enemy.spawnWeight
      if (roll <= 0) return enemy.id
    }

    return available[available.length - 1].id
  }

  function tick(delta, playerX, playerZ, scaling = null) {
    elapsedTime += delta
    spawnTimer -= delta

    if (spawnTimer > 0) return []

    // Reset timer based on difficulty ramp
    // Story 20.4: Curse reduces interval (increases spawn rate). Stacks multiplicatively with Epic 23 dynamic waves.
    const curseBonus = usePlayer.getState().permanentUpgradeBonuses.curse
    const curseMultiplier = 1.0 + curseBonus
    const baseInterval = Math.max(
      GAME_CONFIG.SPAWN_INTERVAL_MIN,
      GAME_CONFIG.SPAWN_INTERVAL_BASE - elapsedTime * GAME_CONFIG.SPAWN_RAMP_RATE,
    )
    const interval = baseInterval / curseMultiplier
    spawnTimer = interval

    // Calculate batch size
    const batchSize = GAME_CONFIG.SPAWN_BATCH_SIZE_BASE + Math.floor(elapsedTime / GAME_CONFIG.SPAWN_BATCH_RAMP_INTERVAL)

    const instructions = []
    for (let i = 0; i < batchSize; i++) {
      // Story 16.3 HIGH-1 fix: Pass elapsedTime to pickEnemyType (avoids redundant filtering in loop)
      const typeId = pickEnemyType(elapsedTime)
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
          instructions.push({ typeId, x, z, scaling, sweepDirection })
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

        instructions.push({ typeId, x, z, scaling })
      }
    }

    return instructions
  }

  function reset() {
    spawnTimer = GAME_CONFIG.SPAWN_INTERVAL_BASE
    elapsedTime = 0
  }

  return { tick, reset }
}
