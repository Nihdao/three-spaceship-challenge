import { GAME_CONFIG } from '../config/gameConfig.js'
import { createSpatialHash } from './spatialHash.js'

// Collision categories
export const CATEGORY_PLAYER = 'player'
export const CATEGORY_ENEMY = 'enemy'
export const CATEGORY_PROJECTILE = 'projectile'
export const CATEGORY_XP_ORB = 'xpOrb'
export const CATEGORY_BOSS = 'boss'
export const CATEGORY_BOSS_PROJECTILE = 'boss_projectile'
export const CATEGORY_SHOCKWAVE = 'shockwave'
export const CATEGORY_ENEMY_PROJECTILE = 'enemy_projectile'
export const CATEGORY_HEAL_GEM = 'healGem'
export const CATEGORY_FRAGMENT_GEM = 'fragmentGem'
export const CATEGORY_RARE_ITEM = 'rareItem'

// Collision matrix — defines which category pairs can collide
// Key format: "categoryA:categoryB" (sorted alphabetically for consistency)
const COLLISION_PAIRS = new Set([
  `${CATEGORY_ENEMY}:${CATEGORY_PLAYER}`,      // player↔enemy (contact damage)
  `${CATEGORY_ENEMY}:${CATEGORY_PROJECTILE}`,   // projectile↔enemy (damage)
  `${CATEGORY_PLAYER}:${CATEGORY_XP_ORB}`,      // player↔xpOrb (pickup)
  `${CATEGORY_BOSS}:${CATEGORY_PROJECTILE}`,    // player projectile↔boss (damage boss)
  `${CATEGORY_BOSS_PROJECTILE}:${CATEGORY_PLAYER}`, // boss projectile↔player (damage player)
  `${CATEGORY_BOSS}:${CATEGORY_PLAYER}`,        // boss↔player (contact damage)
  `${CATEGORY_PLAYER}:${CATEGORY_SHOCKWAVE}`,    // shockwave↔player (damage)
  `${CATEGORY_ENEMY_PROJECTILE}:${CATEGORY_PLAYER}`, // enemy projectile↔player (damage)
  `${CATEGORY_HEAL_GEM}:${CATEGORY_PLAYER}`,    // player↔healGem (pickup)
  `${CATEGORY_FRAGMENT_GEM}:${CATEGORY_PLAYER}`, // player↔fragmentGem (pickup)
  `${CATEGORY_PLAYER}:${CATEGORY_RARE_ITEM}`,    // player↔rareItem (pickup)
])

function _pairKey(catA, catB) {
  return catA < catB ? `${catA}:${catB}` : `${catB}:${catA}`
}

/**
 * Swept segment-vs-circle collision test (anti-tunneling).
 * Returns true if line segment (ax,az)→(bx,bz) passes within distance r of point (cx,cz).
 * Cost: ~10 arithmetic ops — no sqrt, no allocation.
 */
export function segmentCircleIntersect(ax, az, bx, bz, cx, cz, r) {
  const abx = bx - ax, abz = bz - az
  const acx = cx - ax, acz = cz - az
  const abLenSq = abx * abx + abz * abz
  if (abLenSq === 0) return acx * acx + acz * acz <= r * r
  let t = (acx * abx + acz * abz) / abLenSq
  if (t < 0) t = 0; else if (t > 1) t = 1
  const dx = cx - (ax + t * abx), dz = cz - (az + t * abz)
  return dx * dx + dz * dz <= r * r
}

/**
 * Creates a collision system that owns a spatial hash and provides collision queries.
 * @param {number} [cellSize=GAME_CONFIG.SPATIAL_HASH_CELL_SIZE] - Grid cell size in world units
 */
export function createCollisionSystem(cellSize = GAME_CONFIG.SPATIAL_HASH_CELL_SIZE) {
  const spatialHash = createSpatialHash(cellSize)

  function clear() {
    spatialHash.clear()
  }

  function registerEntity(entity) {
    spatialHash.insert(entity)
  }

  function checkPair(categoryA, categoryB) {
    return COLLISION_PAIRS.has(_pairKey(categoryA, categoryB))
  }

  function queryCollisions(entity, targetCategory) {
    // Check collision matrix first
    if (!checkPair(entity.category, targetCategory)) {
      return []
    }

    const nearby = spatialHash.queryNearby(entity.x, entity.z, entity.radius)
    const collisions = []

    for (let i = 0; i < nearby.length; i++) {
      const other = nearby[i]
      if (other.id === entity.id) continue
      if (other.category !== targetCategory) continue

      // Circle-vs-circle: squared distance < squared radius sum
      const dx = entity.x - other.x
      const dz = entity.z - other.z
      const distSq = dx * dx + dz * dz
      const radiusSum = entity.radius + other.radius
      if (distSq < radiusSum * radiusSum) {
        collisions.push(other)
      }
    }

    return collisions
  }

  return { clear, registerEntity, queryCollisions, checkPair }
}
