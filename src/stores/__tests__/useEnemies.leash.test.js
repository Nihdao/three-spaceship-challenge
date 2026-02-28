import { describe, it, expect, beforeEach } from 'vitest'
import useEnemies from '../useEnemies.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('useEnemies leash system (Story 36.1)', () => {
  beforeEach(() => {
    useEnemies.getState().reset()
  })

  const playerPos = [0, 0, 0]

  it('leashes chase enemy at 400u to within 150u of player', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 400, 0)
    useEnemies.getState().tick(0.016, playerPos, { leashEnabled: true })

    const e = useEnemies.getState().enemies[0]
    const dx = e.x - playerPos[0]
    const dz = e.z - playerPos[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    // spawn range is [80, 120] so dist should be well within 150
    expect(dist).toBeLessThanOrEqual(150)
  })

  it('does NOT leash sweep enemy at 400u', () => {
    useEnemies.getState().spawnEnemy('FODDER_SWARM', 400, 0)
    useEnemies.getState().tick(0.016, playerPos, { leashEnabled: true })

    // Sweep despawnTimer starts at 10–15s so a single 0.016s tick won't despawn it
    const enemies = useEnemies.getState().enemies
    expect(enemies).toHaveLength(1)
    const e = enemies[0]
    const dist = Math.sqrt(e.x * e.x + e.z * e.z)
    expect(dist).toBeGreaterThan(350)
  })

  it('does NOT leash teleport enemy at 400u', () => {
    useEnemies.getState().spawnEnemy('TELEPORTER', 400, 0)
    // Prevent the enemy's own teleport behavior from firing
    useEnemies.getState().enemies[0].teleportTimer = 999
    useEnemies.getState().tick(0.016, playerPos, { leashEnabled: true })

    const e = useEnemies.getState().enemies[0]
    // Should still be near 400 (only chase movement = speed * 0.016 ≈ tiny)
    const dist = Math.sqrt(e.x * e.x + e.z * e.z)
    expect(dist).toBeGreaterThan(350)
  })

  it('leashes shockwave enemy at 400u to within 150u of player', () => {
    useEnemies.getState().spawnEnemy('SHOCKWAVE_BLOB', 400, 0)
    useEnemies.getState().tick(0.016, playerPos, { leashEnabled: true })

    const e = useEnemies.getState().enemies[0]
    const dist = Math.sqrt(e.x * e.x + e.z * e.z)
    expect(dist).toBeLessThanOrEqual(150)
  })

  it('leashes sniper_mobile enemy at 400u to within 150u of player', () => {
    useEnemies.getState().spawnEnemy('SNIPER_MOBILE', 400, 0)
    useEnemies.getState().tick(0.016, playerPos, { leashEnabled: true })

    const e = useEnemies.getState().enemies[0]
    const dist = Math.sqrt(e.x * e.x + e.z * e.z)
    expect(dist).toBeLessThanOrEqual(150)
  })

  it('does not leash when leashEnabled is false', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 600, 0)
    useEnemies.getState().tick(0.016, playerPos, { leashEnabled: false })

    const e = useEnemies.getState().enemies[0]
    // Should still be near 600 (only tiny chase movement, clamped to PLAY_AREA_SIZE)
    expect(e.x).toBeGreaterThan(500)
  })

  it('leashes when no options passed (backward compat: leashEnabled defaults to true)', () => {
    // options.leashEnabled !== false → undefined !== false → true → leash fires
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 400, 0)
    useEnemies.getState().tick(0.016, playerPos)

    const e = useEnemies.getState().enemies[0]
    const dist = Math.sqrt(e.x * e.x + e.z * e.z)
    expect(dist).toBeLessThanOrEqual(150)
  })

  it('clamps leashed position to play area bounds', () => {
    // Player near boundary so leash spawn could overshoot play area
    const edgePlayer = [620, 0, 0]
    // Enemy at x=100, far from edge player (dist = 520u > ENEMY_LEASH_DISTANCE)
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 100, 0)
    useEnemies.getState().tick(0.016, edgePlayer, { leashEnabled: true })

    const e = useEnemies.getState().enemies[0]
    expect(e.x).toBeGreaterThanOrEqual(-GAME_CONFIG.PLAY_AREA_SIZE)
    expect(e.x).toBeLessThanOrEqual(GAME_CONFIG.PLAY_AREA_SIZE)
    expect(e.z).toBeGreaterThanOrEqual(-GAME_CONFIG.PLAY_AREA_SIZE)
    expect(e.z).toBeLessThanOrEqual(GAME_CONFIG.PLAY_AREA_SIZE)
  })

  it('pushes _teleportEvents with { oldX, oldZ, newX, newZ } format when leashing', () => {
    useEnemies.getState().spawnEnemy('FODDER_BASIC', 400, 0)
    useEnemies.getState().tick(0.016, playerPos, { leashEnabled: true })

    const events = useEnemies.getState().consumeTeleportEvents()
    expect(events.length).toBeGreaterThan(0)
    const evt = events[0]
    expect(typeof evt.oldX).toBe('number')
    expect(typeof evt.oldZ).toBe('number')
    expect(typeof evt.newX).toBe('number')
    expect(typeof evt.newZ).toBe('number')
    // oldX should be near the original far position (chase only moved it ~0.27 units)
    expect(Math.abs(evt.oldX - 400)).toBeLessThan(5)
    // newX/Z should be near the player (within spawn range)
    const newDist = Math.sqrt(evt.newX * evt.newX + evt.newZ * evt.newZ)
    expect(newDist).toBeLessThanOrEqual(150)
  })
})
