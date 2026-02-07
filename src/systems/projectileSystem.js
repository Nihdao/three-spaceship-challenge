import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Layer 2: Pure logic system — no React, no stores, no rendering.
 * Moves projectiles in-place and marks expired/OOB ones as inactive.
 */
export function createProjectileSystem() {
  const PLAY_AREA = GAME_CONFIG.PLAY_AREA_SIZE

  function tick(projectiles, delta) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active) continue

      p.x += p.dirX * p.speed * delta
      p.z += p.dirZ * p.speed * delta
      p.elapsedTime += delta

      if (
        p.elapsedTime >= p.lifetime ||
        Math.abs(p.x) > PLAY_AREA ||
        Math.abs(p.z) > PLAY_AREA
      ) {
        p.active = false
      }
    }
  }

  function reset() {
    // No-op — system is stateless. Kept for consistency with spawnSystem/collisionSystem pattern.
  }

  return { tick, reset }
}
