import { create } from 'zustand'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { calcDriftOffset, updateDamageNumbers } from '../systems/damageNumberSystem.js'

// Monotonic ID counter — module-level to survive resets
let _nextId = 0

const useDamageNumbers = create((set, get) => ({
  damageNumbers: [],

  /**
   * Spawns a new floating damage number at the given world position.
   * If MAX_COUNT is reached, removes the oldest number first.
   *
   * @param {{ damage: number, worldX: number, worldZ: number, color?: string }} params
   */
  spawnDamageNumber: ({ damage, worldX, worldZ, color = '#ffffff' }) => {
    const cfg = GAME_CONFIG.DAMAGE_NUMBERS
    const newNumber = {
      id: _nextId++,
      damage,
      worldX,
      worldY: 1.0, // slightly above ground plane
      worldZ,
      age: 0,
      color,
      offsetX: calcDriftOffset(),
    }

    const { damageNumbers } = get()
    let updated = [...damageNumbers, newNumber]

    // Enforce max count: remove oldest entries (from front of array)
    if (updated.length > cfg.MAX_COUNT) {
      updated = updated.slice(updated.length - cfg.MAX_COUNT)
    }

    set({ damageNumbers: updated })
  },

  /**
   * Spawns multiple damage numbers in a single state update — use when several
   * hits arrive in the same frame (e.g. multi-projectile weapons) to avoid N
   * redundant set() calls.
   *
   * @param {Array<{ damage: number, worldX: number, worldZ: number, color?: string }>} entries
   */
  spawnDamageNumbers: (entries) => {
    if (entries.length === 0) return
    const cfg = GAME_CONFIG.DAMAGE_NUMBERS
    const newNumbers = entries.map(({ damage, worldX, worldZ, color = '#ffffff' }) => ({
      id: _nextId++,
      damage,
      worldX,
      worldY: 1.0, // slightly above ground plane
      worldZ,
      age: 0,
      color,
      offsetX: calcDriftOffset(),
    }))

    const { damageNumbers } = get()
    let updated = [...damageNumbers, ...newNumbers]

    if (updated.length > cfg.MAX_COUNT) {
      updated = updated.slice(updated.length - cfg.MAX_COUNT)
    }

    set({ damageNumbers: updated })
  },

  /**
   * Advances all damage numbers by delta seconds.
   * Removes numbers that have reached or exceeded LIFETIME.
   * Delegates to updateDamageNumbers() from damageNumberSystem.
   *
   * @param {number} delta - Time delta in seconds
   */
  tick: (delta) => {
    const { damageNumbers } = get()
    if (damageNumbers.length === 0) return
    set({ damageNumbers: updateDamageNumbers(damageNumbers, delta) })
  },

  /** Clears all active damage numbers (call on game reset / system transition). */
  reset: () => set({ damageNumbers: [] }),
}))

export default useDamageNumbers
