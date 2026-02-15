import { describe, it, expect } from 'vitest'
import { minimapDotPosition, isWithinMinimapRadius, minimapBoundaryEdgePct, MINIMAP } from '../HUD.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

describe('Minimap helpers (Story 10.3, updated Story 24.1)', () => {
  describe('minimapDotPosition (Story 24.1 — player-relative)', () => {
    it('returns 50%/50% when entity is at player position', () => {
      const pos = minimapDotPosition(100, 200, 100, 200, 500)
      expect(pos.left).toBe('50%')
      expect(pos.top).toBe('50%')
    })

    it('returns correct offset for entity to the right of player', () => {
      // entity at x=300, player at x=100, radius=500 → relX=200 → 50 + (200/500)*50 = 70%
      const pos = minimapDotPosition(300, 0, 100, 0, 500)
      expect(pos.left).toBe('70%')
      expect(pos.top).toBe('50%') // relZ = 0-0=0 → 50%
    })

    it('returns 0% for entity at negative edge of visible radius', () => {
      // entity at x=-500, player at x=0, radius=500 → relX=-500 → 50 + (-500/500)*50 = 0%
      const pos = minimapDotPosition(-500, 0, 0, 0, 500)
      expect(pos.left).toBe('0%')
      expect(pos.top).toBe('50%')
    })

    it('returns 100% for entity at positive edge of visible radius', () => {
      // entity at x=500, player at x=0, radius=500 → relX=500 → 50 + (500/500)*50 = 100%
      const pos = minimapDotPosition(500, 0, 0, 0, 500)
      expect(pos.left).toBe('100%')
      expect(pos.top).toBe('50%')
    })

    it('returns values beyond 0-100% for entities beyond visible radius', () => {
      // entity at x=1000, player at x=0, radius=500 → relX=1000 → 50 + (1000/500)*50 = 150%
      const pos = minimapDotPosition(1000, 0, 0, 0, 500)
      expect(pos.left).toBe('150%')
    })

    it('returns both left and top keys', () => {
      const pos = minimapDotPosition(0, 0, 0, 0, 500)
      expect(pos).toHaveProperty('left')
      expect(pos).toHaveProperty('top')
    })

    it('scales correctly with different visible radii', () => {
      // Same relative offset, different radii → different percentages
      const small = minimapDotPosition(100, 0, 0, 0, 200)
      const large = minimapDotPosition(100, 0, 0, 0, 1000)
      // 50 + (100/200)*50 = 75%
      expect(small.left).toBe('75%')
      // 50 + (100/1000)*50 = 55%
      expect(large.left).toBe('55%')
    })
  })

  describe('player always at center (Story 24.1)', () => {
    it('player dot is always at 50%/50% regardless of player position', () => {
      // Player-relative: entity AT player position = always center
      const pos = minimapDotPosition(999, -500, 999, -500, 500)
      expect(pos.left).toBe('50%')
      expect(pos.top).toBe('50%')
    })
  })

  describe('isWithinMinimapRadius (Story 24.1)', () => {
    it('returns true for entity at player position', () => {
      expect(isWithinMinimapRadius(100, 200, 100, 200, 500)).toBe(true)
    })

    it('returns true for entity exactly at radius boundary', () => {
      expect(isWithinMinimapRadius(500, 0, 0, 0, 500)).toBe(true)
    })

    it('returns false for entity beyond visible radius', () => {
      expect(isWithinMinimapRadius(501, 0, 0, 0, 500)).toBe(false)
    })

    it('handles diagonal distances correctly', () => {
      // Distance = sqrt(300^2 + 400^2) = 500 — exactly at boundary
      expect(isWithinMinimapRadius(300, 400, 0, 0, 500)).toBe(true)
      // Distance = sqrt(301^2 + 400^2) ≈ 500.6 — just beyond
      expect(isWithinMinimapRadius(301, 400, 0, 0, 500)).toBe(false)
    })
  })

  describe('minimapBoundaryEdgePct (Story 24.1)', () => {
    it('shows boundary at 70% when player is 200 units from edge with radius 500', () => {
      // Player at x=1800, area=2000, radius=500 → posEdge = 50 + (200/500)*50 = 70%
      const { posEdge } = minimapBoundaryEdgePct(1800, 2000, 500)
      expect(posEdge).toBe(70)
    })

    it('negative edge is off-screen when player is far from it', () => {
      // Player at x=1800, area=2000, radius=500 → negEdge = 50 + (-3800/500)*50 = -330%
      const { negEdge } = minimapBoundaryEdgePct(1800, 2000, 500)
      expect(negEdge).toBeLessThan(0)
    })

    it('both edges visible when player is at center with small radius', () => {
      // Player at x=0, area=100, radius=200 → posEdge = 50 + (100/200)*50 = 75%, negEdge = 25%
      const { posEdge, negEdge } = minimapBoundaryEdgePct(0, 100, 200)
      expect(posEdge).toBe(75)
      expect(negEdge).toBe(25)
    })
  })

  describe('GAME_CONFIG.MINIMAP_VISIBLE_RADIUS (Story 24.1)', () => {
    it('exists and is a positive number', () => {
      expect(GAME_CONFIG.MINIMAP_VISIBLE_RADIUS).toBeDefined()
      expect(typeof GAME_CONFIG.MINIMAP_VISIBLE_RADIUS).toBe('number')
      expect(GAME_CONFIG.MINIMAP_VISIBLE_RADIUS).toBeGreaterThan(0)
    })
  })

  describe('MINIMAP constants', () => {
    it('exports all required styling keys', () => {
      const requiredKeys = [
        'borderRadius', 'borderColor', 'boxShadow', 'backgroundColor',
        'playerDotColor', 'playerDotSize', 'playerDotGlow',
        'planetDotSize',
        'wormholeBaseSize', 'wormholeActiveSize', 'wormholeColor',
        'wormholeGlowActive', 'wormholeGlowBase',
        'enemyDotSize', 'enemyDotColor',
        'enemyPollInterval',
        'dotTransition',
        'boundaryInset', 'boundaryBorder',
      ]
      for (const key of requiredKeys) {
        expect(MINIMAP).toHaveProperty(key)
        expect(MINIMAP[key]).toBeTruthy()
      }
    })

    it('wormhole active size is larger than base size', () => {
      const base = parseInt(MINIMAP.wormholeBaseSize)
      const active = parseInt(MINIMAP.wormholeActiveSize)
      expect(active).toBeGreaterThan(base)
    })

    it('dot transition includes ease-out timing', () => {
      expect(MINIMAP.dotTransition).toContain('ease-out')
    })

    it('player dot color differs from wormhole color', () => {
      expect(MINIMAP.playerDotColor).not.toBe(MINIMAP.wormholeColor)
    })
  })
})
