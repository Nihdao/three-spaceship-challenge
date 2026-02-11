import { describe, it, expect } from 'vitest'
import { TAUNT_MESSAGES } from '../GameOverScreen.jsx'
import { formatTimer } from '../HUD.jsx'

describe('GameOverScreen logic', () => {
  describe('TAUNT_MESSAGES', () => {
    it('contains at least 6 messages', () => {
      expect(TAUNT_MESSAGES.length).toBeGreaterThanOrEqual(6)
    })

    it('all messages are uppercase strings', () => {
      for (const msg of TAUNT_MESSAGES) {
        expect(typeof msg).toBe('string')
        expect(msg).toBe(msg.toUpperCase())
      }
    })

    it('random selection stays within bounds', () => {
      for (let i = 0; i < 100; i++) {
        const idx = Math.floor(Math.random() * TAUNT_MESSAGES.length)
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(TAUNT_MESSAGES.length)
        expect(TAUNT_MESSAGES[idx]).toBeDefined()
      }
    })
  })

  describe('formatTimer reuse for game over stats', () => {
    it('formats systemTimer value (time survived) correctly', () => {
      // systemTimer counts up from 0
      expect(formatTimer(125)).toBe('02:05')
    })

    it('formats 0 seconds as 00:00', () => {
      expect(formatTimer(0)).toBe('00:00')
    })

    it('formats full 10 minutes (600s) as 10:00', () => {
      expect(formatTimer(600)).toBe('10:00')
    })
  })
})
