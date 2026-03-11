import { GAME_CONFIG } from '../config/gameConfig.js'

// Story 52.2 review: extracted from GameLoop.jsx to enable unit testing.
// Pure function — no React, no stores.

const CHAOS_FALLBACK = { hp: 1, damage: 1, speed: 1, spawnRate: 1 }

/**
 * Build systemScaling and chaosSpawnMult for a galaxy + 0-based system index.
 * Chaos mults are applied in both branches (difficultyScalingPerSystem or fallback).
 *
 * @param {object|null} gc - Galaxy config object (from getGalaxyById)
 * @param {number} systemIndex - 0-based (system 1 → 0, system 2 → 1, …)
 * @returns {{ scaling: object, chaosSpawnMult: number }}
 */
export function buildSystemScaling(gc, systemIndex) {
  const chaos = gc?.chaosEnemyMult ?? CHAOS_FALLBACK

  if (gc?.difficultyScalingPerSystem) {
    const s = gc.difficultyScalingPerSystem
    return {
      scaling: {
        hp:             Math.pow(s.hp,       systemIndex) * chaos.hp,
        damage:         Math.pow(s.damage,   systemIndex) * chaos.damage,
        speed:          Math.pow(s.speed,    systemIndex) * (gc.enemySpeedMult ?? 1.0) * chaos.speed,
        xpReward:       Math.pow(s.xpReward, systemIndex),
        galaxyXpMult:   gc?.xpMultiplier    ?? 1.0,
        galaxyFragMult: gc?.fragmentMultiplier ?? 1.0,
        galaxyScoreMult: gc?.scoreMultiplier ?? 1.0,
      },
      chaosSpawnMult: chaos.spawnRate,
    }
  }

  // Fallback branch: galaxy without difficultyScalingPerSystem.
  // Chaos mults are applied here too for consistency (no-ops for non-chaos galaxies).
  const base = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[systemIndex + 1] || GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
  return {
    scaling: {
      hp:             (base.hp     ?? 1) * chaos.hp,
      damage:         (base.damage ?? 1) * chaos.damage,
      speed:          (base.speed  ?? 1) * chaos.speed,
      xpReward:       base.xpReward ?? 1,
      galaxyXpMult:   1.0,
      galaxyFragMult: 1.0,
      galaxyScoreMult: 1.0,
    },
    chaosSpawnMult: chaos.spawnRate,
  }
}
