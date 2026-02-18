import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../gameConfig.js'

describe('SYSTEM_ENTRY portal color config (Story 21.4)', () => {
  const cfg = GAME_CONFIG.SYSTEM_ENTRY

  it('SYSTEM_ENTRY config exists', () => {
    expect(cfg).toBeDefined()
  })

  it('PORTAL_COLOR is a valid hex string', () => {
    expect(cfg.PORTAL_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('PORTAL_COLOR is purple-toned (not cyan)', () => {
    // Parse hex color to RGB
    const hex = cfg.PORTAL_COLOR.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)

    // Purple: high red and blue, low green (e.g. #9933ff → r=153, g=51, b=255)
    // Cyan (#00ccff): r=0, g=204, b=255 — should NOT match
    expect(r).toBeGreaterThan(g) // purple has more red than green
    expect(b).toBeGreaterThan(g) // purple has more blue than green
  })

  it('PORTAL_COLOR matches WormholeRenderer WORMHOLE_COLOR2 for palette symmetry (Story 21.4)', () => {
    // Design decision: portal primary color mirrors wormhole secondary color (#bb88ff)
    // This creates an inverted but cohesive palette between portal and wormhole
    expect(cfg.PORTAL_COLOR).toBe('#bb88ff')
  })
})
