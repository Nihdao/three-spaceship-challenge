import { create } from 'zustand'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { UPGRADES } from '../entities/upgradeDefs.js'
import { DILEMMAS } from '../entities/dilemmaDefs.js'
import { SHIPS, getDefaultShipId } from '../entities/shipDefs.js'

const DEFAULT_UPGRADE_STATS = { damageMult: 1.0, speedMult: 1.0, hpMaxBonus: 0, cooldownMult: 1.0, fragmentMult: 1.0 }
const DEFAULT_DILEMMA_STATS = { damageMult: 1.0, speedMult: 1.0, hpMaxMult: 1.0, cooldownMult: 1.0 }

const usePlayer = create((set, get) => ({
  // --- Ship Selection (Story 9.1) ---
  currentShipId: getDefaultShipId(),
  shipBaseSpeed: SHIPS[getDefaultShipId()].baseSpeed,
  shipBaseDamageMultiplier: SHIPS[getDefaultShipId()].baseDamageMultiplier,

  // --- State ---
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  rotation: 0,
  bankAngle: 0,
  speed: 0,
  currentHP: GAME_CONFIG.PLAYER_BASE_HP,
  maxHP: GAME_CONFIG.PLAYER_BASE_HP,
  isInvulnerable: false,
  invulnerabilityTimer: 0,
  lastDamageTime: 0,
  contactDamageCooldown: 0,

  // --- Dash (Story 5.1) ---
  isDashing: false,
  dashTimer: 0,
  dashCooldownTimer: 0,

  // --- Visual damage feedback (Story 4.6) ---
  damageFlashTimer: 0,
  cameraShakeTimer: 0,
  cameraShakeIntensity: 0,

  // --- Fragments (Story 7.1) ---
  fragments: 0,

  // --- Permanent Upgrades & Dilemmas (Story 7.2) ---
  permanentUpgrades: {},
  acceptedDilemmas: [],
  upgradeStats: { ...DEFAULT_UPGRADE_STATS },
  dilemmaStats: { ...DEFAULT_DILEMMA_STATS },

  // --- XP & Level ---
  currentXP: 0,
  currentLevel: 1,
  xpToNextLevel: GAME_CONFIG.XP_LEVEL_CURVE[0],
  pendingLevelUp: false,

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta, input, speedMultiplier = 1, arenaSize = GAME_CONFIG.PLAY_AREA_SIZE) => {
    const state = get()
    const {
      PLAYER_BASE_SPEED,
      PLAYER_ACCELERATION,
      PLAYER_FRICTION,
      PLAYER_ROTATION_SPEED,
      PLAYER_MAX_BANK_ANGLE,
      PLAYER_BANK_SPEED,
    } = GAME_CONFIG
    const PLAY_AREA_SIZE = arenaSize

    // Ship baseSpeed acts as a ratio relative to BALANCED (50 = 1.0x)
    const shipSpeedRatio = state.shipBaseSpeed / SHIPS[getDefaultShipId()].baseSpeed
    const effectiveSpeed = PLAYER_BASE_SPEED * shipSpeedRatio * speedMultiplier

    // --- Direction from input ---
    let dirX = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0)
    let dirZ = (input.moveForward ? -1 : 0) + (input.moveBackward ? 1 : 0)
    // Normalize diagonal to prevent 1.41x speed
    const length = Math.sqrt(dirX * dirX + dirZ * dirZ)
    if (length > 0) { dirX /= length; dirZ /= length }
    const hasInput = length > 0

    // --- Velocity (acceleration / friction) ---
    let vx = state.velocity[0]
    let vz = state.velocity[2]

    if (hasInput) {
      const targetVx = dirX * effectiveSpeed
      const targetVz = dirZ * effectiveSpeed
      const accelFactor = 1 - Math.exp(-PLAYER_ACCELERATION * delta / effectiveSpeed)
      vx += (targetVx - vx) * accelFactor
      vz += (targetVz - vz) * accelFactor
    } else {
      // Friction decay — exponential per-frame
      const frictionFactor = Math.pow(PLAYER_FRICTION, delta * 60)
      vx *= frictionFactor
      vz *= frictionFactor
      // Zero out tiny velocities
      if (Math.abs(vx) < 0.01) vx = 0
      if (Math.abs(vz) < 0.01) vz = 0
    }

    // --- Position ---
    let px = state.position[0] + vx * delta
    let pz = state.position[2] + vz * delta

    // Clamp to play area boundaries
    px = Math.max(-PLAY_AREA_SIZE, Math.min(PLAY_AREA_SIZE, px))
    pz = Math.max(-PLAY_AREA_SIZE, Math.min(PLAY_AREA_SIZE, pz))

    // Zero velocity component if hitting boundary
    if (Math.abs(px) >= PLAY_AREA_SIZE) vx = 0
    if (Math.abs(pz) >= PLAY_AREA_SIZE) vz = 0

    // --- Rotation (yaw) ---
    let yaw = state.rotation
    const prevYaw = yaw

    if (hasInput) {
      const targetYaw = Math.atan2(dirX, -dirZ)
      let diff = targetYaw - yaw
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      const rotLerp = 1 - Math.exp(-PLAYER_ROTATION_SPEED * delta)
      yaw += diff * rotLerp
    }

    // --- Banking ---
    let yawDelta = yaw - prevYaw
    // Normalize yaw delta
    while (yawDelta > Math.PI) yawDelta -= Math.PI * 2
    while (yawDelta < -Math.PI) yawDelta += Math.PI * 2
    const angularVelocity = delta > 0 ? yawDelta / delta : 0
    const targetBank = -Math.min(Math.max(angularVelocity * 0.5, -PLAYER_MAX_BANK_ANGLE), PLAYER_MAX_BANK_ANGLE)
    const bankLerp = 1 - Math.exp(-PLAYER_BANK_SPEED * delta)
    let bank = state.bankAngle + (targetBank - state.bankAngle) * bankLerp
    // Return to 0 when not turning
    if (!hasInput && Math.abs(yawDelta) < 0.001) {
      bank += (0 - bank) * bankLerp
    }

    // --- Speed scalar (for UI/debug) ---
    const speed = Math.sqrt(vx * vx + vz * vz)

    // --- Contact damage cooldown ---
    let contactDamageCooldown = state.contactDamageCooldown - delta
    if (contactDamageCooldown < 0) contactDamageCooldown = 0

    // --- Invulnerability timer ---
    let isInvulnerable = state.isInvulnerable
    let invulnerabilityTimer = state.invulnerabilityTimer
    if (invulnerabilityTimer > 0) {
      invulnerabilityTimer = Math.max(0, invulnerabilityTimer - delta)
      if (invulnerabilityTimer <= 0) {
        isInvulnerable = false
      }
    }

    // --- Dash timer (Story 5.1) ---
    let isDashing = state.isDashing
    let dashTimer = state.dashTimer
    let dashCooldownTimer = state.dashCooldownTimer

    if (isDashing && dashTimer > 0) {
      const remaining = delta - dashTimer
      dashTimer = Math.max(0, dashTimer - delta)
      if (dashTimer <= 0) {
        isDashing = false
        dashCooldownTimer = Math.max(0, GAME_CONFIG.DASH_COOLDOWN - remaining)
        // End invulnerability ONLY if damage i-frames also expired
        if (invulnerabilityTimer <= 0) {
          isInvulnerable = false
        }
      }
    } else if (!isDashing && dashCooldownTimer > 0) {
      dashCooldownTimer = Math.max(0, dashCooldownTimer - delta)
    }

    // --- Visual damage feedback timers ---
    let damageFlashTimer = Math.max(0, state.damageFlashTimer - delta)
    let cameraShakeTimer = Math.max(0, state.cameraShakeTimer - delta)
    let cameraShakeIntensity = state.cameraShakeIntensity
    if (cameraShakeTimer <= 0) cameraShakeIntensity = 0

    set({
      position: [px, 0, pz],
      velocity: [vx, 0, vz],
      rotation: yaw,
      bankAngle: bank,
      speed,
      contactDamageCooldown,
      isInvulnerable,
      invulnerabilityTimer,
      isDashing,
      dashTimer,
      dashCooldownTimer,
      damageFlashTimer,
      cameraShakeTimer,
      cameraShakeIntensity,
    })
  },

  // --- Ship Selection (Story 9.1) ---
  setCurrentShipId: (shipId) => {
    if (!SHIPS[shipId]) return
    set({ currentShipId: shipId })
  },

  // --- Actions ---
  sacrificeFragmentsForHP: () => {
    const { fragments, currentHP, maxHP } = get()
    if (fragments < GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST) return false
    if (currentHP >= maxHP) return false
    set({
      fragments: fragments - GAME_CONFIG.HP_SACRIFICE_FRAGMENT_COST,
      currentHP: Math.min(maxHP, currentHP + GAME_CONFIG.HP_SACRIFICE_HP_RECOVERY),
    })
    return true
  },

  addFragments: (amount) => set(state => ({
    fragments: state.fragments + Math.round(amount * state.upgradeStats.fragmentMult),
  })),

  applyPermanentUpgrade: (upgradeId) => {
    const upgrade = UPGRADES[upgradeId]
    if (!upgrade) return false
    const state = get()
    if (state.fragments < upgrade.fragmentCost) return false
    if (state.permanentUpgrades[upgradeId]) return false
    if (upgrade.prerequisite && !state.permanentUpgrades[upgrade.prerequisite]) return false

    const effect = upgrade.effect
    const updates = {
      fragments: state.fragments - upgrade.fragmentCost,
      permanentUpgrades: { ...state.permanentUpgrades, [upgradeId]: true },
    }

    if (effect.type === 'DAMAGE_MULT') {
      updates.upgradeStats = { ...state.upgradeStats, damageMult: state.upgradeStats.damageMult * effect.value }
    } else if (effect.type === 'SPEED_MULT') {
      updates.upgradeStats = { ...state.upgradeStats, speedMult: state.upgradeStats.speedMult * effect.value }
    } else if (effect.type === 'HP_MAX_BONUS') {
      updates.upgradeStats = { ...state.upgradeStats, hpMaxBonus: state.upgradeStats.hpMaxBonus + effect.value }
      updates.maxHP = state.maxHP + effect.value
      updates.currentHP = state.currentHP + effect.value
    } else if (effect.type === 'COOLDOWN_MULT') {
      updates.upgradeStats = { ...state.upgradeStats, cooldownMult: state.upgradeStats.cooldownMult * effect.value }
    } else if (effect.type === 'FRAGMENT_MULT') {
      updates.upgradeStats = { ...state.upgradeStats, fragmentMult: state.upgradeStats.fragmentMult * effect.value }
    }

    set(updates)
    return true
  },

  acceptDilemma: (dilemmaId) => {
    const dilemma = DILEMMAS[dilemmaId]
    if (!dilemma) return false
    const state = get()
    if (state.acceptedDilemmas.includes(dilemmaId)) return false

    const updates = {
      acceptedDilemmas: [...state.acceptedDilemmas, dilemmaId],
      dilemmaStats: { ...state.dilemmaStats },
    }

    const applyEffect = (effect) => {
      if (effect.type === 'DAMAGE_MULT') {
        updates.dilemmaStats.damageMult = (updates.dilemmaStats.damageMult ?? state.dilemmaStats.damageMult) * effect.value
      } else if (effect.type === 'SPEED_MULT') {
        updates.dilemmaStats.speedMult = (updates.dilemmaStats.speedMult ?? state.dilemmaStats.speedMult) * effect.value
      } else if (effect.type === 'HP_MAX_MULT') {
        const prevMaxHP = updates.maxHP ?? state.maxHP
        const newMaxHP = Math.floor(prevMaxHP * effect.value)
        updates.maxHP = newMaxHP
        const prevCurrentHP = updates.currentHP ?? state.currentHP
        // Increase: heal proportionally so the player benefits from the extra HP
        // Decrease: clamp currentHP to new lower max
        updates.currentHP = effect.value >= 1
          ? prevCurrentHP + (newMaxHP - prevMaxHP)
          : Math.min(prevCurrentHP, newMaxHP)
        updates.dilemmaStats.hpMaxMult = (updates.dilemmaStats.hpMaxMult ?? state.dilemmaStats.hpMaxMult) * effect.value
      } else if (effect.type === 'COOLDOWN_MULT') {
        updates.dilemmaStats.cooldownMult = (updates.dilemmaStats.cooldownMult ?? state.dilemmaStats.cooldownMult) * effect.value
      }
    }

    applyEffect(dilemma.bonus)
    applyEffect(dilemma.malus)

    set(updates)
    return true
  },

  addXP: (amount) => {
    const state = get()
    const curve = GAME_CONFIG.XP_LEVEL_CURVE
    let xp = state.currentXP + amount
    let level = state.currentLevel
    let xpToNext = state.xpToNextLevel
    let pending = state.pendingLevelUp

    while (xp >= xpToNext && level <= curve.length) {
      xp -= xpToNext
      level++
      xpToNext = curve[level - 1] ?? Infinity
      pending = true
    }

    set({ currentXP: xp, currentLevel: level, xpToNextLevel: xpToNext, pendingLevelUp: pending })
  },

  consumeLevelUp: () => {
    const state = get()
    if (!state.pendingLevelUp) return false
    set({ pendingLevelUp: false })
    return true
  },

  // Dash action (Story 5.1) — triggers barrel roll + invulnerability
  startDash: () => {
    const state = get()
    if (state.isDashing) return
    if (state.dashCooldownTimer > 0) return
    set({
      isDashing: true,
      dashTimer: GAME_CONFIG.DASH_DURATION,
      isInvulnerable: true,
    })
  },

  // Double-guard: invulnerability (post-hit i-frames, Story 3.5) + contact cooldown (Story 2.4).
  // Both currently share the same duration but serve as independent safety nets.
  takeDamage: (amount) => {
    const state = get()
    if (state.isInvulnerable) return
    if (state.contactDamageCooldown > 0) return
    set({
      currentHP: Math.max(0, state.currentHP - amount),
      isInvulnerable: true,
      invulnerabilityTimer: GAME_CONFIG.INVULNERABILITY_DURATION,
      lastDamageTime: Date.now(),
      contactDamageCooldown: GAME_CONFIG.CONTACT_DAMAGE_COOLDOWN,
      damageFlashTimer: GAME_CONFIG.DAMAGE_FLASH_DURATION,
      cameraShakeTimer: GAME_CONFIG.CAMERA_SHAKE_DURATION,
      cameraShakeIntensity: GAME_CONFIG.CAMERA_SHAKE_AMPLITUDE,
    })
  },

  resetForNewSystem: () => set({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    rotation: 0,
    bankAngle: 0,
    speed: 0,
    isInvulnerable: false,
    invulnerabilityTimer: 0,
    lastDamageTime: 0,
    contactDamageCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashCooldownTimer: 0,
    damageFlashTimer: 0,
    cameraShakeTimer: 0,
    cameraShakeIntensity: 0,
    currentXP: 0,
    currentLevel: 1,
    xpToNextLevel: GAME_CONFIG.XP_LEVEL_CURVE[0],
    pendingLevelUp: false,
    // Preserves: fragments, currentHP, maxHP, permanentUpgrades, acceptedDilemmas, upgradeStats, dilemmaStats, currentShipId, shipBaseSpeed, shipBaseDamageMultiplier
  }),

  reset: () => {
    const { currentShipId } = get()
    const ship = SHIPS[currentShipId] || SHIPS[getDefaultShipId()]
    set({
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      rotation: 0,
      bankAngle: 0,
      speed: 0,
      currentHP: ship.baseHP,
      maxHP: ship.baseHP,
      shipBaseSpeed: ship.baseSpeed,
      shipBaseDamageMultiplier: ship.baseDamageMultiplier,
      isInvulnerable: false,
      invulnerabilityTimer: 0,
      lastDamageTime: 0,
      contactDamageCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      dashCooldownTimer: 0,
      damageFlashTimer: 0,
      cameraShakeTimer: 0,
      cameraShakeIntensity: 0,
      currentXP: 0,
      currentLevel: 1,
      xpToNextLevel: GAME_CONFIG.XP_LEVEL_CURVE[0],
      pendingLevelUp: false,
      fragments: 0,
      permanentUpgrades: {},
      acceptedDilemmas: [],
      upgradeStats: { ...DEFAULT_UPGRADE_STATS },
      dilemmaStats: { ...DEFAULT_DILEMMA_STATS },
    })
  },
}))

export default usePlayer
