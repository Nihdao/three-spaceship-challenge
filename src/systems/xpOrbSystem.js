import { GAME_CONFIG } from '../config/gameConfig.js'

const MAX_ORBS = GAME_CONFIG.MAX_XP_ORBS

// Pre-allocated pool — zero GC pressure (follows particleSystem.js pattern)
const orbs = []
for (let i = 0; i < MAX_ORBS; i++) {
  orbs[i] = { x: 0, z: 0, xpValue: 0, elapsedTime: 0 }
}
let activeCount = 0

export function spawnOrb(x, z, xpValue) {
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
    return
  }
  const orb = orbs[activeCount]
  orb.x = x
  orb.z = z
  orb.xpValue = xpValue
  orb.elapsedTime = 0
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

export function getOrbs() {
  return orbs
}

export function getActiveCount() {
  return activeCount
}

export function resetOrbs() {
  activeCount = 0
}
