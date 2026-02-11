import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../usePlayer.jsx'
import { SHIPS, getDefaultShipId } from '../../entities/shipDefs.js'
import { GAME_CONFIG } from '../../config/gameConfig.js'

const FORWARD_INPUT = { moveForward: true, moveBackward: false, moveLeft: false, moveRight: false, dash: false }
const NO_INPUT = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, dash: false }

describe('usePlayer — ship stats integration (Story 9.3)', () => {
  beforeEach(() => {
    usePlayer.getState().setCurrentShipId(getDefaultShipId())
    usePlayer.getState().reset()
  })

  // --- Task 1: Verify reset() initializes all ship stats ---
  describe('Task 1: reset() ship stat initialization', () => {
    it('initializes HP from BALANCED ship', () => {
      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      const s = usePlayer.getState()
      expect(s.currentHP).toBe(SHIPS.BALANCED.baseHP)
      expect(s.maxHP).toBe(SHIPS.BALANCED.baseHP)
    })

    it('initializes HP from GLASS_CANNON ship', () => {
      usePlayer.getState().setCurrentShipId('GLASS_CANNON')
      usePlayer.getState().reset()
      const s = usePlayer.getState()
      expect(s.currentHP).toBe(SHIPS.GLASS_CANNON.baseHP)
      expect(s.maxHP).toBe(SHIPS.GLASS_CANNON.baseHP)
    })

    it('initializes HP from TANK ship', () => {
      usePlayer.getState().setCurrentShipId('TANK')
      usePlayer.getState().reset()
      const s = usePlayer.getState()
      expect(s.currentHP).toBe(SHIPS.TANK.baseHP)
      expect(s.maxHP).toBe(SHIPS.TANK.baseHP)
    })

    it('stores shipBaseSpeed from ship definition', () => {
      for (const [id, ship] of Object.entries(SHIPS)) {
        usePlayer.getState().setCurrentShipId(id)
        usePlayer.getState().reset()
        expect(usePlayer.getState().shipBaseSpeed).toBe(ship.baseSpeed)
      }
    })

    it('stores shipBaseDamageMultiplier from ship definition', () => {
      for (const [id, ship] of Object.entries(SHIPS)) {
        usePlayer.getState().setCurrentShipId(id)
        usePlayer.getState().reset()
        expect(usePlayer.getState().shipBaseDamageMultiplier).toBe(ship.baseDamageMultiplier)
      }
    })

    it('falls back to default ship when currentShipId is invalid', () => {
      // Force invalid shipId by directly setting state
      usePlayer.setState({ currentShipId: 'NONEXISTENT' })
      usePlayer.getState().reset()
      const s = usePlayer.getState()
      const fallback = SHIPS[getDefaultShipId()]
      expect(s.currentHP).toBe(fallback.baseHP)
      expect(s.maxHP).toBe(fallback.baseHP)
    })
  })

  // --- Task 3: baseSpeed affects player movement ---
  describe('Task 3: baseSpeed integration with movement', () => {
    it('GLASS_CANNON moves faster than BALANCED with same input', () => {
      // BALANCED run
      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      usePlayer.getState().tick(0.1, FORWARD_INPUT, 1)
      const balancedVz = Math.abs(usePlayer.getState().velocity[2])

      // GLASS_CANNON run
      usePlayer.getState().setCurrentShipId('GLASS_CANNON')
      usePlayer.getState().reset()
      usePlayer.getState().tick(0.1, FORWARD_INPUT, 1)
      const cannonVz = Math.abs(usePlayer.getState().velocity[2])

      expect(cannonVz).toBeGreaterThan(balancedVz)
    })

    it('TANK moves slower than BALANCED with same input', () => {
      // BALANCED run
      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      usePlayer.getState().tick(0.1, FORWARD_INPUT, 1)
      const balancedVz = Math.abs(usePlayer.getState().velocity[2])

      // TANK run
      usePlayer.getState().setCurrentShipId('TANK')
      usePlayer.getState().reset()
      usePlayer.getState().tick(0.1, FORWARD_INPUT, 1)
      const tankVz = Math.abs(usePlayer.getState().velocity[2])

      expect(tankVz).toBeLessThan(balancedVz)
    })

    it('speed differences are proportional to ship baseSpeed values after convergence', () => {
      const results = {}
      for (const [id, ship] of Object.entries(SHIPS)) {
        usePlayer.getState().setCurrentShipId(id)
        usePlayer.getState().reset()
        // Run enough ticks for velocity to converge to effective speed
        for (let i = 0; i < 60; i++) {
          usePlayer.getState().tick(0.016, FORWARD_INPUT, 1)
        }
        results[id] = Math.abs(usePlayer.getState().velocity[2])
      }

      // At convergence, velocity ratios should match ship baseSpeed ratios
      const balancedSpeed = SHIPS.BALANCED.baseSpeed
      for (const [id, ship] of Object.entries(SHIPS)) {
        if (id === 'BALANCED') continue
        const expectedRatio = ship.baseSpeed / balancedSpeed
        const actualRatio = results[id] / results.BALANCED
        expect(actualRatio).toBeCloseTo(expectedRatio, 1)
      }
    })
  })

  // --- Task 5: Multi-run state isolation ---
  describe('Task 5: multi-run state isolation', () => {
    it('switching ships between runs gives correct HP', () => {
      // Run 1: BALANCED
      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      expect(usePlayer.getState().currentHP).toBe(SHIPS.BALANCED.baseHP)

      // Simulate damage during run
      usePlayer.getState().takeDamage(30)

      // Run 2: GLASS_CANNON
      usePlayer.getState().setCurrentShipId('GLASS_CANNON')
      usePlayer.getState().reset()
      expect(usePlayer.getState().currentHP).toBe(SHIPS.GLASS_CANNON.baseHP)
      expect(usePlayer.getState().maxHP).toBe(SHIPS.GLASS_CANNON.baseHP)
    })

    it('switching ships between runs gives correct speed stats', () => {
      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      expect(usePlayer.getState().shipBaseSpeed).toBe(SHIPS.BALANCED.baseSpeed)

      usePlayer.getState().setCurrentShipId('TANK')
      usePlayer.getState().reset()
      expect(usePlayer.getState().shipBaseSpeed).toBe(SHIPS.TANK.baseSpeed)
    })

    it('XP, level, fragments all reset between runs', () => {
      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      usePlayer.getState().addXP(500)
      usePlayer.getState().addFragments(100)

      usePlayer.getState().setCurrentShipId('GLASS_CANNON')
      usePlayer.getState().reset()
      const s = usePlayer.getState()
      expect(s.currentXP).toBe(0)
      expect(s.currentLevel).toBe(1)
      expect(s.fragments).toBe(0)
    })

    it('rapid cycling: BALANCED → GLASS_CANNON → BALANCED produces consistent state', () => {
      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      const first = usePlayer.getState().currentHP

      usePlayer.getState().setCurrentShipId('GLASS_CANNON')
      usePlayer.getState().reset()

      usePlayer.getState().setCurrentShipId('BALANCED')
      usePlayer.getState().reset()
      expect(usePlayer.getState().currentHP).toBe(first)
      expect(usePlayer.getState().shipBaseSpeed).toBe(SHIPS.BALANCED.baseSpeed)
      expect(usePlayer.getState().shipBaseDamageMultiplier).toBe(SHIPS.BALANCED.baseDamageMultiplier)
    })
  })

  // --- Task 6: Ship selection persistence within a run ---
  describe('Task 6: ship selection persistence within a run', () => {
    it('currentShipId does not change during tick()', () => {
      usePlayer.getState().setCurrentShipId('GLASS_CANNON')
      usePlayer.getState().reset()

      // Simulate several ticks
      for (let i = 0; i < 10; i++) {
        usePlayer.getState().tick(0.016, FORWARD_INPUT, 1)
      }
      expect(usePlayer.getState().currentShipId).toBe('GLASS_CANNON')
    })

    it('shipBaseSpeed and shipBaseDamageMultiplier persist across ticks', () => {
      usePlayer.getState().setCurrentShipId('TANK')
      usePlayer.getState().reset()

      for (let i = 0; i < 10; i++) {
        usePlayer.getState().tick(0.016, FORWARD_INPUT, 1)
      }
      expect(usePlayer.getState().shipBaseSpeed).toBe(SHIPS.TANK.baseSpeed)
      expect(usePlayer.getState().shipBaseDamageMultiplier).toBe(SHIPS.TANK.baseDamageMultiplier)
    })
  })

  // --- Task 8: Edge cases ---
  describe('Task 8: edge cases', () => {
    it('reset with invalid shipId falls back gracefully', () => {
      usePlayer.setState({ currentShipId: 'DOES_NOT_EXIST' })
      usePlayer.getState().reset()
      const s = usePlayer.getState()
      const fallback = SHIPS[getDefaultShipId()]
      expect(s.currentHP).toBe(fallback.baseHP)
      expect(s.shipBaseSpeed).toBe(fallback.baseSpeed)
      expect(s.shipBaseDamageMultiplier).toBe(fallback.baseDamageMultiplier)
    })
  })
})
