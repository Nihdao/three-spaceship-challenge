# Story 35.1: Fog of War Exploration Module

Status: done

## Story

As a player,
I want the large map to only reveal areas I have visited,
So that exploration feels meaningful and progressive.

## Acceptance Criteria

1. **Given** `src/systems/fogSystem.js` (new module) **When** imported **Then** it exports: `resetFogGrid()`, `markDiscovered(playerX, playerZ, radius)`, `getDiscoveredCells()`, `FOG_GRID_SIZE` (const = 60), `CELL_SIZE` (const ≈ 66.7).

2. **Given** a 60×60 grid over a 4000×4000 world **When** `markDiscovered(x, z, radius)` is called **Then** all grid cells whose center falls within `radius` of `(x, z)` are marked as discovered (value `1`), and cells are never un-marked (monotonic discovery, values only go 0→1).

3. **Given** GameLoop during gameplay **When** executing (every 10 frames — frame counter mod 10) **Then** `markDiscovered(playerX, playerZ, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)` is called, **And** the fog update does NOT happen during boss phase (`bossActive === true`).

4. **Given** system transition (tunnel → new system) **When** GameLoop detects `prevPhaseRef.current === 'tunnel'` and enters gameplay **Then** `resetFogGrid()` is called (new system = fresh exploration).

5. **Given** a new game start **When** the full reset block fires in GameLoop (prevPhase not in gameplay/levelUp/planetReward/tunnel/systemEntry/revive) **Then** `resetFogGrid()` is called as part of the full system reset sequence.

## Tasks / Subtasks

- [x] Task 1: Create `src/systems/fogSystem.js` (AC: 1, 2)
  - [x] Subtask 1.1: Define constants: `FOG_GRID_SIZE = 60`, `WORLD_SIZE = 4000`, `CELL_SIZE = WORLD_SIZE / FOG_GRID_SIZE`
  - [x] Subtask 1.2: Allocate module-level `const _grid = new Uint8Array(FOG_GRID_SIZE * FOG_GRID_SIZE)` (pre-allocated, zero GC)
  - [x] Subtask 1.3: Implement `resetFogGrid()` — `_grid.fill(0)`
  - [x] Subtask 1.4: Implement `markDiscovered(wx, wz, radius)` per the algorithm in Dev Notes
  - [x] Subtask 1.5: Implement `getDiscoveredCells()` — returns `_grid` reference (read-only by convention)
  - [x] Subtask 1.6: Export `{ resetFogGrid, markDiscovered, getDiscoveredCells, FOG_GRID_SIZE, CELL_SIZE }`

- [x] Task 2: Integrate into `src/GameLoop.jsx` (AC: 3, 4, 5)
  - [x] Subtask 2.1: Add import `{ resetFogGrid, markDiscovered }` from `./systems/fogSystem.js` at the top of the file (with other system imports)
  - [x] Subtask 2.2: Add `const fogFrameCountRef = useRef(0)` alongside other refs (before `useFrame`)
  - [x] Subtask 2.3: In the `tunnel → gameplay` transition block (~line 107-142), add `resetFogGrid()` call alongside `resetParticles()` / `resetLoot()`
  - [x] Subtask 2.4: In the full game reset block (~line 145-164), add `resetFogGrid()` call alongside `resetParticles()` / `resetLoot()`
  - [x] Subtask 2.5: After section 7g (planet scanning, ~line 753), add the frame-throttled fog update (see Dev Notes)

- [x] Task 3: Write unit tests for fogSystem.js (AC: 1, 2)
  - **Note (AC 3/4/5):** GameLoop integration ACs have no automated test coverage — no `useFrame` test infrastructure exists project-wide. Verified by code inspection: `resetFogGrid()` present at GameLoop lines 152 (tunnel→gameplay) and 183 (full reset); fog throttle at lines 870–872 with `!bossActive` guard.
  - [x] Test `resetFogGrid()` produces all-zero Uint8Array(3600)
  - [x] Test `markDiscovered(0, 0, 500)` marks cells near center (index 30*60+30 = 1830 must be 1)
  - [x] Test cells outside radius remain 0
  - [x] Test monotonic: `markDiscovered` then `markDiscovered` at different position — prior marked cells stay 1
  - [x] Test `getDiscoveredCells()` returns Uint8Array with length `FOG_GRID_SIZE * FOG_GRID_SIZE`
  - [x] Test boundary: `markDiscovered(-2000, -2000, 100)` marks corner cells without overflow/crash

## Dev Notes

### Module Architecture — CRITICAL

`fogSystem.js` is a **pure JS module singleton** — the same pattern as `xpOrbSystem.js`, `particleSystem.js`, `lootSystem.js`. **NO Zustand, NO React, NO store imports.** Module-level mutable state, exported pure functions. This is deliberate: the fog grid is read by Story 35.2 (MapOverlay canvas renderer) via direct import, not via Zustand subscription.

### fogSystem.js — Complete Reference Implementation

```js
// src/systems/fogSystem.js
// Story 35.1: Fog-of-war grid tracking explored areas

const FOG_GRID_SIZE = 60
const WORLD_SIZE = 4000          // 2 × GAME_CONFIG.PLAY_AREA_SIZE (2000)
const CELL_SIZE = WORLD_SIZE / FOG_GRID_SIZE  // ≈ 66.67 world units per cell

// Pre-allocated flat grid — 0 = hidden, 1 = discovered
// Uint8Array avoids float boxing, zero GC pressure on markDiscovered
const _grid = new Uint8Array(FOG_GRID_SIZE * FOG_GRID_SIZE)

export function resetFogGrid() {
  _grid.fill(0)
}

export function markDiscovered(wx, wz, radius) {
  // Convert world center to grid cell-space (float)
  // World -2000 → cell 0, world +2000 → cell 60
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
  return _grid   // direct reference — caller must NOT mutate
}

export { FOG_GRID_SIZE, CELL_SIZE }
```

**Performance note:** With `radius = 500` and `CELL_SIZE ≈ 66.7`, `radiusCells ≈ 7.5`. The bounding box is at most 16×16 = 256 cells, only iterated every 10 frames. Effective cost ≈ 25 cell writes/frame. Negligible.

### GameLoop.jsx Integration — Exact Positions

**1. Import** — add with the other system imports (around line 21-29):
```js
import { resetFogGrid, markDiscovered as markFogDiscovered } from './systems/fogSystem.js'
// ⚠️ Alias required: useArmory.getState().markDiscovered already exists in GameLoop scope.
// Do NOT import as bare `markDiscovered` — it shadows the armory action silently.
```

**2. Ref** — add alongside `prevPhaseRef`, `trailEmitAccRef` etc. (around line 88-96):
```js
const fogFrameCountRef = useRef(0)   // Story 35.1: frame throttle for fog update
```

**3. Tunnel → gameplay transition block** (~line 107, inside `if (phase === 'gameplay' || ...) && prevPhaseRef.current === 'tunnel')`)
Add **alongside** `resetParticles()` and `resetLoot()`:
```js
resetFogGrid()                     // Story 35.1: new system = fresh exploration
```

**4. Full game reset block** (~line 145, inside the `prevPhase not in [gameplay/levelUp/...]` condition)
Add **alongside** `resetParticles()` and `resetLoot()`:
```js
resetFogGrid()                     // Story 35.1: new run = fresh exploration
```

**5. Fog frame update** — add after section 7g (planet scanning tick, after line ~753), before section 8 (XP/orbs):
```js
// Story 35.1: Fog of war — mark player's visited area every 10 frames
// Skipped during boss phase to avoid marking unchecked boss arena zones
fogFrameCountRef.current++
if (fogFrameCountRef.current % 10 === 0 && !bossActive) {
  markFogDiscovered(playerPos[0], playerPos[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)
}
```

**Why after section 7g?** Both `bossActive` (defined at line 283) and `playerPos` (defined at line 252) are in scope. Section 7g is the last "player-world interaction" section before XP processing, making it a natural grouping.

### Variables Already in Scope at Integration Point

| Variable | Defined at | Value |
|---|---|---|
| `bossActive` | ~line 283: `const bossActive = useBoss.getState().isActive` | boolean |
| `playerPos` | ~line 252: `const playerPos = playerState.position` | `[x, y, z]` |
| `GAME_CONFIG.MINIMAP_VISIBLE_RADIUS` | gameConfig.js | `500` (world units) |

**Do NOT re-read `bossActive` via `useBoss.getState().isActive`** — use the existing const defined in section 5.

### Key Constants Reference

- `GAME_CONFIG.MINIMAP_VISIBLE_RADIUS = 500` — radius for fog marking (≈ 7.5 grid cells)
- `GAME_CONFIG.PLAY_AREA_SIZE = 2000` → `WORLD_SIZE = 4000` (half-size × 2)
- FOG_GRID_SIZE = 60 → CELL_SIZE ≈ 66.7 world units per cell
- Grid indexing: `_grid[row * FOG_GRID_SIZE + col]`, where row=Z axis, col=X axis

### Files to Touch

| File | Action | Scope |
|---|---|---|
| `src/systems/fogSystem.js` | **CREATE** new file | ~40 lines |
| `src/GameLoop.jsx` | **EDIT** — 4 targeted changes | 1 import + 1 ref + 2 reset lines + 1 frame-update block |

### What NOT to Do

- Do NOT add fog state to any Zustand store — module-level singleton is correct
- Do NOT call `markDiscovered` every frame — the `% 10` throttle is intentional
- Do NOT add `fogFrameCountRef.current = 0` in the reset blocks — the modulo counter doesn't need reset, `resetFogGrid()` clears the grid data, the counter just throttles calls
- Do NOT import `getDiscoveredCells` in GameLoop — only Story 35.2 (MapOverlay) will use it
- Do NOT add fog logic to any Zustand store tick

### Project Structure Notes

- `src/systems/` — all pure JS game systems, no React. fogSystem.js belongs here.
- Pattern source of truth: `src/systems/xpOrbSystem.js` (same module-level array, same export style, same reset function)
- Import style used in project: named exports, no default export for systems

### References

- Epic definition with technical notes: `_bmad-output/planning-artifacts/epic-35-exploration-navigation.md#Story 35.1`
- System pattern to mirror: `src/systems/xpOrbSystem.js`
- GameLoop integration source: `src/GameLoop.jsx` — transition block line ~107, reset block line ~145, `bossActive` line ~283, `playerPos` line ~252
- GAME_CONFIG: `src/config/gameConfig.js` — `MINIMAP_VISIBLE_RADIUS: 500`, `PLAY_AREA_SIZE: 2000`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_No debug issues encountered._

### Completion Notes List

- Created `src/systems/fogSystem.js` as pure JS module singleton (Uint8Array 60×60 grid, zero GC pressure). Pattern mirrors `xpOrbSystem.js`.
- Integrated into `GameLoop.jsx`: import, `fogFrameCountRef` ref, `resetFogGrid()` in both reset blocks (tunnel→gameplay + full game reset), frame-throttled `markFogDiscovered()` every 10 frames after section 7g, skipped during boss phase.
- `markDiscovered` aliased as `markFogDiscovered` in GameLoop import to avoid name clash with `useArmory.getState().markDiscovered`.
- 8 unit tests written and passing; 6 required test cases from story + 2 boundary extras. No regressions introduced (pre-existing failures in Story 32.1 tests are unrelated).
- **Code Review (2026-02-23):** 2 MEDIUM + 3 LOW findings — all fixed. Dev Notes updated with correct `markFogDiscovered` alias + warning. Added `radius=0` test (now 9/9). `getDiscoveredCells()` contract comment expanded. `WORLD_SIZE` maintenance note added. GameLoop AC 3/4/5 coverage gap documented (no useFrame test infra project-wide; verified by code inspection).

### File List

- `src/systems/fogSystem.js` — **CREATED**
- `src/systems/__tests__/fogSystem.test.js` — **CREATED**
- `src/GameLoop.jsx` — **MODIFIED** (import, ref, 2× resetFogGrid, fog frame-update block)
- `_bmad-output/implementation-artifacts/35-1-fog-of-war-exploration-module.md` — **MODIFIED** (story tasks, status)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — **MODIFIED** (status: done)

## Change Log

| Date | Change |
|---|---|
| 2026-02-23 | Story 35.1 implemented: fogSystem.js module + GameLoop integration + 8 unit tests |
| 2026-02-23 | Code review: 2M+3L fixed — alias docs, radius=0 test (9 tests), mutation contract, WORLD_SIZE note, AC3/4/5 coverage gap noted. Status → done |
