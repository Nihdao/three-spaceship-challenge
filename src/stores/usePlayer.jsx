import { create } from 'zustand'
import { GAME_CONFIG } from '../config/gameConfig.js'

const usePlayer = create((set, get) => ({
  // --- State ---
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  rotation: 0,
  bankAngle: 0,
  speed: 0,
  currentHP: 100,
  maxHP: 100,
  isInvulnerable: false,
  lastDamageTime: 0,
  contactDamageCooldown: 0,

  // --- Tick (called by GameLoop each frame) ---
  tick: (delta, input) => {
    const state = get()
    const {
      PLAYER_BASE_SPEED,
      PLAYER_ACCELERATION,
      PLAYER_FRICTION,
      PLAYER_ROTATION_SPEED,
      PLAYER_MAX_BANK_ANGLE,
      PLAYER_BANK_SPEED,
      PLAY_AREA_SIZE,
    } = GAME_CONFIG

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
      const targetVx = dirX * PLAYER_BASE_SPEED
      const targetVz = dirZ * PLAYER_BASE_SPEED
      const accelFactor = 1 - Math.exp(-PLAYER_ACCELERATION * delta / PLAYER_BASE_SPEED)
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

    set({
      position: [px, 0, pz],
      velocity: [vx, 0, vz],
      rotation: yaw,
      bankAngle: bank,
      speed,
      contactDamageCooldown,
    })
  },

  // --- Actions ---
  takeDamage: (amount) => {
    const state = get()
    if (state.isInvulnerable) return
    if (state.contactDamageCooldown > 0) return
    set({
      currentHP: Math.max(0, state.currentHP - amount),
      lastDamageTime: Date.now(),
      contactDamageCooldown: GAME_CONFIG.CONTACT_DAMAGE_COOLDOWN,
    })
  },

  reset: () => set({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    rotation: 0,
    bankAngle: 0,
    speed: 0,
    currentHP: 100,
    maxHP: 100,
    isInvulnerable: false,
    lastDamageTime: 0,
    contactDamageCooldown: 0,
  }),
}))

export default usePlayer
