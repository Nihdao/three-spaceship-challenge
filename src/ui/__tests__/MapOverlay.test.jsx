// src/ui/__tests__/MapOverlay.test.jsx
// Story 35.2: Unit tests for worldToMapPct pure helper
// Story 45.2 fix: corrected world edge values to match PLAY_AREA_SIZE=1000 (world range: -1000..+1000)

import { describe, it, expect } from 'vitest'
import { worldToMapPct } from '../MapOverlay.jsx'

describe('worldToMapPct', () => {
  it('maps -1000 (world left edge) to 0%', () => {
    expect(worldToMapPct(-1000)).toBe(0)
  })

  it('maps 0 (world center) to 50%', () => {
    expect(worldToMapPct(0)).toBe(50)
  })

  it('maps 1000 (world right edge) to 100%', () => {
    expect(worldToMapPct(1000)).toBe(100)
  })

  it('maps 500 to 75%', () => {
    expect(worldToMapPct(500)).toBe(75)
  })

  it('maps -500 to 25%', () => {
    expect(worldToMapPct(-500)).toBe(25)
  })
})
