# Story 4.7: Bugfix — Reset Enemies on Retry

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want enemies, projectiles, and all level state to be properly cleared when I retry after game over,
So that each new run starts fresh without leftover enemies or stale state from the previous attempt.

## Acceptance Criteria

1. **Given** the player dies and sees the game over screen **When** the player presses R (retry) **Then** all enemies from the previous run are cleared **And** the new gameplay starts with zero enemies on screen **And** the spawn system begins fresh wave spawning from time zero

2. **Given** the player was scanning a planet when they died **When** the player retries **Then** all planet scan progress is reset to 0 **And** `activeScanPlanetId` is cleared **And** planets are re-randomized with fresh positions

3. **Given** the player retries after game over **When** the new gameplay begins **Then** the `wormholeState` is reset to `'hidden'` **And** `difficulty` is reset to 1 **And** the system timer starts from 0

4. **Given** the player retries multiple times **When** each retry occurs **Then** no enemies, scan state, or level state leak between runs **And** performance does not degrade across multiple retries

## Tasks / Subtasks

- [x] Task 1: Add `useEnemies.getState().reset()` to GameLoop reset block (AC: #1)
  - [x] 1.1: In `src/GameLoop.jsx`, inside the phase-transition reset block (line ~62-70), add `useEnemies.getState().reset()` before the existing reset calls
  - [x] 1.2: Ensure `useEnemies` is imported at the top of GameLoop.jsx (verify it's already imported for the tick section)

- [x] Task 2: Replace `useLevel.getState().initializePlanets()` with full `reset()` + `initializePlanets()` (AC: #2, #3)
  - [x] 2.1: In `src/GameLoop.jsx`, replace the single `useLevel.getState().initializePlanets()` call with `useLevel.getState().reset()` followed by `useLevel.getState().initializePlanets()`
  - [x] 2.2: This ensures `activeScanPlanetId`, `wormholeState`, `difficulty`, and `systemTimer` are all properly cleared before new planets are placed

- [x] Task 3: Write unit tests for the reset flow (AC: #1, #2, #3, #4)
  - [x] 3.1: Test that `useEnemies.reset()` clears `enemies` array and resets `nextId` to 0
  - [x] 3.2: Test that `useLevel.reset()` clears `activeScanPlanetId`, `wormholeState`, `difficulty`, `systemTimer`, and `planets`
  - [x] 3.3: Integration-style test: simulate a game-over-to-retry transition and verify all stores are in fresh state

- [ ] Task 4: Manual verification (AC: #1, #4)
  - [ ] 4.1: Play until enemies are on screen, die, press R → verify no enemies visible on retry
  - [ ] 4.2: Retry multiple times → verify no performance degradation or ghost enemies
  - [x] 4.3: Run full test suite — no regressions

## Dev Notes

### Root Cause Analysis

The bug stems from an incomplete reset block in `src/GameLoop.jsx` (lines 60-70). When the game transitions from `gameOver` → `gameplay` on retry, the GameLoop correctly detects the phase change and runs a reset block. However, two critical resets are missing:

1. **`useEnemies.getState().reset()` is never called** — enemies from the previous run remain in the store's `enemies` array and will immediately appear and collide with the player on the first frame of the new game.

2. **`useLevel.getState().initializePlanets()` is called but `reset()` is not** — `initializePlanets()` only sets the `planets` array with fresh planet data. It does NOT reset `activeScanPlanetId` (stale scan state from previous run), `wormholeState` (could be stuck in `'visible'` or `'active'`), `difficulty` (remains elevated from previous run), or `systemTimer` (already reset by `useGame.startGameplay()` but conceptually belongs to useLevel).

### Current Reset Block (GameLoop.jsx lines 60-70)

```javascript
if (phase === 'gameplay' && prevPhaseRef.current !== 'gameplay' && prevPhaseRef.current !== 'levelUp' && prevPhaseRef.current !== 'planetReward') {
  spawnSystemRef.current.reset()
  projectileSystemRef.current.reset()
  useWeapons.getState().initializeWeapons()
  useBoons.getState().reset()
  resetParticles()
  resetOrbs()
  usePlayer.getState().reset()
  useLevel.getState().initializePlanets()  // BUG: no reset() first
  // BUG: useEnemies.getState().reset() is MISSING
}
```

### Fix Overview

Add two lines to the reset block:
1. `useEnemies.getState().reset()` — clears enemy array and resets ID counter
2. `useLevel.getState().reset()` — clears scan state, wormhole state, difficulty, before `initializePlanets()` re-generates planets

### Stores Already Have Proper reset() Methods

| Store | reset() exists? | Clears all fields? |
|-------|----------------|-------------------|
| `useEnemies` | Yes (line 171) | Yes — `{ enemies: [], nextId: 0 }` |
| `useLevel` | Yes (line 126) | Yes — `{ systemTimer: 0, difficulty: 1, planets: [], wormholeState: 'hidden', activeScanPlanetId: null }` |

No store changes are needed — only the GameLoop reset block needs to call the existing methods.

### Project Structure Notes

**Files to MODIFY:**
- `src/GameLoop.jsx` — Add `useEnemies.getState().reset()` and `useLevel.getState().reset()` to the phase-transition reset block

**Files NOT to modify:**
- `src/stores/useEnemies.jsx` — `reset()` already exists and is complete
- `src/stores/useLevel.jsx` — `reset()` already exists and is complete
- `src/stores/useGame.jsx` — `startGameplay()` correctly handles game-level state
- `src/stores/usePlayer.jsx` — Already reset in the block
- `src/stores/useWeapons.jsx` — Already reset via `initializeWeapons()` in the block
- `src/stores/useBoons.jsx` — Already reset in the block
- `src/ui/GameOverScreen.jsx` — Retry handler is correct (calls `startGameplay()`)

### Anti-Patterns to Avoid

- Do NOT add a separate reset orchestrator function — the GameLoop's existing phase-transition block IS the reset orchestrator per architecture decisions
- Do NOT call `reset()` from `startGameplay()` in useGame — architecture mandates "Store resets happen in GameLoop on gameplay transition, not here" (useGame.jsx comment)
- Do NOT create a new "game restart" event system — the phase transition detection in GameLoop is the correct pattern
- Do NOT reset stores that are already being reset — only add the missing ones

### Testing Approach

- **Unit tests (useEnemies store):** `reset()` clears enemies array and nextId
- **Unit tests (useLevel store):** `reset()` clears all fields to initial values
- **Manual test:** Play → die → retry → verify no leftover enemies, no stale scan state, fresh planet placement
- **Regression:** Run full test suite (353+ tests) — no regressions

### Previous Story Intelligence (4.6)

From Story 4.6 dev notes:
- Timer decay pattern in stores: `Math.max(0, timer - delta)` in tick()
- Reset must include ALL state fields (lesson from project memory)
- GameLoop sections 1-9 define deterministic tick order — reset block runs before ticks
- useEnemies store is already imported in GameLoop for the tick section, so no new import needed

### Git Intelligence

Recent commit `ac05a23` implemented Stories 4.2-5.2 including the GameLoop reset block. The missing `useEnemies.reset()` was likely an oversight during the bulk implementation of multiple stories in that commit.

### Scope Summary

This is a minimal 2-line fix in GameLoop.jsx plus tests. The reset methods already exist in the stores — they're just not being called. No new files, no new stores, no architectural changes.

**Key deliverables:**
1. `src/GameLoop.jsx` — Add `useEnemies.getState().reset()` and `useLevel.getState().reset()` to the phase-transition reset block
2. Tests verifying the reset flow works correctly

### References

- [Source: src/GameLoop.jsx#L60-70] — Phase-transition reset block (missing useEnemies.reset() and useLevel.reset())
- [Source: src/stores/useEnemies.jsx#L171] — Existing reset() method: `{ enemies: [], nextId: 0 }`
- [Source: src/stores/useLevel.jsx#L126-132] — Existing reset() method: clears all 5 fields
- [Source: src/stores/useLevel.jsx#L74-124] — initializePlanets() only sets `planets`, does not reset other fields
- [Source: src/stores/useGame.jsx#L18] — startGameplay() only resets game-level state, comment says "Store resets happen in GameLoop"
- [Source: src/ui/GameOverScreen.jsx#L57-63] — Retry handler calls useGame.startGameplay()
- [Source: _bmad-output/planning-artifacts/architecture.md#GameLoop] — GameLoop is the sole bridge between stores
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns] — Stores never import other stores; GameLoop orchestrates

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered — straightforward 2-line fix.

### Completion Notes List

- Added `useEnemies.getState().reset()` to GameLoop phase-transition reset block — clears leftover enemies on retry
- Added `useLevel.getState().reset()` before `initializePlanets()` — clears stale scan state, wormhole state, difficulty, and system timer on retry
- Added comprehensive unit test for `useLevel.reset()` verifying all 5 fields reset to initial values
- Added integration test suite (`resetFlow.test.js`) with 3 tests: enemy clearing, level state clearing, and multi-retry stability
- Full test suite: 407 tests pass, 0 regressions
- Task 4.1/4.2 (manual play testing) left unchecked — requires human verification in browser

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 — 2026-02-11
**Verdict:** Approve with minor fixes applied

**Findings (0 High, 3 Medium, 2 Low):**
- [M1] GameLoop.jsx diff is interleaved with Story 5.3 changes (`prevScanPlanetRef`, `!== 'planetReward'` guard, section 7g scanning). These are 5.3 changes, not 4.7 — attribution noted for commit hygiene.
- [M2] FIXED — `resetFlow.test.js` now includes `useWeapons.initializeWeapons()` and `useBoons.reset()` to mirror the full GameLoop store-level reset sequence. Extracted `simulateGameLoopReset()` helper.
- [M3] The `!== 'planetReward'` guard condition added to the reset block belongs to Story 5.3. File List correctly attributes only the 2-line reset addition to 4.7.
- [L1] FIXED — Task 4 changed from [x] to [ ] since subtasks 4.1/4.2 (manual browser testing) are still unchecked.
- [L2] Dev Notes "Current Reset Block" section shows pre-fix code with `// BUG:` comments — correct as root cause documentation.

**All 4 ACs verified as implemented. 407 tests pass, 0 regressions.**

### Change Log

- 2026-02-11: Fixed incomplete reset on game retry — added `useEnemies.reset()` and `useLevel.reset()` to GameLoop phase-transition block (Story 4.7)
- 2026-02-11: [Review] Improved `resetFlow.test.js` — added `useWeapons` and `useBoons` to match full GameLoop reset sequence; extracted `simulateGameLoopReset()` helper; fixed Task 4 checkbox (subtasks 4.1/4.2 still pending manual verification)

### File List

- `src/GameLoop.jsx` — Modified: added `useEnemies.getState().reset()` and `useLevel.getState().reset()` to reset block (lines 69-70)
- `src/stores/__tests__/useLevel.planets.test.js` — Modified: added test for full `reset()` field coverage
- `src/stores/__tests__/resetFlow.test.js` — New: integration tests for game-over → retry reset flow (3 tests)
