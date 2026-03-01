import { create } from 'zustand'
import { GAME_CONFIG } from '../config/gameConfig.js'

const useBoss = create((set, get) => ({
  boss: null,
  isActive: false,
  bossDefeated: false,
  defeatAnimationTimer: 0,
  defeatExplosionCount: 0,
  rewardGiven: false,

  spawnBoss: (currentSystem = 1, wormholePos = null) => {
    // Story 16.4: Use per-stat scaling from ENEMY_SCALING_PER_SYSTEM
    const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || { hp: 1, damage: 1, speed: 1, xpReward: 1 }
    const bossHP = Math.round(GAME_CONFIG.BOSS_BASE_HP * scaling.hp)
    // Story 17.4: Spawn at wormhole position if provided, otherwise at origin
    const spawnX = wormholePos?.x ?? 0
    const spawnZ = wormholePos?.z ?? 0
    set({
    boss: {
      x: spawnX, z: spawnZ,
      hp: bossHP,
      maxHp: bossHP,
      phase: 0,
      lastHitTime: -Infinity,
      damageMultiplier: scaling.damage, // Damage scaling for contact (Story 16.4)
      hitFlashTimer: 0, // Story 27.3: hit flash timer
    },
    isActive: true,
    bossDefeated: false,
  })
  },

  tick: (delta, playerPos) => {
    const state = get()
    if (!state.boss || state.boss.hp <= 0) return

    // Shallow copy to preserve Zustand immutability (never mutate store references)
    const boss = { ...state.boss }

    // 1. Move boss toward player (chase behavior, like Bruiser)
    const dx = playerPos[0] - boss.x
    const dz = playerPos[2] - boss.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist > 5) {
      boss.x += (dx / dist) * GAME_CONFIG.BOSS_MOVE_SPEED * delta
      boss.z += (dz / dist) * GAME_CONFIG.BOSS_MOVE_SPEED * delta
    }
    // Clamp to play area (boss fights happen in GameplayScene, not a separate arena)
    boss.x = Math.max(-GAME_CONFIG.PLAY_AREA_SIZE, Math.min(GAME_CONFIG.PLAY_AREA_SIZE, boss.x))
    boss.z = Math.max(-GAME_CONFIG.PLAY_AREA_SIZE, Math.min(GAME_CONFIG.PLAY_AREA_SIZE, boss.z))

    // 2. Decay hit flash timer (Story 27.3)
    if (boss.hitFlashTimer > 0) {
      boss.hitFlashTimer = Math.max(0, boss.hitFlashTimer - delta)
    }

    // 3. Check phase transitions
    const hpFraction = boss.hp / boss.maxHp
    const thresholds = GAME_CONFIG.BOSS_PHASE_THRESHOLDS
    let newPhase = 0
    for (let i = 0; i < thresholds.length; i++) {
      if (hpFraction <= thresholds[i]) newPhase = i + 1
    }
    if (newPhase > boss.phase) {
      boss.phase = newPhase
    }

    set({ boss })
  },

  damageBoss: (amount) => {
    const { boss } = get()
    if (!boss) return { killed: false }
    const newHp = Math.max(0, boss.hp - amount)
    const killed = newHp <= 0
    const update = {
      boss: { ...boss, hp: newHp, lastHitTime: Date.now(), hitFlashTimer: GAME_CONFIG.HIT_FLASH.DURATION },
      bossDefeated: killed,
    }
    if (killed) {
      update.defeatAnimationTimer = GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY
      update.defeatExplosionCount = 0
    }
    set(update)
    return { killed }
  },

  defeatTick: (delta) => {
    const state = get()
    if (!state.bossDefeated || state.defeatAnimationTimer <= 0) {
      return { explosions: [], animationComplete: state.bossDefeated && state.defeatAnimationTimer <= 0 }
    }

    const timer = Math.max(0, state.defeatAnimationTimer - delta)
    const prevCount = state.defeatExplosionCount
    const totalExplosions = GAME_CONFIG.BOSS_DEATH_EXPLOSION_COUNT
    const elapsed = GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY - timer
    const expectedCount = Math.min(totalExplosions, Math.floor(elapsed / GAME_CONFIG.BOSS_DEATH_EXPLOSION_INTERVAL) + 1)

    const explosions = []
    if (expectedCount > prevCount && state.boss) {
      for (let i = prevCount; i < expectedCount; i++) {
        const isFinal = i === totalExplosions - 1
        explosions.push({
          x: state.boss.x + (Math.random() - 0.5) * 10,
          z: state.boss.z + (Math.random() - 0.5) * 10,
          isFinal,
        })
      }
    }

    const animationComplete = timer <= 0
    set({ defeatAnimationTimer: timer, defeatExplosionCount: expectedCount })

    return { explosions, animationComplete }
  },

  setRewardGiven: (value) => set({ rewardGiven: value }),

  reset: () => set({
    boss: null,
    isActive: false,
    bossDefeated: false,
    defeatAnimationTimer: 0,
    defeatExplosionCount: 0,
    rewardGiven: false,
  }),
}))

export default useBoss
