/**
 * Ship trail particle system
 *
 * Pre-allocated particle pool for ship movement trail effects.
 * Particles spawn behind the ship when moving and fade out over time.
 *
 * Particle structure:
 * - x, z: Position in world space
 * - dirX, dirZ: Movement direction (normalized) for elongation orientation
 * - lifetime: Total lifespan in seconds
 * - elapsedTime: Time since spawn
 * - active: Whether particle is alive
 * - color: Hex color string
 * - size: Base size in world units
 * - isDashing: Whether particle was emitted during dash (for brightness boost)
 *
 * @module particleTrailSystem
 */

import { GAME_CONFIG } from '../config/gameConfig.js'

const trailCfg = GAME_CONFIG.ENVIRONMENT_VISUAL_EFFECTS.SHIP_TRAIL
export const MAX_TRAIL_PARTICLES = trailCfg.MAX_PARTICLES

// Pre-allocated pool — zero GC pressure (matches particleSystem.js pattern)
const particles = []
for (let i = 0; i < MAX_TRAIL_PARTICLES; i++) {
  particles[i] = {
    x: 0, z: 0,
    dirX: 0, dirZ: 0,
    lifetime: 0, elapsedTime: 0,
    active: false, color: '', size: 0,
    isDashing: false,
  }
}
let activeCount = 0

/**
 * Emit a new trail particle at the given position
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @param {string} color - Hex color string (e.g., '#ffffff')
 * @param {number} lifetime - Particle lifespan in seconds
 * @param {number} size - Particle size in world units
 * @param {number} dirX - Normalized movement direction X
 * @param {number} dirZ - Normalized movement direction Z
 * @param {boolean} isDashing - Whether player is dashing (for brightness boost)
 */
export function emitTrailParticle(x, z, color, lifetime, size, dirX, dirZ, isDashing = false) {
  if (activeCount >= MAX_TRAIL_PARTICLES) return
  const p = particles[activeCount]
  p.x = x
  p.z = z
  p.dirX = dirX || 0
  p.dirZ = dirZ || 0
  p.lifetime = lifetime
  p.elapsedTime = 0
  p.active = true
  p.color = color
  p.size = size
  p.isDashing = isDashing
  activeCount++
}

/**
 * Update all active trail particles - age them and remove expired ones
 * Uses swap-with-last compaction for efficient removal
 * @param {number} delta - Time elapsed since last frame (seconds)
 */
export function updateTrailParticles(delta) {
  let i = 0
  while (i < activeCount) {
    const p = particles[i]
    p.elapsedTime += delta
    if (p.elapsedTime >= p.lifetime) {
      p.active = false
      activeCount--
      if (i < activeCount) {
        const temp = particles[i]
        particles[i] = particles[activeCount]
        particles[activeCount] = temp
      }
    } else {
      i++
    }
  }
}

/**
 * Get the particle pool array
 * @returns {Array} Particle pool (first activeCount entries are live)
 */
export function getTrailParticles() {
  return particles
}

/**
 * Get the number of currently active particles
 * @returns {number} Active particle count
 */
export function getActiveTrailCount() {
  return activeCount
}

/**
 * Reset all particles (used on game reset)
 */
export function resetTrailParticles() {
  activeCount = 0
}
