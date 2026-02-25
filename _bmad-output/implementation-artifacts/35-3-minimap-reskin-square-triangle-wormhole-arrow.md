# Story 35.3: Minimap Reskin — Carré, Triangle Joueur, Flèche Trou de Ver

Status: done

## Story

As a player,
I want the minimap to show my direction of travel and point me toward the wormhole when it's off-screen,
So that navigation is intuitive without opening the full map.

## Acceptance Criteria

1. **Given** the minimap container **When** rendered **Then** shape is square with angular clip-path: `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)` (pas de border-radius) **And** border: `2px solid var(--rs-teal)` (remplace rgba cyan) **And** background: `var(--rs-bg-surface)` (remplace `rgba(0,0,0,0.65)`) **And** `MINIMAP.borderRadius` est supprimé ou ignoré.

2. **Given** the player representation on minimap **When** rendered **Then** the player dot is replaced by a triangle SVG (▲) of size 8×10px, color `var(--rs-teal)` **And** the triangle rotates with `usePlayer.rotation` (CSS `transform: rotate(${rotation}rad)`) **And** the NESW compass labels remain fixed (ne tournent pas avec le joueur).

3. **Given** the wormhole is spawned (`wormholeState !== 'hidden'`) **When** the wormhole IS within `MINIMAP_VISIBLE_RADIUS` **Then** it is shown as a pulsing violet dot (comportement actuel préservé).

4. **Given** the wormhole is spawned (`wormholeState !== 'hidden'`) **When** the wormhole is OUTSIDE `MINIMAP_VISIBLE_RADIUS` **Then** a small triangle arrow (SVG, color `var(--rs-violet)`, 6px) is positioned on the minimap edge **And** the arrow points in the direction from player to wormhole **And** position on edge = intersection of the direction vector with the minimap boundary.

5. **Given** `wormholeState === 'hidden'` **When** no wormhole exists **Then** no off-screen arrow is shown.

## Tasks / Subtasks

- [x] Task 1: Update `MINIMAP` constants in `src/ui/HUD.jsx` (AC: 1, 2)
  - [x] Subtask 1.1: Remove `borderRadius: '50%'` from `MINIMAP` object (or set to `'0'`) — container will use `clipPath` instead
  - [x] Subtask 1.2: Update `MINIMAP.borderColor` to `'var(--rs-teal)'` (was `'rgba(34, 211, 238, 0.4)'`)
  - [x] Subtask 1.3: Update `MINIMAP.backgroundColor` to `'var(--rs-bg-surface)'` (was `'rgba(0,0,0,0.65)'`)
  - [x] Subtask 1.4: Remove `MINIMAP.boxShadow` field (Redshift style — no glow on container)

- [x] Task 2: Update minimap container div styles (AC: 1)
  - [x] Subtask 2.1: Remove `borderRadius: MINIMAP.borderRadius` from container div
  - [x] Subtask 2.2: Add `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'` to container div
  - [x] Subtask 2.3: Update `border` to `'2px solid var(--rs-teal)'`
  - [x] Subtask 2.4: Update `backgroundColor` to `'var(--rs-bg-surface)'`
  - [x] Subtask 2.5: Remove `boxShadow: MINIMAP.boxShadow` from container

- [x] Task 3: Replace player dot with rotating triangle SVG (AC: 2)
  - [x] Subtask 3.1: Add `const playerRotation = usePlayer((s) => s.rotation)` selector near other `usePlayer` selectors (~line 337 in HUD.jsx)
  - [x] Subtask 3.2: Replace the player dot `<div>` (lines 466–475 in HUD.jsx) with a positioned wrapper `<div>` containing an inline SVG triangle
  - [x] Subtask 3.3: SVG triangle points UP (north) by default: `<polygon points="4,0 8,10 4,7 0,10" />`
  - [x] Subtask 3.4: Wrapper div style: `position: 'absolute', left: '50%', top: '50%', transform: \`translate(-50%, -50%) rotate(${playerRotation}rad)\`, pointerEvents: 'none', zIndex: 5`
  - [x] Subtask 3.5: SVG: `width="8" height="10" viewBox="0 0 8 10" fill="var(--rs-teal)"`

- [x] Task 4: Add exported helper `minimapWormholeArrowPosition` (AC: 4)
  - [x] Subtask 4.1: Add exported pure function after existing helpers in `src/ui/HUD.jsx` (after `isWithinMinimapRadius`, ~line 58)
  - [x] Subtask 4.2: `edgeX` and `edgeZ` are percentages (0–100) for `left`/`top` CSS; `angle` is radians for `rotate(${angle}rad)` CSS transform

- [x] Task 5: Render wormhole off-screen arrow in minimap JSX (AC: 4, 5)
  - [x] Subtask 5.1: Split current wormhole block into TWO mutually exclusive branches: within radius (existing dot) and outside radius (new arrow)
  - [x] Subtask 5.2: Outside-radius condition: `wormhole && wormholeState !== 'hidden' && !isWithinMinimapRadius(...)`
  - [x] Subtask 5.3: Compute edge position with IIFE pattern
  - [x] Subtask 5.4: Arrow SVG pointing RIGHT (east) by default, rotated by `angle` toward wormhole

- [x] Task 6: Unit tests for `minimapWormholeArrowPosition` (AC: 4)
  - [x] Wormhole directly right (dx=100, dz=0): `edgeX ≈ 100`, `edgeZ ≈ 50`, `angle ≈ 0`
  - [x] Wormhole directly below (dx=0, dz=100): `edgeX ≈ 50`, `edgeZ ≈ 100`, `angle ≈ Math.PI/2`
  - [x] Wormhole directly above (dx=0, dz=-100): `edgeX ≈ 50`, `edgeZ ≈ 0`, `angle ≈ -Math.PI/2`
  - [x] Wormhole directly left (dx=-100, dz=0): `edgeX ≈ 0`, `edgeZ ≈ 50`, `angle ≈ ±Math.PI`
  - [x] Wormhole diagonal (dx=100, dz=100): `edgeX ≈ 100`, `edgeZ ≈ 100`, `angle ≈ Math.PI/4`

## Dev Notes

### Architecture — File Scope

Story 35.3 touches **exactly one file**: `src/ui/HUD.jsx`. No new files are created. All changes are surgical and localized:

| Location in HUD.jsx | Change |
|---|---|
| Lines 18–38 (`MINIMAP` object) | Update 3 fields, remove 2 |
| ~Line 337 (player selectors) | Add `playerRotation` selector |
| Lines 441–449 (container div styles) | Remove borderRadius + boxShadow, add clipPath, update border + bg |
| Lines 466–475 (player dot) | Replace dot div with triangle SVG wrapper |
| After line 58 (exported helpers) | Add `minimapWormholeArrowPosition` function |
| Lines 495–508 (wormhole block) | Split into two mutually exclusive branches |

No changes to: GameLoop, stores, fogSystem, MapOverlay, Interface.jsx, or any other file.

### Current Minimap State — What to Change

**`MINIMAP` constants** (HUD.jsx lines 18–38):
```js
// CURRENT (story 10.3 values)
export const MINIMAP = {
  borderRadius: '50%',                         // ← REMOVE (use clipPath instead)
  borderColor: 'rgba(34, 211, 238, 0.4)',      // ← UPDATE → 'var(--rs-teal)'
  boxShadow: '0 0 12px rgba(34, 211, 238, 0.2)', // ← REMOVE
  backgroundColor: 'rgba(0,0,0,0.65)',         // ← UPDATE → 'var(--rs-bg-surface)'
  playerDotColor: '#00ffcc',   // no longer used for player (dot replaced)
  playerDotSize: '6px',        // no longer used
  playerDotGlow: '...',        // no longer used
  // ... rest of fields unchanged (enemyDotSize, wormholeBaseSize, etc.) ...
}
```

**Minimap container div** (lines 441–449):
```js
// BEFORE
border: `2px solid ${MINIMAP.borderColor}`,
borderRadius: MINIMAP.borderRadius,    // ← REMOVE
boxShadow: MINIMAP.boxShadow,          // ← REMOVE
backgroundColor: MINIMAP.backgroundColor,

// AFTER
border: '2px solid var(--rs-teal)',
clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
backgroundColor: 'var(--rs-bg-surface)',
```

### Player Triangle SVG — Complete Replacement

Current player dot (lines 466–475):
```jsx
<div style={{
  position: 'absolute',
  width: MINIMAP.playerDotSize, height: MINIMAP.playerDotSize,
  borderRadius: '50%',
  backgroundColor: MINIMAP.playerDotColor,
  boxShadow: MINIMAP.playerDotGlow,
  left: '50%', top: '50%',
  transform: 'translate(-50%, -50%)',
  transition: MINIMAP.dotTransition,
}} />
```

Replace with:
```jsx
{/* Player triangle — rotates with ship yaw */}
<div style={{
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: `translate(-50%, -50%) rotate(${playerRotation}rad)`,
  pointerEvents: 'none',
  zIndex: 5,
}}>
  <svg width="8" height="10" viewBox="0 0 8 10" fill="var(--rs-teal)">
    {/* Triangle pointing up (north) by default */}
    <polygon points="4,0 8,10 4,7 0,10" />
  </svg>
</div>
```

The polygon `points="4,0 8,10 4,7 0,10"` creates a filled arrow pointing up with a slight concave notch at the base (similar to the MapOverlay player triangle from Story 35.2: `"5,0 10,12 5,9 0,12"`).

**`playerRotation` selector** — add near existing player selectors (~line 337):
```js
const playerRotation = usePlayer((s) => s.rotation)
```

`usePlayer.rotation` is the ship's yaw in radians (confirmed: `src/stores/usePlayer.jsx` line 25). It is updated every frame by `PlayerShip.jsx` `useFrame`. Using a reactive selector means the minimap triangle re-renders on each rotation change — acceptable since `playerPosition` already causes re-renders at 60fps.

**Coordinate system**: `rotation = 0` → ship faces default direction (which is north/up on minimap). `rotation > 0` → clockwise rotation in world → CSS `rotate(Xrad)` is also clockwise → no offset needed.

### Wormhole Off-Screen Arrow — Algorithm

```js
export function minimapWormholeArrowPosition(wormholeX, wormholeZ, playerX, playerZ) {
  const dx = wormholeX - playerX
  const dz = wormholeZ - playerZ
  const angle = Math.atan2(dz, dx)
  // Intersect direction ray with centered unit square (half-size = 0.5)
  const abscos = Math.abs(Math.cos(angle))
  const abssin = Math.abs(Math.sin(angle))
  const scale = 0.5 / Math.max(abscos, abssin)
  const edgeX = 50 + Math.cos(angle) * scale * 100  // %
  const edgeZ = 50 + Math.sin(angle) * scale * 100  // %
  return { edgeX, edgeZ, angle }
}
```

**Coordinate system validation** (minimap: right = +X, down = +Z):
- Wormhole to the right → `atan2(0, +dx) = 0` → `edgeX = 100, edgeZ = 50` ✓
- Wormhole below → `atan2(+dz, 0) = π/2` → `edgeX = 50, edgeZ = 100` ✓
- Wormhole above → `atan2(-dz, 0) = -π/2` → `edgeX = 50, edgeZ = 0` ✓
- Wormhole to the left → `atan2(0, -dx) = ±π` → `edgeX = 0, edgeZ = 50` ✓
- Diagonal (dx=dz) → `atan2(1,1) = π/4` → corner position ✓

**Arrow SVG direction**: The polygon `points="6,4 0,0 1,4 0,8"` points RIGHT (east) by default. Applying `rotate(angle)` from `atan2(dz, dx)` aligns it toward the wormhole in minimap coordinate space. No additional offset needed.

### Wormhole Rendering Split

Current single block (lines 495–508). Replace with two mutually exclusive branches:

```jsx
{/* Branch 1: Wormhole within visible radius — existing dot (AC 3) */}
{wormhole && wormholeState !== 'hidden' && isWithinMinimapRadius(wormhole.x, wormhole.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS) && (
  <div style={{
    position: 'absolute',
    width: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
    height: wormholeState === 'visible' ? MINIMAP.wormholeBaseSize : MINIMAP.wormholeActiveSize,
    borderRadius: '50%',
    backgroundColor: MINIMAP.wormholeColor,
    ...minimapDotPosition(wormhole.x, wormhole.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS),
    transform: 'translate(-50%, -50%)',
    boxShadow: wormholeState !== 'visible' ? MINIMAP.wormholeGlowActive : MINIMAP.wormholeGlowBase,
    animation: 'scanPulse 800ms ease-in-out infinite alternate',
    transition: 'width 200ms ease-out, height 200ms ease-out',
  }} />
)}
{/* Branch 2: Wormhole outside visible radius — edge arrow (AC 4) */}
{wormhole && wormholeState !== 'hidden' && !isWithinMinimapRadius(wormhole.x, wormhole.z, playerPosition[0], playerPosition[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS) && (() => {
  const { edgeX, edgeZ, angle } = minimapWormholeArrowPosition(wormhole.x, wormhole.z, playerPosition[0], playerPosition[2])
  return (
    <div style={{
      position: 'absolute',
      left: `${edgeX}%`,
      top: `${edgeZ}%`,
      transform: `translate(-50%, -50%) rotate(${angle}rad)`,
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      <svg width="6" height="8" viewBox="0 0 6 8" fill="var(--rs-violet)">
        {/* Points right (east) by default — rotated by angle toward wormhole */}
        <polygon points="6,4 0,0 1,4 0,8" />
      </svg>
    </div>
  )
})()}
```

The IIFE `(() => { ... })()` pattern is already established in HUD.jsx for boundary edges (~line 453) — use the same pattern.

### Compass Labels — Restyled, Not Rotated

Current compass labels (lines 522–539) use `color: 'rgba(255,255,255,0.6)'` and no explicit font. Per AC #2 (NESW labels stay fixed) and the Redshift style spec, update their styling only:

```js
// BEFORE
fontSize: '7px',
color: 'rgba(255,255,255,0.6)',
fontWeight: 'bold',
textShadow: '0 0 2px rgba(0,0,0,0.8)',

// AFTER
fontSize: '0.5rem',  // same visual size, relative unit
fontFamily: "'Space Mono', monospace",
color: 'var(--rs-text-muted)',
// remove fontWeight and textShadow
```

Labels remain absolutely positioned with fixed `top/bottom/left/right` — they do NOT rotate with the player.

### Performance Note

Adding `playerRotation = usePlayer((s) => s.rotation)` as a reactive selector means the minimap subtree re-renders on every rotation change (~60fps during flight). This is acceptable because:
1. `playerPosition` already triggers the same re-render frequency (already present)
2. The minimap is a leaf component within HUD — its re-render scope is small
3. Alternative (100ms polling via setInterval) would introduce 100ms lag, making the triangle rotation feel jittery

If performance issues arise in the future, consider memoizing the minimap subtree with `React.memo` or using a CSS custom property approach.

### What NOT to Do

- Do NOT add `border-radius` to the container — use `clip-path` only (Redshift angular style)
- Do NOT use `usePlayer.getState()` inside the render function for `playerRotation` — use the reactive selector
- Do NOT remove existing wormhole dot behavior (within-radius branch) — only ADD the outside-radius branch
- Do NOT rotate the NESW labels — they are world-fixed reference points, not player-relative
- Do NOT show the edge arrow when `wormholeState === 'hidden'` — wormhole hasn't spawned yet
- Do NOT add pulse animation to the edge arrow — static directional indicator only
- Do NOT add pointer-events to any minimap element — `pointerEvents: 'none'` everywhere

### Project Structure Notes

- `src/ui/HUD.jsx` — the ONLY file modified
- `MINIMAP` object: exported at top of HUD.jsx (lines 18–38), testable via import
- Exported helpers: `minimapDotPosition`, `minimapBoundaryEdgePct`, `isWithinMinimapRadius` at lines 40–58 — add `minimapWormholeArrowPosition` after these
- Minimap container JSX: lines 440–540 in HUD.jsx
- `scanPulse` CSS animation: `src/style.css` (already used by wormhole dot and scan bar) — do not redefine
- Redshift CSS variables: `src/style.css` lines 152–176 — `--rs-bg-surface: #1a1528`, `--rs-teal: #00b4d8`, `--rs-violet: #9b5de5`, `--rs-text-muted: #7a6d8a`

### Key Imports Already Available in HUD.jsx

All needed imports are already present:
- `usePlayer` (line 3) — for `playerRotation` selector
- `useLevel` (line 6) — for `wormhole`, `wormholeState` (already used in JSX)
- `GAME_CONFIG` (line 8) — for `MINIMAP_VISIBLE_RADIUS` (already used)
- `isWithinMinimapRadius` (line 54) — already exported and used for wormhole/planets

No new imports needed.

### References

- Epic spec + Acceptance Criteria: `_bmad-output/planning-artifacts/epic-35-exploration-navigation.md#Story 35.3`
- Edge arrow algorithm: `_bmad-output/planning-artifacts/epic-35-exploration-navigation.md#Technical Notes` (Wormhole edge arrow position section)
- Current minimap implementation: `src/ui/HUD.jsx` lines 18–58 (MINIMAP object + helpers), lines 440–540 (minimap JSX)
- Player rotation field: `src/stores/usePlayer.jsx` line 25 — `rotation: 0` (float radians, ship yaw)
- Redshift CSS variables: `src/style.css` lines 152–176
- `scanPulse` animation: `src/style.css` (used in HUD.jsx line 505)
- IIFE pattern in JSX: `src/ui/HUD.jsx` lines 453–463 (boundary edges computation)
- Story 35.2 player triangle: `_bmad-output/implementation-artifacts/35-2-large-map-overlay.md` (polygon `"5,0 10,12 5,9 0,12"` pointing up)
- GAME_CONFIG.MINIMAP_VISIBLE_RADIUS: `src/config/gameConfig.js`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None._

### Completion Notes List

- Implemented all 6 tasks in a single surgical pass on `src/ui/HUD.jsx`
- MINIMAP constants: removed `borderRadius` and `boxShadow`, updated `borderColor` → `var(--rs-teal)`, `backgroundColor` → `var(--rs-bg-surface)`
- Minimap container: replaced circular shape with angular clipPath `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)`
- Player dot replaced with rotating SVG triangle (▲, 8×10px, teal), reads `usePlayer.rotation` reactively
- `minimapWormholeArrowPosition` exported pure function added with square-boundary ray-casting algorithm
- Wormhole rendering split into two mutually exclusive branches: within-radius dot (unchanged) and off-screen edge arrow (new, violet SVG)
- Compass labels restyled to Space Mono, `var(--rs-text-muted)`, 0.5rem — remain fixed (no rotation)
- Existing test suite updated: removed deleted MINIMAP keys (`borderRadius`, `boxShadow`) from required-keys list; added 10 new tests for `minimapWormholeArrowPosition` and updated MINIMAP assertions
- All 144 test files, 2437 tests pass with 0 regressions
- **Code review fixes (2026-02-23)**: M1 — arrow edge clamping added (cx/cz 4-96%/5-95% so 6×8px SVG stays fully inside `overflow:hidden` container); M2 — `MINIMAP.wormholeColor` updated from hardcoded `#bb88ff` to `var(--rs-violet)` for Redshift DS consistency; M3 — added `minimapWormholeArrowPosition` test with non-zero player position. 31/31 minimap tests pass.

### File List

- `src/ui/HUD.jsx` (modified)
- `src/ui/__tests__/HUD.minimap.test.jsx` (modified)

### Change Log

- 2026-02-23: Story 35.3 — Minimap reskin: square clipPath, rotating player triangle, wormhole off-screen edge arrow (claude-sonnet-4-6)
- 2026-02-23: Code review fixes — arrow edge clamping, wormhole color alignment to --rs-violet, non-zero player position test (claude-sonnet-4-6)
