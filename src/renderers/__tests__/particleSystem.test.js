import { describe, it, expect, beforeEach } from 'vitest'
import { addExplosion, resetParticles, getParticles, getActiveCount, updateParticles, MAX_PARTICLES } from '../../systems/particleSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('Particle system', () => {
  beforeEach(() => {
    resetParticles()
  })

  describe('addExplosion', () => {
    it('creates PARTICLE_EXPLOSION_COUNT particles', () => {
      addExplosion(10, 20, '#ff5555')
      expect(getActiveCount()).toBe(GAME_CONFIG.PARTICLE_EXPLOSION_COUNT)
    })

    it('particles have correct initial position', () => {
      addExplosion(42, 99, '#ff5555')
      const particles = getParticles()
      for (let i = 0; i < getActiveCount(); i++) {
        expect(particles[i].x).toBe(42)
        expect(particles[i].z).toBe(99)
      }
    })

    it('particles have outward directions', () => {
      addExplosion(0, 0, '#ff5555')
      const particles = getParticles()
      for (let i = 0; i < getActiveCount(); i++) {
        const p = particles[i]
        const mag = Math.sqrt(p.dirX * p.dirX + p.dirZ * p.dirZ)
        expect(mag).toBeCloseTo(1, 1)
      }
    })

    it('particles have correct color and size', () => {
      addExplosion(0, 0, '#ff00ff')
      const particles = getParticles()
      for (let i = 0; i < getActiveCount(); i++) {
        expect(particles[i].color).toBe('#ff00ff')
        expect(particles[i].size).toBe(GAME_CONFIG.PARTICLE_EXPLOSION_SIZE)
      }
    })

    it('particles start active with elapsedTime 0', () => {
      addExplosion(0, 0, '#ff5555')
      const particles = getParticles()
      for (let i = 0; i < getActiveCount(); i++) {
        expect(particles[i].active).toBe(true)
        expect(particles[i].elapsedTime).toBe(0)
      }
    })

    it('caps at MAX_PARTICLES', () => {
      const explosionsNeeded = Math.ceil(MAX_PARTICLES / GAME_CONFIG.PARTICLE_EXPLOSION_COUNT) + 5
      for (let i = 0; i < explosionsNeeded; i++) {
        addExplosion(i, i, '#ff5555')
      }
      expect(getActiveCount()).toBe(MAX_PARTICLES)
    })
  })

  describe('updateParticles', () => {
    it('moves particles outward based on direction and speed', () => {
      addExplosion(0, 0, '#ff5555')
      const particles = getParticles()
      const p = particles[0]
      const initialX = p.x
      const initialZ = p.z
      const dirX = p.dirX
      const dirZ = p.dirZ
      const speed = p.speed

      updateParticles(0.1)

      expect(p.x).toBeCloseTo(initialX + dirX * speed * 0.1, 5)
      expect(p.z).toBeCloseTo(initialZ + dirZ * speed * 0.1, 5)
    })

    it('increments elapsedTime', () => {
      addExplosion(0, 0, '#ff5555')
      updateParticles(0.1)
      const particles = getParticles()
      for (let i = 0; i < getActiveCount(); i++) {
        expect(particles[i].elapsedTime).toBeCloseTo(0.1, 5)
      }
    })

    it('deactivates and removes particles after lifetime expires', () => {
      addExplosion(0, 0, '#ff5555')

      // Update past lifetime
      updateParticles(GAME_CONFIG.PARTICLE_EXPLOSION_LIFETIME + 0.1)

      expect(getActiveCount()).toBe(0)
    })
  })

  describe('resetParticles', () => {
    it('clears all particles', () => {
      addExplosion(0, 0, '#ff5555')
      addExplosion(10, 10, '#ff3366')
      expect(getActiveCount()).toBeGreaterThan(0)

      resetParticles()
      expect(getActiveCount()).toBe(0)
    })
  })
})
