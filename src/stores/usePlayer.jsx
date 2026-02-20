import { create } from 'zustand'
import { GAME_CONFIG } from '../config/gameConfig.js'
import { getXPForLevel } from '../utils/xpScaling.js'
import { UPGRADES } from '../entities/upgradeDefs.js'
import { DILEMMAS } from '../entities/dilemmaDefs.js'
import { SHIPS, getDefaultShipId } from '../entities/shipDefs.js'
import useShipProgression from './useShipProgression.jsx'
import useDamageNumbers from './useDamageNumbers.jsx'

const DEFAULT_UPGRADE_STATS = { damageMult: 1.0, speedMult: 1.0, hpMaxBonus: 0, cooldownMult: 1.0, fragmentMult: 1.0 }
const DEFAULT_DILEMMA_STATS = { damageMult: 1.0, speedMult: 1.0, hpMaxMult: 1.0, cooldownMult: 1.0 }
const DEFAULT_PERMANENT_BONUSES = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0, magnet: 1.0, luck: 0.0, expBonus: 1.0, curse: 0.0, revival: 0, reroll: 0, skip: 0, banish: 0 }
// Cache default ship baseSpeed to avoid recomputing getDefaultShipId() every tick (60 FPS)
const DEFAULT_SHIP_BASE_SPEED = SHIPS[getDefaultShipId()].baseSpeed

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

  // --- Dual-Stick Controls (Story 21.1) ---
  aimDirection: null,
  _prevVelAngle: 0, // Track previous velocity angle for velocity-based banking

  // --- Dash (Story 5.1) ---
  isDashing: false,
  dashTimer: 0,
  dashCooldownTimer: 0,

  // --- God mode (Story 11.5) ---
  _godMode: false,

  // --- Visual damage feedback (Story 4.6) ---
  damageFlashTimer: 0,
  cameraShakeTimer: 0,
  cameraShakeIntensity: 0,

  // --- Fragments (Story 7.1) ---
  fragments: 0,
  fragmentsEarnedThisRun: 0,

  // --- Permanent Upgrades & Dilemmas (Story 7.2) ---
  permanentUpgrades: {},
  acceptedDilemmas: [],
  upgradeStats: { ...DEFAULT_UPGRADE_STATS },
  dilemmaStats: { ...DEFAULT_DILEMMA_STATS },

  // --- Permanent Upgrade Bonuses (Story 20.1) — computed once at run start ---
  permanentUpgradeBonuses: { ...DEFAULT_PERMANENT_BONUSES },

  // --- Meta stat charges (Story 20.5) — initialized at run start, consumed by Epic 22 ---
  revivalCharges: 0,
  rerollCharges: 0,
  skipCharges: 0,
  banishCharges: 0,

  // --- Luck stat (Story 22.3) ---
  luckBonus: 0, // In-run luck bonus (from boons that grant luck)

  // --- XP & Level ---
  currentXP: 0,
  currentLevel: 1,
  xpToNextLevel: GAME_CONFIG.XP_LEVEL_CURVE[0],
  pendingLevelUps: 0,
  levelsGainedThisBatch: 0,

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta, input, speedMultiplier = 1, arenaSize = GAME_CONFIG.PLAY_AREA_SIZE, hpRegenRate = 0, mouseWorldPos = null, mouseActive = false) => {
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

    // Ship baseSpeed acts as a ratio relative to default ship (50 = 1.0x)
    const shipSpeedRatio = state.shipBaseSpeed / DEFAULT_SHIP_BASE_SPEED
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

    // --- Speed scalar (for UI/debug and banking logic) ---
    const speed = Math.sqrt(vx * vx + vz * vz)

    // --- Dual-stick aim direction (Story 21.1) ---
    // Calculate aimDirection AFTER position update for frame-accurate aiming
    // Use a LOCAL variable so rotation and banking use the current frame's value (not stale state)
    let currentAimDirection = state.aimDirection
    if (mouseWorldPos !== null) {
      if (mouseActive) {
        const dx = mouseWorldPos[0] - px
        const dz = mouseWorldPos[1] - pz
        const aimLen = Math.sqrt(dx * dx + dz * dz)
        if (aimLen > 0.01) {
          currentAimDirection = [dx / aimLen, dz / aimLen]
        }
      } else {
        currentAimDirection = null
      }
    }

    // --- Rotation (yaw) ---
    let yaw = state.rotation
    const prevYaw = yaw

    let shouldRotate = false
    let targetYaw = 0

    if (currentAimDirection) {
      // Rotate toward mouse aim direction (dual-stick mode)
      targetYaw = Math.atan2(currentAimDirection[0], -currentAimDirection[1])
      shouldRotate = true
    } else if (hasInput) {
      // Fallback: Rotate toward movement direction (legacy keyboard-only mode)
      targetYaw = Math.atan2(dirX, -dirZ)
      shouldRotate = true
    }

    if (shouldRotate) {
      let diff = targetYaw - yaw
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      const rotLerp = 1 - Math.exp(-PLAYER_ROTATION_SPEED * delta)
      yaw += diff * rotLerp
    }

    // --- Banking ---
    // Velocity-based banking: bank when movement trajectory changes, not when aiming changes
    // Story 21.1 Code Review Fix: Apply banking to both control modes with appropriate sensitivity
    let bank = state.bankAngle
    const bankLerp = 1 - Math.exp(-PLAYER_BANK_SPEED * delta)

    if (speed > 0.1) {
      // Calculate current velocity angle (direction ship is actually moving)
      const velAngle = Math.atan2(vx, -vz)

      // Calculate velocity angular velocity (how fast the movement direction is changing)
      let velAngleDelta = velAngle - state._prevVelAngle
      while (velAngleDelta > Math.PI) velAngleDelta -= Math.PI * 2
      while (velAngleDelta < -Math.PI) velAngleDelta += Math.PI * 2
      const velAngularVelocity = delta > 0 ? velAngleDelta / delta : 0

      // Banking sensitivity: reduced for dual-stick (0.3) vs keyboard-only (0.5)
      // Dual-stick gets less banking to avoid "tilte trop maladif" (excessive sickening tilt)
      const bankingSensitivity = currentAimDirection ? 0.3 : 0.5
      const targetBank = -Math.min(Math.max(velAngularVelocity * bankingSensitivity, -PLAYER_MAX_BANK_ANGLE), PLAYER_MAX_BANK_ANGLE)

      bank = bank + (targetBank - bank) * bankLerp
    } else {
      // Return to neutral when not moving
      bank = bank + (0 - bank) * bankLerp
    }

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

    // --- HP Regeneration (Story 11.4) ---
    let currentHP = state.currentHP
    let maxHP = state.maxHP
    if (hpRegenRate > 0 && currentHP < maxHP && currentHP > 0) {
      currentHP = Math.min(currentHP + hpRegenRate * delta, maxHP)
    }

    // Update previous velocity angle for next frame's banking calculation
    const newPrevVelAngle = speed > 0.1 ? Math.atan2(vx, -vz) : state._prevVelAngle

    set({
      currentHP,
      position: [px, 0, pz],
      velocity: [vx, 0, vz],
      rotation: yaw,
      bankAngle: bank,
      aimDirection: currentAimDirection,
      _prevVelAngle: newPrevVelAngle,
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

  // --- Luck Stat (Story 22.3) ---
  // Returns total luck: ship base (0 by default) + permanent upgrades + in-run boon bonuses
  getLuckStat: () => {
    const state = get()
    const ship = SHIPS[state.currentShipId] || SHIPS[getDefaultShipId()]
    const shipBaseLuck = ship.baseLuck || 0
    const permanentLuck = state.permanentUpgradeBonuses.luck || 0
    return shipBaseLuck + permanentLuck + state.luckBonus
  },

  // --- Ship Selection (Story 9.1) ---
  setCurrentShipId: (shipId) => {
    if (!SHIPS[shipId]) return
    set({ currentShipId: shipId })
  },

  // --- Dual-Stick Controls (Story 21.1) ---
  setAimDirection: (dir) => set({ aimDirection: dir }),

  // --- Revival System (Story 22.1) ---
  consumeRevival: () => set(state => ({
    revivalCharges: Math.max(0, state.revivalCharges - 1),
  })),

  activateRevivalInvincibility: (duration) => set({
    isInvulnerable: true,
    invulnerabilityTimer: duration,
  }),

  // --- Strategic Charge Consumption (Story 22.2) ---
  consumeReroll: () => set(state => ({
    rerollCharges: Math.max(0, state.rerollCharges - 1),
  })),

  consumeSkip: () => set(state => ({
    skipCharges: Math.max(0, state.skipCharges - 1),
  })),

  consumeBanish: () => set(state => ({
    banishCharges: Math.max(0, state.banishCharges - 1),
  })),

  // Clear pending level-up queue (used by SKIP and BANISH in LevelUpModal)
  clearPendingLevelUps: () => set({ pendingLevelUps: 0, levelsGainedThisBatch: 0 }),

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
    fragments: state.fragments + Math.round(amount),
    fragmentsEarnedThisRun: state.fragmentsEarnedThisRun + Math.round(amount),
  })),

  healFromGem: (healAmount) => {
    const { currentHP, maxHP } = get()
    const actualHealed = Math.min(maxHP - currentHP, healAmount)
    set({
      currentHP: Math.min(maxHP, currentHP + healAmount),
    })
    return actualHealed
  },

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

  // Story 11.4: Apply boon maxHP bonus — call after boon add/upgrade
  applyMaxHPBonus: (totalBonus) => {
    const state = get()
    const prevBonus = state._appliedMaxHPBonus || 0
    const delta = totalBonus - prevBonus
    if (delta === 0) return
    set({
      maxHP: state.maxHP + delta,
      currentHP: state.currentHP + delta,
      _appliedMaxHPBonus: totalBonus,
    })
  },

  addXP: (amount) => {
    const state = get()
    let xp = state.currentXP + amount
    let level = state.currentLevel
    let xpToNext = state.xpToNextLevel

    let levelsGained = 0
    while (xp >= xpToNext) {
      if (xpToNext <= 0) break
      xp -= xpToNext
      level++
      levelsGained++
      xpToNext = getXPForLevel(level)
    }

    const updates = { currentXP: xp, currentLevel: level, xpToNextLevel: xpToNext }
    if (levelsGained > 0) {
      updates.pendingLevelUps = state.pendingLevelUps + levelsGained
      updates.levelsGainedThisBatch = (state.pendingLevelUps > 0 ? state.levelsGainedThisBatch : 0) + levelsGained
    }
    set(updates)
  },

  consumeLevelUp: () => {
    const state = get()
    if (state.pendingLevelUps <= 0) return false
    set({ pendingLevelUps: state.pendingLevelUps - 1 })
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

  // Triple-guard: god mode (Story 11.5) + invulnerability i-frames (Story 3.5) + contact cooldown (Story 2.4).
  takeDamage: (amount, damageReduction = 0) => {
    const state = get()
    if (state._godMode) return
    if (state.isInvulnerable) return
    if (state.contactDamageCooldown > 0) return
    const reducedAmount = amount * (1 - damageReduction)
    set({
      currentHP: Math.max(0, state.currentHP - reducedAmount),
      isInvulnerable: true,
      invulnerabilityTimer: GAME_CONFIG.INVULNERABILITY_DURATION,
      lastDamageTime: Date.now(),
      contactDamageCooldown: GAME_CONFIG.CONTACT_DAMAGE_COOLDOWN,
      damageFlashTimer: GAME_CONFIG.DAMAGE_FLASH_DURATION,
      cameraShakeTimer: GAME_CONFIG.CAMERA_SHAKE_DURATION,
      cameraShakeIntensity: GAME_CONFIG.CAMERA_SHAKE_AMPLITUDE,
    })

    // Spawn red damage number only when damage is non-zero (Story 27.5)
    if (reducedAmount > 0) {
      useDamageNumbers.getState().spawnDamageNumber({
        damage: reducedAmount,
        worldX: state.position[0],
        worldZ: state.position[2],
        isPlayerDamage: true,
      })
    }
  },

  // Cinematic position override (used by SystemEntryPortal during systemEntry phase)
  setCinematicPosition: (pos) => set({ position: pos, rotation: 0 }),

  // Story 20.1: Apply permanent upgrade bonuses at run start (called by GameLoop after reset)
  // Story 25.1: Also applies ship level multiplier (3% per level above 1) to base stats
  initializeRunStats: (bonuses) => {
    const state = get()
    const ship = SHIPS[state.currentShipId] || SHIPS[getDefaultShipId()]

    // Ship level multiplier: 1.0 at level 1, +3% per additional level (Story 25.1)
    const shipLevelMult = useShipProgression.getState().getShipStatMultiplier(state.currentShipId)

    // Apply level multiplier to base stats first, then add permanent upgrade bonuses
    const effectiveMaxHP = ship.baseHP * shipLevelMult + bonuses.maxHP
    set({
      maxHP: effectiveMaxHP,
      currentHP: effectiveMaxHP,
      shipBaseSpeed: ship.baseSpeed * shipLevelMult,
      shipBaseDamageMultiplier: ship.baseDamageMultiplier * shipLevelMult,
      permanentUpgradeBonuses: bonuses,
      // Story 20.5: Meta stat charges = ship base + permanent upgrades
      revivalCharges: (ship.revival || 0) + (bonuses.revival || 0),
      rerollCharges: (ship.reroll || 0) + (bonuses.reroll || 0),
      skipCharges: (ship.skip || 0) + (bonuses.skip || 0),
      banishCharges: (ship.banish || 0) + (bonuses.banish || 0),
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
    _godMode: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldownTimer: 0,
    damageFlashTimer: 0,
    cameraShakeTimer: 0,
    cameraShakeIntensity: 0,
    aimDirection: null,
    _prevVelAngle: 0,
    // INTENTIONALLY PRESERVED across system transitions (Story 18.1):
    // - XP/Level: currentXP, currentLevel, xpToNextLevel, pendingLevelUps, levelsGainedThisBatch
    //   → Player's progression carries through all systems in a run
    // - Ship selection (Epic 9): currentShipId, shipBaseSpeed, shipBaseDamageMultiplier
    // - Permanent progression (Epic 7): fragments, permanentUpgrades, acceptedDilemmas, upgradeStats, dilemmaStats
    // - Permanent upgrade bonuses (Story 20.1): permanentUpgradeBonuses — computed once at run start
    // - HP state: currentHP, maxHP
    // - Boon HP bonus: _appliedMaxHPBonus
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
      _godMode: false,
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
      aimDirection: null,
      _prevVelAngle: 0,
      currentXP: 0,
      currentLevel: 1,
      xpToNextLevel: GAME_CONFIG.XP_LEVEL_CURVE[0],
      pendingLevelUps: 0,
      levelsGainedThisBatch: 0,
      fragments: 0,
      fragmentsEarnedThisRun: 0,
      permanentUpgrades: {},
      acceptedDilemmas: [],
      upgradeStats: { ...DEFAULT_UPGRADE_STATS },
      dilemmaStats: { ...DEFAULT_DILEMMA_STATS },
      permanentUpgradeBonuses: { ...DEFAULT_PERMANENT_BONUSES },
      _appliedMaxHPBonus: 0,
      // Story 20.5: Meta stat charges
      revivalCharges: 0,
      rerollCharges: 0,
      skipCharges: 0,
      banishCharges: 0,
      // Story 22.3: Luck stat
      luckBonus: 0,
    })
  },
}))

export default usePlayer
