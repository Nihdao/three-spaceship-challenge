import { describe, it, expect, beforeEach } from 'vitest'
import useCompanion from '../useCompanion.jsx'

// companionDefs exports DIALOGUE_EVENTS with 'test-hello' (6 lines) from story 30.1
// All tests use 'test-hello' as a known-valid event key

beforeEach(() => {
  useCompanion.getState().reset()
})

describe('useCompanion — initial state', () => {
  it('starts with no current dialogue and empty queue', () => {
    const { current, queue } = useCompanion.getState()
    expect(current).toBeNull()
    expect(queue).toEqual([])
  })

  it('starts with empty shownEvents', () => {
    expect(useCompanion.getState().hasShown('test-hello')).toBe(false)
  })
})

describe('useCompanion — trigger()', () => {
  it('sets current when no dialogue active', () => {
    useCompanion.getState().trigger('test-hello')
    const { current } = useCompanion.getState()
    expect(current).not.toBeNull()
    expect(typeof current.line).toBe('string')
    expect(typeof current.duration).toBe('number')
  })

  it('queues a second normal-priority dialogue', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    const { queue } = useCompanion.getState()
    expect(queue).toHaveLength(1)
  })

  it('silently drops when queue is full (cap = 2 in queue)', () => {
    // trigger 1 → current; trigger 2 → queue[0]; trigger 3 → queue[1]; trigger 4 → dropped
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    const { queue } = useCompanion.getState()
    expect(queue).toHaveLength(2) // queue capped at 2
  })

  it('high-priority immediately replaces current and clears queue', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    const firstLine = useCompanion.getState().current.line

    useCompanion.getState().trigger('test-hello', 'high')
    const { current, queue } = useCompanion.getState()
    expect(queue).toHaveLength(0)
    // The new entry has a fresh id
    expect(current).not.toBeNull()
  })

  it('returns without setting current for unknown event key', () => {
    useCompanion.getState().trigger('unknown-event')
    expect(useCompanion.getState().current).toBeNull()
  })
})

describe('useCompanion — dismiss()', () => {
  it('clears current when queue is empty', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().dismiss()
    expect(useCompanion.getState().current).toBeNull()
  })

  it('advances queue to current on dismiss', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    expect(useCompanion.getState().queue).toHaveLength(1)
    useCompanion.getState().dismiss()
    expect(useCompanion.getState().current).not.toBeNull()
    expect(useCompanion.getState().queue).toHaveLength(0)
  })
})

describe('useCompanion — markShown() / hasShown()', () => {
  it('returns false before marking', () => {
    expect(useCompanion.getState().hasShown('planet-radar')).toBe(false)
  })

  it('returns true after marking', () => {
    useCompanion.getState().markShown('planet-radar')
    expect(useCompanion.getState().hasShown('planet-radar')).toBe(true)
  })

  it('tracks multiple event keys independently', () => {
    useCompanion.getState().markShown('planet-radar')
    expect(useCompanion.getState().hasShown('planet-radar')).toBe(true)
    expect(useCompanion.getState().hasShown('low-hp-warning')).toBe(false)
  })
})

describe('useCompanion — clearQueue() (between-system reset)', () => {
  it('clears active dialogue', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().clearQueue()
    expect(useCompanion.getState().current).toBeNull()
  })

  it('clears queue', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().clearQueue()
    expect(useCompanion.getState().queue).toHaveLength(0)
  })

  it('PRESERVES shownEvents — planet-radar one-shot survives system transition', () => {
    useCompanion.getState().markShown('planet-radar')
    useCompanion.getState().markShown('low-hp-warning')
    useCompanion.getState().markShown('near-wormhole-threshold')

    // Simulate between-system reset (GameLoop line 131)
    useCompanion.getState().clearQueue()

    expect(useCompanion.getState().hasShown('planet-radar')).toBe(true)
    expect(useCompanion.getState().hasShown('low-hp-warning')).toBe(true)
    expect(useCompanion.getState().hasShown('near-wormhole-threshold')).toBe(true)
  })
})

describe('useCompanion — near-wormhole-threshold one-shot (Story 37.2, AC #5)', () => {
  it('fires once when guard passes, then blocks on subsequent attempts', () => {
    // First occurrence: hasShown is false → guard passes, event fires
    if (!useCompanion.getState().hasShown('near-wormhole-threshold')) {
      useCompanion.getState().trigger('near-wormhole-threshold')
      useCompanion.getState().markShown('near-wormhole-threshold')
    }
    expect(useCompanion.getState().current).not.toBeNull()
    expect(useCompanion.getState().hasShown('near-wormhole-threshold')).toBe(true)

    // Second attempt (e.g. re-entering threshold condition): guard blocks
    useCompanion.getState().dismiss()
    if (!useCompanion.getState().hasShown('near-wormhole-threshold')) {
      useCompanion.getState().trigger('near-wormhole-threshold')
      useCompanion.getState().markShown('near-wormhole-threshold')
    }
    expect(useCompanion.getState().current).toBeNull()
  })

  it('survives system transition — guard still holds in systems 2 and 3', () => {
    // Fired in system 1
    useCompanion.getState().trigger('near-wormhole-threshold')
    useCompanion.getState().markShown('near-wormhole-threshold')

    // System transition (GameLoop clearQueue — preserves shownEvents)
    useCompanion.getState().clearQueue()

    // Still marked in system 2
    expect(useCompanion.getState().hasShown('near-wormhole-threshold')).toBe(true)
  })

  it('resets on new run — fires again in the next run', () => {
    useCompanion.getState().trigger('near-wormhole-threshold')
    useCompanion.getState().markShown('near-wormhole-threshold')

    // New run (GameLoop reset — clears shownEvents)
    useCompanion.getState().reset()

    expect(useCompanion.getState().hasShown('near-wormhole-threshold')).toBe(false)
  })
})

describe('useCompanion — reset() (new game run)', () => {
  it('clears active dialogue', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().reset()
    expect(useCompanion.getState().current).toBeNull()
  })

  it('clears queue', () => {
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().trigger('test-hello')
    useCompanion.getState().reset()
    expect(useCompanion.getState().queue).toHaveLength(0)
  })

  it('CLEARS shownEvents — one-shots reset for new run', () => {
    useCompanion.getState().markShown('planet-radar')
    useCompanion.getState().markShown('low-hp-warning')
    useCompanion.getState().markShown('near-wormhole-threshold')

    // Simulate full game restart (GameLoop line 155)
    useCompanion.getState().reset()

    expect(useCompanion.getState().hasShown('planet-radar')).toBe(false)
    expect(useCompanion.getState().hasShown('low-hp-warning')).toBe(false)
    expect(useCompanion.getState().hasShown('near-wormhole-threshold')).toBe(false)
  })
})
