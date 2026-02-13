import { describe, it, expect, beforeEach } from 'vitest'
import usePlayer from '../../stores/usePlayer.jsx'
import { DILEMMAS } from '../../entities/dilemmaDefs.js'
import { computeCanEnterSystem } from '../TunnelHub.jsx'

describe('TunnelHub — Dilemma Gate Logic (Story 13.4)', () => {
  beforeEach(() => {
    usePlayer.getState().reset()
  })

  describe('computeCanEnterSystem', () => {
    it('returns false when a dilemma exists and is unresolved', () => {
      expect(computeCanEnterSystem(DILEMMAS.HIGH_RISK, false)).toBe(false)
    })

    it('returns true when a dilemma exists but is resolved', () => {
      expect(computeCanEnterSystem(DILEMMAS.HIGH_RISK, true)).toBe(true)
    })

    it('returns true when no dilemma available (null)', () => {
      expect(computeCanEnterSystem(null, false)).toBe(true)
    })

    it('returns true when no dilemma and resolved (edge case)', () => {
      expect(computeCanEnterSystem(null, true)).toBe(true)
    })
  })

  describe('Store-level dilemma availability', () => {
    it('fresh player has available dilemmas (gate would block)', () => {
      const acceptedDilemmas = usePlayer.getState().acceptedDilemmas
      const available = Object.values(DILEMMAS).filter(
        (d) => !acceptedDilemmas.includes(d.id)
      )
      expect(available.length).toBeGreaterThan(0)
      // With an available dilemma and unresolved state, gate blocks
      expect(computeCanEnterSystem(available[0], false)).toBe(false)
    })

    it('after accepting a dilemma via store, it is removed from available pool', () => {
      const result = usePlayer.getState().acceptDilemma('HIGH_RISK')
      expect(result).toBe(true)
      const acceptedDilemmas = usePlayer.getState().acceptedDilemmas
      expect(acceptedDilemmas).toContain('HIGH_RISK')
      const available = Object.values(DILEMMAS).filter(
        (d) => !acceptedDilemmas.includes(d.id)
      )
      expect(available.find((d) => d.id === 'HIGH_RISK')).toBeUndefined()
    })

    it('when all dilemmas accepted, no dilemma available (gate open by default)', () => {
      const allDilemmaIds = Object.values(DILEMMAS).map((d) => d.id)
      usePlayer.setState({ acceptedDilemmas: allDilemmaIds })
      const available = Object.values(DILEMMAS).filter(
        (d) => !usePlayer.getState().acceptedDilemmas.includes(d.id)
      )
      expect(available.length).toBe(0)
      // currentDilemma would be null → gate open
      expect(computeCanEnterSystem(null, false)).toBe(true)
    })
  })
})
