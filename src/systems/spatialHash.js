import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Creates a spatial hash grid for broad-phase spatial queries.
 * @param {number} [cellSize=GAME_CONFIG.SPATIAL_HASH_CELL_SIZE] - Grid cell size in world units
 * @returns {{ clear: Function, insert: Function, queryNearby: Function }}
 */
export function createSpatialHash(cellSize = GAME_CONFIG.SPATIAL_HASH_CELL_SIZE) {
  const grid = new Map()

  function _key(cx, cz) {
    return `${cx},${cz}`
  }

  function clear() {
    grid.clear()
  }

  function insert(entity) {
    const { x, z, radius } = entity
    const minCX = Math.floor((x - radius) / cellSize)
    const maxCX = Math.floor((x + radius) / cellSize)
    const minCZ = Math.floor((z - radius) / cellSize)
    const maxCZ = Math.floor((z + radius) / cellSize)

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const k = _key(cx, cz)
        let bucket = grid.get(k)
        if (!bucket) {
          bucket = []
          grid.set(k, bucket)
        }
        bucket.push(entity)
      }
    }
  }

  function queryNearby(x, z, radius) {
    const minCX = Math.floor((x - radius) / cellSize)
    const maxCX = Math.floor((x + radius) / cellSize)
    const minCZ = Math.floor((z - radius) / cellSize)
    const maxCZ = Math.floor((z + radius) / cellSize)

    const seen = new Set()
    const result = []

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const bucket = grid.get(_key(cx, cz))
        if (!bucket) continue
        for (let i = 0; i < bucket.length; i++) {
          const entity = bucket[i]
          if (!seen.has(entity.id)) {
            seen.add(entity.id)
            result.push(entity)
          }
        }
      }
    }

    return result
  }

  return { clear, insert, queryNearby }
}
