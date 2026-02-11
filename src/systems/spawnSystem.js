import { GAME_CONFIG } from '../config/gameConfig.js'
import { ENEMIES } from '../entities/enemyDefs.js'

// Pre-compute enemy type entries for weighted random selection (exclude boss and any entry without spawnWeight)
const enemyTypes = Object.values(ENEMIES).filter(e => e.spawnWeight > 0)
const totalWeight = enemyTypes.reduce((sum, e) => sum + e.spawnWeight, 0)

export function createSpawnSystem() {
  let spawnTimer = GAME_CONFIG.SPAWN_INTERVAL_BASE
  let elapsedTime = 0

  function pickEnemyType() {
    let roll = Math.random() * totalWeight
    for (let i = 0; i < enemyTypes.length; i++) {
      roll -= enemyTypes[i].spawnWeight
      if (roll <= 0) return enemyTypes[i].id
    }
    return enemyTypes[enemyTypes.length - 1].id
  }

  function tick(delta, playerX, playerZ, difficultyMult = 1.0) {
    elapsedTime += delta
    spawnTimer -= delta

    if (spawnTimer > 0) return []

    // Reset timer based on difficulty ramp
    const interval = Math.max(
      GAME_CONFIG.SPAWN_INTERVAL_MIN,
      GAME_CONFIG.SPAWN_INTERVAL_BASE - elapsedTime * GAME_CONFIG.SPAWN_RAMP_RATE,
    )
    spawnTimer = interval

    // Calculate batch size
    const batchSize = GAME_CONFIG.SPAWN_BATCH_SIZE_BASE + Math.floor(elapsedTime / GAME_CONFIG.SPAWN_BATCH_RAMP_INTERVAL)

    const instructions = []
    for (let i = 0; i < batchSize; i++) {
      const typeId = pickEnemyType()
      const angle = Math.random() * Math.PI * 2
      const distance = GAME_CONFIG.SPAWN_DISTANCE_MIN +
        Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)

      let x = playerX + Math.cos(angle) * distance
      let z = playerZ + Math.sin(angle) * distance

      // Clamp to play area bounds
      const bound = GAME_CONFIG.PLAY_AREA_SIZE
      x = Math.max(-bound, Math.min(bound, x))
      z = Math.max(-bound, Math.min(bound, z))

      instructions.push({ typeId, x, z, difficultyMult })
    }

    return instructions
  }

  function reset() {
    spawnTimer = GAME_CONFIG.SPAWN_INTERVAL_BASE
    elapsedTime = 0
  }

  return { tick, reset }
}
