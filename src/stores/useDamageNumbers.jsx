import { create } from 'zustand'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { calcDriftOffset, getColorForDamage } from '../systems/damageNumberSystem.js'

// Monotonic ID counter — module-level to survive resets
let _nextId = 0

// Ring buffer — pre-allocated pool to avoid spread/slice allocations (Story 41.2 AC 4)
const MAX_DN = GAME_CONFIG.DAMAGE_NUMBERS.MAX_COUNT
const _pool = new Array(MAX_DN).fill(null)
let _writeIdx = 0

/** Write a single entry into the ring buffer, overwriting oldest if full. */
function _poolWrite(entry) {
  _pool[_writeIdx % MAX_DN] = entry
  _writeIdx++
}

/** Build the public damageNumbers array from the ring buffer in chronological order (oldest first). */
function _poolSnapshot() {
  const result = []
  // Start from the oldest surviving slot and iterate forward
  const start = _writeIdx <= MAX_DN ? 0 : _writeIdx % MAX_DN
  for (let i = 0; i < MAX_DN; i++) {
    const entry = _pool[(start + i) % MAX_DN]
    if (entry !== null) result.push(entry)
  }
  return result
}

const useDamageNumbers = create((set, get) => ({
  damageNumbers: [],

  spawnDamageNumber: ({ damage, worldX, worldZ, isCrit = false, isPlayerDamage = false, color }) => {
    const resolvedColor = color ?? getColorForDamage(isPlayerDamage, isCrit)
    _poolWrite({
      id: _nextId++,
      damage,
      worldX,
      worldY: 1.0,
      worldZ,
      age: 0,
      isCrit,
      isPlayerDamage,
      color: resolvedColor,
      offsetX: calcDriftOffset(),
    })
    set({ damageNumbers: _poolSnapshot() })
  },

  spawnDamageNumbers: (entries) => {
    if (entries.length === 0) return
    for (let i = 0; i < entries.length; i++) {
      const { damage, worldX, worldZ, isCrit = false, isPlayerDamage = false, color } = entries[i]
      const resolvedColor = color ?? getColorForDamage(isPlayerDamage, isCrit)
      _poolWrite({
        id: _nextId++,
        damage,
        worldX,
        worldY: 1.0,
        worldZ,
        age: 0,
        isCrit,
        isPlayerDamage,
        color: resolvedColor,
        offsetX: calcDriftOffset(),
      })
    }
    set({ damageNumbers: _poolSnapshot() })
  },

  tick: (delta) => {
    const lifetime = GAME_CONFIG.DAMAGE_NUMBERS.LIFETIME
    let anyActive = false
    let changed = false
    for (let i = 0; i < MAX_DN; i++) {
      const entry = _pool[i]
      if (!entry) continue
      entry.age += delta
      if (entry.age >= lifetime) {
        _pool[i] = null
        changed = true
      } else {
        anyActive = true
        // age mutated in-place — renderer reads imperatively via getState(), no set() needed for animation
      }
    }
    if (changed) {
      set({ damageNumbers: anyActive ? _poolSnapshot() : [] })
    }
  },

  reset: () => {
    _pool.fill(null)
    _writeIdx = 0
    set({ damageNumbers: [] })
  },
}))

export default useDamageNumbers
