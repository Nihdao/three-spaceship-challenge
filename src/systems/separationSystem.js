import { GAME_CONFIG } from '../config/gameConfig.js'
import { createSpatialHash } from './spatialHash.js'

/**
 * Module-level pre-allocated structures — Story 41.3.
 * Consistent with the pattern established in 41.1 (GameLoop) and 41.2 (useEnemies/useWeapons).
 * Safe because applySeparation() is called synchronously once per frame from the GameLoop.
 */
const _processedPairs = new Set()
const _enemyMap = new Map()

// Story 43.3: Reusable stub pool for spatialHash.insert() — eliminates 1 object allocation per
// enemy per frame. Pool grows lazily when enemy count exceeds current pool size; never shrinks.
const _sepStubs = []

function _getStub(i) {
  if (i >= _sepStubs.length) {
    _sepStubs.push({ id: '', numericId: 0, x: 0, z: 0, radius: 0 })
  }
  return _sepStubs[i]
}

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
      _enemyMap.clear()
      for (let i = 0; i < enemies.length; i++) {
        _enemyMap.set(enemies[i].id, enemies[i])
      }

      // Rebuild spatial hash with current enemy positions — Story 43.3: reuse stub objects
      spatialHash.clear()
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i]
        const s = _getStub(i)
        s.id = e.id
        s.numericId = e.numericId
        s.x = e.x
        s.z = e.z
        s.radius = GAME_CONFIG.ENEMY_SEPARATION_RADIUS
        spatialHash.insert(s)
      }

      // Apply separation forces — each pair processed exactly once
      _processedPairs.clear()
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

          // Integer pair key — requires numericId in the spatialHash.insert stub above and at spawn (useEnemies.jsx). See Story 41.3.
          const aNum = enemyA.numericId
          const bNum = neighbor.numericId
          const pairKey = Math.min(aNum, bNum) * 100000 + Math.max(aNum, bNum)
          if (_processedPairs.has(pairKey)) continue
          _processedPairs.add(pairKey)

          const enemyB = _enemyMap.get(neighbor.id)
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
