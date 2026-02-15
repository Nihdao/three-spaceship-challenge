# Story 24.1: Minimap — Follow Player & Zoom

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the minimap to follow my ship and show nearby surroundings,
so that I have situational awareness of local threats rather than a full map overview.

## Acceptance Criteria

1. **AC1 — Player-centered viewport:** The minimap is centered on the player's current position (not the map center), shows a zoomed-in view of the area around the player, with the visible radius configurable via `MINIMAP_VISIBLE_RADIUS` in gameConfig.js. The zoom level shows enough area to see approaching enemies before they appear on screen.

2. **AC2 — Element display:** The player ship is always at the center of the minimap. Enemies appear as dots/icons when within the visible radius. Planets, wormhole, and boss appear as distinct icons. The play area boundary is shown as a border/edge indicator when the player is near the edge.

3. **AC3 — Smooth movement:** The minimap content scrolls smoothly (enemy dots move relative to player center). The minimap does NOT rotate with the player (north is always up).

4. **AC4 — Preserve existing styling:** The existing visual style from Story 10.3 is preserved (colors, border, opacity, compass labels). Only the viewport behavior changes (centered on player, zoomed in).

## Tasks / Subtasks

- [x] Task 1 — Add config constant (AC: #1)
  - [x] Add `MINIMAP_VISIBLE_RADIUS` to gameConfig.js (suggested value: 400–600, tune for ~15s enemy warning)
- [x] Task 2 — Refactor minimapDotPosition helper (AC: #1, #3)
  - [x] Update `minimapDotPosition(worldX, worldZ, playerX, playerZ, visibleRadius)` signature
  - [x] Compute positions relative to player: `relativeX = worldX - playerX`, percentage = `50 + (relativeX / visibleRadius) * 50`
  - [x] Add CSS `overflow: hidden` on minimap container to clip out-of-radius elements
- [x] Task 3 — Update player dot rendering (AC: #2)
  - [x] Player dot is always at center (50%, 50%) — no position calculation needed
- [x] Task 4 — Update planet/wormhole/boss dot rendering (AC: #2, #3)
  - [x] Pass playerPosition to minimapDotPosition for each entity
  - [x] Only render entities within visible radius (distance check)
- [x] Task 5 — Add enemy dots to minimap (AC: #2)
  - [x] Poll `useEnemies.getState().enemies` every 200–300ms (existing sniper_fixed pattern)
  - [x] Filter enemies within `MINIMAP_VISIBLE_RADIUS` of player
  - [x] Render as 4px red dots with existing dot transition style
- [x] Task 6 — Update boundary indicator (AC: #2)
  - [x] Calculate play area edges relative to player position
  - [x] Show boundary edge lines when within visible radius
- [x] Task 7 — Update tests (AC: #1–#4)
  - [x] Update existing HUD.minimap.test.jsx tests for new minimapDotPosition signature
  - [x] Add tests: player always at center, entities relative positioning, out-of-radius culling, boundary rendering near edges

## Dev Notes

### Architecture Compliance — 6-Layer Pattern

- **Config Layer** (`src/config/gameConfig.js`): Add `MINIMAP_VISIBLE_RADIUS` constant
- **UI Layer** (`src/ui/HUD.jsx`): All minimap logic stays in HUD — pure CSS/HTML overlay, no 3D rendering
- **Stores** (read-only access): `usePlayer` for position, `useLevel` for planets/wormhole, `useEnemies` for enemies, `useBoss` for boss
- **No GameLoop changes**: Minimap reads from stores, does not affect tick order

### Current Minimap Implementation (HUD.jsx lines 408–503)

The minimap is a **circular HTML div** positioned top-right of the viewport. Key elements:

**Constants object** (lines 17–34):
```javascript
export const MINIMAP = {
  borderRadius: '50%',
  borderColor: 'rgba(34, 211, 238, 0.4)',
  backgroundColor: 'rgba(0,0,0,0.65)',
  playerDotColor: '#00ffcc',
  playerDotSize: '6px',
  planetDotSize: '6px',
  wormholeBaseSize: '6px',
  wormholeActiveSize: '9px',
  wormholeColor: '#bb88ff',
  dotTransition: 'left 40ms ease-out, top 40ms ease-out',
  boundaryInset: '5%',
  boundaryBorder: '1px solid rgba(255,255,255,0.1)',
}
```

**Current transform function** (lines 36–40):
```javascript
export function minimapDotPosition(worldX, worldZ, playAreaSize) {
  const left = `${50 + (worldX / playAreaSize) * 50}%`
  const top = `${50 + (worldZ / playAreaSize) * 50}%`
  return { left, top }
}
```
This maps the ENTIRE play area (±2000 units) to the minimap. Must be replaced with player-relative transform.

**Current elements rendered:**
- Player dot (6px cyan) — line 429–438
- Planet dots (6px tier-colored) — line 440–456
- Wormhole dot (6px/9px purple with pulse) — line 458–471
- Sniper Fixed enemies (4px red) — line 472–483 (polled every 500ms)
- Boundary indicator (inner border at 5% inset) — line 421–427
- Compass labels (N/S/E/W) — line 485–501

### New Transform Logic

```javascript
// NEW: Player-centered minimap
export function minimapDotPosition(worldX, worldZ, playerX, playerZ, visibleRadius) {
  const relativeX = worldX - playerX
  const relativeZ = worldZ - playerZ
  const left = `${50 + (relativeX / visibleRadius) * 50}%`
  const top = `${50 + (relativeZ / visibleRadius) * 50}%`
  return { left, top }
}
```

Player dot becomes trivially: `{ left: '50%', top: '50%' }` (always center).

### Enemy Polling Pattern

The existing sniper_fixed polling (HUD.jsx lines 322–338) uses `setInterval` at 500ms with imperative `useEnemies.getState().enemies` access. This pattern must be reused for all enemies:

```javascript
// Cannot use reactive Zustand selectors for enemies — causes infinite re-renders
// because set() is called inside tick() for shockwave/projectile spawning
useEffect(() => {
  const id = setInterval(() => {
    const enemies = useEnemies.getState().enemies
    // filter by distance from player, then setState
  }, 250)  // 250ms for responsive minimap
  return () => clearInterval(id)
}, [])
```

**Important:** The existing sniper_fixed polling can be merged into this single all-enemies poll to avoid duplicate intervals.

### Boundary Rendering Near Edges

When player is at position (1800, 0) with visibleRadius 500:
- Right boundary (x=2000) is 200 units away → appears at `50 + (200/500)*50 = 70%` from left
- Left boundary (x=-2000) is 3800 units away → off-screen (clipped by overflow:hidden)

Draw boundary edges as lines when they fall within the minimap viewport.

### Entity Visibility Filtering

For performance, filter before rendering:
```javascript
const dx = entityX - playerX
const dz = entityZ - playerZ
const dist = Math.sqrt(dx * dx + dz * dz)
if (dist > visibleRadius) return null  // Don't render — clipped anyway by overflow:hidden
```

Note: `overflow: hidden` on the minimap container provides automatic clipping, so filtering is a performance optimization rather than a visual requirement. However, it avoids creating unnecessary DOM elements.

### Config Tuning Guidance

`MINIMAP_VISIBLE_RADIUS` determines zoom level:
- 300 = very zoomed in, ~15s warning at avg enemy speed 20 u/s
- 500 = moderate zoom, good balance of awareness vs detail
- 800 = wider view, closer to current behavior

Suggested starting value: **500** (playtest and adjust). This should show a 1000×1000 unit window around the player (25% of the full 4000×4000 play area).

### New MINIMAP Constants Needed

```javascript
enemyDotSize: '4px',
enemyDotColor: '#ff4444',       // Red for regular enemies
bossDotSize: '8px',
bossDotColor: '#cc66ff',        // Purple/magenta for boss
enemyPollInterval: 250,         // ms between enemy position polls
```

### Performance Considerations

- **Enemy polling:** 100 enemies × distance check every 250ms = 400 checks/sec (negligible CPU)
- **DOM updates:** Only render enemies within radius (typically 10–30 at any time, not all 100)
- **CSS transitions:** 40ms ease-out prevents jitter while maintaining responsiveness
- **No useFrame in HUD:** The HTML overlay runs outside the R3F render loop, which is correct
- **Individual Zustand selectors:** `usePlayer((s) => s.position)` prevents unnecessary re-renders

### Test File

Existing: `src/ui/__tests__/HUD.minimap.test.jsx` (12 tests from Story 10.3)

Tests to update/add:
- `minimapDotPosition` with new 5-param signature (player-relative)
- Player at center returns 50%/50%
- Entity at player position returns 50%/50%
- Entity at edge of visible radius returns 0% or 100%
- Entity beyond visible radius (if filtering tested separately)
- Boundary line positioning when player near play area edge

### Project Structure Notes

- Alignment with 6-layer architecture: Config → UI, no intermediate layers involved
- No new files created — all changes in existing `HUD.jsx` and `gameConfig.js`
- Test file extended in-place
- Helper function signature change is backwards-incompatible — update all callsites in HUD.jsx

### References

- [Source: _bmad-output/planning-artifacts/epic-24-visual-polish-qol.md#Story 24.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Technical Stack]
- [Source: src/ui/HUD.jsx#lines 17-40, 408-503] — Current minimap implementation
- [Source: src/ui/__tests__/HUD.minimap.test.jsx] — Existing minimap tests
- [Source: src/config/gameConfig.js#PLAY_AREA_SIZE] — Current config
- [Source: src/stores/usePlayer.jsx#position] — Player position access
- [Source: src/stores/useEnemies.jsx] — Enemy store access pattern
- [Source: _bmad-output/implementation-artifacts/10-3-enhanced-minimap-styling.md] — Previous minimap story

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- No blockers or debug issues encountered during implementation.

### Completion Notes List
- **Task 1:** Added `MINIMAP_VISIBLE_RADIUS: 500` to gameConfig.js — 500 units gives a 1000×1000 window (25% of play area), providing ~25s enemy warning.
- **Task 2:** Refactored `minimapDotPosition` from 3-param (absolute) to 5-param (player-relative) signature. Updated all 4 callsites in HUD.jsx.
- **Task 3:** Player dot hardcoded to `left: '50%', top: '50%'` — always centered regardless of player position.
- **Task 4:** Planets and wormhole now use player-relative positioning with `isWithinMinimapRadius` distance filtering. Boss dot not needed as minimap is hidden during boss phase.
- **Task 5:** Replaced sniper_fixed-only enemy poll (500ms) with all-enemies poll (250ms) using squared distance check for performance. Enemies rendered as 4px red dots with dot transition.
- **Task 6:** Replaced fixed 5% inset boundary circle with dynamic edge lines that appear as the player approaches play area borders. Uses `minimapBoundaryEdgePct` helper.
- **Task 7:** Updated all 6 original tests to new 5-param signature. Added 8 new tests: player-at-center, entity positioning, distance culling, boundary edge percentages, new MINIMAP constants.
- **Total tests:** 20 (up from 12), all passing. Full regression suite: 1421/1422 pass (1 pre-existing flaky performance timing test).

### Change Log
- 2026-02-15: Story 24.1 — Minimap follows player position with configurable zoom radius. All enemies visible as red dots. Boundary edges shown dynamically.
- 2026-02-15: Code review fixes — Removed unused bossDotSize/bossDotColor constants (minimap hidden during boss phase). Refactored boundary edge IIFE to use minimapBoundaryEdgePct helper. Added empty-array optimization to enemy poll setState. Changed isWithinMinimapRadius to squared distance comparison.

### File List
- `src/config/gameConfig.js` — Added `MINIMAP_VISIBLE_RADIUS: 500`
- `src/ui/HUD.jsx` — Refactored minimap: player-relative positioning, all-enemy polling, dynamic boundary edges, new MINIMAP constants (enemyDotSize, enemyDotColor, enemyPollInterval), exported helpers (minimapBoundaryEdgePct, isWithinMinimapRadius)
- `src/ui/__tests__/HUD.minimap.test.jsx` — Updated existing tests for new signature, added 8 new tests (20 total)
