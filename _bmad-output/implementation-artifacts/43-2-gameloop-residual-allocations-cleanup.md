# Story 43.2: GameLoop Residual Allocations Cleanup

Status: done

## Story

As a player,
I want zero JavaScript object allocations per frame in the GameLoop,
So that GC pauses never coincide with spawn/combat spikes.

## Acceptance Criteria

1. **Given** `composedWeaponMods` object in GameLoop (currently line ~304)
   **When** the frame tick runs
   **Then** `composedWeaponMods` is a module-level object mutated in-place (`_composedWeaponMods.damageMultiplier = ...`) instead of a new object literal each frame

2. **Given** the shockwave `stillPending = []` pattern (currently line ~661)
   **When** pending arcs exist
   **Then** uses an in-place compaction (write-index) instead of allocating a new `stillPending` array each frame
   **And** the `shockwaveArcs.filter(a => a.active)` pruning (line ~745) uses the same in-place compaction pattern

3. **Given** `new Set()` allocated per shockwave arc (currently line ~688)
   **When** a new arc is created
   **Then** reuses arc objects from a pool with `arc.hitEnemies.clear()` instead of allocating a fresh `Set` per arc
   **And** the pool has a fixed size matching `poolLimit * 3` (the pruning threshold)

4. **Given** `_dnEntries` used separately per weapon system (laser cross, magnetic, shockwave, mine, tactical, projectile)
   **When** each weapon system generates damage numbers
   **Then** all systems accumulate into a single `_dnEntries` array across the entire frame
   **And** `spawnDamageNumbers(_dnEntries)` is called once at the end of section 7 (after all weapon damage is resolved), not after each weapon type
   **And** this reduces `useDamageNumbers.set()` calls from up to 6 per frame to exactly 1

5. **Given** the player contact damage section (currently line ~1046)
   **When** `aliveEnemies.find(e => e.id === playerHits[i].id)` is called
   **Then** uses a `for` loop with direct ID comparison instead of `.find()` callback allocation
   **And** the same pattern applies to `shockwaves.find()` (line ~1064) and `enemyProj.find()` (line ~1082)

6. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass

## Tasks / Subtasks

- [x] Task 1 — Module-level `_composedWeaponMods` (AC #1)
  - [x] Add `const _composedWeaponMods = { damageMultiplier: 1, cooldownMultiplier: 1, critChance: 0, critMultiplier: 2.0, projectileSpeedMultiplier: 1.0, zoneMultiplier: 1 }` at module scope (after `_eligibleTargets` declaration, ~line 78)
  - [x] Replace `const composedWeaponMods = { ... }` block (lines ~304-311) with 6 field mutations on `_composedWeaponMods`
  - [x] Replace all `composedWeaponMods` references in useFrame with `_composedWeaponMods`

- [x] Task 2 — Shockwave `stillPending` in-place compaction (AC #2a)
  - [x] Remove `const stillPending = []` at line ~661
  - [x] Replace `stillPending.push(pending)` (in the else branch) with write-index compaction: `swWeapon.shockwavePendingArcs[writeIdx++] = pending`
  - [x] Replace `swWeapon.shockwavePendingArcs = stillPending` at line ~695 with `swWeapon.shockwavePendingArcs.length = writeIdx`
  - [x] Add `let writeIdx = 0` before the pending arcs loop

- [x] Task 3 — Shockwave `filter(a => a.active)` in-place compaction (AC #2b)
  - [x] Replace the `shockwaveArcs.filter(a => a.active)` call at line ~745 with write-index in-place compaction

- [x] Task 4 — Arc pool for `new Set()` elimination (AC #3)
  - [x] Add module-level `const _swArcPool = []` and `function _getSwArc(...)` that returns a pooled or new arc object (with `hitEnemies.clear()`)
  - [x] Replace `swWeapon.shockwaveArcs.push({ ..., hitEnemies: new Set(), ... })` at line ~677 with `_getSwArc(...)` pattern
  - [x] Ensure pool respects the `poolLimit * 3` maximum (arcs beyond the limit are pruned by Task 3)

- [x] Task 5 — Consolidate DN batching to single `spawnDamageNumbers` call (AC #4)
  - [x] Add single `_dnEntries.length = 0` reset once at the start of section 7 (before `_projectileHits.length = 0` or just after, around line 455)
  - [x] Remove the 6 individual `_dnEntries.length = 0` calls before each weapon's DN loop (laser cross ~541, magnetic ~595, shockwave ~751, mine ~863, tactical ~953, projectile ~1000)
  - [x] Remove the 6 individual `useDamageNumbers.getState().spawnDamageNumbers(_dnEntries)` calls inside each weapon block
  - [x] Remove the `if (_dnEntries.length > 0)` guards that wrap those calls (they are no longer needed per-weapon)
  - [x] Add a single `if (_dnEntries.length > 0) useDamageNumbers.getState().spawnDamageNumbers(_dnEntries)` call after section 7b (after the projectile death events loop, before section 7d at line ~1034)

- [x] Task 6 — Replace `.find()` callbacks with `for` loops (AC #5)
  - [x] Line ~1046: `aliveEnemies.find((e) => e.id === playerHits[i].id)` → `for` loop with `break`
  - [x] Line ~1064: `shockwaves.find(s => s.id === swHits[i].id)` → `for` loop with `break`
  - [x] Line ~1082: `enemyProj.find(p => p.id === epHits[i].id)` → `for` loop with `break`

- [x] Task 7 — Run test suite
  - [x] `npx vitest run` — all tests pass (158 files, 2694 tests)

## Dev Notes

### Precise File Locations in `src/GameLoop.jsx`

All changes are in a single file. Current line references (from code audit, may shift slightly):

| AC | Current code | Location |
|----|-------------|----------|
| AC#1 | `const composedWeaponMods = { ... }` | lines 304–311 |
| AC#2a | `const stillPending = []` + `swWeapon.shockwavePendingArcs = stillPending` | lines 661, 695 |
| AC#2b | `swWeapon.shockwaveArcs.filter(a => a.active)` | lines 744–746 |
| AC#3 | `hitEnemies: new Set()` in `shockwaveArcs.push({...})` | line 688 |
| AC#4 | `_dnEntries.length = 0` + `spawnDamageNumbers` | lines 541-545, 595-599, 751-755, 863-867, 953-957, 1000-1015 |
| AC#5 | `.find(...)` callbacks | lines 1046, 1064, 1082 |

### `_composedWeaponMods` Implementation Pattern

```js
// At module level (after _eligibleTargets declaration):
const _composedWeaponMods = {
  damageMultiplier: 1,
  cooldownMultiplier: 1,
  critChance: 0,
  critMultiplier: 2.0,
  projectileSpeedMultiplier: 1.0,
  zoneMultiplier: 1,
}

// Inside useFrame, replace lines 304-311 with:
_composedWeaponMods.damageMultiplier = composeDamageMultiplier(playerState, boonModifiers, upgradeStats, dilemmaStats)
_composedWeaponMods.cooldownMultiplier = (boonModifiers.cooldownMultiplier ?? 1) * upgradeStats.cooldownMult * dilemmaStats.cooldownMult * playerState.permanentUpgradeBonuses.attackSpeed
_composedWeaponMods.critChance = boonModifiers.critChance ?? 0
_composedWeaponMods.critMultiplier = boonModifiers.critMultiplier ?? 2.0
_composedWeaponMods.projectileSpeedMultiplier = boonModifiers.projectileSpeedMultiplier ?? 1.0
_composedWeaponMods.zoneMultiplier = playerState.permanentUpgradeBonuses.zone
```

Note: `const composedWeaponMods = ...` was a `const`, so all downstream reads of `composedWeaponMods` must be renamed to `_composedWeaponMods`. The variable is used in: `useWeapons.getState().tick(...)` call, and inside every `7a-*` weapon block. Use find-and-replace within the file.

### `stillPending` In-Place Compaction Pattern

```js
// Replace this (lines ~661-695):
if (swWeapon.shockwavePendingArcs?.length > 0) {
  const stillPending = []
  for (let p = 0; p < swWeapon.shockwavePendingArcs.length; p++) {
    const pending = swWeapon.shockwavePendingArcs[p]
    pending.remainingDelay -= clampedDelta
    if (pending.remainingDelay <= 0) {
      // ... spawn arc ...
    } else {
      stillPending.push(pending)
    }
  }
  swWeapon.shockwavePendingArcs = stillPending
}

// With this:
if (swWeapon.shockwavePendingArcs?.length > 0) {
  let writeIdx = 0
  for (let p = 0; p < swWeapon.shockwavePendingArcs.length; p++) {
    const pending = swWeapon.shockwavePendingArcs[p]
    pending.remainingDelay -= clampedDelta
    if (pending.remainingDelay <= 0) {
      // ... spawn arc ... (unchanged)
    } else {
      swWeapon.shockwavePendingArcs[writeIdx++] = pending
    }
  }
  swWeapon.shockwavePendingArcs.length = writeIdx
}
```

Key: `swWeapon.shockwavePendingArcs` is already an array (initialized at line 643). Mutating its length and contents in-place avoids any allocation.

### Shockwave Arc Pool Pattern

```js
// Module-level (add after _swArcPool declaration):
const _swArcPool = []

function _getSwArc(centerX, centerZ, aimAngle, sectorAngle, maxRadius, expandSpeed, damage, isCrit) {
  for (let i = 0; i < _swArcPool.length; i++) {
    if (!_swArcPool[i].active) {
      const arc = _swArcPool[i]
      arc.centerX = centerX
      arc.centerZ = centerZ
      arc.aimAngle = aimAngle
      arc.sectorAngle = sectorAngle
      arc.prevRadius = 0
      arc.currentRadius = 0
      arc.maxRadius = maxRadius
      arc.expandSpeed = expandSpeed
      arc.damage = damage
      arc.isCrit = isCrit
      arc.hitEnemies.clear()   // ← reuse Set, no allocation
      arc.active = true
      return arc
    }
  }
  // Pool miss — allocate new arc (only on first use per slot)
  const arc = {
    centerX, centerZ, aimAngle, sectorAngle,
    prevRadius: 0, currentRadius: 0,
    maxRadius, expandSpeed, damage, isCrit,
    hitEnemies: new Set(),
    active: true,
  }
  _swArcPool.push(arc)
  return arc
}
```

Replace the `swWeapon.shockwaveArcs.push({ ..., hitEnemies: new Set(), ... })` block with:
```js
const newArc = _getSwArc(
  playerPos[0], playerPos[2],
  pending.aimAngle, swDef.waveSectorAngle,
  pending.effectiveMaxRadius, swDef.waveExpandSpeed,
  pending.damage, pending.isCrit
)
swWeapon.shockwaveArcs.push(newArc)
```

Note: `shockwaveArcs` itself is still a regular array pushed to on arc creation. The pool is for the **arc objects** (and their embedded `Set`), not for the outer array. The outer array is pruned via in-place compaction (Task 3).

### DN Batching — Correct Order

The current code spawns DN **before** calling `damageEnemiesBatch` (enemy positions valid), then applies damage. With batching, DN entries from each weapon are collected in-order into `_dnEntries` (no reset between weapons). `spawnDamageNumbers` is called once at the end.

**Critical**: Keep the per-weapon `damageEnemiesBatch` calls in their existing order — only the DN flush is deferred. Death handling (explosions, loot, kill counter) stays immediately after each `damageEnemiesBatch`. Only the `spawnDamageNumbers` call moves.

Placement of the single flush: after section 7b's death events loop (after line ~1031) and before section 7d (player contact damage, ~line 1034):

```js
// End of 7b death processing...
    }
  }
}

// Single DN flush — all weapon systems accumulated into _dnEntries
if (_dnEntries.length > 0) useDamageNumbers.getState().spawnDamageNumbers(_dnEntries)

// 7d. Player-enemy contact damage
```

### `.find()` Replacement Pattern

```js
// Before (allocates a closure + binding per call):
const enemy = aliveEnemies.find((e) => e.id === playerHits[i].id)

// After (zero allocation):
let enemy = null
for (let k = 0; k < aliveEnemies.length; k++) {
  if (aliveEnemies[k].id === playerHits[i].id) { enemy = aliveEnemies[k]; break }
}
```

Apply the same pattern for:
- `shockwaves.find(s => s.id === swHits[i].id)` → declare `let sw = null` before the loop at line ~1062
- `enemyProj.find(p => p.id === epHits[i].id)` → declare `let ep = null` before the loop at line ~1080

Note: `enemyProj` was declared at line 444 via `const enemyProj = useEnemies.getState().enemyProjectiles`. The `ep.active = false` at line 1085 mutates the object in the live state (not a snapshot) — this existing behavior is preserved since `enemyProj` is the same array reference.

### Architecture Compliance

- **6-layer architecture**: This change is purely in GameLoop (layer 4). No stores, systems, or renderers are modified.
- **Module-level mutable objects**: Follows the existing pattern established in Epic 41 (`_projectileHits`, `_laserCrossHits`, etc. are all module-level).
- **No new store subscriptions**: All data flows through existing `getState()` calls.
- **No React state involved**: `_composedWeaponMods` and `_swArcPool` are plain JS objects outside React's reconciliation.
- **WebGL memory**: No Three.js objects involved — pure JS data structures.

### Testing Notes

GameLoop is an R3F `useFrame` component and has no direct unit tests. Correctness is validated indirectly via the store-level test suite:

- `src/stores/__tests__/useWeapons.shockwave.test.js` — verifies shockwave damage logic
- `src/stores/__tests__/useWeapons.test.js` — general weapon tests
- `src/stores/__tests__/useEnemies.knockback.test.js` — enemy damage/knockback
- `vitest run` — full suite baseline

**There are no tests that directly verify the allocation patterns** — the refactor's correctness is structural (same logic, different data structure). Visual/perf verification is via Chrome DevTools Allocation timeline.

### Epic 41 Patterns to Follow

The refactor follows patterns already established in Epic 41:
- Module-level pre-allocated arrays: `_projectileHits`, `_laserCrossHits`, `_magHits`, etc. (already in file)
- Single-pass loops with `length = 0` reset (already used for hit arrays)
- Entity pool (`entityPoolRef.current`) for collision registration

`_composedWeaponMods` follows the same design as these arrays — module-level, mutated in-place, never replaced with a new object.

### Previous Story (43.1) Context

Story 43.1 (`43-1-spawn-eviction-zero-allocation-refactor`) has not yet been implemented (status: backlog). It modifies `src/stores/useEnemies.jsx` only. Story 43.2 modifies `src/GameLoop.jsx` only. **There is no file overlap** — these stories can be developed independently or in sequence without merge conflicts.

If 43.1 is done first, its `damageEnemiesBatch` minimal capture refactor means `event.enemy` will contain only `{ x, z, typeId, color }` instead of the full enemy spread. The GameLoop currently reads `event.enemy.x`, `.z`, `.color`, `.typeId` from death events — which matches the minimal capture fields exactly. Story 43.2 is compatible with either state of 43.1.

### Project Structure Notes

- Only file touched: `src/GameLoop.jsx` (1464 lines, single file)
- All module-level additions go in the top section, after the existing pre-allocated arrays block (lines 69–83)
- No new files, no imports added

### References

- Epic spec: [Source: `_bmad-output/planning-artifacts/epic-43-performance-hotpath-residual-gc.md#Story-43.2`]
- GameLoop source (audited): `src/GameLoop.jsx` — all line numbers verified against current code
- Epic 41 patterns: `_bmad-output/implementation-artifacts/41-1-gameloop-zero-allocation-frame-tick.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- **Task 1 (AC#1)**: Added module-level `_composedWeaponMods` object after `_eligibleTargets`. Replaced `const composedWeaponMods = {}` declaration (6-field object literal per frame) with 6 in-place mutations. Renamed all reads via replace_all — no downstream behavior change.
- **Task 2 (AC#2a)**: Replaced `stillPending = []` + `shockwavePendingArcs = stillPending` pattern with `let writeIdx = 0` + `shockwavePendingArcs.length = writeIdx` compaction. Zero array allocation per frame for pending arc bookkeeping.
- **Task 3 (AC#2b)**: Replaced `shockwaveArcs.filter(a => a.active)` with write-index in-place compaction (same pruneIdx pattern). Eliminates one array allocation per pruning event.
- **Task 4 (AC#3)**: Added `_swArcPool` and `_getSwArc()` at module scope. Arc objects (including their embedded `Set`) are reused from the pool; `hitEnemies.clear()` replaces `new Set()`. Pool grows only on first use per slot, steady-state is zero allocation.
- **Task 5 (AC#4)**: Single `_dnEntries.length = 0` at start of section 7. All 6 per-weapon DN reset+flush pairs removed. Accumulation happens across laser cross → magnetic → shockwave → mine → tactical → projectiles. Single `spawnDamageNumbers(_dnEntries)` call placed between end of 7b and start of 7d. Reduces `useDamageNumbers.set()` calls from up to 6 per frame to exactly 1.
- **Task 6 (AC#5)**: Replaced 3 `.find()` callback allocations with `for` loops at aliveEnemies (7d), shockwaves (7d-bis), enemyProj (7d-ter). Each uses `let x = null` + `break` pattern from Dev Notes.
- **Task 7**: `npx vitest run` — 158 test files, 2694 tests, all passed. Zero regressions.

### File List

- `src/GameLoop.jsx`

## Change Log

- 2026-02-25: Implemented all 6 tasks — `_composedWeaponMods` module-level mutation, `stillPending` + `filter` in-place compaction, `_swArcPool` arc pool, single `_dnEntries` flush, `.find()` → `for` loop replacements. 158 tests pass, 0 regressions. (claude-sonnet-4-6)
- 2026-02-25: **Code review fixes** (claude-opus-4-6):
  - [H1] Fixed arc pool double-reference bug: moved `shockwaveArcs` inactive-arc pruning BEFORE pending arc processing to prevent `_getSwArc()` from reactivating arcs still referenced in the array (caused 2x expansion speed)
  - [M1] Replaced `tacticalStrikes.splice(s, 1)` with write-index compaction (zero allocation)
  - 158 test files, 2696 tests, all pass
