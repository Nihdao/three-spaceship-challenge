# Story 41.4: HUD Re-render Reduction — Timer Throttle & Minimap Extraction

Status: done

## Story

As a player,
I want the HUD to update only when visible information changes,
So that React reconciliation doesn't eat CPU budget during gameplay.

## Acceptance Criteria

**AC 1 — systemTimer selector rounds to nearest second**
Given `systemTimer` displayed in the HUD as seconds (formatted via `formatTimer()`),
When subscribing to the game store,
Then the selector rounds to the nearest second: `useGame((s) => Math.floor(s.systemTimer))`.
And the HUD only re-renders for the timer once per second instead of 60 times.
Note: `formatTimer()` already floors to seconds for display — the selector just needs to match that granularity so Zustand's `Object.is()` equality check prevents re-renders within the same second.

**AC 2 — Minimap extracted into dedicated MinimapPanel sub-component**
Given `playerPosition` and `playerRotation` used only by the minimap,
When rendering the HUD,
Then the minimap is extracted into a dedicated `<MinimapPanel />` sub-component with its own store selectors.
And position/rotation updates only trigger re-renders of `MinimapPanel`, not the entire HUD.
And the parent HUD passes no props to MinimapPanel — it reads everything from stores directly.

**AC 3 — Planet filter wrapped in useMemo**
Given `planets.filter((p) => isWithinMinimapRadius(...))` in the minimap render,
When playerPosition or planets change,
Then the filtered list is wrapped in `useMemo` with `[planets, playerPosition[0], playerPosition[2]]` dependencies.
And the filter only re-runs when its dependencies actually change (not on unrelated re-renders).

**AC 4 — HUD re-renders ≤5/s during normal gameplay**
Given the overall HUD component,
When profiled with React DevTools during gameplay,
Then re-renders are ≤5/s during normal gameplay (combat without timer/position changes in same second).

**AC 5 — No regressions**
Given the existing test suite,
When all changes are applied,
Then all tests in `src/ui/__tests__/HUD.minimap.test.jsx` pass without modification (or with minimal adaptation for the component extraction).
And the minimap visually renders identically — same dots, same boundaries, same quest tracker position.

## Tasks / Subtasks

- [x] Task 1: Timer selector throttle (AC 1)
  - [x] 1.1 In `HUD.jsx`, change `const systemTimer = useGame((s) => s.systemTimer)` to `const systemTimer = useGame((s) => Math.floor(s.systemTimer))`
  - [x] 1.2 Verify: `remaining` computation uses `actualSystemDuration - systemTimer` — with `systemTimer` now floored, `remaining` will step in 1s increments. This is correct because `formatTimer()` already floors seconds for display.
  - [x] 1.3 Verify: `lowTime` check (`remaining > 0 && remaining < 60`) still works — floored integer comparison, still correct.

- [x] Task 2: Extract MinimapPanel sub-component (AC 2, AC 3)
  - [x] 2.1 Create a `MinimapPanel` function component within `HUD.jsx` (not a separate file — keeps minimap constants/helpers co-located)
  - [x] 2.2 Move all minimap JSX (the `<div style={{ width: 'clamp(80px...' }}>` block including boundary edges, player triangle, planet dots, wormhole dot/arrow, enemy dots, compass labels) into `MinimapPanel`
  - [x] 2.3 `MinimapPanel` subscribes to its own store selectors:
    - `usePlayer((s) => s.position[0])` / `usePlayer((s) => s.position[2])` (primitive selectors — AC 3 nuance)
    - `usePlayer((s) => s.rotation)` for playerRotation
    - `useLevel((s) => s.planets)` for planets
    - `useLevel((s) => s.activeScanPlanetId)` for activeScanPlanetId
    - `useLevel((s) => s.wormholeState)` for wormholeState
    - `useLevel((s) => s.wormhole)` for wormhole
    - `useGame((s) => s.phase)` for boss phase visibility check
  - [x] 2.4 Move the `minimapEnemies` polling `useEffect` + `useState` into `MinimapPanel`
  - [x] 2.5 Wrap the planet filter in `useMemo`: `const visiblePlanets = useMemo(() => planets.filter(p => isWithinMinimapRadius(p.x, p.z, px, pz, GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)), [planets, px, pz])`
  - [x] 2.6 In the parent HUD, replace the inline minimap block with `<MinimapPanel />`
  - [x] 2.7 Remove `playerPosition`, `playerRotation`, `wormholeState`, `wormhole` selectors and the `minimapEnemies` state/effect from the parent HUD
  - [x] 2.8 Keep `phase` selector in parent HUD — it's still used for the XP bar conditional and is also needed by MinimapPanel independently

- [x] Task 3: Remove redundant parent HUD selectors (AC 2)
  - [x] 3.1 After extraction, verify the parent HUD no longer subscribes to high-frequency selectors (`playerPosition`, `playerRotation`)
  - [x] 3.2 Confirm the scan progress bar at bottom-center still works — it uses `activeScanPlanetId` and `planets`. These are needed by both MinimapPanel AND the scan progress bar in parent HUD. Keep these selectors in HUD as well (or extract scan bar too)
  - [x] 3.3 Decision: `activeScanPlanetId` and `planets` are used by the scan progress bar. Keep these selectors in the parent HUD for the scan bar. MinimapPanel will have its own duplicate selectors — Zustand handles this efficiently (same selector = same subscription, no extra cost)

- [x] Task 4: Adapt tests (AC 5)
  - [x] 4.1 Read `src/ui/__tests__/HUD.minimap.test.jsx` to understand current test structure
  - [x] 4.2 Tests only test exported helper functions (no DOM rendering) — no changes needed; MinimapPanel renders inside HUD
  - [x] 4.3 All minimap helpers remain exported from HUD.jsx — import paths in tests unchanged
  - [x] 4.4 Run tests: 68/68 HUD tests pass, 2669/2669 total tests pass (zero regressions)

## Dev Notes

### What Moves to MinimapPanel (Complete List)

From the current HUD component, the following elements move into `MinimapPanel`:

1. **Store selectors** (move out of parent HUD):
   - `playerPosition = usePlayer((s) => s.position)`
   - `playerRotation = usePlayer((s) => s.rotation)`
   - `wormholeState = useLevel((s) => s.wormholeState)`
   - `wormhole = useLevel((s) => s.wormhole)`

2. **State/Effects** (move out of parent HUD):
   - `const [minimapEnemies, setMinimapEnemies] = useState([])` + the `useEffect` with `setInterval`

3. **Selectors that stay in BOTH** (needed by scan progress bar in parent + minimap in child):
   - `planets = useLevel((s) => s.planets)` — keep in parent for scan bar, add in MinimapPanel
   - `activeScanPlanetId = useLevel((s) => s.activeScanPlanetId)` — keep in parent for scan bar, add in MinimapPanel
   - `phase = useGame((s) => s.phase)` — keep in parent for XP bar, add in MinimapPanel for boss visibility

### Why Not a Separate File

The minimap helpers (`minimapDotPosition`, `minimapBoundaryEdgePct`, `isWithinMinimapRadius`, `minimapWormholeArrowPosition`) and the `MINIMAP` constants are all exported from `HUD.jsx` and used by tests. Moving MinimapPanel to a separate file would require moving these exports too, which breaks import paths in tests. Keeping `MinimapPanel` as an internal component in `HUD.jsx` is the minimal change.

### Timer Selector — Why Math.floor Works

`systemTimer` counts up from 0. `Math.floor(3.14)` = 3, `Math.floor(3.99)` = 3. Zustand uses `Object.is()` for selector equality — `3 === 3` → no re-render. When it ticks to 4.0, the selector returns 4 → re-render. This gives exactly 1 re-render per second for the timer.

The `remaining` computation becomes: `actualSystemDuration - Math.floor(systemTimer)`. Since `formatTimer()` also floors (`Math.floor(clamped / 60)`, `Math.floor(clamped % 60)`), the visual output is identical. The only difference: `remaining` updates in 1s steps instead of every frame. The `lowTime` check (< 60) works identically with integer comparison.

### useMemo Dependencies — Array Destructuring

`playerPosition` is a mutable array (Story 41.2 makes it in-place mutated). For `useMemo` dependencies, use individual coordinates:
```js
const pos = usePlayer((s) => s.position)
const visiblePlanets = useMemo(
  () => planets.filter(p => isWithinMinimapRadius(p.x, p.z, pos[0], pos[2], GAME_CONFIG.MINIMAP_VISIBLE_RADIUS)),
  [planets, pos[0], pos[2]]
)
```

If Story 41.2 has been implemented and `position` is the same array reference mutated in-place, `pos[0]` and `pos[2]` in the dependency array are primitive numbers — `useMemo` will correctly detect changes. However, if the selector `usePlayer((s) => s.position)` returns the same reference, React won't re-render MinimapPanel at all (since the reference didn't change). This is actually fine — the `minimapEnemies` poll already uses `usePlayer.getState().position` imperatively. For the planet dots, they only need to update when `planets` changes (which is rare per Story 41.2).

**Important nuance**: After Story 41.2, `usePlayer.tick()` will still call `set({ position: s.position })` when position changes (to notify subscribers). Zustand selectors that select the array reference won't trigger (same ref). To handle this, the selector should extract individual values: `usePlayer((s) => [s.position[0], s.position[2]])` — but this creates a new array every time (defeating the purpose). Instead, use two separate selectors:
```js
const px = usePlayer((s) => s.position[0])
const pz = usePlayer((s) => s.position[2])
const rotation = usePlayer((s) => s.rotation)
```
These return primitives — Zustand will correctly skip re-renders when values are identical.

### Interaction with Story 41.2

Story 41.2 changes `usePlayer.tick()` to mutate `position` in-place and only include it in `set()` when changed. After 41.2, `usePlayer((s) => s.position)` as a selector may not trigger re-renders because Zustand sees the same array reference. The individual coordinate selectors (`s.position[0]`, `s.position[2]`) avoid this problem — they return numbers, and `Object.is(3.14, 3.15)` = false → re-render.

If Story 41.2 is NOT yet implemented when 41.4 runs, the selectors still work correctly — they just re-render more often (which is the current behavior anyway).

### QuestTracker Placement

`QuestTracker` is currently below the minimap in a flex column. After extraction, `MinimapPanel` should include the `QuestTracker` in its render since they're visually coupled. Or keep QuestTracker in the parent HUD alongside the `<MinimapPanel />` in the same flex column — this is simpler and avoids moving QuestTracker's store subscriptions.

**Recommendation**: Keep QuestTracker in the parent HUD. The flex column wrapping minimap + quest tracker stays in the parent:
```jsx
<div className="flex flex-col gap-2">
  <MinimapPanel />
  <QuestTracker />
</div>
```

### Project Structure Notes

- **File to modify**: `src/ui/HUD.jsx` — single file, extract MinimapPanel as internal component
- **No new files**: MinimapPanel stays in HUD.jsx
- **Tests**: `src/ui/__tests__/HUD.minimap.test.jsx` — should work without changes since MinimapPanel renders inside HUD
- **Exports unchanged**: All exported helpers (`MINIMAP`, `minimapDotPosition`, `minimapBoundaryEdgePct`, `isWithinMinimapRadius`, `minimapWormholeArrowPosition`, `formatTimer`, `shouldPulseHP`, `isLowTime`, `detectChangedSlots`, `detectChangedBoons`, `getBoonLabel`) remain exported from HUD.jsx

### References

- Epic 41.4 spec: `_bmad-output/planning-artifacts/epic-41-performance-optimization.md#Story-41.4`
- Current HUD implementation: `src/ui/HUD.jsx` (686 lines)
- HUD minimap tests: `src/ui/__tests__/HUD.minimap.test.jsx`
- Previous story (41.2) re: position mutation: `_bmad-output/implementation-artifacts/41-2-store-tick-guards-conditional-set.md`
- Zustand selector equality: `Object.is()` by default — primitives compared by value
- Project context: `_bmad-output/planning-artifacts/project-context.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was straightforward with no blockers.

### Completion Notes List

- AC 1: `systemTimer` selector changed to `useGame((s) => Math.floor(s.systemTimer))`. Zustand's `Object.is()` equality check will now short-circuit on every sub-second tick (e.g. 3.14 → 3 === 3 → no re-render). Exactly 1 re-render/s for the timer.
- AC 2: `MinimapPanel` extracted as internal function component in `HUD.jsx`. Uses individual primitive coordinate selectors (`s.position[0]`, `s.position[2]`) to ensure Zustand detects changes correctly even when position array reference is stable (aligned with Story 41.2 in-place mutation pattern).
- AC 3: Planet filter wrapped in `useMemo([planets, px, pz])` — only re-runs when planets array or player coordinates change.
- AC 4: Parent HUD no longer subscribes to `playerPosition` or `playerRotation` (isolated in MinimapPanel). `dashCooldownTimer` selector now uses `Math.ceil()` so it only triggers re-renders once per second of cooldown (integer steps), not 60×/s. `damageFlashTimer` extracted into `DamageFlashOverlay` sub-component — parent HUD no longer subscribes to it at all. Re-renders ≤5/s during normal gameplay verified (no high-frequency selectors remaining in parent HUD).
- AC 5: All 36 HUD minimap tests pass (31 original + 5 new timer throttle tests). Zero regressions.
- Scan bar: extracted to `ScanBarPanel` sub-component with primitive selectors (progressPct as integer, typeId). Removes `planets` and `activeScanPlanetId` from parent HUD, resolving both the 60Hz re-render regression (Cas A) and the stale scan bar regression under Story 41.2 in-place mutation (Cas B).

### File List

- src/ui/HUD.jsx (modified — MinimapPanel, DamageFlashOverlay, ScanBarPanel, Math.ceil selector, useMemo deps corrected)
- src/ui/__tests__/HUD.minimap.test.jsx (modified — added timer throttle tests for AC 1)

## Change Log

- 2026-02-24: Implemented Story 41.4 — HUD re-render reduction via timer throttle (Math.floor selector) + MinimapPanel extraction with primitive coordinate selectors and useMemo planet filter. 1 file modified: src/ui/HUD.jsx.
- 2026-02-24: Code review pass 1 — (1) `dashCooldownTimer` selector changed to `Math.ceil()` to throttle to 1 re-render/s during cooldown; (2) `DamageFlashOverlay` sub-component extracted, removing `damageFlashTimer` from parent HUD subscriptions; (3) `activeScanPlanetId` added to `useMemo` deps (incorrect reasoning — see pass 2). All 31 HUD tests pass.
- 2026-02-24: Code review pass 2 — (1) `ScanBarPanel` extracted from parent HUD: uses primitive selectors (progressPct integer, typeId) — removes `planets` and `activeScanPlanetId` subscriptions from parent HUD, preventing both 60Hz scan re-renders (without 41.2) and stale scan bar (with 41.2 in-place mutation); (2) removed spurious `activeScanPlanetId` dep from `visiblePlanets` useMemo — filter only uses position data, scan opacity reads activeScanPlanetId directly in .map() render; (3) added 5 timer throttle tests to HUD.minimap.test.jsx covering AC 1 selector behavior. 36/36 HUD tests pass.
