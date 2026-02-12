import { describe, it, expect } from 'vitest'
import { minimapDotPosition, MINIMAP } from '../HUD.jsx'

describe('Minimap helpers (Story 10.3)', () => {
  describe('minimapDotPosition', () => {
    it('returns 50% for origin (0,0)', () => {
      const pos = minimapDotPosition(0, 0, 1000)
      expect(pos.left).toBe('50%')
      expect(pos.top).toBe('50%')
    })

    it('returns correct percentages for positive position', () => {
      // x=500 in a 1000-area → 50 + (500/1000)*50 = 75%
      const pos = minimapDotPosition(500, 500, 1000)
      expect(pos.left).toBe('75%')
      expect(pos.top).toBe('75%')
    })

    it('returns correct percentages for negative position', () => {
      // x=-500 in a 1000-area → 50 + (-500/1000)*50 = 25%
      const pos = minimapDotPosition(-500, -500, 1000)
      expect(pos.left).toBe('25%')
      expect(pos.top).toBe('25%')
    })

    it('returns extreme percentages for positions at area boundaries', () => {
      // x=1000 in a 1000-area → 50 + (1000/1000)*50 = 100%
      const pos = minimapDotPosition(1000, -1000, 1000)
      expect(pos.left).toBe('100%')
      expect(pos.top).toBe('0%')
    })

    it('returns both left and top keys', () => {
      const pos = minimapDotPosition(0, 0, 500)
      expect(pos).toHaveProperty('left')
      expect(pos).toHaveProperty('top')
    })

    it('scales correctly with different play area sizes', () => {
      // Same world position, different area sizes → different percentages
      const small = minimapDotPosition(100, 100, 200)
      const large = minimapDotPosition(100, 100, 2000)
      // 50 + (100/200)*50 = 75%
      expect(small.left).toBe('75%')
      // 50 + (100/2000)*50 = 52.5%
      expect(large.left).toBe('52.5%')
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
