import { describe, it, expect } from 'vitest'
import { COMPANION, DIALOGUE_EVENTS, getRandomLine } from '../companionDefs.js'

const PRODUCTION_EVENT_KEYS = [
  'system-arrival-1',
  'system-arrival-2',
  'system-arrival-3',
  'planet-radar',
  'wormhole-spawn',
  'boss-spawn',
  'low-hp-warning',
  'boss-defeat',
]

describe('companionDefs — COMPANION identity (Story 30.4)', () => {
  it('has name ARIA', () => {
    expect(COMPANION.name).toBe('ARIA')
  })

  it('has icon emoji', () => {
    expect(typeof COMPANION.icon).toBe('string')
    expect(COMPANION.icon.length).toBeGreaterThan(0)
  })
})

describe('companionDefs — DIALOGUE_EVENTS catalogue (Story 30.4)', () => {
  it('contains all 8 required production event keys', () => {
    for (const key of PRODUCTION_EVENT_KEYS) {
      expect(DIALOGUE_EVENTS, `Missing event key: "${key}"`).toHaveProperty(key)
    }
  })

  it('retains test-hello dev entry', () => {
    expect(DIALOGUE_EVENTS).toHaveProperty('test-hello')
  })

  it.each(PRODUCTION_EVENT_KEYS)('%s — has exactly 3 lines', (key) => {
    expect(DIALOGUE_EVENTS[key]).toHaveLength(3)
  })

  it.each(PRODUCTION_EVENT_KEYS)('%s — each line has string `line` and positive `duration`', (key) => {
    for (const entry of DIALOGUE_EVENTS[key]) {
      expect(typeof entry.line, `${key}: line must be a string`).toBe('string')
      expect(entry.line.length, `${key}: line must not be empty`).toBeGreaterThan(0)
      expect(typeof entry.duration, `${key}: duration must be a number`).toBe('number')
      expect(entry.duration, `${key}: duration must be positive`).toBeGreaterThan(0)
    }
  })

  it.each(PRODUCTION_EVENT_KEYS)('%s — no inline priority field', (key) => {
    for (const entry of DIALOGUE_EVENTS[key]) {
      expect(entry).not.toHaveProperty('priority')
    }
  })

  it('boss-spawn entries have duration >= 4', () => {
    for (const entry of DIALOGUE_EVENTS['boss-spawn']) {
      expect(entry.duration).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('companionDefs — getRandomLine (Story 30.4)', () => {
  it('returns null for unknown key', () => {
    expect(getRandomLine('nonexistent-event')).toBeNull()
  })

  it.each(PRODUCTION_EVENT_KEYS)('%s — returns a valid line object', (key) => {
    const result = getRandomLine(key)
    expect(result).not.toBeNull()
    expect(typeof result.line).toBe('string')
    expect(typeof result.duration).toBe('number')
  })

  it('returns one of the defined lines (not always the same index)', () => {
    const key = 'system-arrival-1'
    const lines = DIALOGUE_EVENTS[key].map((e) => e.line)
    const results = new Set()
    for (let i = 0; i < 50; i++) {
      results.add(getRandomLine(key).line)
    }
    // With 3 lines and 50 draws, all 3 should appear
    for (const line of lines) {
      expect(results).toContain(line)
    }
  })
})
