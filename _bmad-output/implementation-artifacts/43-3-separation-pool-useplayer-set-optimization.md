# Story 43.3: Separation System Object Pool & usePlayer set() Optimization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want enemy separation and player tick to produce zero transient objects,
so that the combined per-frame GC pressure from stores and systems is eliminated.

## Acceptance Criteria

1. **AC1 — Separation stub pool**: Given `separationSystem.js` calling `spatialHash.insert({ id, numericId, x, z, radius })` per enemy, when 100+ enemies are alive, then uses a module-level pool of stub objects (`_sepStubs`) mutated in-place instead of creating 100 new objects per frame. The pool grows lazily (only allocates new stubs when enemy count exceeds pool size) and never shrinks.

2. **AC2 — usePlayer Object.keys removal**: Given `usePlayer.tick()` building a `changed = {}` object each frame, when checking `Object.keys(changed).length > 0` to decide whether to call `set()`, then uses a boolean `let hasChange = false` flag set to `true` at each field assignment into `changed`. The `Object.keys()` call is removed entirely.

3. **AC3 — usePlayerCamera spread elimination**: Given `usePlayerCamera.jsx` suppressing shake during pause, when `isPaused && playerState.cameraShakeTimer > 0`, then passes `0` directly to `computeCameraFrame` as the shake timer value instead of spreading `{ ...playerState, cameraShakeTimer: 0 }`. `computeCameraFrame` receives `shakeTimerOverride` as a parameter (or the caller sets `effectiveShakeTimer = 0` and passes it).

4. **AC4 — All tests pass**: Given `vitest run`, when the story is implemented, then all existing tests pass — including `usePlayer.movement.test.js`, `usePlayer.inertiaPhysics.test.js`, `usePlayer.conditionalSet.test.js`, `separationSystem.test.js`.

## Tasks / Subtasks

- [x] Task 1 — Separation stub pool in `separationSystem.js` (AC: #1)
  - [x] 1.1 Add module-level `const _sepStubs = []` and `function _getStub(i)` that returns an existing stub or lazily allocates a new one
  - [x] 1.2 In the `applySeparation()` enemy loop (lines 45–54), replace `spatialHash.insert({ id, numericId, x, z, radius })` with `const s = _getStub(i); s.id = e.id; s.numericId = e.numericId; s.x = e.x; s.z = e.z; s.radius = GAME_CONFIG.ENEMY_SEPARATION_RADIUS; spatialHash.insert(s)`
  - [x] 1.3 Verify no downstream code mutates the stub objects after `insert()` (spatialHash reads fields, never writes back to inserted objects)

- [x] Task 2 — Replace `Object.keys(changed).length` with boolean flag in `usePlayer.jsx` (AC: #2)
  - [x] 2.1 Add `let hasChange = false` before the `changed = {}` declaration (line ~268)
  - [x] 2.2 Add `hasChange = true` in each `if (field !== state.field) { changed.field = field }` block (17 blocks total: currentHP, position, velocity, rotation, bankAngle, aimDirection, _prevVelAngle, speed, contactDamageCooldown, isInvulnerable, invulnerabilityTimer, isDashing, dashTimer, dashCooldownTimer, damageFlashTimer, cameraShakeTimer, cameraShakeIntensity)
  - [x] 2.3 Replace `if (Object.keys(changed).length > 0) set(changed)` (line ~296) with `if (hasChange) set(changed)`

- [x] Task 3 — Eliminate `{ ...playerState }` spread in `usePlayerCamera.jsx` (AC: #3)
  - [x] 3.1 Modify `computeCameraFrame` signature to accept an explicit `shakeTimerOverride` parameter (or add it as a final optional param)
  - [x] 3.2 Inside `computeCameraFrame`, use `shakeTimerOverride` when provided (not `undefined`/`null`) instead of `playerState.cameraShakeTimer`
  - [x] 3.3 At the call site (line ~66), remove the `effectivePlayerState` spread logic — pass `playerState` directly and pass `isPaused ? 0 : undefined` as the override
  - [x] 3.4 Verify tests that call `computeCameraFrame` still work (it's exported and tested)

- [x] Task 4 — Run tests and verify (AC: #4)
  - [x] 4.1 `npx vitest run` passes at 100%
  - [x] 4.2 Spot-check separation behavior in-game (enemies don't overlap)

## Dev Notes

### Architecture Compliance

- **6-layer architecture**: This story touches **Systems** layer (`separationSystem.js`), **Stores** layer (`usePlayer.jsx`), and **Hooks** layer (`usePlayerCamera.jsx`). No GameLoop or renderer changes.
- **Zustand pattern**: `usePlayer.jsx` maintains the `create((set, get) => ({ ... }))` pattern. The change is internal to `tick()` — only the gating mechanism changes, not the `set()` call itself.
- **Module-level pre-allocation**: Follows the pattern established by Epic 41 (`_damageMap`, `_killIds` in useEnemies, `_processedPairs`/`_enemyMap` in separationSystem) and Epic 43.1 (`_activeBuffer`/`_readBuffer`).

### Critical Source Analysis — separationSystem.js (lines 45–54)

```js
// CURRENT — allocates 1 object per enemy per frame:
for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i]
  spatialHash.insert({
    id: e.id,
    numericId: e.numericId,
    x: e.x,
    z: e.z,
    radius: GAME_CONFIG.ENEMY_SEPARATION_RADIUS,
  })
}
```

**Replacement — pool of reusable stubs:**
```js
// Module-level (after _enemyMap declaration, ~line 10):
const _sepStubs = []

function _getStub(i) {
  if (i >= _sepStubs.length) {
    _sepStubs.push({ id: '', numericId: 0, x: 0, z: 0, radius: 0 })
  }
  return _sepStubs[i]
}

// In applySeparation(), replace lines 45-54:
for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i]
  const s = _getStub(i)
  s.id = e.id
  s.numericId = e.numericId
  s.x = e.x
  s.z = e.z
  s.radius = GAME_CONFIG.ENEMY_SEPARATION_RADIUS
  spatialHash.insert(s)
}
```

**Safety**: `spatialHash.insert()` stores references in its grid cells, but the grid is `clear()`-ed at line 39 before the insert loop. The stubs are only read during `queryNear()` within the same frame, before the next `clear()`. Reusing stubs across frames is safe because the spatial hash never retains references beyond a single frame.

### Critical Source Analysis — usePlayer.jsx tick() (lines 268–298)

```js
// CURRENT — Object.keys() allocates an array every frame:
const changed = {}
if (currentHP !== state.currentHP) changed.currentHP = currentHP
if (posChanged) changed.position = pos
if (velChanged) changed.velocity = vel
if (yaw !== state.rotation) changed.rotation = yaw
if (bank !== state.bankAngle) changed.bankAngle = bank
// ... 8 more field checks ...

if (Object.keys(changed).length > 0) {
  set(changed)
}
```

**Replacement:**
```js
const changed = {}
let hasChange = false
if (currentHP !== state.currentHP) { changed.currentHP = currentHP; hasChange = true }
if (posChanged) { changed.position = pos; hasChange = true }
if (velChanged) { changed.velocity = vel; hasChange = true }
if (yaw !== state.rotation) { changed.rotation = yaw; hasChange = true }
if (bank !== state.bankAngle) { changed.bankAngle = bank; hasChange = true }
// ... 8 more field checks, each adding hasChange = true ...

if (hasChange) {
  set(changed)
}
```

**Note**: The `changed = {}` object literal is still allocated each frame. This is a single small allocation that Zustand needs as its merge target — it cannot be pooled because `set()` merges it into state and retains the reference. The `Object.keys()` elimination removes the additional array allocation.

### Critical Source Analysis — usePlayerCamera.jsx (lines 59–66)

```js
// CURRENT — spreads entire playerState object during pause:
const playerState = usePlayer.getState();
const effectivePlayerState = isPaused && playerState.cameraShakeTimer > 0
  ? { ...playerState, cameraShakeTimer: 0 }
  : playerState;
computeCameraFrame(state.camera, smoothedPosition.current, effectivePlayerState, delta, offsetY, posSmooth, state.clock.elapsedTime);
```

`computeCameraFrame` (line 15) only destructures 3 fields from `playerState`:
```js
export function computeCameraFrame(camera, smoothedPosition, playerState, delta, offsetY, posSmooth, elapsedTime) {
  const { position, cameraShakeTimer, cameraShakeIntensity } = playerState;
```

**Replacement approach — add `shakeTimerOverride` parameter:**
```js
// Modify computeCameraFrame signature:
export function computeCameraFrame(camera, smoothedPosition, playerState, delta, offsetY, posSmooth, elapsedTime, shakeTimerOverride) {
  const { position, cameraShakeIntensity } = playerState
  const cameraShakeTimer = shakeTimerOverride !== undefined ? shakeTimerOverride : playerState.cameraShakeTimer

// At call site, remove spread:
const playerState = usePlayer.getState()
const shakeOverride = isPaused && playerState.cameraShakeTimer > 0 ? 0 : undefined
computeCameraFrame(state.camera, smoothedPosition.current, playerState, delta, offsetY, posSmooth, state.clock.elapsedTime, shakeOverride)
```

This eliminates the `{ ...playerState }` spread (which copies ~30+ fields) and replaces it with a single `undefined` or `0` value.

### Test Files That May Need Attention

| Test file | Why |
|-----------|-----|
| `src/systems/__tests__/separationSystem.test.js` | Tests separation behavior — should be behavioral (correct push vectors), not implementation detail. Stub pooling is transparent. |
| `src/stores/__tests__/usePlayer.conditionalSet.test.js` | Tests conditional set() gating. Currently may test that `set()` is NOT called when nothing changes — still works with `hasChange` flag. |
| `src/stores/__tests__/usePlayer.movement.test.js` | Tests movement tick results — unaffected by gating mechanism change. |
| `src/stores/__tests__/usePlayer.inertiaPhysics.test.js` | Tests inertia physics — unaffected. |

**No tests should break** — all changes are implementation-internal optimizations that preserve identical observable behavior.

### Previous Stories Intelligence

**Story 43.1** (ready-for-dev): Refactored `useEnemies.spawnEnemies` eviction to zero-allocation single-pass loop, `damageEnemiesBatch` minimal kill capture, and `consumeTeleportEvents` double-buffer. Established the pattern of module-level buffers for hot-path allocation elimination. **No file overlap with 43.3.**

**Story 43.2** (ready-for-dev): Refactored `GameLoop.jsx` — module-level `_composedWeaponMods`, shockwave arc pool, in-place compaction, DN batching, `.find()` → `for` loop. **No file overlap with 43.3.**

Both previous stories follow the same zero-allocation philosophy this story continues. Pattern: identify per-frame allocation → replace with module-level reusable structure → mutate in-place.

### Git Intelligence

Recent commits focus on UI/design system work (Epics 33-34). The performance optimization work (Epic 41-43) is a parallel workstream. No merge conflicts expected with the files in this story.

### Project Structure Notes

- Three files modified: `src/systems/separationSystem.js`, `src/stores/usePlayer.jsx`, `src/hooks/usePlayerCamera.jsx`
- No new files created
- No new dependencies
- All changes align with Epic 41 pre-allocation conventions

### References

- [Source: _bmad-output/planning-artifacts/epic-43-performance-hotpath-residual-gc.md#Story 43.3]
- [Source: src/systems/separationSystem.js — applySeparation lines 31-72, insert loop lines 45-54]
- [Source: src/stores/usePlayer.jsx — tick() lines 82-298, changed object lines 268-298]
- [Source: src/hooks/usePlayerCamera.jsx — computeCameraFrame line 15, useFrame lines 50-67, spread lines 59-66]
- [Source: _bmad-output/planning-artifacts/project-context.md — architecture, conventions]
- [Source: _bmad-output/implementation-artifacts/43-1-spawn-eviction-zero-allocation-refactor.md — previous story patterns]
- [Source: _bmad-output/implementation-artifacts/43-2-gameloop-residual-allocations-cleanup.md — previous story patterns]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None — implementation proceeded without blockers.

### Completion Notes List
- Task 1: Added `_sepStubs[]` pool + `_getStub(i)` function at module-level in `separationSystem.js`. Replaced the `spatialHash.insert({...})` inline object literal with stub mutation. Pool grows lazily, never shrinks. Verified spatialHash never writes back to stubs.
- Task 2: Added `let hasChange = false` alongside the `changed = {}` declaration in `usePlayer.tick()`. All 17 conditional assignment blocks now set `hasChange = true`. Replaced `Object.keys(changed).length > 0` with `hasChange`.
- Task 3: Added `shakeTimerOverride` as 8th parameter to `computeCameraFrame`. Extracts `cameraShakeTimer` from override when provided (not `undefined`), otherwise falls back to `playerState.cameraShakeTimer`. Call site now passes `playerState` directly with `shakeOverride = isPaused && playerState.cameraShakeTimer > 0 ? 0 : undefined`.
- Task 4: Full test suite — 2698/2698 passing, 0 regressions.

### Scope Note (Review)
The git diff for the 3 claimed files also contains changes from other stories (Story 41.2/41.3 in `separationSystem.js` and `usePlayer.jsx`, plus unrelated random spawn position in `usePlayer.reset()`/`resetForNewSystem()`). These are NOT part of Story 43.3 — they were already present in the working tree when 43.3 was implemented. Story 43.3's specific contributions are: `_sepStubs`/`_getStub()` in separationSystem, `hasChange` flag in usePlayer.tick(), and `shakeTimerOverride` parameter in usePlayerCamera.

### File List
- src/systems/separationSystem.js
- src/stores/usePlayer.jsx
- src/hooks/usePlayerCamera.jsx
- src/hooks/__tests__/usePlayerCamera.test.js (review fix: added shakeTimerOverride test coverage)

## Change Log
- 2026-02-25: Story 43.3 implemented — separation stub pool, Object.keys elimination, playerState spread elimination. Zero regressions.
- 2026-02-25: Code review — added 2 tests for `shakeTimerOverride` path (H1 fix), corrected task block count 13→17 (M2), added scope note documenting other-story changes in shared files (M1).
