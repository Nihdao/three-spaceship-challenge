// src/ui/__tests__/MapOverlay.test.jsx
// Story 35.2: Unit tests for worldToMapPct pure helper
// Story 45.2 fix: corrected world edge values to match PLAY_AREA_SIZE=650 (world range: -650..+650)

import { describe, it, expect } from 'vitest'
import { worldToMapPct } from '../MapOverlay.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

const PLAY_AREA_SIZE = GAME_CONFIG.PLAY_AREA_SIZE

describe('worldToMapPct', () => {
  it('maps -PLAY_AREA_SIZE (world left edge) to 0%', () => {
    expect(worldToMapPct(-PLAY_AREA_SIZE)).toBe(0)
  })

  it('maps 0 (world center) to 50%', () => {
    expect(worldToMapPct(0)).toBe(50)
  })

  it('maps +PLAY_AREA_SIZE (world right edge) to 100%', () => {
    expect(worldToMapPct(PLAY_AREA_SIZE)).toBe(100)
  })

  it('maps PLAY_AREA_SIZE/2 to 75%', () => {
    expect(worldToMapPct(PLAY_AREA_SIZE / 2)).toBe(75)
  })

  it('maps -PLAY_AREA_SIZE/2 to 25%', () => {
    expect(worldToMapPct(-PLAY_AREA_SIZE / 2)).toBe(25)
  })
})
