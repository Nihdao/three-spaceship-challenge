import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Layer 2: Pure logic system — no React, no stores, no rendering.
 * Moves projectiles in-place and marks expired/OOB ones as inactive.
 */
export function createProjectileSystem() {
  const PLAY_AREA = GAME_CONFIG.PLAY_AREA_SIZE
  const HOMING_TURN_RATE = 3.0 // radians/sec — how fast homing missiles steer

  function tick(projectiles, delta, enemies) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i]
      if (!p.active) continue

      // Homing steering: gently turn toward nearest enemy
      if (p.homing && enemies && enemies.length > 0) {
        let nearestDistSq = Infinity
        let nearestX = 0
        let nearestZ = 0
        for (let e = 0; e < enemies.length; e++) {
          const dx = enemies[e].x - p.x
          const dz = enemies[e].z - p.z
          const distSq = dx * dx + dz * dz
          if (distSq < nearestDistSq) {
            nearestDistSq = distSq
            nearestX = dx
            nearestZ = dz
          }
        }
        if (nearestDistSq < Infinity) {
          // Compute target angle and current angle
          const targetAngle = Math.atan2(nearestX, -nearestZ)
          const currentAngle = Math.atan2(p.dirX, -p.dirZ)

          // Compute shortest angular difference
          let angleDiff = targetAngle - currentAngle
          // Wrap to [-PI, PI]
          while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
          while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

          // Apply turn rate limit
          const maxTurn = HOMING_TURN_RATE * delta
          const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff))
          const newAngle = currentAngle + turn

          // Update direction (normalized by construction via sin/cos)
          p.dirX = Math.sin(newAngle)
          p.dirZ = -Math.cos(newAngle)
        }
      }

      // Store previous position for swept collision detection (anti-tunneling)
      p.prevX = p.x
      p.prevZ = p.z
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
