import { describe, it, expect, beforeEach, vi } from 'vitest'
import { selectRandomGameplayMusic, getCurrentGameplayTrack } from '../audioManager.js'

describe('selectRandomGameplayMusic', () => {
  const mockTracks = [
    'audio/music/Creo - Rock Thing.mp3',
    'audio/music/Guifrog - Frog Punch.mp3',
    'audio/music/Michett - Snackmix.mp3',
  ]

  beforeEach(() => {
    // Reset Math.random mock if any
    vi.restoreAllMocks()
  })

  it('should return one of the provided tracks', () => {
    const result = selectRandomGameplayMusic(mockTracks)
    expect(mockTracks).toContain(result)
  })

  it('should store the selected track in currentGameplayTrack', () => {
    const result = selectRandomGameplayMusic(mockTracks)
    expect(getCurrentGameplayTrack()).toBe(result)
  })

  it('should return null for non-array input', () => {
    const result = selectRandomGameplayMusic('not-an-array')
    expect(result).toBeNull()
  })

  it('should return null for null input', () => {
    const result = selectRandomGameplayMusic(null)
    expect(result).toBeNull()
  })

  it('should return null for undefined input', () => {
    const result = selectRandomGameplayMusic(undefined)
    expect(result).toBeNull()
  })

  it('should return null for empty array', () => {
    const result = selectRandomGameplayMusic([])
    expect(result).toBeNull()
  })

  it('should work with single-element array', () => {
    const singleTrack = ['audio/music/only-track.mp3']
    const result = selectRandomGameplayMusic(singleTrack)
    expect(result).toBe('audio/music/only-track.mp3')
  })

  it('should select first track when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = selectRandomGameplayMusic(mockTracks)
    expect(result).toBe(mockTracks[0])
  })

  it('should select last track when Math.random returns 0.999', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const result = selectRandomGameplayMusic(mockTracks)
    expect(result).toBe(mockTracks[2])
  })

  it('should select middle track when Math.random returns 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = selectRandomGameplayMusic(mockTracks)
    expect(result).toBe(mockTracks[1])
  })

  it('should have roughly uniform distribution over many calls', () => {
    const callCount = 3000
    const distribution = { 0: 0, 1: 0, 2: 0 }

    for (let i = 0; i < callCount; i++) {
      const result = selectRandomGameplayMusic(mockTracks)
      const index = mockTracks.indexOf(result)
      distribution[index]++
    }

    // Each track should be selected roughly 1/3 of the time (±15% tolerance)
    const expectedCount = callCount / 3
    const tolerance = expectedCount * 0.15

    expect(distribution[0]).toBeGreaterThan(expectedCount - tolerance)
    expect(distribution[0]).toBeLessThan(expectedCount + tolerance)
    expect(distribution[1]).toBeGreaterThan(expectedCount - tolerance)
    expect(distribution[1]).toBeLessThan(expectedCount + tolerance)
    expect(distribution[2]).toBeGreaterThan(expectedCount - tolerance)
    expect(distribution[2]).toBeLessThan(expectedCount + tolerance)
  })

  it('should log warning for non-array input', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    selectRandomGameplayMusic('invalid')
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'selectRandomGameplayMusic: tracks must be an array, got',
      'string'
    )
    consoleWarnSpy.mockRestore()
  })

  it('should log warning for empty array', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    selectRandomGameplayMusic([])
    expect(consoleWarnSpy).toHaveBeenCalledWith('selectRandomGameplayMusic: tracks array is empty')
    consoleWarnSpy.mockRestore()
  })
})
