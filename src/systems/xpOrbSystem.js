import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_ORBS = GAME_CONFIG.MAX_XP_ORBS

// Pre-allocated pool — zero GC pressure (follows particleSystem.js pattern)
// Story 19.1: Added isRare field to support rare XP gems
const orbs = []
for (let i = 0; i < MAX_ORBS; i++) {
  orbs[i] = { x: 0, z: 0, xpValue: 0, elapsedTime: 0, isMagnetized: false, isRare: false }
}
let activeCount = 0

export function spawnOrb(x, z, xpValue, isRare = false) {
  if (activeCount >= MAX_ORBS) {
    // Recycle oldest orb (highest elapsedTime) to avoid silent XP loss
    let oldestIdx = 0
    for (let i = 1; i < activeCount; i++) {
      if (orbs[i].elapsedTime > orbs[oldestIdx].elapsedTime) oldestIdx = i
    }
    const orb = orbs[oldestIdx]
    orb.x = x
    orb.z = z
    orb.xpValue = xpValue
    orb.elapsedTime = 0
    orb.isMagnetized = false
    orb.isRare = isRare
    return
  }
  const orb = orbs[activeCount]
  orb.x = x
  orb.z = z
  orb.xpValue = xpValue
  orb.elapsedTime = 0
  orb.isMagnetized = false
  orb.isRare = isRare
  activeCount++
}

export function updateOrbs(delta) {
  for (let i = 0; i < activeCount; i++) {
    orbs[i].elapsedTime += delta
  }
}

export function collectOrb(index) {
  const xpValue = orbs[index].xpValue
  activeCount--
  if (index < activeCount) {
    const temp = orbs[index]
    orbs[index] = orbs[activeCount]
    orbs[activeCount] = temp
  }
  return xpValue
}

export function updateMagnetization(px, pz, delta, pickupRadiusMultiplier = 1.0) {
  const magnetRadius = GAME_CONFIG.XP_MAGNET_RADIUS * pickupRadiusMultiplier
  const magnetRadiusSq = magnetRadius * magnetRadius
  const magnetSpeed = GAME_CONFIG.XP_MAGNET_SPEED
  const accelCurve = GAME_CONFIG.XP_MAGNET_ACCELERATION_CURVE

  for (let i = 0; i < activeCount; i++) {
    const orb = orbs[i]
    const dx = px - orb.x
    const dz = pz - orb.z
    const distSq = dx * dx + dz * dz

    if (distSq <= magnetRadiusSq) {
      orb.isMagnetized = true
    } else {
      orb.isMagnetized = false
    }

    if (orb.isMagnetized) {
      const dist = Math.sqrt(distSq)
      if (dist > 0.01) {
        const dirX = dx / dist
        const dirZ = dz / dist
        const normalizedDist = dist / magnetRadius
        const speedFactor = Math.pow(1 - normalizedDist, accelCurve)
        const speed = magnetSpeed * speedFactor
        orb.x += dirX * speed * delta
        orb.z += dirZ * speed * delta
      }
    }
  }
}

export function getOrbs() {
  return orbs
}

export function getActiveCount() {
  return activeCount
}

export function resetOrbs() {
  for (let i = 0; i < MAX_ORBS; i++) {
    orbs[i].x = 0
    orbs[i].z = 0
    orbs[i].xpValue = 0
    orbs[i].elapsedTime = 0
    orbs[i].isMagnetized = false
    orbs[i].isRare = false
  }
  activeCount = 0
}
