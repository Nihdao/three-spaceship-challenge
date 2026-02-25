import { describe, it, expect } from 'vitest'
import { isHitByArm } from '../../GameLoop.jsx'

// Story 32.1: isHitByArm — segment-vs-point collision in XZ plane

describe('isHitByArm (Story 32.1)', () => {
  const ARM_LENGTH = 12
  const ARM_HALF_WIDTH = 1.0
  const PX = 0, PZ = 0 // player position (arm origin)

  describe('arm along angle=0 (points along +X axis)', () => {
    const ANGLE = 0

    it('hits an enemy exactly on the arm center', () => {
      // At angle=0, dirX=cos(0)=1, dirZ=sin(0)=0
      // Enemy at [5, 0] → dot=5 (within ±12), perp=0 (within halfWidth=1)
      expect(isHitByArm(5, 0, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(true)
    })

    it('hits an enemy at the end of the arm', () => {
      expect(isHitByArm(ARM_LENGTH, 0, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(true)
    })

    it('hits an enemy at the negative end of the arm', () => {
      expect(isHitByArm(-ARM_LENGTH, 0, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(true)
    })

    it('misses an enemy beyond the arm tip', () => {
      expect(isHitByArm(ARM_LENGTH + 1, 0, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(false)
    })

    it('misses an enemy beyond the negative arm tip', () => {
      expect(isHitByArm(-(ARM_LENGTH + 1), 0, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(false)
    })

    it('hits an enemy within half-width perpendicular', () => {
      expect(isHitByArm(5, 0.9, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(true)
    })

    it('misses an enemy outside half-width perpendicular', () => {
      expect(isHitByArm(5, 1.5, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(false)
    })
  })

  describe('arm along angle=PI/2 (points along +Z axis)', () => {
    const ANGLE = Math.PI / 2

    it('hits an enemy on the +Z arm', () => {
      // At angle=PI/2: dirX=cos(PI/2)≈0, dirZ=sin(PI/2)=1
      expect(isHitByArm(0, 6, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(true)
    })

    it('misses an enemy beyond the +Z arm tip', () => {
      expect(isHitByArm(0, ARM_LENGTH + 1, PX, PZ, ANGLE, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(false)
    })
  })

  describe('player offset from origin', () => {
    it('hits relative to player position', () => {
      const px = 10, pz = 20
      // Arm along +X from [10, 20]; enemy at [15, 20] (5 units along arm)
      expect(isHitByArm(15, 20, px, pz, 0, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(true)
    })

    it('misses when enemy is at same absolute position but arm points elsewhere', () => {
      const px = 10, pz = 20
      // Enemy at [10, 27] is 7 units in +Z from player — but arm is along X, enemy is on +Z side
      // dot = 0, perp = 7 > halfWidth → miss
      expect(isHitByArm(10, 27, px, pz, 0, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns true for enemy exactly at halfWidth boundary (inclusive)', () => {
      // perp = ARM_HALF_WIDTH exactly → hypot = 1.0 <= 1.0 → true (inclusive boundary)
      expect(isHitByArm(5, ARM_HALF_WIDTH, PX, PZ, 0, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(true)
    })

    it('returns false for enemy far away from arm', () => {
      expect(isHitByArm(100, 100, PX, PZ, 0, ARM_LENGTH, ARM_HALF_WIDTH)).toBe(false)
    })
  })
})
