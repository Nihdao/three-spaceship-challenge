import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Projects a 3D world position to 2D screen pixel coordinates.
 * Accepts a THREE.Vector3 scratch buffer — position3D IS mutated by .project().
 * Pass a disposable or pre-allocated Vector3 (e.g. a module-level _tmpV).
 *
 * @param {THREE.Vector3} position3D - Scratch world position (will be mutated via .project())
 * @param {THREE.Camera} camera - Three.js camera
 * @param {HTMLCanvasElement} canvas - R3F canvas element
 * @returns {{ x: number, y: number }} Screen pixel coordinates
 */
export function project3DToScreen(position3D, camera, canvas) {
  position3D.project(camera) // Normalized device coordinates (-1 to 1); mutates position3D

  const x = (position3D.x * 0.5 + 0.5) * canvas.clientWidth
  const y = (-(position3D.y * 0.5) + 0.5) * canvas.clientHeight

  return { x, y }
}

/**
 * Ages all damage numbers by delta and removes expired ones.
 * Pure function — returns new array, does not mutate input.
 *
 * @param {Array} numbers - Current damage numbers array
 * @param {number} delta - Time delta in seconds
 * @returns {Array} Updated damage numbers array with expired entries removed
 */
export function updateDamageNumbers(numbers, delta) {
  const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
  const result = []
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i]
    const newAge = n.age + delta
    if (newAge < lifetime) {
      result.push({ ...n, age: newAge })
    }
  }
  return result
}

/**
 * Calculates a random horizontal drift offset for a new damage number.
 * Returns a value in the range [-DRIFT_RANGE, +DRIFT_RANGE] (pixels).
 *
 * @returns {number} Pixel offset (can be negative for left drift)
 */
export function calcDriftOffset() {
  return (Math.random() - 0.5) * GAME_CONFIG.DAMAGE_NUMBERS.DRIFT_RANGE * 2
}
