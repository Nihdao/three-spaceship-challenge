// src/systems/fogSystem.js
// Story 35.1: Fog-of-war grid tracking explored areas

import { GAME_CONFIG } from '../config/gameConfig.js'

const FOG_GRID_SIZE = 60
const WORLD_SIZE = GAME_CONFIG.PLAY_AREA_SIZE * 2  // 2 × PLAY_AREA_SIZE
const CELL_SIZE = WORLD_SIZE / FOG_GRID_SIZE        // world units per cell

// Pre-allocated flat grid — 0 = hidden, 1 = discovered
// Uint8Array avoids float boxing, zero GC pressure on markDiscovered
const _grid = new Uint8Array(FOG_GRID_SIZE * FOG_GRID_SIZE)

export function resetFogGrid() {
  _grid.fill(0)
}

export function isPosDiscovered(wx, wz) {
  const col = Math.floor((wx + WORLD_SIZE / 2) / CELL_SIZE)
  const row = Math.floor((wz + WORLD_SIZE / 2) / CELL_SIZE)
  if (col < 0 || col >= FOG_GRID_SIZE || row < 0 || row >= FOG_GRID_SIZE) return false
  return _grid[row * FOG_GRID_SIZE + col] === 1
}

export function markDiscovered(wx, wz, radius) {
  // Convert world center to grid cell-space (float)
  // World -PLAY_AREA_SIZE → cell 0, world +PLAY_AREA_SIZE → cell FOG_GRID_SIZE
  const cx = (wx + WORLD_SIZE / 2) / CELL_SIZE   // center X in cell units
  const cz = (wz + WORLD_SIZE / 2) / CELL_SIZE   // center Z in cell units
  const radiusCells = radius / CELL_SIZE

  const minCol = Math.max(0, Math.floor(cx - radiusCells))
  const maxCol = Math.min(FOG_GRID_SIZE - 1, Math.ceil(cx + radiusCells))
  const minRow = Math.max(0, Math.floor(cz - radiusCells))
  const maxRow = Math.min(FOG_GRID_SIZE - 1, Math.ceil(cz + radiusCells))

  const r2 = radiusCells * radiusCells
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      // Use cell center (col + 0.5, row + 0.5) for accurate circle test
      const dcol = col + 0.5 - cx
      const drow = row + 0.5 - cz
      if (dcol * dcol + drow * drow <= r2) {
        _grid[row * FOG_GRID_SIZE + col] = 1
      }
    }
  }
}

export function getDiscoveredCells() {
  // Returns direct Uint8Array reference for zero-GC canvas rendering (Story 35.2).
  // CONTRACT: caller must read-only. Writing any cell corrupts fog state permanently
  // until next resetFogGrid(). Never assign: cells[i] = 0.
  return _grid
}

export { FOG_GRID_SIZE, CELL_SIZE }
