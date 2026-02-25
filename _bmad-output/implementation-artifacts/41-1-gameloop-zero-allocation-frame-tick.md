# Story 41.1: GameLoop Hot Path — Zero-Allocation Frame Tick

Status: done

## Story

As a player,
I want smooth 60 FPS during intense combat with 100+ enemies and multiple weapons active,
So that the game never stutters from garbage collection pauses.

## Acceptance Criteria

**AC 1 — Pre-allocated hit arrays (module-level, cleared with `.length = 0`)**
Given the GameLoop `useFrame` callback,
When processing a full frame with all weapon types active and 100 enemies alive,
Then zero new arrays are allocated for: `projectileHits`, `laserCrossHits`, `magHits`, `swHits`, `mineHits`, `uniqueHits` (mine dedup), `tacticalHits`, and `dnEntries` (shared across all damage-number sections).
And each array is declared as a `const _<name> = []` at module level (outside the component) and cleared with `_<name>.length = 0` at the start of its section.

**AC 2 — Single weapon bucketing pass**
Given the weapon lookup pattern in sections 7a-bis through 7a-sexies,
When the frame tick starts (at the top of section 7a),
Then `activeWeapons` is iterated once with a single `for` loop + `if/else if` on `WEAPONS[w.weaponId]?.weaponType`, storing each weapon reference in a dedicated local variable (`lcWeapon`, `magWeapon`, `swWeapon`, `mineWeapon`, `tactWeapon`).
And the individual `.find()` calls on `activeWeapons` inside each section are removed.

**AC 3 — Enemy position stored in hit objects (eliminate O(N) find loops)**
Given the hit-processing loops for shockwave (section 7a-quater), mine_around (7a-quinquies), and tactical_shot (7a-sexies),
When an enemy is hit and a damage number entry is built,
Then the enemy's `x` and `z` are stored directly in the hit object at creation time: `{ enemyId: enemy.id, damage: dmg, isCrit, x: enemy.x, z: enemy.z }`.
And the `enemies.find(ev => ev.id === ...)` O(N) lookups inside the `dnEntries` build loops are removed.
Note: `magnetic_field` already does this correctly (M4 fix) — replicate to shockwave/mine/tactical.

**AC 4 — Intermediate `.map()` calls eliminated**
Given the shockwave section building `hitsBatch = swHits.map(h => ({ enemyId, damage, isCrit }))`,
And the mine_around section building `uniqueHits.map(h => ...)` for `damageEnemiesBatch`,
When constructing the batch for `damageEnemiesBatch`,
Then the `.map()` pass is eliminated and `_swHits` / `_uniqueHits` are passed directly to `damageEnemiesBatch` (the objects in those arrays already contain `enemyId`, `damage`, `isCrit` — the extra fields like `dirX/dirZ` are benign noise, `damageEnemiesBatch` ignores unknown fields).

**AC 5 — Single `getState()` per store per logical section**
Given `useGame.getState()` and `useWeapons.getState()` called multiple times in the same section,
When the frame tick is running,
Then each store is read via `getState()` at most once per logical section and the result is cached in a local `const`.
Specifically: `useWeapons.getState().activeWeapons` should be read once at the bucketing pass (AC 2), not re-read inside each weapon section. The `useGame.getState()` kill/score calls in death loops can keep calling it inline as they're in side-effect-only paths and not hot per frame.

**AC 6 — `seenEnemies` Set pre-allocated (mine dedup)**
Given `const seenEnemies = new Set()` allocated every time mines detonate (section 7a-quinquies),
When at least one mine triggers in a frame,
Then a module-level `const _seenEnemies = new Set()` is used instead, cleared with `_seenEnemies.clear()` before the dedup loop.

**AC 7 — No regressions**
Given the existing test suite,
When all changes are applied,
Then all tests in `src/stores/__tests__/useWeapons.*.test.js` and related files pass without modification.

## Tasks / Subtasks

- [x] Task 1: Add module-level pre-allocated arrays (AC 1, AC 6)
  - [x] 1.1 At module level in `GameLoop.jsx`, add: `const _projectileHits = []`, `const _laserCrossHits = []`, `const _magHits = []`, `const _swHits = []`, `const _mineHits = []`, `const _uniqueHits = []`, `const _tacticalHits = []`, `const _dnEntries = []`, `const _seenEnemies = new Set()`
  - [x] 1.2 Replace `const projectileHits = []` (line ~443) with `_projectileHits.length = 0`
  - [x] 1.3 Replace each local `const laserCrossHits = []`, `const lcDnEntries = []`, etc. with their module-level equivalents cleared with `.length = 0`
  - [x] 1.4 Replace `const seenEnemies = new Set()` (mine dedup) with `_seenEnemies.clear()`

- [x] Task 2: Weapon bucketing pass (AC 2)
  - [x] 2.1 At the top of section 7a (before 7a-bis), add a single `for` loop iterating `activeWeapons` (obtained from one cached `useWeapons.getState()` call) and bucket into `let lcWeapon = null`, `let magWeapon = null`, `let swWeapon = null`, `let mineWeapon = null`, `let tactWeapon = null` using `WEAPONS[w.weaponId]?.weaponType` switch
  - [x] 2.2 Remove `const { activeWeapons: lcWeapons } = useWeapons.getState(); const lcWeapon = lcWeapons.find(...)` from 7a-bis
  - [x] 2.3 Remove `const { activeWeapons: mfWeapons } = useWeapons.getState(); const magWeapon = mfWeapons.find(...)` from 7a-ter
  - [x] 2.4 Remove `const swWeapons = ...; const swWeapon = swWeapons.find(...)` from 7a-quater
  - [x] 2.5 Remove `const maWeapons = ...; const mineWeapon = maWeapons.find(...)` from 7a-quinquies
  - [x] 2.6 Remove `const tacticalWeapon = useWeapons.getState().activeWeapons.find(...)` from 7a-sexies
  - [x] 2.7 Verify `LASER_CROSS` is matched by `weaponType === 'laser_cross'` (check weaponDefs) — if LASER_CROSS uses `weaponId` directly, use `w.weaponId === 'LASER_CROSS'` instead

- [x] Task 3: Store enemy positions in shockwave hit objects (AC 3)
  - [x] 3.1 In section 7a-quater (shockwave), in the enemy hit detection loop, change the `swHits.push({...})` to include `x: enemy.x, z: enemy.z`
  - [x] 3.2 Replace the `dnEntries` build loop that does `enemies.find(ev => ev.id === swHits[i].enemyId)` with a direct read: `_dnEntries.push({ damage: Math.round(_swHits[i].damage), worldX: _swHits[i].x, worldZ: _swHits[i].z, isCrit: _swHits[i].isCrit })`

- [x] Task 4: Store enemy positions in mine hit objects (AC 3, AC 4)
  - [x] 4.1 In section 7a-quinquies (mine_around), in the AOE detonation loop, change `mineHits.push({...})` to include `x: enemies[e].x, z: enemies[e].z`
  - [x] 4.2 Replace the `dnEntries` build loop that does `enemies.find(ev => ev.id === uniqueHits[i].enemyId)` with a direct read from `_uniqueHits[i].x/z`
  - [x] 4.3 Remove `const hitsBatch = uniqueHits.map(h => ({ enemyId: h.enemyId, damage: h.damage, isCrit: h.isCrit }))` and pass `_uniqueHits` directly to `damageEnemiesBatch`

- [x] Task 5: Store enemy positions in tactical hit objects (AC 3)
  - [x] 5.1 In section 7a-sexies (tactical_shot), in the hit list build, change `tacticalHits.push(...)` to include `x: enemies[e].x, z: enemies[e].z` for the splash hits, and `x: target.x, z: target.z` for the primary
  - [x] 5.2 Replace the `dnEntries` build loop that does `enemies.find(ev => ev.id === tacticalHits[i].enemyId)` with direct read from `_tacticalHits[i].x/z`

- [x] Task 6: Eliminate shockwave intermediate `.map()` (AC 4)
  - [x] 6.1 Remove `const hitsBatch = swHits.map(h => ({ enemyId: h.enemyId, damage: h.damage, isCrit: h.isCrit }))` and pass `_swHits` directly to `damageEnemiesBatch`

- [x] Task 7: Fix projectile section 7b O(N) find loops (AC 3 — projectile hits)
  - [x] 7.1 In section 7b, when building `dnEntries` for `projectileHits`, the current code iterates enemies to find positions. Since projectile hits don't yet have `x/z` stored, add `x: hits[h/0].x, z: hits[h/0].z` — wait, the hits come from the collision system, not directly from enemy objects. The enemy's position is in `enemies[j]` during the find loop. This section already uses a `for` loop with `enemies[j].id === hit.enemyId` break — this is acceptable (uses indexed for, not `.find()`). No change needed here.

- [x] Task 8: Verify and run tests
  - [x] 8.1 Run `npm test -- --testPathPattern="useWeapons"` and verify all weapon tests pass
  - [x] 8.2 Run full test suite: `npm test` and verify no regressions

### Review Follow-ups (AI)

- [x] [AI-Review][MEDIUM] Replace `shockwaveArcs.filter(a => a.active).length` with a `for` loop counter — avoids throw-away array allocation per pending-arc frame [GameLoop.jsx:667] ✅ Fixed in code review
- [x] [AI-Review][MEDIUM] Pre-allocate `_eligibleTargets = []` at module level for tactical_shot candidate pool — replaces `const eligibleTargets = []` allocated at each fire event [GameLoop.jsx:911] ✅ Fixed in code review
- [ ] [AI-Review][LOW] `const stillPending = []` in shockwave pending-arc loop — acknowledged in Dev Notes as out-of-scope; pre-allocate `const _swStillPending = []` at module level in a future pass [GameLoop.jsx:660]
- [ ] [AI-Review][LOW] Section 7b projectile hits: O(N) inner find-loop for enemy positions — store `x/z` in projectile hit objects at collision time (in collisionSystem or projectileSystem); aligns with AC 3 pattern already applied to all other weapon types [GameLoop.jsx:999]
- [ ] [AI-Review][LOW] `spawnDamageNumbers` internal allocations (`.map()` + spread + `.slice()`) not addressed by 41.1 — scoped to Story 41.2 ring buffer [useDamageNumbers.jsx:54,71,74]

## Dev Notes

### What's Already Zero-Allocation (Don't Touch)

The GameLoop already has substantial pre-allocation infrastructure — don't re-do what's done:

- **`_orbIds[]`, `_healGemIds[]`, `_fragmentGemIds[]`** — module-level pre-allocated ID strings (lines 51-66)
- **`entityPoolRef`** — pooled entity descriptor objects for collision registration (line 106)
- **`assignEntity()`** — in-place mutation helper, avoids new objects
- **`composeDamageMultiplier()`** — pure computation, no allocations

### Critical: LASER_CROSS uses `weaponId` directly, not `weaponType`

At line 493: `lcWeapons.find(w => w.weaponId === 'LASER_CROSS')` — this uses `weaponId`, not `weaponType`. In the bucketing pass (Task 2), bucket LASER_CROSS by `w.weaponId === 'LASER_CROSS'`, not by weaponType. The other four weapons all use `WEAPONS[w.weaponId]?.weaponType` checks, so match those patterns for the others.

### `damageEnemiesBatch` is tolerant of extra fields

`useEnemies.damageEnemiesBatch()` receives hit objects and reads only `enemyId`, `damage`, `isCrit`. It is safe to pass `{ enemyId, damage, isCrit, dirX, dirZ, x, z }` — the extra fields are ignored. This enables Tasks 4.3 and 6.1 to skip the `.map()` entirely.

### Module-level `_dnEntries` is shared across all weapon sections

Since the frame tick runs synchronously (single-threaded), `_dnEntries` can be the same array for all sections. Clear it with `_dnEntries.length = 0` at the start of each section that uses it. Each section builds `_dnEntries`, calls `spawnDamageNumbers(_dnEntries)`, then the next section clears it again. This is the same pattern as the existing `_projectileHits`.

### Shockwave `hitEnemies` field — KEEP the per-arc `new Set()`

The `hitEnemies: new Set()` field on each `shockwaveArc` object (line 671) is NOT a per-frame allocation — arcs are created once per burst and persist across frames. This Set is necessary to track which enemies have already been hit by an expanding arc ring. Do NOT pre-allocate or refactor this — it's not in scope for 41.1.

### Shockwave `stillPending = []` allocation (line 648)

This array is only allocated when `shockwavePendingArcs.length > 0`, which is only true for ~3 frames per burst cycle (waveDelay * waveCount frames). This is a minor allocation in a conditional path. The epic does not call this out specifically. Leave it for now or pre-allocate `const _swStillPending = []` at module level if desired, but it's not a hot path.

### `getState()` consolidation scope

The AC says to cache `getState()` results. The most impactful fix is the `activeWeapons` consolidation (Task 2 — was calling `useWeapons.getState()` 4 times in 7a sections). The kill/score `useGame.getState().incrementKills()` calls in death loops are side-effect paths called at most N times per frame where N = enemies killed, which is rare. Don't over-engineer those.

### Architecture Pattern: Module-Level Constants

Following existing patterns in the file (lines 51-66 for ID arrays), new module-level pre-allocated arrays go in the same region — after the import block but before the exported helper functions.

### Project Structure Notes

- **File to modify**: `src/GameLoop.jsx` — single file, no new files needed
- **Tests**: No new test files needed. Existing weapon tests cover behavior; this story is a refactor of internals with no observable behavior change.
- **Pattern alignment**: Matches the pre-existing `_orbIds`/`_healGemIds`/`_fragmentGemIds` pattern already in the file

### References

- Epic 41.1 AC: `_bmad-output/planning-artifacts/epic-41-performance-optimization.md#Story-41.1`
- Existing pre-allocation region: `GameLoop.jsx` lines 51-66 (module-level ID arrays)
- Entity pool pattern: `GameLoop.jsx` lines 104-110 (`entityPoolRef`)
- Magnetic field as reference pattern (already stores x/z): `GameLoop.jsx` line 574 (`magHits.push({ enemyId, damage, isCrit, x: enemy.x, z: enemy.z })`)
- `damageEnemiesBatch` signature: `src/stores/useEnemies.jsx` (reads `enemyId`, `damage`, `isCrit`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

None — no debugging required, pure refactor.

### Completion Notes List

- Added 10 module-level pre-allocated arrays/Set after existing `_orbIds`/`_healGemIds`/`_fragmentGemIds` region (follows established pattern); includes `_eligibleTargets` added in code review (was missing from original implementation)
- Replaced all per-frame `const arr = []` and `new Set()` with `.length = 0` / `.clear()` clears
- Single weapon bucketing pass: one `for` loop over `activeWeapons` at top of section 7a replaces 5 separate `useWeapons.getState().activeWeapons.find()` calls
- LASER_CROSS correctly bucketed by `weaponId === 'LASER_CROSS'` (not weaponType), matching existing code pattern
- Stored `x/z` enemy positions directly in hit objects for shockwave, mine_around, and tactical_shot — eliminated 3 O(N) `enemies.find()` lookups in damage number loops
- Also stored positions in laser_cross hits, eliminating the nested for-loop lookup for lcDnEntries
- Eliminated 2 intermediate `.map()` allocations: shockwave `hitsBatch` and mine `hitsBatch` — `_swHits`/`_uniqueHits` passed directly to `damageEnemiesBatch` (extra fields benign)
- Shared `_dnEntries` array across all weapon sections (cleared with `.length = 0` before each use)
- `_weaponState = useWeapons.getState()` cached once for bucketing; other getState() calls in side-effect paths left as-is per AC 5 guidance
- Renamed `tacticalWeapon` → `tactWeapon` throughout section 7a-sexies for consistency with bucketed variable name
- All 155 test files (2664 tests) pass with zero regressions

### File List

- `src/GameLoop.jsx` (modified)

### Change Log

- 2026-02-24: Story 41.1 implemented — zero-allocation frame tick for GameLoop hot path. Pre-allocated hit arrays, single weapon bucketing pass, enemy position caching in hit objects, eliminated .map() intermediates.
- 2026-02-24: Code review fixes — (1) replaced `shockwaveArcs.filter(a=>a.active).length` with for-loop counter (line ~667, avoids throw-away array per burst), (2) added `_eligibleTargets` module-level pre-alloc for tactical_shot candidate pool (was missing from original implementation).
