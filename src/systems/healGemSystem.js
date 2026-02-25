import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_HEAL_GEMS = GAME_CONFIG.MAX_HEAL_GEMS

// Pre-allocated pool — zero GC pressure (mirrors xpOrbSystem.js pattern)
const healGems = []
for (let i = 0; i < MAX_HEAL_GEMS; i++) {
  healGems[i] = { x: 0, z: 0, healAmount: 0, elapsedTime: 0, isMagnetized: false }
}
let activeCount = 0

export function spawnHealGem(x, z, healAmount) {
  if (activeCount >= MAX_HEAL_GEMS) {
    return false // Pool full, cannot spawn
  }
  const gem = healGems[activeCount]
  gem.x = x
  gem.z = z
  gem.healAmount = healAmount
  gem.elapsedTime = 0
  gem.isMagnetized = false
  activeCount++
  return true
}

export function collectHealGem(index) {
  const healAmount = healGems[index].healAmount
  activeCount--
  if (index < activeCount) {
    const temp = healGems[index]
    healGems[index] = healGems[activeCount]
    healGems[activeCount] = temp
  }
  return healAmount
}

export function updateHealGemMagnetization(px, pz, delta, pickupRadiusMultiplier = 1.0) {
  const magnetRadius = GAME_CONFIG.XP_MAGNET_RADIUS * pickupRadiusMultiplier
  const magnetRadiusSq = magnetRadius * magnetRadius
  const magnetSpeed = GAME_CONFIG.XP_MAGNET_SPEED
  const accelCurve = GAME_CONFIG.XP_MAGNET_ACCELERATION_CURVE

  for (let i = 0; i < activeCount; i++) {
    const gem = healGems[i]
    const dx = px - gem.x
    const dz = pz - gem.z
    const distSq = dx * dx + dz * dz

    if (distSq <= magnetRadiusSq) {
      gem.isMagnetized = true
    }
    // No else — once magnetized, stays magnetized until collected or reset

    if (gem.isMagnetized) {
      const dist = Math.sqrt(distSq)
      if (dist > 0.01) {
        const dirX = dx / dist
        const dirZ = dz / dist
        const normalizedDist = dist / magnetRadius
        const speedFactor = Math.max(0, Math.pow(Math.max(0, 1 - normalizedDist), accelCurve))
        const speed = Math.max(GAME_CONFIG.XP_MAGNET_MIN_SPEED, magnetSpeed * speedFactor)
        gem.x += dirX * speed * delta
        gem.z += dirZ * speed * delta
      }
    }
  }
}

export function getHealGems() {
  return healGems
}

export function getActiveHealGemCount() {
  return activeCount
}

export function forceActivateMagnetHealGems() {
  for (let i = 0; i < activeCount; i++) {
    healGems[i].isMagnetized = true
  }
}

export function resetHealGems() {
  for (let i = 0; i < MAX_HEAL_GEMS; i++) {
    healGems[i].x = 0
    healGems[i].z = 0
    healGems[i].healAmount = 0
    healGems[i].elapsedTime = 0
    healGems[i].isMagnetized = false
  }
  activeCount = 0
}
