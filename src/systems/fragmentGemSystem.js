import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_GEMS = GAME_CONFIG.MAX_FRAGMENT_GEMS

// Pre-allocated pool — zero GC pressure (follows xpOrbSystem.js pattern)
const gems = []
for (let i = 0; i < MAX_GEMS; i++) {
  gems[i] = { x: 0, z: 0, fragmentValue: 0, elapsedTime: 0, isMagnetized: false }
}
let activeCount = 0

export function spawnGem(x, z, fragmentValue) {
  if (activeCount >= MAX_GEMS) {
    // Recycle oldest gem (highest elapsedTime) to avoid silent loss
    let oldestIdx = 0
    for (let i = 1; i < activeCount; i++) {
      if (gems[i].elapsedTime > gems[oldestIdx].elapsedTime) oldestIdx = i
    }
    const gem = gems[oldestIdx]
    gem.x = x
    gem.z = z
    gem.fragmentValue = fragmentValue
    gem.elapsedTime = 0
    gem.isMagnetized = false
    return
  }
  const gem = gems[activeCount]
  gem.x = x
  gem.z = z
  gem.fragmentValue = fragmentValue
  gem.elapsedTime = 0
  gem.isMagnetized = false
  activeCount++
}

export function collectGem(index) {
  const fragmentValue = gems[index].fragmentValue
  activeCount--
  if (index < activeCount) {
    const temp = gems[index]
    gems[index] = gems[activeCount]
    gems[activeCount] = temp
  }
  return fragmentValue
}

export function updateMagnetization(px, pz, delta) {
  const magnetRadius = GAME_CONFIG.XP_MAGNET_RADIUS
  const magnetRadiusSq = magnetRadius * magnetRadius
  const magnetSpeed = GAME_CONFIG.XP_MAGNET_SPEED
  const accelCurve = GAME_CONFIG.XP_MAGNET_ACCELERATION_CURVE

  for (let i = 0; i < activeCount; i++) {
    const gem = gems[i]
    const dx = px - gem.x
    const dz = pz - gem.z
    const distSq = dx * dx + dz * dz

    if (distSq <= magnetRadiusSq) {
      gem.isMagnetized = true
    } else {
      gem.isMagnetized = false
    }

    if (gem.isMagnetized) {
      const dist = Math.sqrt(distSq)
      if (dist > 0.01) {
        const dirX = dx / dist
        const dirZ = dz / dist
        const normalizedDist = dist / magnetRadius
        const speedFactor = Math.pow(1 - normalizedDist, accelCurve)
        const speed = magnetSpeed * speedFactor
        gem.x += dirX * speed * delta
        gem.z += dirZ * speed * delta
      }
    }

    gem.elapsedTime += delta
  }
}

export function getActiveGems() {
  return gems
}

export function getActiveCount() {
  return activeCount
}

export function reset() {
  for (let i = 0; i < MAX_GEMS; i++) {
    gems[i].x = 0
    gems[i].z = 0
    gems[i].fragmentValue = 0
    gems[i].elapsedTime = 0
    gems[i].isMagnetized = false
  }
  activeCount = 0
}
