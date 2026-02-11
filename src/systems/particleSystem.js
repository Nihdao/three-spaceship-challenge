import { GAME_CONFIG } from '../config/gameConfig.js'

export const MAX_PARTICLES = GAME_CONFIG.MAX_ENEMIES_ON_SCREEN * GAME_CONFIG.PARTICLE_EXPLOSION_COUNT

// Pre-allocated pool — zero GC pressure (matches entity pool pattern in GameLoop)
const particles = []
for (let i = 0; i < MAX_PARTICLES; i++) {
  particles[i] = {
    x: 0, z: 0,
    dirX: 0, dirZ: 0,
    speed: 0, lifetime: 0, elapsedTime: 0,
    active: false, color: '', size: 0,
  }
}
let activeCount = 0

export function addExplosion(x, z, color, scale = 1) {
  const count = GAME_CONFIG.PARTICLE_EXPLOSION_COUNT
  for (let i = 0; i < count; i++) {
    if (activeCount >= MAX_PARTICLES) break
    const p = particles[activeCount]
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    p.x = x
    p.z = z
    p.dirX = Math.cos(angle)
    p.dirZ = Math.sin(angle)
    p.speed = GAME_CONFIG.PARTICLE_EXPLOSION_SPEED * (0.7 + Math.random() * 0.6) * scale
    p.lifetime = GAME_CONFIG.PARTICLE_EXPLOSION_LIFETIME * scale
    p.elapsedTime = 0
    p.active = true
    p.color = color
    p.size = GAME_CONFIG.PARTICLE_EXPLOSION_SIZE * scale
    activeCount++
  }
}

export function updateParticles(delta) {
  let i = 0
  while (i < activeCount) {
    const p = particles[i]
    p.x += p.dirX * p.speed * delta
    p.z += p.dirZ * p.speed * delta
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

export function resetParticles() {
  activeCount = 0
}

export function getParticles() {
  return particles
}

export function getActiveCount() {
  return activeCount
}
