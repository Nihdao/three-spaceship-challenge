# Story 41.3: Spatial Systems — Integer Keys & Pre-allocated Structures

Status: done

## Story

As a player,
I want collision detection and separation to run without allocating memory,
So that dense enemy encounters (100+ enemies) don't trigger GC pauses.

## Acceptance Criteria

**AC 1 — `spatialHash.js` integer cell keys**
Given `spatialHash.js` `_key(cx, cz)` function,
When computing cell keys for entity insertion and querying,
Then returns an integer `((cx & 0xFFFF) << 16) | (cz & 0xFFFF)` instead of a template string.
And the backing `Map` uses integer keys throughout (no behavioral change, just key type change).

**AC 2 — `spatialHash.js` pre-allocated `seen` Set and `result` array**
Given `queryNearby()` creating `new Set()` and `[]` on every call (called 100+ times per frame from both collisionSystem and separationSystem),
When computing entity deduplication during a query,
Then a module-level `const _seenInQuery = new Set()` is used, cleared with `_seenInQuery.clear()` at the start of each `queryNearby` call.
And a module-level `const _queryResult = []` is returned instead of a new `[]` per call, cleared with `_queryResult.length = 0` at the start of each call.

**AC 3 — `separationSystem.js` pre-allocated `processed` Set**
Given `applySeparation()` creating `const processed = new Set()` on every call (60/s with 100+ enemies),
When tracking processed pairs to avoid double-displacement,
Then a module-level `const _processedPairs = new Set()` is used, cleared with `_processedPairs.clear()` at the start of the enemy-enemy separation block.
And all `processed.has()`, `processed.add()` references become `_processedPairs.has()`, `_processedPairs.add()`.

**AC 4 — `separationSystem.js` pre-allocated `enemyMap` Map**
Given `applySeparation()` creating `const enemyMap = new Map()` every frame to allow O(1) enemy lookup by id,
When building the id→enemy lookup map,
Then a module-level `const _enemyMap = new Map()` is used, cleared with `_enemyMap.clear()` before population.
And all `enemyMap.set()`, `enemyMap.get()` references become `_enemyMap.set()`, `_enemyMap.get()`.

**AC 5 — `separationSystem.js` integer pair key**
Given pair keys built as template strings `a < b ? \`${a}|${b}\` : \`${b}|${a}\`` (one string allocation per unique pair checked),
When computing pair identity for two enemies,
Then uses an integer pair key: `const aNum = enemyA.numericId; const bNum = neighbor.numericId; const pairKey = Math.min(aNum, bNum) * 100000 + Math.max(aNum, bNum)`.
And the string template `\`${a}|${b}\`` is removed.

**AC 6 — `useEnemies.jsx` enemy spawn adds `numericId`**
Given enemy IDs formatted `enemy_N` where N is the numeric increment,
When an enemy is spawned in `spawnEnemies()`,
Then the enemy object includes `numericId: nextId` (the raw integer used to build the `id` string).
This allows `separationSystem.js` to read `enemy.numericId` directly without parsing the ID string each frame.

**AC 7 — `PlanetAuraRenderer.jsx` indexed loops**
Given `for (const planet of planets)` iterator allocations in `PlanetAuraRenderer.jsx` (3 occurrences called 60/s),
When iterating the planets array in the `useFrame` hot path,
Then all `for (const planet of planets)` loops are converted to `for (let i = 0; i < planets.length; i++)` with `const planet = planets[i]`.
Note: `for (const s of states.values())` (Map iteration, line 98) is exempt from this AC — it is a Map iterator, not an array, and is a minor allocation relative to the three array loops.

**AC 8 — `useLevel.scanningTick()` indexed loop**
Given `for (const planet of planets)` iterator allocation in `scanningTick()` (called 60/s while scanning),
When finding the closest unscanned planet,
Then the loop is converted to `for (let i = 0; i < planets.length; i++)` with `const planet = planets[i]`.

**AC 9 — No regressions**
Given the existing test suite,
When all changes are applied,
Then all tests in `src/systems/__tests__/spatialHash.test.js` and `src/systems/__tests__/separationSystem.test.js` pass.
And the `separationSystem.test.js` `makeEnemy` helper is updated to include `numericId: parseInt(id.replace(/\D+/, '')) || 0`.
And all other store tests pass without modification.

## Tasks / Subtasks

- [x] Task 1: `spatialHash.js` — integer keys + pre-allocated arrays (AC 1, AC 2)
  - [x] 1.1 Add two module-level declarations at the top of `spatialHash.js` (before `createSpatialHash`): `const _seenInQuery = new Set()` and `const _queryResult = []`
  - [x] 1.2 Change `_key(cx, cz)` body from `` return `${cx},${cz}` `` to `return ((cx & 0xFFFF) << 16) | (cz & 0xFFFF)`
  - [x] 1.3 In `queryNearby()`: replace `const seen = new Set()` with `_seenInQuery.clear()`, and `const result = []` with `_queryResult.length = 0`
  - [x] 1.4 Replace all `seen.has()` / `seen.add()` with `_seenInQuery.has()` / `_seenInQuery.add()`
  - [x] 1.5 Replace `result.push(entity)` with `_queryResult.push(entity)` and `return result` with `return _queryResult`
  - [x] 1.6 Add a JSDoc comment above `_seenInQuery` and `_queryResult` explaining the shared module-level pattern and the single-threaded safety guarantee

- [x] Task 2: `separationSystem.js` — pre-allocated Set + Map + integer pair key (AC 3, AC 4, AC 5)
  - [x] 2.1 Add at module level (before `createSeparationSystem`): `const _processedPairs = new Set()` and `const _enemyMap = new Map()`
  - [x] 2.2 In `applySeparation()`, replace `const processed = new Set()` (line 48) with `_processedPairs.clear()`
  - [x] 2.3 Replace all `processed.has()` / `processed.add()` with `_processedPairs.has()` / `_processedPairs.add()`
  - [x] 2.4 Replace `const enemyMap = new Map()` (line 30) with `_enemyMap.clear()`
  - [x] 2.5 Replace all `enemyMap.set()` / `enemyMap.get()` with `_enemyMap.set()` / `_enemyMap.get()`
  - [x] 2.6 Replace the string pair key block (lines 63-64): remove `const a = enemyA.id; const b = neighbor.id; const pairKey = a < b ? \`${a}|${b}\` : \`${b}|${a}\``
  - [x] 2.7 Replace with: `const aNum = enemyA.numericId; const bNum = neighbor.numericId; const pairKey = Math.min(aNum, bNum) * 100000 + Math.max(aNum, bNum)`
  - [x] 2.8 Add comment: `// Integer pair key — requires enemy.numericId set at spawn (useEnemies.jsx). See Story 41.3.`

- [x] Task 3: `useEnemies.jsx` — add `numericId` to enemy spawn (AC 6)
  - [x] 3.1 In `spawnEnemies()`, in the enemy object literal (around line 132), add `numericId: nextId` immediately after `id: \`enemy_${nextId}\``
  - [x] 3.2 Verify `reset()` does not need changes — enemies are removed from the pool on reset, and `nextId` resets to 0. New enemies spawned post-reset will have correct `numericId`.

- [x] Task 4: `PlanetAuraRenderer.jsx` — indexed loops (AC 7)
  - [x] 4.1 Line 57: change `for (const planet of planets)` to `for (let i = 0; i < planets.length; i++)` and add `const planet = planets[i]` inside
  - [x] 4.2 Line 72: same conversion for the "Update fade states" loop
  - [x] 4.3 Line 104: same conversion for the "Render visible auras" loop
  - [x] 4.4 Leave line 98 (`for (const s of states.values())`) unchanged — Map iterator, not in scope

- [x] Task 5: `useLevel.jsx` — indexed loop in `scanningTick()` (AC 8)
  - [x] 5.1 Line 39: change `for (const planet of planets)` to `for (let i = 0; i < planets.length; i++)` and add `const planet = planets[i]` inside

- [x] Task 6: Update `separationSystem.test.js` `makeEnemy` helper (AC 9)
  - [x] 6.1 Update `makeEnemy` helper (line 6-8) to include `numericId: parseInt(id.replace(/\D+/, '')) || 0`
  - [x] 6.2 Verify: `'e1'` → numericId 1, `'e2'` → numericId 2, `'e3'` → numericId 3, `'e4'` → numericId 4. Pair key 1*100000+2 = 100002, 3*100000+4 = 300004 — all unique. ✓

- [x] Task 7: Run tests (AC 9)
  - [x] 7.1 Run `npm test -- --testPathPattern="spatialHash"` — all 11 tests pass
  - [x] 7.2 Run `npm test -- --testPathPattern="separationSystem"` — all 19 tests pass
  - [x] 7.3 Run `npm test -- --testPathPattern="useEnemies"` — 148 tests pass, no regressions
  - [x] 7.4 Run full suite `npm test` — 2669 tests / 156 files, all pass

## Dev Notes

### Critical: Shared Module-Level `_queryResult` — Safety Guarantee

`_seenInQuery` and `_queryResult` are declared at module level in `spatialHash.js`, shared across all spatial hash instances (collision hash, separation hash, and any test instances). This is safe because:
- JavaScript is **single-threaded** — no concurrent access possible
- Each `queryNearby` call is **synchronous** — no async/await or callbacks
- The result is **consumed before the next call**: in `separationSystem.js`, the inner `for (j)` loop iterates `neighbors` (the `_queryResult` reference) to completion before the outer `for (i)` loop triggers the next `queryNearby`
- In `collisionSystem.js`, `nearby` (= `_queryResult`) is iterated synchronously inside `queryCollisions` before returning; callers receive `collisions` (a new array), not `nearby`

⚠️ **Warning for future devs**: Do NOT hold a reference to `queryNearby()`'s return value across multiple `queryNearby` calls. The returned array is reused and cleared each call.

### Critical: Integer Key Bit-Packing — Range Verification

`_key(cx, cz)` packs two 16-bit values: `((cx & 0xFFFF) << 16) | (cz & 0xFFFF)`

- `PLAY_AREA_SIZE = 2000`, `CELL_SIZE = GAME_CONFIG.SPATIAL_HASH_CELL_SIZE` (default 2)
- Cell coords range: `-1000/2 = -500` to `+500/2 = +500`, well within 16-bit signed range (±32767)
- The `& 0xFFFF` mask handles negative cell coords correctly (two's complement preserved in lower 16 bits)
- Example: `cx = -500` → `-500 & 0xFFFF = 65036` (unsigned 16-bit representation)
- Collision: `cx = -500, cz = 500` → different key than `cx = 500, cz = -500` ✓ (shift ensures no collision)

Verify `GAME_CONFIG.SPATIAL_HASH_CELL_SIZE` before implementation. If it's larger (e.g., 10), cell range shrinks to ±100, even safer.

### Critical: `numericId` and Pair Key Uniqueness

Pair key formula: `Math.min(aNum, bNum) * 100000 + Math.max(aNum, bNum)`

This requires `maxId < 100000`. Since enemies are spawned sequentially and the pool size is bounded (~200 max), this is safe. If the game ever supports 100k+ enemies (it won't), the formula would need updating. Current pool: `GAME_CONFIG.ENEMY_POOL_SIZE` or similar constant.

IDs in tests use `makeEnemy('e1', ...)` → `parseInt('e1'.replace(/\D+/, '')) = 1`. All test IDs are small integers, safe.

### `spatialHash.js`: Note on `collisionSystem.js` Usage

`collisionSystem.js::queryCollisions()` receives `nearby = spatialHash.queryNearby(...)` (which is `_queryResult`), iterates it synchronously, and builds a new `collisions` array. It does NOT return `nearby` to callers — it returns `collisions`. So the shared `_queryResult` pattern is invisible to collision system callers. ✓

### `separationSystem.js`: Note on Shared vs. Separate Spatial Hashes

The separation system has its own `spatialHash` instance (created inside `createSeparationSystem()`). The collision system has a separate instance. Both share the module-level `_queryResult` from `spatialHash.js`. This is safe (see above).

**Future optimization note (documented in code):** The separation spatial hash and collision spatial hash are rebuilt each frame with the same enemy positions. Sharing a single hash would save one O(n) rebuild per frame, but requires coordination between systems. Keep separate for now — different `cellSize` values may be needed.

### `PlanetAuraRenderer.jsx`: Loop Conversion Pattern

The three `for (const planet of planets)` loops become:
```js
for (let i = 0; i < planets.length; i++) {
  const planet = planets[i]
  // ... existing body unchanged
}
```
Do NOT convert `for (const s of states.values())` on line 98 — `states` is a Map, not an array, and iterating Map values with an indexed loop would require `Array.from()` which defeats the purpose.

### `useLevel.jsx scanningTick()` — Only One Loop to Change

Only the "Find closest unscanned planet" loop (line 39) uses `for...of` on `planets`. The scan completion branches use `.map()` — those are outside the scope of story 41.3 (they are addressed in story 41.2 via in-place mutation). Do not change the `.map()` calls here.

### Module-Level Singleton Pattern (Consistent with Epics 41.1 and 41.2)

All module-level pre-allocated structures follow the same pattern established in:
- 41.1: `GameLoop.jsx` module-level `_projectileHits`, `_dnEntries`, `_seenEnemies`, etc.
- 41.2: `useEnemies.jsx` module-level `_damageMap`, `useWeapons.jsx` module-level `_projCountByWeapon`

This story extends the same pattern to `spatialHash.js` and `separationSystem.js`.

### Test Impact Summary

| File | Change | Test Impact |
|---|---|---|
| `spatialHash.js` | integer keys + pre-allocated arrays | Tests use numeric IDs (1, 2) — no change needed in `spatialHash.test.js` |
| `separationSystem.js` | module-level Set/Map + integer pair key | `makeEnemy` helper must add `numericId` field |
| `useEnemies.jsx` | add `numericId: nextId` to spawn | No behavioral change — extra field ignored by existing tests |
| `PlanetAuraRenderer.jsx` | indexed loops | No tests for visual-only components |
| `useLevel.jsx` | indexed loop in `scanningTick` | No behavioral change — `useLevel.planets.test.js` and `useLevel.systemTransition.test.js` should pass without modification |

### Project Structure Notes

Files to modify (5 total, no new files):
- `src/systems/spatialHash.js` — integer keys + module-level pre-alloc
- `src/systems/separationSystem.js` — module-level Set/Map + integer pair key
- `src/stores/useEnemies.jsx` — add `numericId: nextId` to enemy spawn
- `src/renderers/PlanetAuraRenderer.jsx` — indexed array loops
- `src/stores/useLevel.jsx` — indexed array loop in `scanningTick()`
- `src/systems/__tests__/separationSystem.test.js` — update `makeEnemy` helper

### References

- Epic 41.3 spec: `_bmad-output/planning-artifacts/epic-41-performance-optimization.md#Story-41.3`
- `spatialHash.js` current implementation: `src/systems/spatialHash.js` (67 lines)
- `separationSystem.js` current implementation: `src/systems/separationSystem.js` (123 lines)
- `collisionSystem.js` usage of `queryNearby`: `src/systems/collisionSystem.js:60`
- Enemy spawn with `nextId`: `src/stores/useEnemies.jsx:133` (`id: \`enemy_${nextId}\``)
- `PlanetAuraRenderer.jsx` for-of loops: lines 57, 72, 104
- `useLevel.jsx` `scanningTick()` for-of loop: line 39
- Previous story patterns (41.1, 41.2): `_bmad-output/implementation-artifacts/41-1-*.md` and `41-2-*.md`
- `GAME_CONFIG.SPATIAL_HASH_CELL_SIZE`: `src/config/gameConfig.js`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — all tasks implemented cleanly on first pass.

### Completion Notes List

- **Task 1 (spatialHash.js):** Added module-level `_seenInQuery` (Set) and `_queryResult` (array) with JSDoc safety warning. Changed `_key()` from template string to integer bit-packing `((cx & 0xFFFF) << 16) | (cz & 0xFFFF)`. `queryNearby()` now clears and reuses these shared structures. All 11 spatialHash tests pass.
- **Task 2 (separationSystem.js):** Added module-level `_processedPairs` (Set) and `_enemyMap` (Map). Replaced inline `new Set()` / `new Map()` allocations with `.clear()` calls on pre-allocated structures. Replaced string pair key `\`${a}|${b}\`` with integer formula `Math.min(aNum, bNum) * 100000 + Math.max(aNum, bNum)`. All 19 separationSystem tests pass.
- **Task 3 (useEnemies.jsx):** Added `numericId: nextId` immediately after `id: \`enemy_${nextId}\`` in the enemy spawn object literal. No changes to reset() needed — nextId resets to 0 on reset(). All 148 useEnemies tests pass without modification.
- **Task 4 (PlanetAuraRenderer.jsx):** Converted 3 `for...of` array loops to indexed `for` loops. Left `for (const s of states.values())` on Map iteration unchanged as specified.
- **Task 5 (useLevel.jsx):** Converted the `scanningTick()` loop over planets from `for...of` to indexed `for`. No behavioral change.
- **Task 6 (separationSystem.test.js):** Updated `makeEnemy` helper to include `numericId: parseInt(id.replace(/\D+/, '')) || 0`. Test IDs `e1`→1, `e2`→2, `e3`→3, `e4`→4; pair keys all unique.
- **Full suite:** 2669 tests / 156 test files — all pass, zero regressions.

### File List

- `src/systems/spatialHash.js` (modified)
- `src/systems/separationSystem.js` (modified)
- `src/stores/useEnemies.jsx` (modified)
- `src/renderers/PlanetAuraRenderer.jsx` (modified)
- `src/stores/useLevel.jsx` (modified)
- `src/systems/__tests__/separationSystem.test.js` (modified)
- `src/systems/__tests__/spatialHash.test.js` (modified — code review fix)

## Change Log

- 2026-02-24: Story implemented. Replaced all per-frame `new Set()` / `new Map()` / `new []` allocations in spatialHash.js and separationSystem.js with module-level pre-allocated structures. Switched `_key()` from template string to integer bit-packing. Added integer pair key (replacing string template pair key) in separationSystem.js. Added `numericId` field to enemy spawn in useEnemies.jsx. Converted 3 `for...of` array loops in PlanetAuraRenderer.jsx and 1 in useLevel.jsx to indexed loops. All 2669 tests pass.
- 2026-02-24 (code review): Fixed critical bug — `spatialHash.insert()` stub in `separationSystem.js` was missing `numericId`, causing `neighbor.numericId = undefined` and all integer pair keys to collapse to `NaN`. Only the first overlapping pair was processed per frame; remaining pairs silently skipped. Fix: added `numericId: e.numericId` to the insert stub. Added regression test (3 mutually-overlapping enemies) to `separationSystem.test.js`. Added cross-instance `_queryResult` sharing test to `spatialHash.test.js`. 32 tests pass.
