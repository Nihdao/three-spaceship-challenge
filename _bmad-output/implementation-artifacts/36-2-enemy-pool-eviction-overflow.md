# Story 36.2: Enemy Pool Eviction on Overflow

Status: done

## Story

As a developer,
I want new enemy waves to always spawn even when the pool is full,
so that late-game tension never stalls due to stale old-wave enemies.

## Acceptance Criteria

1. **Given** `spawnEnemies(instructions)` called when `enemies.length >= MAX_ENEMIES_ON_SCREEN`
   **When** the overflow would otherwise silently discard the new batch
   **Then** the oldest non-elite, non-boss enemies are removed to free exactly `instructions.length` slots (or as many as available from non-protected enemies)
   **And** "oldest" = lowest numeric ID suffix — sort by parsing `enemy_${n}` suffix as integer

2. **Given** evicted enemies
   **When** removed
   **Then** they are silently despawned — no death explosion, no XP drop, no loot, no `_teleportEvents` emitted
   **And** the enemies array is updated in the same `set()` call as the new batch spawn

3. **Given** the new batch
   **When** pool was full and oldest enemies evicted
   **Then** the new enemies spawn at their intended positions as normal

4. **Given** `MAX_ENEMIES_ON_SCREEN`
   **When** reviewed post-story
   **Then** the value remains 100 — no change to the cap itself, only the overflow behavior changes

5. **Given** enemies with `behavior === 'boss'` or whose def has `tier === 'ELITE'` (check via `ENEMIES[e.typeId]?.tier`)
   **When** eviction candidates are selected
   **Then** these enemies are NEVER evicted regardless of their ID

6. **Given** fewer evictable enemies than slots needed
   **When** `instructions.length` > number of non-protected enemies available
   **Then** only as many enemies as are evictable are removed — remaining new enemies from the batch are not spawned (partial batch acceptable)

## Tasks / Subtasks

- [x] Task 1: Modify `spawnEnemies()` in `useEnemies.jsx` to support pool eviction (AC: #1–#6)
  - [x] Change `const state = get()` to `let state = get()` at the top of `spawnEnemies` — needed to rebind after computing survivors
  - [x] Remove (or restructure) the early-return guard `if (available <= 0 || instructions.length === 0) return` — keep the `instructions.length === 0` guard, but replace `available <= 0` with the eviction path
  - [x] Add eviction logic before the batch-build loop (see Dev Notes for exact code pattern)
  - [x] After eviction, recalculate `available` from the updated `currentEnemies.length`
  - [x] Keep the batch-build loop (lines 93–132) unchanged — no modifications to enemy construction
  - [x] In the final `set()` call, use `currentEnemies` (survivors) + `batch`: `enemies: [...currentEnemies, ...batch]`

- [x] Task 2: Tests (AC: #1–#6)
  - [x] Test: pool full (100 enemies), `spawnEnemies([1 instruction])` → 1 oldest evicted, 1 new spawned, total = 100
  - [x] Test: evicted enemy has lowest numeric ID suffix (oldest enemy removed, not arbitrary)
  - [x] Test: pool full + 5 new instructions → 5 oldest evicted, 5 new spawned, total = 100
  - [x] Test: pool full with only ELITE enemies (all protected) → 0 evictions, new batch not spawned
  - [x] Test: `_teleportEvents` NOT pushed for evicted enemies (array remains empty)
  - [x] Test: enemies.length stays at `MAX_ENEMIES_ON_SCREEN` after eviction+spawn (when enough evictable exist)

## Dev Notes

### Architecture Context

This story modifies only `src/stores/useEnemies.jsx` — a single-function change to `spawnEnemies()`. No new files, no new stores, no rendering changes, no GameLoop changes.

Layer: Config/Data → Systems → **Stores** ← this story → GameLoop → Rendering → UI

### Critical: `tier` is NOT on the enemy object

The spawned enemy object does NOT include a `tier` field. The fields are:
`id, typeId, x, z, hp, maxHp, speed, damage, radius, behavior, color, meshScale, xpReward, lastHitTime, hitFlashTimer`

To check tier, look up the def:
```js
// ENEMIES is already imported at the top of useEnemies.jsx
ENEMIES[e.typeId]?.tier !== 'ELITE'
```

No ELITE enemies currently exist in `enemyDefs.js` (all tiers are FODDER/SKIRMISHER/ASSAULT), but the guard must be there for forward compatibility.

### Critical: `behavior === 'boss'` is defensive but correct

The boss entity is managed by `useBoss` — it is **never** in `useEnemies.enemies`. The `behavior === 'boss'` check in the filter will never fire in practice, but matches the spec exactly. Keep it.

### Exact Implementation Pattern

```js
spawnEnemies: (instructions) => {
  if (instructions.length === 0) return

  const state = get()
  let currentEnemies = state.enemies

  // Evict oldest non-protected enemies if pool is full
  const slotsNeeded = Math.max(0, currentEnemies.length + instructions.length - GAME_CONFIG.MAX_ENEMIES_ON_SCREEN)
  if (slotsNeeded > 0) {
    const evictable = currentEnemies
      .filter(e => e.behavior !== 'boss' && ENEMIES[e.typeId]?.tier !== 'ELITE')
      .sort((a, b) => parseInt(a.id.slice(6), 10) - parseInt(b.id.slice(6), 10))
    const toEvict = new Set(evictable.slice(0, slotsNeeded).map(e => e.id))
    currentEnemies = currentEnemies.filter(e => !toEvict.has(e.id))
  }

  const available = GAME_CONFIG.MAX_ENEMIES_ON_SCREEN - currentEnemies.length
  if (available <= 0) return

  const batch = []
  let nextId = state.nextId
  const limit = Math.min(instructions.length, available)

  for (let i = 0; i < limit; i++) {
    const instruction = instructions[i]
    const { typeId, x, z, scaling, difficultyMult = 1.0 } = instruction
    const def = ENEMIES[typeId]
    if (!def) continue
    // ... rest of enemy construction unchanged ...
  }

  if (batch.length > 0) {
    set({
      enemies: [...currentEnemies, ...batch],
      nextId,
    })
  }
},
```

### ID Parsing: `'enemy_'.length === 6` → use `.slice(6)`

The ID format is `enemy_${nextId}`. Parsing the suffix:
```js
parseInt(a.id.slice(6), 10)  // faster than .replace('enemy_', '')
```

O(1) per enemy. Sort is O(n log n) but only runs when pool is at capacity — infrequent.

### Exact slotsNeeded Formula

The epic says "free exactly `instructions.length` slots". The precise minimum eviction count is:
```
slotsNeeded = max(0, (currentEnemies.length + instructions.length) - MAX_ENEMIES_ON_SCREEN)
```
Not just `instructions.length` — if the pool has 98/100 and 3 new enemies come in, only 1 eviction is needed (not 3).

### No regression on common case

When `currentEnemies.length + instructions.length <= MAX_ENEMIES_ON_SCREEN`, `slotsNeeded === 0` and the eviction block is entirely skipped. Zero change to the happy path.

### Test Infrastructure

Tests use Vitest. Pattern:
```js
import { beforeEach, it, expect, describe } from 'vitest'
import useEnemies from '../useEnemies'
import { GAME_CONFIG } from '../../config/gameConfig'

beforeEach(() => { useEnemies.getState().reset() })
```

To fill the pool quickly in tests:
```js
for (let i = 0; i < GAME_CONFIG.MAX_ENEMIES_ON_SCREEN; i++) {
  useEnemies.getState().spawnEnemy('FODDER_BASIC', i, 0)
}
// After this loop: enemies[0].id === 'enemy_0' (oldest), enemies[99].id === 'enemy_99' (newest)
```

For ELITE protection test: since no ELITE enemy type exists yet, test the boss path instead (behavior check), or manually push a fake enemy object to `state.enemies` via `set()` with a typeId whose def would have `tier: 'ELITE'` — but since no such def exists, the simplest option is to test the behavior guard only.

### Previous Story Context (36.1)

Story 36.1 added the leash system to `tick()`. The eviction in 36.2 is independent:
- Leash fires inside `tick()` during the game loop — repositions live enemies
- Eviction fires inside `spawnEnemies()` — removes stale enemies at wave spawn time
- No interaction between the two systems
- No changes needed to the leash code from 36.1

### Project Structure Notes

Files modified:
- `src/stores/useEnemies.jsx` — `spawnEnemies()` function only (lines 88–140)

No new files. No new imports (`ENEMIES` is already imported at the top of the file).

### References

- [Source: src/stores/useEnemies.jsx#L88-140] — `spawnEnemies()` current implementation to modify
- [Source: src/stores/useEnemies.jsx#L42-45] — state shape: `enemies: [], nextId: 0`
- [Source: src/stores/useEnemies.jsx#L50] — `_teleportEvents: []` (NOT used for evictions)
- [Source: src/entities/enemyDefs.js#L18,36,54,72,93,116,140] — tier values: FODDER/SKIRMISHER/ASSAULT (no ELITE yet)
- [Source: src/entities/enemyDefs.js#L171] — `behavior: 'boss'` exists but never in useEnemies pool
- [Source: src/config/gameConfig.js] — `MAX_ENEMIES_ON_SCREEN: 100`
- [Source: src/stores/__tests__/useEnemies.test.js#L60-77] — existing MAX_ENEMIES tests (must remain green)
- [Source: _bmad-output/planning-artifacts/epic-36-enemy-pressure-systems.md#Story-36.2] — epic spec and technical notes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Modified `spawnEnemies()` in `useEnemies.jsx` — added pool eviction block before batch build. Changed `const state = get()` pattern to use `let currentEnemies` for survivor tracking. Replaced the `available <= 0` early return with an eviction path using sort-by-ID-suffix and Set-based filtering. Final `set()` uses `[...currentEnemies, ...batch]`.
- Eviction is O(n log n) but only runs when pool is at capacity. Happy path (pool not full) adds zero overhead — `slotsNeeded === 0` skips the block entirely.
- ELITE tier guard (`ENEMIES[e.typeId]?.tier !== 'ELITE'`) included for forward compatibility; no ELITE enemies exist yet so boss behavior guard was used as proxy in tests.
- 8 new tests added covering AC#1–#6 plus regression. Full suite: 2364 tests, 0 failures.

### File List

- `src/stores/useEnemies.jsx` — `spawnEnemies()` modified with pool eviction logic
- `src/stores/__tests__/useEnemies.poolEviction.test.js` — new test file (9 tests)

### Change Log

- 2026-02-23: Story 36.2 implemented — pool eviction on overflow in `spawnEnemies()`. Oldest non-protected enemies silently despawned to free slots for new waves. No XP drop, no explosions, no teleport events emitted on eviction.
- 2026-02-23: Code review fixes — (M2) added `hadEviction` flag so evictions are committed even when batch ends up empty (invalid typeIds edge case); (M1) added partial batch AC#6 test (95 protected + 5 evictable, 10 instructions → 5 evicted, 5 spawned). 9 tests total, full suite stable.
