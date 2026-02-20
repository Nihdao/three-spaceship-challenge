import { WEAPONS } from '../entities/weaponDefs.js'
import { ENEMIES } from '../entities/enemyDefs.js'
import { GAME_CONFIG } from '../config/gameConfig.js'

/**
 * Apply an instant knockback displacement to an enemy on projectile hit.
 * Story 27.4: Direct position displacement — enemy.x/z shifted instantly on hit.
 * Chase AI naturally returns the enemy to its trajectory after displacement.
 *
 * Note on boss resistance: ENEMIES[typeId].isBoss is only set for BOSS_SPACESHIP,
 * which lives in useBoss and is NOT part of the useEnemies enemies array. This guard
 * targets potential future mini-boss enemy types that spawn via the wave system with
 * isBoss: true. The main boss fight resolves collisions separately and currently
 * receives no knockback (satisfies AC4: "bosses have reduced knockback or none").
 *
 * @param {object[]} enemies - Mutable enemies array from useEnemies
 * @param {string} enemyId - ID of the enemy to knock back
 * @param {{ weaponId: string, dirX?: number, dirZ?: number }} proj - The projectile that hit
 */
export function applyKnockbackImpulse(enemies, enemyId, proj) {
  const weaponDef = WEAPONS[proj.weaponId]
  let knockbackStrength = weaponDef?.knockbackStrength ?? 0
  if (knockbackStrength <= 0) return

  const enemy = enemies.find(e => e.id === enemyId)
  if (!enemy) return

  // Projectiles use dirX/dirZ (unit vector) + speed, not vx/vz
  const dx = proj.dirX ?? 0
  const dz = proj.dirZ ?? 0
  if (dx === 0 && dz === 0) return

  if (ENEMIES[enemy.typeId]?.isBoss) {
    knockbackStrength *= (1 - GAME_CONFIG.BOSS_KNOCKBACK_RESISTANCE)
  }

  // Direct position displacement — instant jump backward, chase AI brings enemy back naturally
  const bound = GAME_CONFIG.PLAY_AREA_SIZE
  enemy.x = Math.max(-bound, Math.min(bound, enemy.x + dx * knockbackStrength))
  enemy.z = Math.max(-bound, Math.min(bound, enemy.z + dz * knockbackStrength))
}
