import { GAME_CONFIG } from '../config/gameConfig.js'

const GROWTH_RATE = 1.02

/**
 * Calculate XP requirement for a given level.
 * Levels 1-14: hardcoded XP_LEVEL_CURVE.
 * Levels 15+: exponential scaling (baseXP * 1.02^(level - baseLevel)).
 * Tuned for fast feel-good infinite progression.
 */
export function getXPForLevel(level) {
  const curve = GAME_CONFIG.XP_LEVEL_CURVE

  if (level >= 1 && level <= curve.length) {
    return curve[level - 1]
  }

  const baseLevel = curve.length // 14
  const baseXP = curve[baseLevel - 1] // 4400
  const exponent = level - baseLevel
  const xp = baseXP * Math.pow(GROWTH_RATE, exponent)

  return Math.min(Math.floor(xp), Number.MAX_SAFE_INTEGER)
}
