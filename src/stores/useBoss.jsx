import { create } from 'zustand'
import { GAME_CONFIG } from '../config/gameConfig.js'

const useBoss = create((set, get) => ({
  boss: null,
  bossProjectiles: [],
  isActive: false,
  bossDefeated: false,
  nextProjectileId: 0,
  defeatAnimationTimer: 0,
  defeatExplosionCount: 0,
  rewardGiven: false,

  spawnBoss: (currentSystem = 1, wormholePos = null) => {
    // Story 16.4: Use per-stat scaling from ENEMY_SCALING_PER_SYSTEM
    const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || { hp: 1, damage: 1, speed: 1, xpReward: 1 }
    const bossHP = Math.round(GAME_CONFIG.BOSS_HP * scaling.hp)
    // Story 17.4: Spawn at wormhole position if provided, otherwise at origin
    const spawnX = wormholePos?.x ?? 0
    const spawnZ = wormholePos?.z ?? 0
    set({
    boss: {
      x: spawnX, z: spawnZ,
      hp: bossHP,
      maxHp: bossHP,
      phase: 0,
      attackCooldown: GAME_CONFIG.BOSS_ATTACK_COOLDOWN,
      telegraphTimer: 0,
      attackType: null,
      lastHitTime: -Infinity,
      damageMultiplier: scaling.damage, // Damage scaling for projectiles/contact (Story 16.4)
    },
    isActive: true,
    bossDefeated: false,
    bossProjectiles: [],
    nextProjectileId: 0,
  })
  },

  tick: (delta, playerPos) => {
    const state = get()
    if (!state.boss || state.boss.hp <= 0) return

    // Shallow copy to preserve Zustand immutability (never mutate store references)
    const boss = { ...state.boss }
    const currentProjectiles = state.bossProjectiles
    let newNextId = state.nextProjectileId

    // 1. Move boss toward player (chase but keep min distance)
    const dx = playerPos[0] - boss.x
    const dz = playerPos[2] - boss.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist > 15) {
      boss.x += (dx / dist) * GAME_CONFIG.BOSS_MOVE_SPEED * delta
      boss.z += (dz / dist) * GAME_CONFIG.BOSS_MOVE_SPEED * delta
    }
    // Clamp to arena
    boss.x = Math.max(-GAME_CONFIG.BOSS_ARENA_SIZE, Math.min(GAME_CONFIG.BOSS_ARENA_SIZE, boss.x))
    boss.z = Math.max(-GAME_CONFIG.BOSS_ARENA_SIZE, Math.min(GAME_CONFIG.BOSS_ARENA_SIZE, boss.z))

    // 2. Attack state machine
    const phaseMultiplier = 1 + boss.phase * 0.3
    const newProjectiles = []
    if (boss.telegraphTimer > 0) {
      boss.telegraphTimer = Math.max(0, boss.telegraphTimer - delta)
      if (boss.telegraphTimer <= 0) {
        // Execute attack — fire projectiles toward player
        const aimDx = playerPos[0] - boss.x
        const aimDz = playerPos[2] - boss.z
        const aimDist = Math.sqrt(aimDx * aimDx + aimDz * aimDz) || 1
        const baseAngle = Math.atan2(aimDz, aimDx)

        const burstCount = GAME_CONFIG.BOSS_BURST_COUNT + boss.phase // More projectiles at higher phases
        const spread = GAME_CONFIG.BOSS_BURST_SPREAD
        const startAngle = baseAngle - (spread * (burstCount - 1)) / 2

        for (let i = 0; i < burstCount; i++) {
          const angle = startAngle + i * spread
          newProjectiles.push({
            id: `bp_${newNextId++}`,
            x: boss.x,
            z: boss.z,
            vx: Math.cos(angle) * GAME_CONFIG.BOSS_PROJECTILE_SPEED,
            vz: Math.sin(angle) * GAME_CONFIG.BOSS_PROJECTILE_SPEED,
            damage: Math.round(GAME_CONFIG.BOSS_PROJECTILE_DAMAGE * (boss.damageMultiplier || 1)),
            radius: GAME_CONFIG.BOSS_PROJECTILE_RADIUS,
            lifetime: 5,
          })
        }
      }
    } else {
      boss.attackCooldown = Math.max(0, boss.attackCooldown - delta * phaseMultiplier)
      if (boss.attackCooldown <= 0) {
        boss.telegraphTimer = GAME_CONFIG.BOSS_TELEGRAPH_DURATION
        boss.attackCooldown = GAME_CONFIG.BOSS_ATTACK_COOLDOWN
      }
    }

    // 3. Update existing projectiles (immutable — build new array)
    const updatedProjectiles = []
    for (let i = 0; i < currentProjectiles.length; i++) {
      const p = currentProjectiles[i]
      const nx = p.x + p.vx * delta
      const nz = p.z + p.vz * delta
      const nl = p.lifetime - delta
      if (nl > 0 && Math.abs(nx) <= GAME_CONFIG.BOSS_ARENA_SIZE + 50 && Math.abs(nz) <= GAME_CONFIG.BOSS_ARENA_SIZE + 50) {
        updatedProjectiles.push({ ...p, x: nx, z: nz, lifetime: nl })
      }
    }
    // Apply first tick of movement to newly spawned projectiles
    for (let i = 0; i < newProjectiles.length; i++) {
      const p = newProjectiles[i]
      updatedProjectiles.push({
        ...p,
        x: p.x + p.vx * delta,
        z: p.z + p.vz * delta,
        lifetime: p.lifetime - delta,
      })
    }

    // 4. Check phase transitions
    const hpFraction = boss.hp / boss.maxHp
    const thresholds = GAME_CONFIG.BOSS_PHASE_THRESHOLDS
    let newPhase = 0
    for (let i = 0; i < thresholds.length; i++) {
      if (hpFraction <= thresholds[i]) newPhase = i + 1
    }
    if (newPhase > boss.phase) {
      boss.phase = newPhase
    }

    set({ boss, bossProjectiles: updatedProjectiles, nextProjectileId: newNextId })
  },

  damageBoss: (amount) => {
    const { boss } = get()
    if (!boss) return { killed: false }
    const newHp = Math.max(0, boss.hp - amount)
    const killed = newHp <= 0
    const update = {
      boss: { ...boss, hp: newHp, lastHitTime: Date.now() },
      bossDefeated: killed,
    }
    if (killed) {
      update.defeatAnimationTimer = GAME_CONFIG.BOSS_DEFEAT_TRANSITION_DELAY
      update.defeatExplosionCount = 0
      update.bossProjectiles = []
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
    bossProjectiles: [],
    isActive: false,
    bossDefeated: false,
    nextProjectileId: 0,
    defeatAnimationTimer: 0,
    defeatExplosionCount: 0,
    rewardGiven: false,
  }),
}))

export default useBoss
