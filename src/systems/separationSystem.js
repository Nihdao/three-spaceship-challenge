import { GAME_CONFIG } from '../config/gameConfig.js'
import { createSpatialHash } from './spatialHash.js'

/**
 * Creates a separation system that applies soft-body push forces between enemies
 * to prevent visual stacking. Uses a dedicated spatial hash for efficient O(n) neighbor
 * queries instead of O(n²) brute-force comparisons.
 *
 * Story 23.2: Enemy Collision Physics
 */
export function createSeparationSystem() {
  // Dedicated spatial hash — independent from the collision system's hash
  const spatialHash = createSpatialHash(GAME_CONFIG.SPATIAL_HASH_CELL_SIZE)

  /**
   * Apply separation forces to all enemies for the current frame.
   * Mutates enemy x/z positions directly (no React re-renders triggered).
   *
   * @param {Array} enemies - Array of enemy objects (mutable, from useEnemies.getState().enemies)
   * @param {Object|null} boss - Boss object with x, z, hp (from useBoss.getState().boss), or null
   * @param {number} delta - Frame delta in seconds
   */
  function applySeparation(enemies, boss, delta) {
    if (enemies.length === 0) return

    // Enemy-enemy separation (requires at least 2 enemies)
    if (enemies.length >= 2) {
      // Build id→enemy map for O(1) lookup — avoids O(n) Array.find() in the inner loop
      // With 200 enemies and 800 pairs, this saves ~160k iterations per frame
      const enemyMap = new Map()
      for (let i = 0; i < enemies.length; i++) {
        enemyMap.set(enemies[i].id, enemies[i])
      }

      // Rebuild spatial hash with current enemy positions
      spatialHash.clear()
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i]
        spatialHash.insert({
          id: e.id,
          x: e.x,
          z: e.z,
          radius: GAME_CONFIG.ENEMY_SEPARATION_RADIUS,
        })
      }

      // Apply separation forces — each pair processed exactly once
      const processed = new Set()
      for (let i = 0; i < enemies.length; i++) {
        const enemyA = enemies[i]
        const neighbors = spatialHash.queryNearby(
          enemyA.x,
          enemyA.z,
          GAME_CONFIG.ENEMY_SEPARATION_RADIUS
        )

        for (let j = 0; j < neighbors.length; j++) {
          const neighbor = neighbors[j]
          if (neighbor.id === enemyA.id) continue

          // Canonical pair key (order-independent deduplication)
          const a = enemyA.id
          const b = neighbor.id
          const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`
          if (processed.has(pairKey)) continue
          processed.add(pairKey)

          const enemyB = enemyMap.get(neighbor.id)
          if (!enemyB) continue

          const dx = enemyA.x - enemyB.x
          const dz = enemyA.z - enemyB.z
          const distance = Math.sqrt(dx * dx + dz * dz)

          if (distance < GAME_CONFIG.ENEMY_SEPARATION_RADIUS && distance > 0.001) {
            const overlap = GAME_CONFIG.ENEMY_SEPARATION_RADIUS - distance
            const forceMagnitude = overlap * GAME_CONFIG.SEPARATION_FORCE_STRENGTH * delta
            const displacement = Math.min(forceMagnitude, GAME_CONFIG.MAX_SEPARATION_DISPLACEMENT)

            const nx = dx / distance
            const nz = dz / distance

            // Apply half force to each enemy (Newton's third law)
            // sniper_fixed enemies are stationary by design — skip them as pushees
            if (enemyA.behavior !== 'sniper_fixed') {
              enemyA.x += nx * displacement * 0.5
              enemyA.z += nz * displacement * 0.5
            }
            if (enemyB.behavior !== 'sniper_fixed') {
              enemyB.x -= nx * displacement * 0.5
              enemyB.z -= nz * displacement * 0.5
            }
          }
        }
      }
    }

    // Boss separation — boss pushes enemies away, enemies do not push boss (one-way)
    if (boss && boss.hp > 0) {
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i]
        const dx = enemy.x - boss.x
        const dz = enemy.z - boss.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance < GAME_CONFIG.BOSS_SEPARATION_RADIUS && distance > 0.001) {
          const overlap = GAME_CONFIG.BOSS_SEPARATION_RADIUS - distance
          const forceMagnitude = overlap * GAME_CONFIG.SEPARATION_FORCE_STRENGTH * delta
          const displacement = Math.min(forceMagnitude, GAME_CONFIG.MAX_SEPARATION_DISPLACEMENT)

          const nx = dx / distance
          const nz = dz / distance

          // Full force on enemy — boss does not move
          enemy.x += nx * displacement
          enemy.z += nz * displacement
        }
      }
    }
  }

  return { applySeparation }
}
