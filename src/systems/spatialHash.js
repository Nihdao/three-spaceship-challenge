import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Module-level pre-allocated structures for queryNearby().
 *
 * These are shared across ALL spatial hash instances (collision hash, separation hash, tests).
 * This is safe because JavaScript is single-threaded and each queryNearby() call is
 * fully synchronous — the result is consumed (iterated) before the next call is made.
 *
 * ⚠️ WARNING for future devs: Do NOT hold a reference to queryNearby()'s return value
 * across multiple queryNearby() calls. The returned array is reused and cleared each call.
 *
 * Story 41.3: Zero-allocation spatial queries.
 */
const _seenInQuery = new Set()
const _queryResult = []

/**
 * Creates a spatial hash grid for broad-phase spatial queries.
 * @param {number} [cellSize=GAME_CONFIG.SPATIAL_HASH_CELL_SIZE] - Grid cell size in world units
 * @returns {{ clear: Function, insert: Function, queryNearby: Function }}
 */
export function createSpatialHash(cellSize = GAME_CONFIG.SPATIAL_HASH_CELL_SIZE) {
  const grid = new Map()

  /**
   * Integer cell key using bit-packing.
   * Packs two 16-bit signed cell coords into a single 32-bit integer.
   * Cell range: ±500 (for PLAY_AREA_SIZE=2000, cellSize≥2), well within ±32767 (16-bit).
   * Negative coords handled correctly via two's complement with & 0xFFFF mask.
   */
  function _key(cx, cz) {
    return ((cx & 0xFFFF) << 16) | (cz & 0xFFFF)
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

    _seenInQuery.clear()
    _queryResult.length = 0

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const bucket = grid.get(_key(cx, cz))
        if (!bucket) continue
        for (let i = 0; i < bucket.length; i++) {
          const entity = bucket[i]
          if (!_seenInQuery.has(entity.id)) {
            _seenInQuery.add(entity.id)
            _queryResult.push(entity)
          }
        }
      }
    }

    return _queryResult
  }

  return { clear, insert, queryNearby }
}
