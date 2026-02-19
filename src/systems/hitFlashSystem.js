/**
 * Hit Flash System (Story 27.3)
 * Pure logic functions for enemy/boss material hit flash effects.
 * No Three.js imports — accepts material objects compatible with MeshStandardMaterial.
 */

/**
 * Calculate flash intensity based on remaining timer.
 * Returns 1.0 at the start of the flash (timer === duration),
 * linearly (or cubically) fading to 0.0 as the timer reaches 0.
 *
 * @param {number} timer    - Remaining timer value in seconds
 * @param {number} duration - Total flash duration in seconds
 * @param {'linear'|'easeOut'} [curve='linear'] - Fade curve
 * @returns {number} Intensity clamped to [0, 1]
 */
export function calculateFlashIntensity(timer, duration, curve = 'linear') {
  if (duration <= 0) return 0
  const t = Math.min(1, timer / duration) // 1.0 at start, 0.0 at end
  if (curve === 'easeOut') {
    return t * t * t // Cubic ease-out — dramatic fade
  }
  return t // Linear fade
}

/**
 * Apply hit flash emissive colour to a material.
 * Stores the original emissive in material.userData on the very first call
 * so it can be restored later without losing custom glow colours.
 *
 * @param {object} material  - Three.js material with emissive Color property
 * @param {number} intensity - Flash intensity [0, 1]
 * @param {number} [colorHex=0xFFFFFF] - Flash colour as a 24-bit hex integer (e.g. 0xFF4444 for red)
 */
export function applyHitFlash(material, intensity, colorHex = 0xFFFFFF) {
  if (!material?.emissive) return
  // Store original emissive once — never overwrite on subsequent calls
  if (!material.userData.originalEmissive) {
    material.userData.originalEmissive = material.emissive.clone()
  }
  // Extract RGB from hex and scale by intensity — no Three.js import required
  const r = ((colorHex >> 16) & 0xFF) / 255 * intensity
  const g = ((colorHex >> 8) & 0xFF) / 255 * intensity
  const b = (colorHex & 0xFF) / 255 * intensity
  material.emissive.setRGB(r, g, b)
}

/**
 * Restore the original emissive colour to a material after flash ends.
 *
 * @param {object} material - Three.js material previously passed to applyHitFlash
 */
export function restoreOriginalColor(material) {
  if (!material?.emissive) return
  if (material.userData.originalEmissive) {
    material.emissive.copy(material.userData.originalEmissive)
  }
}
