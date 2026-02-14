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
])

function _pairKey(catA, catB) {
  return catA < catB ? `${catA}:${catB}` : `${catB}:${catA}`
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
