# Story 35.2: Large Map Overlay (Touche M)

Status: done

## Story

As a player,
I want to see a large map by holding the M key to check my exploration progress without pausing the game,
So that I can plan my route while staying in danger.

## Acceptance Criteria

1. **Given** the M key is held during gameplay **When** `phase === 'gameplay'` and `isPaused === false` **Then** the map overlay is shown while M is held and closes when M is released **And** `isPaused` remains `false` — the game continues running **And** the key is detected via `e.key === 'm'` (layout-independent, works on AZERTY and QWERTY).

2. **Given** the map overlay is open **When** rendered **Then** it covers ~80% of screen width and ~80% of screen height, centered **And** background: `var(--rs-bg)` at 65% opacity (semi-transparent — gameplay visible behind) **And** border: `2px solid var(--rs-teal)`, clip-path angulaire coin coupé haut-droite 16px **And** the game is still visible and running behind the overlay.

3. **Given** the map contents **When** rendered **Then** fog cells NOT discovered are rendered dark (`var(--rs-bg)` at 80% opacity) **And** fog cells that ARE discovered are rendered as a subtle lighter tone (`var(--rs-bg-raised)` at 45% opacity) **And** discovered planets are shown as colored dots using `PLANETS[p.typeId]?.color` with scanned planets at 30% opacity **And** the wormhole is shown if `wormholeState !== 'hidden'` as a pulsing violet dot (`var(--rs-violet)`) **And** the player position is shown as a triangle SVG at correct map coordinates, rotating with `usePlayer.rotation` **And** enemies are NOT shown on the large map **And** cardinal directions (N S E W) are shown at map edges in `Space Mono` font.

4. **Given** the map overlay is open and the player moves **When** positions are updated **Then** the map refreshes at ~10fps (setInterval 100ms polling, NOT real-time Zustand subscription).

5. **Given** closing the map **When** M is released **Then** the overlay closes.

6. **Given** the game enters a non-gameplay phase (levelUp, planetReward, pause, gameOver, etc.) **When** the phase changes away from `gameplay` **Then** the map overlay automatically closes if open.

## Tasks / Subtasks

- [x] Task 1: Create `src/ui/MapOverlay.jsx` — overlay layout + keyboard (AC: 1, 2, 5, 6)
  - [x] Subtask 1.1: Export pure helper `worldToMapPct(worldCoord)` — convert world coord (-2000..+2000) to percentage (0..100); export for unit testing
  - [x] Subtask 1.2: M key toggle via `window.addEventListener('keydown')` in useEffect (guard: `phase === 'gameplay'` — always close on M, only open when `!isPaused`)
  - [x] Subtask 1.3: Escape key handler to close overlay in same useEffect (`e.code === 'Escape' && isOpen → setIsOpen(false)`)
  - [x] Subtask 1.4: Auto-close useEffect on phase: `if (phase !== 'gameplay') setIsOpen(false)`
  - [x] Subtask 1.5: Overlay container with Redshift styles (see Dev Notes)

- [x] Task 2: Polling + fog canvas rendering (AC: 3, 4)
  - [x] Subtask 2.1: `useRef` for canvas element (native 60×60 px)
  - [x] Subtask 2.2: `useState` for `polledState` with shape `{ playerPos, playerRot, planets, wormhole, wormholeState }` — see Dev Notes
  - [x] Subtask 2.3: `setInterval(100ms)` in useEffect (runs only when `isOpen`) — reads `usePlayer.getState()` and `useLevel.getState()` imperatively, calls `setPolledState`; clears on cleanup
  - [x] Subtask 2.4: Canvas draw useEffect triggered on each `polledState` update — calls `getDiscoveredCells()` and draws fog grid cell-by-cell (see Dev Notes)

- [x] Task 3: Planet, wormhole, player SVG overlay (AC: 3)
  - [x] Subtask 3.1: Planet dots positioned via `worldToMapPct` (absolute over canvas), color from `PLANETS[p.typeId]?.color`, opacity 0.3 if scanned
  - [x] Subtask 3.2: Wormhole pulsing violet dot when `wormholeState !== 'hidden'`, uses `scanPulse` animation from style.css
  - [x] Subtask 3.3: Player triangle SVG rotated by `polledState.playerRot` radians, color `var(--rs-teal)`
  - [x] Subtask 3.4: Cardinal labels N/S/E/W at map edges in `Space Mono`, color `var(--rs-text-muted)`

- [x] Task 4: Mount in Interface.jsx (AC: 1)
  - [x] Subtask 4.1: Import `MapOverlay` in `src/ui/Interface.jsx`
  - [x] Subtask 4.2: Add `{phase === 'gameplay' && <MapOverlay />}` in Interface return JSX (alongside `<HUD />`)

- [x] Task 5: Unit tests for `worldToMapPct` (AC: 3)
  - [x] `worldToMapPct(-2000)` returns `0`
  - [x] `worldToMapPct(0)` returns `50`
  - [x] `worldToMapPct(2000)` returns `100`
  - [x] `worldToMapPct(1000)` returns `75`
  - [x] `worldToMapPct(-1000)` returns `25`

## Dev Notes

### Architecture — CRITICAL

`MapOverlay.jsx` is a **React UI component** mounted in `Interface.jsx` (same root as HUD, PauseMenu, etc.). It renders as an HTML `div` with `position: fixed` and a z-index above the HUD (zIndex: 50, HUD is at z-40).

**DO NOT use reactive Zustand selectors for real-time game data** — subscribing to `usePlayer.position` at 60fps would cause 60fps re-renders of the entire map component. Instead, follow the exact same imperative polling pattern as the minimap enemy polling in `HUD.jsx` (lines 346–365): a `setInterval` at 100ms reads store state imperatively and updates a single `polledState` object.

### worldToMapPct — Pure Helper (Exportable)

```js
// src/ui/MapOverlay.jsx
// World coord range: -2000 (GAME_CONFIG.PLAY_AREA_SIZE) to +2000
// Map percentage: 0% = world left/top edge, 100% = world right/bottom edge
const WORLD_SIZE = 4000  // 2 × GAME_CONFIG.PLAY_AREA_SIZE

export function worldToMapPct(worldCoord) {
  return ((worldCoord + WORLD_SIZE / 2) / WORLD_SIZE) * 100
}
```

### polledState Structure

```js
const [polledState, setPolledState] = useState({
  playerPos: [0, 0, 0],   // usePlayer.position — [x, y, z]
  playerRot: 0,            // usePlayer.rotation — float radians (ship yaw)
  planets: [],             // useLevel.planets — array of { id, x, z, typeId, scanned }
  wormhole: null,          // useLevel.wormhole — { x, z } or null
  wormholeState: 'hidden', // useLevel.wormholeState — string
})
```

### Polling Interval (mirrors HUD.jsx minimap enemy pattern)

```js
useEffect(() => {
  if (!isOpen) return
  const id = setInterval(() => {
    const { position: playerPos, rotation: playerRot } = usePlayer.getState()
    const { planets, wormhole, wormholeState } = useLevel.getState()
    setPolledState({ playerPos, playerRot, planets, wormhole, wormholeState })
  }, 100)
  return () => clearInterval(id)
}, [isOpen])
```

Note: only runs when `isOpen` to avoid wasted polling when map is closed.

### Canvas Fog Rendering

Native canvas is **60×60 pixels** (matching `FOG_GRID_SIZE`), scaled to fill the map panel via CSS `width: 100%; height: 100%; image-rendering: pixelated`. This gives crisp block-style fog cells.

```js
// useEffect on polledState — redraw fog whenever data updates
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas || !isOpen) return
  const ctx = canvas.getContext('2d')
  const grid = getDiscoveredCells()  // Uint8Array(3600) from fogSystem.js

  ctx.clearRect(0, 0, FOG_GRID_SIZE, FOG_GRID_SIZE)
  for (let row = 0; row < FOG_GRID_SIZE; row++) {
    for (let col = 0; col < FOG_GRID_SIZE; col++) {
      const discovered = grid[row * FOG_GRID_SIZE + col] === 1
      // rs-bg-raised = #241d35 at 45% — rs-bg = #0d0b14 at 80%
      ctx.fillStyle = discovered ? 'rgba(36,29,53,0.45)' : 'rgba(13,11,20,0.80)'
      ctx.fillRect(col, row, 1, 1)
    }
  }
}, [polledState, isOpen])
```

Planet/wormhole/player dots are rendered as **HTML elements positioned absolute over the canvas** — not drawn on canvas. This keeps SVG rotation math trivial.

### Overlay Container Styles (Redshift)

```jsx
{isOpen && (
  <div style={{
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80vw', height: '80vh',
    backgroundColor: 'rgba(13,11,20,0.65)',   // var(--rs-bg) at 65%
    border: '2px solid var(--rs-teal)',
    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
    zIndex: 50,
    overflow: 'hidden',
    pointerEvents: 'none',  // keyboard only — no clicks needed on overlay
  }}>
    {/* 60×60 canvas fills panel */}
    <canvas
      ref={canvasRef}
      width={FOG_GRID_SIZE}
      height={FOG_GRID_SIZE}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        imageRendering: 'pixelated',
      }}
    />
    {/* SVG overlay — absolute positioned elements over canvas */}
    {/* ... planets, wormhole, player, labels ... */}
  </div>
)}
```

### Keyboard Handling Pattern

Hold-to-show via `keydown`/`keyup` pair. Uses `e.key` (not `e.code`) for keyboard-layout independence — `e.code === 'KeyM'` is the physical QWERTY position; on AZERTY, the M key has `e.code === 'KeyL'`.

```js
useEffect(() => {
  const onKeyDown = (e) => {
    if ((e.key === 'm' || e.key === 'M') && !e.repeat) {
      const { isPaused } = useGame.getState()
      if (!isPaused) setIsOpen(true)
    }
  }
  const onKeyUp = (e) => {
    if (e.key === 'm' || e.key === 'M') setIsOpen(false)
  }
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('keyup', onKeyUp, true)
  return () => {
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('keyup', onKeyUp, true)
  }
}, [])
```

`!e.repeat` prevents re-triggering on key held repeat. Stable `[]` dependency — no need to close on Escape separately since releasing M is the single close mechanism.

### Player Triangle SVG

```jsx
<div style={{
  position: 'absolute',
  left: `${worldToMapPct(polledState.playerPos[0])}%`,
  top: `${worldToMapPct(polledState.playerPos[2])}%`,   // Z axis = vertical on map
  transform: `translate(-50%, -50%) rotate(${polledState.playerRot}rad)`,
  pointerEvents: 'none',
}}>
  <svg width="10" height="12" viewBox="0 0 10 12" fill="var(--rs-teal)">
    {/* Triangle pointing up — rotates with player yaw */}
    <polygon points="5,0 10,12 5,9 0,12" />
  </svg>
</div>
```

`usePlayer.rotation` is the ship's yaw in radians (verified in `src/stores/usePlayer.jsx` line 25).

### Planet Dots

```jsx
{polledState.planets.map(p => {
  const color = PLANETS[p.typeId]?.color || '#ffffff'
  return (
    <div key={p.id} style={{
      position: 'absolute',
      left: `${worldToMapPct(p.x)}%`,
      top: `${worldToMapPct(p.z)}%`,
      width: '8px', height: '8px',
      borderRadius: '50%',
      backgroundColor: color,
      boxShadow: `0 0 6px ${color}`,
      transform: 'translate(-50%, -50%)',
      opacity: p.scanned ? 0.3 : 1,
      transition: 'opacity 200ms ease-out',
      pointerEvents: 'none',
    }} />
  )
})}
```

Planet colors come from `src/entities/planetDefs.js`: PLANET_CINDER `#a07855`, PLANET_PULSE `#00b4d8`, PLANET_VOID `#9b5de5` (Epic 34 is done — these are the only active planet types). The `PLANETS[p.typeId]?.color || '#ffffff'` fallback handles any future unknown types.

### Wormhole Dot

```jsx
{polledState.wormhole && polledState.wormholeState !== 'hidden' && (
  <div style={{
    position: 'absolute',
    left: `${worldToMapPct(polledState.wormhole.x)}%`,
    top: `${worldToMapPct(polledState.wormhole.z)}%`,
    width: '10px', height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--rs-violet)',
    boxShadow: '0 0 8px var(--rs-violet)',
    transform: 'translate(-50%, -50%)',
    animation: 'scanPulse 800ms ease-in-out infinite alternate',
    pointerEvents: 'none',
  }} />
)}
```

`scanPulse` keyframe animation is already defined in `src/style.css` (reused from minimap wormhole dot in HUD.jsx line 505).

### Cardinal Direction Labels

```jsx
{[
  { label: 'N', style: { top: '6px', left: '50%', transform: 'translateX(-50%)' } },
  { label: 'S', style: { bottom: '6px', left: '50%', transform: 'translateX(-50%)' } },
  { label: 'W', style: { left: '6px', top: '50%', transform: 'translateY(-50%)' } },
  { label: 'E', style: { right: '6px', top: '50%', transform: 'translateY(-50%)' } },
].map(({ label, style }) => (
  <span key={label} style={{
    position: 'absolute', ...style,
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: 'var(--rs-text-muted)',
    pointerEvents: 'none',
    zIndex: 10,
  }}>{label}</span>
))}
```

### Integration in Interface.jsx

Interface.jsx already mounts `<HUD />` during `gameplay` phase (line ~206). MapOverlay mounts similarly:

```jsx
// src/ui/Interface.jsx — add import near top with other UI imports:
import MapOverlay from './MapOverlay.jsx'

// In return JSX, after HUD mount block:
{phase === 'gameplay' && <MapOverlay />}
```

This ensures auto-unmount on phase change (backup to the internal `useEffect` guard).

### Key Imports for MapOverlay.jsx

```js
import { useState, useEffect, useRef } from 'react'
import useGame from '../stores/useGame.jsx'
import usePlayer from '../stores/usePlayer.jsx'
import useLevel from '../stores/useLevel.jsx'
import { PLANETS } from '../entities/planetDefs.js'
import { getDiscoveredCells, FOG_GRID_SIZE } from '../systems/fogSystem.js'
```

### Dependency on Story 35.1

Story 35.1 is **done** — `src/systems/fogSystem.js` already exists with the full API. No stub needed. Import directly:

```js
import { getDiscoveredCells, FOG_GRID_SIZE } from '../systems/fogSystem.js'
```

Verified in 35.1 File List: `src/systems/fogSystem.js` — CREATED, exports `resetFogGrid`, `markDiscovered`, `getDiscoveredCells`, `FOG_GRID_SIZE`, `CELL_SIZE`.

### Files to Touch

| File | Action | Scope |
|---|---|---|
| `src/ui/MapOverlay.jsx` | **CREATE** new file | ~120-150 lines |
| `src/ui/Interface.jsx` | **EDIT** — 2 targeted changes | 1 import + 1 JSX mount line |

### What NOT to Do

- Do NOT set `isPaused: true` when M is pressed — the map is explicitly a non-pausing overlay
- Do NOT use reactive Zustand selectors for position/planets data — imperative polling only (HUD.jsx minimap enemy pattern)
- Do NOT draw planets, wormhole, or player on the canvas — use HTML elements absolutely positioned over canvas for easier rotation/opacity management
- Do NOT add `pointer-events: auto` to the overlay — keyboard listeners on `window` handle all interaction; no mouse clicks needed
- Do NOT add fog logic to any Zustand store — `fogSystem.js` is a pure module singleton, import directly
- Do NOT render enemy dots on the large map — explicitly excluded by AC #3
- Do NOT use `border-radius` on the map panel — use `clip-path` only (Redshift angular style)
- Do NOT add `stopPropagation` on the M key — only add it on Escape if the pause conflict proves problematic during testing

### Project Structure Notes

- `src/ui/` — all React UI overlays. MapOverlay.jsx belongs here alongside HUD.jsx and PauseMenu.jsx.
- `src/ui/Interface.jsx` — root UI orchestrator. This is the correct place to mount MapOverlay (not inside HUD.jsx, which has `pointer-events: none` on its root div).
- Pattern reference for polling: `src/ui/HUD.jsx` lines 346–365
- Pattern reference for keyboard + phase guard: `src/ui/Interface.jsx` lines 199–210
- `scanPulse` animation: already in `src/style.css` — do not redefine
- Canvas in project: this is the first `<canvas>` element in the UI layer; no existing pattern to follow

### References

- Epic spec + Technical Notes: `_bmad-output/planning-artifacts/epic-35-exploration-navigation.md#Story 35.2`
- Story 35.1 (dependency): `_bmad-output/implementation-artifacts/35-1-fog-of-war-exploration-module.md` — fogSystem.js API and constants
- Polling pattern: `src/ui/HUD.jsx` lines 344–366 (minimap enemy setInterval)
- Keyboard pattern: `src/ui/Interface.jsx` lines 169–183 (ESC/P pause toggle)
- Redshift CSS variables: `src/style.css` lines 152–176 (`--rs-bg #0d0b14`, `--rs-bg-raised #241d35`, `--rs-border #2e2545`, `--rs-violet #9b5de5`, `--rs-teal #00b4d8`, `--rs-text-muted #7a6d8a`)
- `scanPulse` animation: defined in `src/style.css` line 66, used in `HUD.jsx` line 507
- Planet colors: `src/entities/planetDefs.js` — PLANET_CINDER `#a07855`, PLANET_PULSE `#00b4d8`, PLANET_VOID `#9b5de5` (Epic 34 done)
- Player rotation field: `src/stores/usePlayer.jsx` line 25 — `rotation: 0` (float radians, ship yaw)
- Interface.jsx mount patterns: `src/ui/Interface.jsx` lines 187–197 (phase-gated component mounts)
- GAME_CONFIG.PLAY_AREA_SIZE: 2000 → WORLD_SIZE = 4000

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation, no regressions.

### Completion Notes List

- Created `src/ui/MapOverlay.jsx` (~130 lines): M key toggle (non-pausing), Escape close, auto-close on phase change, 100ms imperative polling pattern (mirrors HUD.jsx minimap), canvas fog rendering (60×60 px pixelated), planet dots, wormhole pulsing dot, player triangle SVG, cardinal labels.
- `worldToMapPct` exported as pure helper, tested with 5 unit tests (all pass).
- Escape key uses `e.stopImmediatePropagation()` with capture-phase listener (`addEventListener(..., true)`) to prevent Escape from also triggering Interface.jsx's pause handler. `stopPropagation()` is insufficient against sibling `window` listeners; capture phase + `stopImmediatePropagation()` is the correct fix.
- `polledState` initialized via lazy initializer `useState(() => readStores())` and polled immediately on open — eliminates the ~100ms flash where the player triangle appeared at [0,0,0] before the first interval tick.
- Removed redundant reactive `useGame(s => s.phase)` selector — MapOverlay is conditionally mounted by Interface.jsx (`{phase === 'gameplay' && ...}`), so phase is always 'gameplay' inside the component; the subscription and both phase guards were dead code.
- Mounted in `src/ui/Interface.jsx` with `{phase === 'gameplay' && <MapOverlay />}`.
- 5 unit tests — all green.
- **Post-review amendments (2026-02-23):** M key changed from toggle to hold-to-show (`keydown` opens, `keyup` closes); `e.code === 'KeyM'` replaced by `e.key === 'm'` for AZERTY/QWERTY compatibility; background opacity reduced `0.85→0.65`; border changed `1px var(--rs-border)→2px var(--rs-teal)` (aligns with minimap story 35.3); canvas fog opacity reduced (undiscovered `0.95→0.80`, discovered `0.60→0.45`).

### File List

- `src/ui/MapOverlay.jsx` — CREATED
- `src/ui/Interface.jsx` — EDITED (1 import + 1 JSX mount line)
- `src/ui/__tests__/MapOverlay.test.jsx` — CREATED
