import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'

const MOCK_POOL = ['IRON REACH', 'DEAD ORBIT', 'VOID CORONA', 'BURNING FRONT']

describe('useLevel — initializeSystemName (Story 34.3)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  it('initial state: currentSystemName is null', () => {
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('initial state: usedSystemNames is empty array', () => {
    expect(useLevel.getState().usedSystemNames).toEqual([])
  })

  it('sets currentSystemName to a name from pool', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const name = useLevel.getState().currentSystemName
    expect(MOCK_POOL).toContain(name)
  })

  it('adds chosen name to usedSystemNames', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const name = useLevel.getState().currentSystemName
    expect(useLevel.getState().usedSystemNames).toContain(name)
  })

  it('4 successive calls with a 4-name pool yield 4 unique names', () => {
    const usedNames = new Set()
    for (let i = 0; i < MOCK_POOL.length; i++) {
      useLevel.getState().initializeSystemName(MOCK_POOL)
      usedNames.add(useLevel.getState().currentSystemName)
    }
    expect(usedNames.size).toBe(MOCK_POOL.length)
  })

  it('wrap-around: 5th call after pool exhausted still returns a valid name', () => {
    for (let i = 0; i < MOCK_POOL.length; i++) {
      useLevel.getState().initializeSystemName(MOCK_POOL)
    }
    // 5th call — pool exhausted, should wrap around
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const name = useLevel.getState().currentSystemName
    expect(MOCK_POOL).toContain(name)
  })

  it('wrap-around: usedSystemNames resets to [name] so deduplication resumes after cycle', () => {
    for (let i = 0; i < MOCK_POOL.length; i++) {
      useLevel.getState().initializeSystemName(MOCK_POOL)
    }
    // 5th call — wrap-around: usedSystemNames should be reset to [newName], not grow indefinitely
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const name = useLevel.getState().currentSystemName
    expect(useLevel.getState().usedSystemNames).toEqual([name])
  })

  it('reset() clears currentSystemName to null', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    expect(useLevel.getState().currentSystemName).not.toBeNull()
    useLevel.getState().reset()
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('reset() clears usedSystemNames to empty array', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    expect(useLevel.getState().usedSystemNames.length).toBeGreaterThan(0)
    useLevel.getState().reset()
    expect(useLevel.getState().usedSystemNames).toEqual([])
  })

  it('no-op when pool is empty array', () => {
    useLevel.getState().initializeSystemName([])
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('no-op when pool is null', () => {
    useLevel.getState().initializeSystemName(null)
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('no-op when pool is undefined', () => {
    useLevel.getState().initializeSystemName(undefined)
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('advanceSystem() does NOT clear usedSystemNames (per-run persistence)', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const usedBefore = [...useLevel.getState().usedSystemNames]
    expect(usedBefore.length).toBe(1)
    useLevel.getState().advanceSystem()
    expect(useLevel.getState().usedSystemNames).toEqual(usedBefore)
  })

  it('currentSystemName persists after advanceSystem() (until next initializeSystemName call)', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const nameBefore = useLevel.getState().currentSystemName
    useLevel.getState().advanceSystem()
    expect(useLevel.getState().currentSystemName).toBe(nameBefore)
  })
})
