import { describe, it, expect, beforeEach } from 'vitest'
import {
  emitTrailParticle,
  updateTrailParticles,
  getTrailParticles,
  getActiveTrailCount,
  resetTrailParticles,
  MAX_TRAIL_PARTICLES,
} from '../particleTrailSystem.js'

describe('particleTrailSystem', () => {
  beforeEach(() => {
    resetTrailParticles()
  })

  it('starts with zero active particles', () => {
    expect(getActiveTrailCount()).toBe(0)
  })

  it('emitTrailParticle adds a particle', () => {
    emitTrailParticle(10, 20, '#00ccff', 0.4, 0.15, 0, -1, false)
    expect(getActiveTrailCount()).toBe(1)
    const particles = getTrailParticles()
    expect(particles[0].x).toBe(10)
    expect(particles[0].z).toBe(20)
    expect(particles[0].lifetime).toBe(0.4)
    expect(particles[0].elapsedTime).toBe(0)
    expect(particles[0].isDashing).toBe(false)
  })

  it('emitTrailParticle stores dash state', () => {
    emitTrailParticle(0, 0, '#00ccff', 0.4, 0.15, 0, -1, true)
    const particles = getTrailParticles()
    expect(particles[0].isDashing).toBe(true)
  })

  it('updateTrailParticles ages particles', () => {
    emitTrailParticle(0, 0, '#00ccff', 1.0, 0.15, 0, -1, false)
    updateTrailParticles(0.3)
    const particles = getTrailParticles()
    expect(particles[0].elapsedTime).toBeCloseTo(0.3)
    expect(getActiveTrailCount()).toBe(1)
  })

  it('removes expired particles', () => {
    emitTrailParticle(0, 0, '#00ccff', 0.4, 0.15, 0, -1, false)
    updateTrailParticles(0.5) // exceeds lifetime
    expect(getActiveTrailCount()).toBe(0)
  })

  it('does not exceed MAX_TRAIL_PARTICLES', () => {
    for (let i = 0; i < MAX_TRAIL_PARTICLES + 10; i++) {
      emitTrailParticle(i, i, '#00ccff', 1.0, 0.15, 0, -1, false)
    }
    expect(getActiveTrailCount()).toBe(MAX_TRAIL_PARTICLES)
  })

  it('resetTrailParticles clears all particles', () => {
    emitTrailParticle(0, 0, '#00ccff', 1.0, 0.15, 0, -1, false)
    emitTrailParticle(1, 1, '#00ccff', 1.0, 0.15, 0, -1, false)
    expect(getActiveTrailCount()).toBe(2)
    resetTrailParticles()
    expect(getActiveTrailCount()).toBe(0)
  })

  it('uses swap-with-last compaction when particles expire', () => {
    emitTrailParticle(1, 1, '#00ccff', 0.2, 0.15, 0, -1, false) // will expire
    emitTrailParticle(2, 2, '#00ccff', 1.0, 0.15, 0, -1, false) // will survive
    emitTrailParticle(3, 3, '#00ccff', 1.0, 0.15, 0, -1, false) // will survive

    updateTrailParticles(0.3) // first particle expires

    expect(getActiveTrailCount()).toBe(2)
    // The surviving particles should still be accessible
    const particles = getTrailParticles()
    const activeXs = [particles[0].x, particles[1].x].sort()
    expect(activeXs).toEqual([2, 3])
  })
})
