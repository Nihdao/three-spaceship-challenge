import { describe, it, expect, beforeEach } from 'vitest'
import { resetFogGrid, markDiscovered, getDiscoveredCells, FOG_GRID_SIZE, CELL_SIZE } from '../fogSystem.js'

describe('fogSystem (Story 35.1)', () => {
  beforeEach(() => {
    resetFogGrid()
  })

  it('resetFogGrid() produces all-zero Uint8Array of length 3600', () => {
    // Pre-populate something
    markDiscovered(0, 0, 500)
    resetFogGrid()

    const grid = getDiscoveredCells()
    expect(grid).toBeInstanceOf(Uint8Array)
    expect(grid.length).toBe(FOG_GRID_SIZE * FOG_GRID_SIZE)
    expect(grid.length).toBe(3600)
    const allZero = Array.from(grid).every(v => v === 0)
    expect(allZero).toBe(true)
  })

  it('getDiscoveredCells() returns Uint8Array with length FOG_GRID_SIZE * FOG_GRID_SIZE', () => {
    const grid = getDiscoveredCells()
    expect(grid).toBeInstanceOf(Uint8Array)
    expect(grid.length).toBe(FOG_GRID_SIZE * FOG_GRID_SIZE)
  })

  it('markDiscovered(0, 0, 500) marks center cell (index 1830) as 1', () => {
    // World (0,0) → grid center: cx = (0+1000)/CELL_SIZE = 30, cz = 30
    // Center cell index = row 30 * 60 + col 30 = 1830
    markDiscovered(0, 0, 500)
    const grid = getDiscoveredCells()
    expect(grid[30 * FOG_GRID_SIZE + 30]).toBe(1)
  })

  it('markDiscovered(0, 0, 500) leaves corner cells (index 0) as 0 — outside radius', () => {
    // Grid cell (0,0) center is at (0.5, 0.5) in cell units from world corner
    // Distance from grid center (30, 30) ≈ 41.7 cells >> radiusCells ≈ 15
    markDiscovered(0, 0, 500)
    const grid = getDiscoveredCells()
    expect(grid[0]).toBe(0)
    expect(grid[FOG_GRID_SIZE - 1]).toBe(0)
    expect(grid[(FOG_GRID_SIZE - 1) * FOG_GRID_SIZE]).toBe(0)
    expect(grid[FOG_GRID_SIZE * FOG_GRID_SIZE - 1]).toBe(0)
  })

  it('discovery is monotonic — already-marked cells stay 1 after second markDiscovered call', () => {
    markDiscovered(0, 0, 500)
    const centerIdx = 30 * FOG_GRID_SIZE + 30
    expect(getDiscoveredCells()[centerIdx]).toBe(1)

    // Mark a different area (world 500, 500 → far from center)
    markDiscovered(500, 500, 100)

    // Center cell must still be 1
    expect(getDiscoveredCells()[centerIdx]).toBe(1)
  })

  it('markDiscovered(-1000, -1000, 100) marks corner cell (index 0) without crash', () => {
    // World (-1000, -1000) → grid (0, 0)
    // radiusCells = 100/CELL_SIZE ≈ 3, cell (0,0) center at (0.5,0.5) → dist ≈ 0.71 < 3
    expect(() => markDiscovered(-1000, -1000, 100)).not.toThrow()
    const grid = getDiscoveredCells()
    expect(grid[0]).toBe(1)
  })

  it('markDiscovered at world boundary +1000 does not overflow grid', () => {
    // World (999, 999) should clamp to last cell without out-of-bounds
    expect(() => markDiscovered(999, 999, 100)).not.toThrow()
    const grid = getDiscoveredCells()
    // Last cell index = (59)*60 + 59 = 3599
    expect(grid[FOG_GRID_SIZE * FOG_GRID_SIZE - 1]).toBe(1)
  })

  it('markDiscovered with radius=0 marks no cells and does not throw', () => {
    expect(() => markDiscovered(0, 0, 0)).not.toThrow()
    const grid = getDiscoveredCells()
    const anyMarked = Array.from(grid).some(v => v === 1)
    expect(anyMarked).toBe(false)
  })

  it('exported constants have correct values', () => {
    expect(FOG_GRID_SIZE).toBe(60)
    // CELL_SIZE = 2000 / 60
    expect(CELL_SIZE).toBeCloseTo(2000 / 60, 5)
  })
})
