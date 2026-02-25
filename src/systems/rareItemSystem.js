import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_RARE_ITEMS = GAME_CONFIG.MAX_RARE_ITEMS

// Pre-allocated pool — zero GC pressure (mirrors healGemSystem.js pattern)
const rareItems = []
for (let i = 0; i < MAX_RARE_ITEMS; i++) {
  rareItems[i] = { x: 0, z: 0, type: 'MAGNET', isMagnetized: false, active: false }
}
let activeCount = 0

export function spawnRareItem(x, z, type) {
  if (activeCount >= MAX_RARE_ITEMS) {
    return false // Pool full, cannot spawn
  }
  const item = rareItems[activeCount]
  item.x = x
  item.z = z
  item.type = type
  item.isMagnetized = false
  item.active = true
  activeCount++
  return true
}

export function collectRareItem(index) {
  const type = rareItems[index].type
  activeCount--
  if (index < activeCount) {
    const temp = rareItems[index]
    rareItems[index] = rareItems[activeCount]
    rareItems[activeCount] = temp
  }
  rareItems[activeCount].active = false
  return { type }
}

export function updateRareItemMagnetization(px, pz, delta, pickupRadiusMultiplier = 1.0) {
  const magnetRadius = GAME_CONFIG.XP_MAGNET_RADIUS * pickupRadiusMultiplier
  const magnetRadiusSq = magnetRadius * magnetRadius
  const magnetSpeed = GAME_CONFIG.XP_MAGNET_SPEED
  const accelCurve = GAME_CONFIG.XP_MAGNET_ACCELERATION_CURVE

  for (let i = 0; i < activeCount; i++) {
    const item = rareItems[i]
    const dx = px - item.x
    const dz = pz - item.z
    const distSq = dx * dx + dz * dz

    if (distSq <= magnetRadiusSq) {
      item.isMagnetized = true
    }
    // NO else — sticky by design (44.3 pattern)

    if (item.isMagnetized) {
      const dist = Math.sqrt(distSq)
      if (dist > 0.01) {
        const dirX = dx / dist
        const dirZ = dz / dist
        const normalizedDist = dist / magnetRadius
        const speedFactor = Math.max(0, Math.pow(Math.max(0, 1 - normalizedDist), accelCurve))
        const speed = Math.max(GAME_CONFIG.XP_MAGNET_MIN_SPEED, magnetSpeed * speedFactor)
        item.x += dirX * speed * delta
        item.z += dirZ * speed * delta
      }
    }
  }
}

export function forceActivateMagnetRareItems() {
  for (let i = 0; i < activeCount; i++) {
    rareItems[i].isMagnetized = true
  }
}

export function getRareItems() {
  return rareItems
}

export function getActiveRareItemCount() {
  return activeCount
}

export function resetRareItems() {
  for (let i = 0; i < MAX_RARE_ITEMS; i++) {
    rareItems[i].x = 0
    rareItems[i].z = 0
    rareItems[i].type = 'MAGNET'
    rareItems[i].isMagnetized = false
    rareItems[i].active = false
  }
  activeCount = 0
}
