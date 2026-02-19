import { describe, it, expect, beforeEach } from 'vitest'
import { calculateFlashIntensity, applyHitFlash, restoreOriginalColor } from '../hitFlashSystem.js'

// Minimal mock material for testing — mirrors Three.js MeshStandardMaterial emissive API
function createMockMaterial(r = 0, g = 0, b = 0) {
  return {
    emissive: {
      r, g, b,
      setScalar(v) { this.r = v; this.g = v; this.b = v },
      setRGB(r, g, b) { this.r = r; this.g = g; this.b = b },
      copy(other) { this.r = other.r; this.g = other.g; this.b = other.b },
      clone() {
        return {
          r: this.r, g: this.g, b: this.b,
          setScalar: this.setScalar,
          setRGB: this.setRGB,
          copy: this.copy,
          clone: this.clone,
        }
      },
    },
    userData: {},
  }
}

describe('hitFlashSystem (Story 27.3)', () => {
  describe('calculateFlashIntensity', () => {
    it('returns 1.0 at start of flash (timer === duration)', () => {
      expect(calculateFlashIntensity(0.12, 0.12, 'linear')).toBeCloseTo(1.0)
    })

    it('returns 0.5 at half duration', () => {
      expect(calculateFlashIntensity(0.06, 0.12, 'linear')).toBeCloseTo(0.5)
    })

    it('returns 0.0 when timer is 0', () => {
      expect(calculateFlashIntensity(0, 0.12, 'linear')).toBeCloseTo(0.0)
    })

    it('returns 0 for zero duration to avoid division by zero', () => {
      expect(calculateFlashIntensity(0.1, 0, 'linear')).toBe(0)
    })

    it('clamps to 1.0 if timer exceeds duration', () => {
      expect(calculateFlashIntensity(0.2, 0.12, 'linear')).toBeCloseTo(1.0)
    })

    it('applies easeOut curve (cubic) correctly at half duration', () => {
      // t = 0.5, t^3 = 0.125
      expect(calculateFlashIntensity(0.06, 0.12, 'easeOut')).toBeCloseTo(0.125)
    })

    it('easeOut returns 1.0 at full duration', () => {
      expect(calculateFlashIntensity(0.12, 0.12, 'easeOut')).toBeCloseTo(1.0)
    })

    it('easeOut returns 0.0 when timer is 0', () => {
      expect(calculateFlashIntensity(0, 0.12, 'easeOut')).toBeCloseTo(0.0)
    })
  })

  describe('applyHitFlash', () => {
    it('sets emissive to intensity value on first call', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8)
      expect(mat.emissive.r).toBeCloseTo(0.8)
      expect(mat.emissive.g).toBeCloseTo(0.8)
      expect(mat.emissive.b).toBeCloseTo(0.8)
    })

    it('stores originalEmissive in userData on first call', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8)
      expect(mat.userData.originalEmissive).toBeTruthy()
      expect(mat.userData.originalEmissive.r).toBeCloseTo(0)
    })

    it('does NOT overwrite originalEmissive on subsequent calls', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8)
      // originalEmissive is now stored as black (0, 0, 0)
      applyHitFlash(mat, 0.5) // second call — should not overwrite
      // originalEmissive should still be black
      expect(mat.userData.originalEmissive.r).toBeCloseTo(0)
    })

    it('updates emissive intensity on each call', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8)
      applyHitFlash(mat, 0.3)
      expect(mat.emissive.r).toBeCloseTo(0.3)
    })

    it('handles material with non-zero original emissive', () => {
      const mat = createMockMaterial(1, 0, 0) // red emissive
      applyHitFlash(mat, 0.8)
      // originalEmissive should be red
      expect(mat.userData.originalEmissive.r).toBeCloseTo(1)
      expect(mat.userData.originalEmissive.g).toBeCloseTo(0)
      // current emissive should be white flash
      expect(mat.emissive.r).toBeCloseTo(0.8)
      expect(mat.emissive.g).toBeCloseTo(0.8)
    })

    it('does nothing if material has no emissive property', () => {
      const mat = { userData: {} } // no emissive
      expect(() => applyHitFlash(mat, 0.8)).not.toThrow()
      expect(mat.userData.originalEmissive).toBeUndefined()
    })

    it('does nothing if material is null/undefined', () => {
      expect(() => applyHitFlash(null, 0.8)).not.toThrow()
      expect(() => applyHitFlash(undefined, 0.8)).not.toThrow()
    })

    it('applies white flash by default (0xFFFFFF at 0.8 intensity)', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8) // default colorHex = 0xFFFFFF
      expect(mat.emissive.r).toBeCloseTo(0.8)
      expect(mat.emissive.g).toBeCloseTo(0.8)
      expect(mat.emissive.b).toBeCloseTo(0.8)
    })

    it('applies a custom color hex (0xFF0000 = red)', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 1.0, 0xFF0000) // pure red at full intensity
      expect(mat.emissive.r).toBeCloseTo(1.0)
      expect(mat.emissive.g).toBeCloseTo(0.0)
      expect(mat.emissive.b).toBeCloseTo(0.0)
    })

    it('scales custom color by intensity (0xFF0000 at 0.5)', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.5, 0xFF0000)
      expect(mat.emissive.r).toBeCloseTo(0.5)
      expect(mat.emissive.g).toBeCloseTo(0.0)
      expect(mat.emissive.b).toBeCloseTo(0.0)
    })
  })

  describe('restoreOriginalColor', () => {
    it('restores emissive to originalEmissive stored in userData', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8) // stores original (black), sets to white
      restoreOriginalColor(mat)
      expect(mat.emissive.r).toBeCloseTo(0)
      expect(mat.emissive.g).toBeCloseTo(0)
      expect(mat.emissive.b).toBeCloseTo(0)
    })

    it('restores non-black original emissive correctly', () => {
      const mat = createMockMaterial(1, 0, 0) // red emissive boss-style
      applyHitFlash(mat, 0.8)
      restoreOriginalColor(mat)
      expect(mat.emissive.r).toBeCloseTo(1)
      expect(mat.emissive.g).toBeCloseTo(0)
      expect(mat.emissive.b).toBeCloseTo(0)
    })

    it('does nothing if originalEmissive was never stored', () => {
      const mat = createMockMaterial(0.5, 0.5, 0)
      // No applyHitFlash was called → no originalEmissive stored
      expect(() => restoreOriginalColor(mat)).not.toThrow()
      // emissive unchanged
      expect(mat.emissive.r).toBeCloseTo(0.5)
    })

    it('does nothing if material has no emissive property', () => {
      const mat = { userData: {} }
      expect(() => restoreOriginalColor(mat)).not.toThrow()
    })

    it('does nothing if material is null/undefined', () => {
      expect(() => restoreOriginalColor(null)).not.toThrow()
      expect(() => restoreOriginalColor(undefined)).not.toThrow()
    })
  })

  describe('full flash-and-restore cycle', () => {
    it('black emissive: apply then restore returns to black', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8)
      expect(mat.emissive.r).toBeCloseTo(0.8)
      restoreOriginalColor(mat)
      expect(mat.emissive.r).toBeCloseTo(0)
    })

    it('multiple flashes and restores work correctly', () => {
      const mat = createMockMaterial(0, 0, 0)
      applyHitFlash(mat, 0.8)
      restoreOriginalColor(mat)
      applyHitFlash(mat, 0.5) // second flash — originalEmissive already stored
      expect(mat.emissive.r).toBeCloseTo(0.5)
      restoreOriginalColor(mat)
      expect(mat.emissive.r).toBeCloseTo(0)
    })
  })
})
