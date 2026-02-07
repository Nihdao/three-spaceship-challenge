import { create } from 'zustand'
import { ENEMIES } from '../entities/enemyDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

const useEnemies = create((set, get) => ({
  // --- State ---
  enemies: [],
  nextId: 0,

  // --- Actions ---
  spawnEnemy: (typeId, x, z) => {
    const state = get()
    if (state.enemies.length >= GAME_CONFIG.MAX_ENEMIES_ON_SCREEN) return

    const def = ENEMIES[typeId]
    if (!def) return

    const id = `enemy_${state.nextId}`
    const enemy = {
      id,
      typeId,
      x,
      z,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      damage: def.damage,
      radius: def.radius,
      behavior: def.behavior,
      color: def.color,
      meshScale: def.meshScale,
    }

    set({
      enemies: [...state.enemies, enemy],
      nextId: state.nextId + 1,
    })
  },

  // Batch spawn — single set() call for multiple enemies (called by GameLoop)
  spawnEnemies: (instructions) => {
    const state = get()
    const available = GAME_CONFIG.MAX_ENEMIES_ON_SCREEN - state.enemies.length
    if (available <= 0 || instructions.length === 0) return

    const batch = []
    let nextId = state.nextId
    const limit = Math.min(instructions.length, available)

    for (let i = 0; i < limit; i++) {
      const { typeId, x, z } = instructions[i]
      const def = ENEMIES[typeId]
      if (!def) continue

      batch.push({
        id: `enemy_${nextId}`,
        typeId,
        x,
        z,
        hp: def.hp,
        maxHp: def.hp,
        speed: def.speed,
        damage: def.damage,
        radius: def.radius,
        behavior: def.behavior,
        color: def.color,
        meshScale: def.meshScale,
      })
      nextId++
    }

    if (batch.length > 0) {
      set({
        enemies: [...state.enemies, ...batch],
        nextId,
      })
    }
  },

  // --- Tick (called by GameLoop each frame) ---
  // Mutates enemy positions in-place for zero GC pressure.
  // Readers use getState() in useFrame, not React subscriptions.
  tick: (delta, playerPosition) => {
    const { enemies } = get()
    if (enemies.length === 0) return

    const px = playerPosition[0]
    const pz = playerPosition[2]
    const bound = GAME_CONFIG.PLAY_AREA_SIZE

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]

      if (e.behavior === 'chase') {
        const dx = px - e.x
        const dz = pz - e.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0.1) {
          e.x += (dx / dist) * e.speed * delta
          e.z += (dz / dist) * e.speed * delta
        }
      }

      // Clamp to play area
      e.x = Math.max(-bound, Math.min(bound, e.x))
      e.z = Math.max(-bound, Math.min(bound, e.z))
    }
  },

  killEnemy: (id) => {
    const { enemies } = get()
    const filtered = enemies.filter((e) => e.id !== id)
    set({ enemies: filtered })
  },

  reset: () => set({ enemies: [], nextId: 0 }),
}))

export default useEnemies
