// src/systems/explosiveRoundVfx.js — Story 32.7: EXPLOSIVE_ROUND ring VFX state
const POOL_SIZE = 10
const rings = []

export function addExplosionRing(x, z, maxRadius, duration = 0.5) {
  if (rings.length >= POOL_SIZE) return
  rings.push({ x, z, timer: duration, maxDuration: duration, maxRadius })
}

export function tickRings(delta) {
  for (let i = rings.length - 1; i >= 0; i--) {
    rings[i].timer -= delta
    if (rings[i].timer <= 0) rings.splice(i, 1)
  }
}

export function getRings() { return rings }

export function resetRings() { rings.length = 0 }
