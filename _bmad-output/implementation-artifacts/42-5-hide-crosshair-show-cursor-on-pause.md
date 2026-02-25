# Story 42.5: Hide Crosshair & Show Cursor on Pause

Status: done

## Story

As a player,
I want the crosshair to disappear and the normal mouse cursor to appear when I pause the game,
So that I can navigate the pause menu comfortably without the crosshair interfering.

## Acceptance Criteria

1. **Given** `Crosshair.jsx`
   **When** the game is paused (`useGame.isPaused === true`) during `gameplay` or `boss` phase
   **Then** the component returns `null` (crosshair hidden)

2. **Given** `src/index.jsx` — cursor style logic
   **When** the game is paused (`isPaused === true`) while phase is `gameplay` or `boss`
   **Then** `cursor: none` is replaced by `cursor: default` — the native OS cursor becomes visible
   **And** when the game resumes (`isPaused === false`), `cursor: none` is re-applied

3. **Given** the phases `levelUp`, `planetReward`, `revive`
   **When** these modals are displayed (game phase changed, `isPaused: true` in store)
   **Then** existing behavior is preserved — crosshair already hidden by phase check (not gameplay/boss)
   **And** cursor already visible because phase is not gameplay/boss — no change needed

4. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass

## Tasks / Subtasks

- [x] Task 1 — Update `Crosshair.jsx` to hide when paused (AC: #1)
  - [x] Import `useGame` (already imported)
  - [x] Add `const isPaused = useGame((s) => s.isPaused)` selector
  - [x] Add `if (isPaused) return null` after the existing phase check
- [x] Task 2 — Update cursor logic in `src/index.jsx` (AC: #2)
  - [x] Add `isPaused` selector: `const isPaused = useGame((s) => s.isPaused)`
  - [x] Change `cursorStyle` to: `(phase === 'gameplay' || phase === 'boss') && !isPaused ? 'none' : 'default'`
- [x] Task 3 — Run vitest and verify no regressions (AC: #4)

## Dev Notes

### Context

The crosshair (Story 21.2) is a fixed-position HTML overlay that follows the mouse. It currently renders during `gameplay` and `boss` phases unconditionally — including when the game is paused via ESC/P.

The cursor hiding (also Story 21.2) is implemented in `src/index.jsx` via `document.body.style.cursor` and the `<Canvas style={{ cursor }}>`. It currently only considers `phase`, not `isPaused`.

When the player presses ESC/P during gameplay:
- `useGame.phase` stays `'gameplay'` (unchanged)
- `useGame.isPaused` becomes `true`
- `PauseMenu` renders (conditionally in `Interface.jsx`)
- Currently: crosshair still visible, cursor still hidden → **broken UX**

The fix is minimal — two files, two one-line changes.

### Phases & `isPaused` — Truth Table

| Phase | isPaused | Current cursor | Current crosshair | Expected cursor | Expected crosshair |
|-------|----------|---------------|-------------------|-----------------|-------------------|
| `gameplay` | false | none | visible | none | visible |
| `gameplay` | true (ESC) | none | visible | **default** | **hidden** |
| `boss` | false | none | visible | none | visible |
| `boss` | true (ESC) | none | visible | **default** | **hidden** |
| `levelUp` | true | default | hidden | default | hidden |
| `planetReward` | true | default | hidden | default | hidden |
| `revive` | true | default | hidden | default | hidden |
| `gameOver` | true | default | hidden | default | hidden |
| `menu` | false | default | hidden | default | hidden |

Rows 2 and 4 are the only changes needed.

### Files to Touch

| File | Change |
|------|--------|
| `src/ui/Crosshair.jsx` | Add `isPaused` check → return null when paused |
| `src/index.jsx` | Add `isPaused` to cursorStyle computation |

### Current Implementations

**`src/ui/Crosshair.jsx` (line 1–13 relevant):**
```jsx
import { useControlsStore } from '../stores/useControlsStore.jsx'
import useGame from '../stores/useGame.jsx'
import { GAME_CONFIG } from '../config/gameConfig.js'

export default function Crosshair() {
  const phase = useGame((s) => s.phase)
  const mouseScreenPos = useControlsStore((s) => s.mouseScreenPos)

  // Only show during active combat phases (AC 3)
  if (phase !== 'gameplay' && phase !== 'boss') return null
  // ← ADD: if (isPaused) return null
```

**`src/index.jsx` (lines 12–24 relevant):**
```jsx
function App() {
  const phase = useGame((s) => s.phase)
  // ← ADD: const isPaused = useGame((s) => s.isPaused)

  // Story 21.2: Hide OS cursor during gameplay/boss, show during UI phases
  const cursorStyle = (phase === 'gameplay' || phase === 'boss') ? 'none' : 'default'
  // ← CHANGE to: && !isPaused
```

### `useGame` Store Reference

`isPaused` is a boolean field. `setPaused(bool)` is the action. The selector pattern already used in Crosshair.jsx: `const phase = useGame((s) => s.phase)`.

```js
// useGame.jsx — relevant state
isPaused: false,
setPaused: (isPaused) => set({ isPaused }),
```

### Architecture Compliance

- UI layer only — no store changes, no system changes, no GameLoop changes
- Selector pattern follows existing conventions: `useGame((s) => s.isPaused)`
- No new dependencies introduced
- `cursor: none` applied to both `document.body.style.cursor` and `<Canvas style={{cursor}}>` — both must be updated via the `cursorStyle` variable (already handled by existing `useEffect`)

### Testing

No dedicated tests exist for Crosshair.jsx or the cursor behavior in index.jsx — they're visual-only components. The AC4 requirement is to not break existing tests. Run `vitest run` before and after to verify.

If a test file is needed (optional, not required by epic), it would mock `useGame` and assert `Crosshair` returns null when `isPaused: true`.

### Project Structure Notes

- `src/index.jsx` — App entry point, cursor logic lives here
- `src/ui/Crosshair.jsx` — Standalone visual component, no children
- `src/ui/Interface.jsx` — Parent that renders `<Crosshair />` unconditionally (no change needed here)
- `src/stores/useGame.jsx` — Source of truth for `isPaused` and `phase`

### References

- [Source: epic-42-ui-harmonization-deep-cleanup.md#Story 42.5]
- [Source: src/ui/Crosshair.jsx] — existing implementation
- [Source: src/index.jsx] — cursor logic (Story 21.2 comment)
- [Source: src/stores/useGame.jsx] — `isPaused` field and `setPaused` action
- [Source: src/ui/Interface.jsx:193] — PauseMenu render condition (`phase === 'gameplay' && <PauseMenu />`)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: Added `isPaused` selector to `Crosshair.jsx` and `return null` guard after the phase check. Crosshair now hidden when game is paused during gameplay/boss phases.
- Task 2: Added `isPaused` selector to `src/index.jsx` and updated `cursorStyle` computation to include `&& !isPaused`. OS cursor now visible when paused, hidden during active gameplay.
- Task 3: `vitest run` → 157 test files, 2676 tests — all pass, zero regressions.
- Code Review Fix (HIGH): Boss phase pause was inaccessible — ESC handler in `Interface.jsx` gated to `gameplay` only, `PauseMenu` also only rendered during `gameplay`, and `shouldShowPauseMenu` excluded `boss`. Fixed all three to extend boss phase support. `PauseMenu.jsx` handles resume correctly (`setPaused(false)` without phase change, so boss phase is preserved on resume).
- Code Review Fix (MEDIUM): Extracted `shouldShowCrosshair(phase, isPaused)` pure logic helper from `Crosshair.jsx` and created `src/ui/__tests__/Crosshair.test.jsx` covering all 8 truth-table rows + store integration. Also updated `PauseMenu.test.jsx` to assert the new boss+pause behavior.
- Final: `vitest run` → 158 test files, 2689 tests — all pass, zero regressions.

### File List

- src/ui/Crosshair.jsx
- src/index.jsx
- src/ui/PauseMenu.jsx
- src/ui/Interface.jsx
- src/ui/__tests__/Crosshair.test.jsx
- src/ui/__tests__/PauseMenu.test.jsx
