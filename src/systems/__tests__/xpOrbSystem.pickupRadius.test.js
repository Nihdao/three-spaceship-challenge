import { describe, it, expect, beforeEach } from 'vitest'
import { spawnOrb, updateMagnetization, getOrbs, resetOrbs } from '../xpOrbSystem.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('xpOrbSystem — pickup radius multiplier (Story 11.4)', () => {
  beforeEach(() => {
    resetOrbs()
  })

  it('magnetizes orb within default radius', () => {
    const radius = GAME_CONFIG.XP_MAGNET_RADIUS
    spawnOrb(radius * 0.9, 0, 10) // just inside default radius
    updateMagnetization(0, 0, 0.016)
    expect(getOrbs()[0].isMagnetized).toBe(true)
  })

  it('does not magnetize orb outside default radius', () => {
    const radius = GAME_CONFIG.XP_MAGNET_RADIUS
    spawnOrb(radius * 1.1, 0, 10) // just outside default radius
    updateMagnetization(0, 0, 0.016)
    expect(getOrbs()[0].isMagnetized).toBe(false)
  })

  it('magnetizes orb outside default radius with 2.0x multiplier', () => {
    const radius = GAME_CONFIG.XP_MAGNET_RADIUS
    spawnOrb(radius * 1.5, 0, 10) // outside default but inside 2x
    updateMagnetization(0, 0, 0.016, 2.0)
    expect(getOrbs()[0].isMagnetized).toBe(true)
  })

  it('does not magnetize orb outside expanded radius', () => {
    const radius = GAME_CONFIG.XP_MAGNET_RADIUS
    spawnOrb(radius * 2.1, 0, 10) // outside 2x range
    updateMagnetization(0, 0, 0.016, 2.0)
    expect(getOrbs()[0].isMagnetized).toBe(false)
  })

  it('default multiplier (1.0) matches original behavior', () => {
    const radius = GAME_CONFIG.XP_MAGNET_RADIUS
    spawnOrb(radius * 0.5, 0, 10)
    updateMagnetization(0, 0, 0.016, 1.0)
    expect(getOrbs()[0].isMagnetized).toBe(true)
  })

  it('omitted multiplier defaults to 1.0', () => {
    const radius = GAME_CONFIG.XP_MAGNET_RADIUS
    spawnOrb(radius * 0.5, 0, 10)
    updateMagnetization(0, 0, 0.016)
    expect(getOrbs()[0].isMagnetized).toBe(true)
  })
})
