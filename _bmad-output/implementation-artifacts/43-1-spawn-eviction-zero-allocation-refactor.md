# Story 43.1: Spawn/Eviction Path Zero-Allocation Refactor

Status: done

## Story

As a player,
I want enemy spawning to never cause a visible frame stutter,
so that combat remains fluid even when the enemy pool is full and new enemies need to replace old ones.

## Acceptance Criteria

1. **AC1 — Eviction path zero-allocation**: Given `useEnemies.spawnEnemies()` with a full enemy pool requiring eviction, when `slotsNeeded > 0`, then the eviction path does NOT call `.filter()`, `.sort()`, `.slice()`, `.map()`, or construct a `new Set()`. Instead it iterates `currentEnemies` once with a `for` loop, selecting the first `slotsNeeded` non-boss/non-ELITE enemies (exploiting insertion order = age order, since `numericId` is monotonically increasing), marks them via `e._evict = true`, and the final array is built with a single `for` loop that skips evicted and appends the new batch.

2. **AC2 — Sort removal**: Given the old sort comparator `parseInt(a.id.slice(6), 10) - parseInt(b.id.slice(6), 10)`, then sorting is entirely removed — enemies are already in insertion order in the `enemies` array because `nextId` is monotonically increasing and enemies are appended via `[...currentEnemies, ...batch]`.

3. **AC3 — Minimal kill capture in damageEnemiesBatch**: Given `damageEnemiesBatch()` when an enemy is killed, then captures only the 4 fields used downstream: `{ x: enemy.x, z: enemy.z, typeId: enemy.typeId, color: enemy.color }` instead of `{ ...enemy }` (full ~15-property shallow copy).

4. **AC4 — consumeTeleportEvents double-buffer**: Given `consumeTeleportEvents()` when teleport events exist, then uses a double-buffer swap pattern with module-level `_teleportBuffer`/`_teleportEvents` instead of `.slice()`.

5. **AC5 — All tests pass**: Given `vitest run`, then all existing tests pass including `useEnemies.poolEviction.test.js`, `useEnemies.leash.test.js`, `useEnemies.knockback.test.js`, and `useEnemies.damage.test.js`.

## Tasks / Subtasks

- [x] Task 1 — Refactor eviction path in `spawnEnemies` (AC: #1, #2)
  - [x] 1.1 Replace `.filter().sort().slice().map()` + `new Set()` + `.filter()` chain with single `for` loop iterating from index 0
  - [x] 1.2 Mark first `slotsNeeded` evictable enemies (non-boss, non-ELITE) with `e._evict = true`
  - [x] 1.3 Build final array with one `for` loop: skip `_evict` entries, append new batch
  - [x] 1.4 Remove the `.sort()` entirely (insertion order IS age order)
- [x] Task 2 — Minimal kill capture in `damageEnemiesBatch` (AC: #3)
  - [x] 2.1 Replace `{ ...enemy }` with `{ x: enemy.x, z: enemy.z, typeId: enemy.typeId, color: enemy.color }` in the killed branch
- [x] Task 3 — Double-buffer for `consumeTeleportEvents` (AC: #4)
  - [x] 3.1 Add module-level `let _activeBuffer = []; let _readBuffer = []`
  - [x] 3.2 Teleport push writes to `_activeBuffer` (replace `get()._teleportEvents.push(...)` with `_activeBuffer.push(...)`)
  - [x] 3.3 `consumeTeleportEvents` swaps buffers and returns the read buffer
  - [x] 3.4 Remove `_teleportEvents` from Zustand state (it no longer needs to be reactive)
  - [x] 3.5 Update `reset()` to clear both module-level buffers
- [x] Task 4 — Run tests and verify (AC: #5)
  - [x] 4.1 `vitest run` passes at 100%
  - [x] 4.2 Verify pool eviction tests still validate correct enemy removal behavior

## Dev Notes

### Architecture Compliance

- **6-layer architecture**: This story only touches the **Stores** layer (`useEnemies.jsx`). No GameLoop, system, or renderer changes.
- **Zustand pattern**: `create((set, get) => ({ ... }))` — maintain this pattern. The eviction and kill logic live inside store actions.
- **In-place mutation**: Enemy positions are already mutated in-place in `tick()`. The eviction refactor follows this pattern — mark `_evict` in-place, then build the new array for `set()`.

### Critical Source Analysis — Current Eviction Code (lines 105-113)

```js
// CURRENT — 6 allocations per eviction frame:
const evictable = currentEnemies
  .filter(e => e.behavior !== 'boss' && ENEMIES[e.typeId]?.tier !== 'ELITE')  // alloc #1
  .sort((a, b) => parseInt(a.id.slice(6), 10) - parseInt(b.id.slice(6), 10)) // alloc #2 (sort callback + string ops)
const toEvict = new Set(evictable.slice(0, slotsNeeded).map(e => e.id))      // alloc #3 (slice) + #4 (map) + #5 (Set)
if (toEvict.size > 0) {
  currentEnemies = currentEnemies.filter(e => !toEvict.has(e.id))             // alloc #6
  hadEviction = true
}
```

**Replacement pattern:**
```js
// REFACTORED — single pass, zero intermediate allocations:
if (slotsNeeded > 0) {
  let evicted = 0
  for (let i = 0; i < currentEnemies.length && evicted < slotsNeeded; i++) {
    const e = currentEnemies[i]
    if (e.behavior !== 'boss' && ENEMIES[e.typeId]?.tier !== 'ELITE') {
      e._evict = true
      evicted++
    }
  }
  hadEviction = evicted > 0
}

// Build final array (replaces [...currentEnemies, ...batch]):
const result = []
for (let i = 0; i < currentEnemies.length; i++) {
  if (!currentEnemies[i]._evict) result.push(currentEnemies[i])
}
for (let i = 0; i < batch.length; i++) {
  result.push(batch[i])
}
```

### Critical Source Analysis — damageEnemiesBatch Kill Capture (line 539)

Current: `results.push({ killed: true, enemy: { ...enemy } })` — spreads all ~15 properties.

Downstream usage in `GameLoop.jsx` (verified by grep):
- `event.enemy.x` — explosion position
- `event.enemy.z` — explosion position
- `event.enemy.color` — explosion color
- `event.enemy.typeId` — passed to `rollDrops(typeId, x, z, enemyInstance)`

`rollDrops` 4th arg accesses `enemyInstance?.dropOverrides?.[lootId]` — `dropOverrides` does NOT exist on spawned enemies (verified in `spawnEnemies` construction). Optional chaining returns `undefined`, falls through to global config. Safe to omit.

**Replacement:**
```js
results.push({ killed: true, enemy: { x: enemy.x, z: enemy.z, typeId: enemy.typeId, color: enemy.color } })
```

### Critical Source Analysis — consumeTeleportEvents (lines 560-566)

Current: `events.slice()` allocates a new array copy every call.

**Replacement — double-buffer swap:**
```js
// Module level:
let _activeBuffer = []
let _readBuffer = []

// In tick() and leash system, replace get()._teleportEvents.push(...) with:
_activeBuffer.push({ oldX, oldZ, newX: e.x, newZ: e.z })

// consumeTeleportEvents:
consumeTeleportEvents: () => {
  if (_activeBuffer.length === 0) return _readBuffer  // return empty (already cleared)
  const tmp = _readBuffer
  _readBuffer = _activeBuffer
  _activeBuffer = tmp
  _activeBuffer.length = 0
  return _readBuffer
},
```

**Important**: Remove `_teleportEvents` from Zustand state since it's now module-level. Update `reset()` to clear both buffers:
```js
reset: () => {
  _activeBuffer.length = 0
  _readBuffer.length = 0
  set({ enemies: [], nextId: 0, shockwaves: [], nextShockwaveId: 0, enemyProjectiles: [], nextEnemyProjId: 0 })
}
```

### Teleport Event Push Locations (must all switch to `_activeBuffer`)

1. **Line 446** — teleport behavior in `tick()`: `get()._teleportEvents.push({ oldX, oldZ, newX: e.x, newZ: e.z })`
2. **Line 489** — leash system in `tick()`: `get()._teleportEvents.push({ oldX, oldZ, newX: e.x, newZ: e.z })`

Both must become `_activeBuffer.push(...)`.

### Test Files That May Need Attention

| Test file | Why |
|-----------|-----|
| `src/stores/__tests__/useEnemies.poolEviction.test.js` | Tests eviction behavior — verify it tests correct enemies are removed, not implementation details |
| `src/stores/__tests__/useEnemies.leash.test.js` | Tests teleport events — may access `_teleportEvents` from state directly |
| `src/stores/__tests__/useEnemies.knockback.test.js` | Tests enemy mutation — should be unaffected |
| `src/stores/__tests__/useEnemies.damage.test.js` | Tests `damageEnemiesBatch` results — may assert on `enemy` object having all fields |

**Critical**: If `useEnemies.damage.test.js` asserts `result.enemy.hp` or other fields beyond `{ x, z, typeId, color }` for killed enemies, those assertions will fail. Check and update tests to only assert the 4 minimal fields for `killed: true` results.

### Project Structure Notes

- Single file change: `src/stores/useEnemies.jsx`
- No new files created
- No new dependencies
- Aligns with Epic 41 pre-allocation patterns (`_damageMap`, `_killIds` already module-level)

### References

- [Source: _bmad-output/planning-artifacts/epic-43-performance-hotpath-residual-gc.md#Story 43.1]
- [Source: src/stores/useEnemies.jsx — spawnEnemies lines 96-167, damageEnemiesBatch lines 516-552, consumeTeleportEvents lines 560-566]
- [Source: src/GameLoop.jsx — rollDrops usage lines 551-553, 604-606, 765-767, 877-879, 969-971, 1023-1027]
- [Source: src/systems/lootSystem.js — rollDrops function line 39, uses enemyInstance?.dropOverrides only]
- [Source: _bmad-output/planning-artifacts/project-context.md — architecture, conventions]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Bug discovered during implementation: `available` calculation used `currentEnemies.length` without accounting for evicted slots. After marking enemies with `_evict = true`, the length is unchanged so `available = 0` caused early return. Fixed by introducing `evictedCount` variable and using `available = MAX - currentEnemies.length + evictedCount`.
- `consumeTeleportEvents` double-buffer: Dev Notes pattern had a subtle stale-data bug when `_activeBuffer` is empty. Fixed by clearing `_readBuffer` before returning it in the empty branch: `_readBuffer.length = 0; return _readBuffer`.

### Completion Notes List

- **Task 1**: Replaced 6-allocation eviction chain (`.filter().sort().slice().map()` + `new Set()` + `.filter()`) with a single `for` loop marking `_evict = true` on eligible enemies. Final array built with two `for` loops (skip evicted, append batch). `available` calculation updated to `MAX - length + evictedCount` to account for freed slots.
- **Task 2**: `{ ...enemy }` spread in `damageEnemiesBatch` kill branch replaced with `{ x, z, typeId, color }` — the 4 fields verified downstream in GameLoop (explosion position, color, rollDrops typeId). `xpReward` confirmed NOT read from kill events in GameLoop (XP via orb collection).
- **Task 3**: `_teleportEvents` removed from Zustand state. Module-level `_activeBuffer`/`_readBuffer` added. Both push sites (`tick` teleport behavior, leash system) updated to `_activeBuffer.push(...)`. `consumeTeleportEvents` uses double-buffer swap. `reset()` clears both buffers.
- **Test updates**: 4 test files updated — `poolEviction` and `leash` tests switched from `getState()._teleportEvents` to `consumeTeleportEvents()`. `damage` test removed `deathEvent.enemy.id` assertion (not in minimal capture). `difficultyScaling` test updated: `xpReward` verified on spawned entity (not kill event), kill event checked for minimal `{x, z, typeId}` fields.
- **Full regression**: 158 test files, 2694 tests, 100% pass.

### File List

- src/stores/useEnemies.jsx
- src/stores/__tests__/useEnemies.poolEviction.test.js
- src/stores/__tests__/useEnemies.leash.test.js
- src/stores/__tests__/useEnemies.damage.test.js
- src/systems/__tests__/difficultyScaling.test.js

## Change Log

- (2026-02-25) Story 43.1 implemented: spawn/eviction zero-allocation refactor in `useEnemies.jsx`. Eviction path reduced from 6 intermediate allocations to 0. Minimal kill capture (4 fields). Double-buffer `consumeTeleportEvents`. 4 test files updated.
