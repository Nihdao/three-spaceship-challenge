# Story 36.1: Enemy Leash / Teleport System

Status: done

## Story

As a player,
I want enemies to teleport near me if I move too far away,
so that I can never fully escape combat by running away.

## Acceptance Criteria

1. **Given** `useEnemies.tick(delta, playerPosition, options)` where `options.leashEnabled`
   **When** an enemy of behavior `chase`, `shockwave`, or `sniper_mobile` has distance to player > `ENEMY_LEASH_DISTANCE` (750 units)
   **Then** that enemy is relocated to a random position at spawn distance (80–120 units) from the player
   **And** a teleport departure event (old position) and arrival event (new position) are pushed via `_teleportEvents` (same `{ oldX, oldZ, newX, newZ }` format as existing teleport behavior)
   **And** the enemy's position is updated in-place (no new object allocation)

2. **Given** leash during boss fight
   **When** `options.leashEnabled === false`
   **Then** no enemy is leashed regardless of distance

3. **Given** enemy types excluded from leash
   **When** an enemy of behavior `sweep`, `sniper_fixed`, or `teleport` is at leash distance
   **Then** it is NOT teleported (sweep has its own despawn, sniper_fixed is stationary by design, teleport has its own relocation)

4. **Given** `GameLoop.jsx`
   **When** calling `useEnemies.getState().tick(clampedDelta, playerPos, options)`
   **Then** `leashEnabled: !bossActive` is passed as the third argument
   **And** `bossActive` comes from `useBoss.getState().isActive` (already read at line 283)

5. **Given** `ENEMY_LEASH_DISTANCE` constant
   **When** defined in `gameConfig.js`
   **Then** it equals 750 (= `MINIMAP_VISIBLE_RADIUS` 500 × 1.5)

6. **Given** teleport arrival position
   **When** the leash fires
   **Then** spawn position is random angle, distance ∈ [80, 120] units from player, clamped to `PLAY_AREA_SIZE` bounds (±2000)

## Tasks / Subtasks

- [x] Task 1: Add `ENEMY_LEASH_DISTANCE` to `gameConfig.js` (AC: #5)
  - [x] Add `ENEMY_LEASH_DISTANCE: 750` — use the literal value 750 with a comment (cannot self-reference the object being constructed)
  - [x] Place it near the "Spawning" or "Minimap" section for contextual clarity

- [x] Task 2: Add module-level leash constants to `useEnemies.jsx` (AC: #1, #3)
  - [x] Add near the top of the file (after existing constants like `SWEEP_DESPAWN_MARGIN`):
    ```js
    const LEASH_ELIGIBLE = new Set(['chase', 'shockwave', 'sniper_mobile'])
    const ENEMY_LEASH_DISTANCE = 750 // MINIMAP_VISIBLE_RADIUS * 1.5
    const LEASH_DIST_SQ = ENEMY_LEASH_DISTANCE * ENEMY_LEASH_DISTANCE // 562500
    ```

- [x] Task 3: Update `tick()` signature and add leash loop (AC: #1, #2, #6)
  - [x] Change signature: `tick: (delta, playerPosition, options = {}) => {`
  - [x] Add at top of tick body: `const leashEnabled = options.leashEnabled !== false`
  - [x] Add leash loop AFTER the main behavior loop (after line ~444) and BEFORE the despawn filter (line ~446)
  - [x] Use `get()._teleportEvents.push(...)` for direct mutation (same pattern as line 418)
  - [x] Clamp new position to `±bound` where `bound = GAME_CONFIG.PLAY_AREA_SIZE` (already declared at line 272)

- [x] Task 4: Update `GameLoop.jsx` tick call (AC: #4)
  - [x] At line 298: `useEnemies.getState().tick(clampedDelta, playerPos)` → `useEnemies.getState().tick(clampedDelta, playerPos, { leashEnabled: !bossActive })`
  - [x] `bossActive` is already declared at line 283 — no additional reads needed

- [x] Task 5: Tests
  - [x] Test: `chase` enemy at 800u from player → leashed to within 150u after one tick
  - [x] Test: `sweep` enemy at 800u → NOT leashed
  - [x] Test: `teleport` enemy at 800u → NOT leashed
  - [x] Test: `leashEnabled: false` → no leash even at 1000u
  - [x] Test: leashed position clamped to `[-2000, +2000]`
  - [x] Test: `_teleportEvents` pushed with correct `{ oldX, oldZ, newX, newZ }` format

## Dev Notes

### Architecture Context

This story touches 3 files and adds no new subsystems — it's a targeted extension of existing infrastructure.

The project uses a **6-layer architecture**: Config/Data → Systems → Stores → GameLoop → Rendering → UI. This feature lives in Config (`gameConfig.js`), Store (`useEnemies.jsx`), and GameLoop (`GameLoop.jsx`).

### Critical Implementation: gameConfig.js — Self-reference Issue

`GAME_CONFIG` is a single `export const GAME_CONFIG = { ... }` object literal. You **cannot** reference `GAME_CONFIG.MINIMAP_VISIBLE_RADIUS` inside the same object. Use the literal value:

```js
ENEMY_LEASH_DISTANCE: 750, // MINIMAP_VISIBLE_RADIUS (500) * 1.5
```

### Critical Implementation: useEnemies.jsx

**Module-level constants** (add near line 16, after `SWEEP_DESPAWN_MARGIN`):
```js
// Leash system (Story 36.1)
const LEASH_ELIGIBLE = new Set(['chase', 'shockwave', 'sniper_mobile'])
const ENEMY_LEASH_DISTANCE = 750 // GAME_CONFIG.MINIMAP_VISIBLE_RADIUS * 1.5
const LEASH_DIST_SQ = ENEMY_LEASH_DISTANCE * ENEMY_LEASH_DISTANCE // 562500
```

**Tick signature** (line 266):
```js
// BEFORE:
tick: (delta, playerPosition) => {
// AFTER:
tick: (delta, playerPosition, options = {}) => {
```

Add immediately after the opening brace:
```js
const leashEnabled = options.leashEnabled !== false
```

(`!== false` not `=== true` — ensures backward compat when options not passed in tests.)

**Leash loop** — insert after the main behavior loop (after line ~444 `}`) and before the despawn filter (line ~446 `if (hasDespawns)`):

```js
// --- Leash system (Story 36.1) ---
if (leashEnabled) {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]
    if (!LEASH_ELIGIBLE.has(e.behavior)) continue
    const dx = px - e.x
    const dz = pz - e.z
    if (dx * dx + dz * dz <= LEASH_DIST_SQ) continue
    // Teleport: push departure event, compute new position, push arrival
    const oldX = e.x
    const oldZ = e.z
    const angle = Math.random() * Math.PI * 2
    const spawnDist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)
    e.x = Math.max(-bound, Math.min(bound, px + Math.cos(angle) * spawnDist))
    e.z = Math.max(-bound, Math.min(bound, pz + Math.sin(angle) * spawnDist))
    get()._teleportEvents.push({ oldX, oldZ, newX: e.x, newZ: e.z })
  }
}
```

Notes:
- `px`, `pz`, `bound` are all already declared earlier in tick() — no redeclaration needed
- `get()._teleportEvents.push(...)` is direct mutation, same as existing teleport behavior at line 418
- `GAME_CONFIG.SPAWN_DISTANCE_MIN` (80) and `SPAWN_DISTANCE_MAX` (120) — avoids magic numbers, matches spawn system

### Why Boss is Safe Without Explicit Check

`BOSS_SPACESHIP` has `behavior: 'chase'` but is managed by `useBoss` store — it is NEVER in the `useEnemies.enemies` array. So LEASH_ELIGIBLE `'chase'` filter is safe for all regular enemies.

### GameLoop.jsx — Single-line Change

At line 298, single character change:
```js
// BEFORE:
useEnemies.getState().tick(clampedDelta, playerPos)
// AFTER:
useEnemies.getState().tick(clampedDelta, playerPos, { leashEnabled: !bossActive })
```

`bossActive` is declared at line 283: `const bossActive = useBoss.getState().isActive` — already available.

### Teleport VFX — Already Wired, No Changes Needed

GameLoop.jsx section `5d` (lines 308–314) already consumes `_teleportEvents` and renders purple `#cc66ff` explosions at both departure and arrival. Leash events use the same format `{ oldX, oldZ, newX, newZ }` and will be handled automatically:

```js
// Already in GameLoop.jsx — no changes:
const teleportEvents = useEnemies.getState().consumeTeleportEvents()
for (let i = 0; i < teleportEvents.length; i++) {
  const te = teleportEvents[i]
  addExplosion(te.oldX, te.oldZ, '#cc66ff', 0.5)
  addExplosion(te.newX, te.newZ, '#cc66ff', 0.5)
}
```

### Design Rationale

- **LEASH_DISTANCE = 750u**: `MINIMAP_VISIBLE_RADIUS` (500) × 1.5 — enemies outside the visible radar zone are leashed back
- **Excluded behaviors**: `sweep` has its own `despawnTimer`; `sniper_fixed` is stationary by design; `teleport` already has its own relocation mechanic
- **leashEnabled = false during boss**: Boss fight has a constrained arena; leashing regular enemies during boss would be disruptive
- **In-place mutation**: Consistent with the entire tick() pattern — zero GC, no `set()` calls

### Project Structure Notes

Files modified:
- `src/config/gameConfig.js` — add `ENEMY_LEASH_DISTANCE: 750`
- `src/stores/useEnemies.jsx` — add constants, update tick() signature and body
- `src/GameLoop.jsx` — update one line (tick call at line 298)

No new files. No new components. No new stores. No rendering changes.

### References

- [Source: src/stores/useEnemies.jsx#L50] — `_teleportEvents: []` state declaration
- [Source: src/stores/useEnemies.jsx#L266] — current tick signature to update
- [Source: src/stores/useEnemies.jsx#L272] — `bound = GAME_CONFIG.PLAY_AREA_SIZE` (reuse in leash)
- [Source: src/stores/useEnemies.jsx#L390-442] — `teleport` behavior as reference for `_teleportEvents.push` pattern (line 418)
- [Source: src/stores/useEnemies.jsx#L513-519] — `consumeTeleportEvents()` handles cleanup automatically
- [Source: src/GameLoop.jsx#L283] — `const bossActive = useBoss.getState().isActive`
- [Source: src/GameLoop.jsx#L298] — tick call to update (single-line change)
- [Source: src/GameLoop.jsx#L308-314] — teleport VFX already wired, no changes needed
- [Source: src/config/gameConfig.js#L111] — `MINIMAP_VISIBLE_RADIUS: 500`
- [Source: src/config/gameConfig.js#L114] — `PLAY_AREA_SIZE: 2000`
- [Source: src/config/gameConfig.js#L119-120] — `SPAWN_DISTANCE_MIN: 80`, `SPAWN_DISTANCE_MAX: 120`
- [Source: _bmad-output/planning-artifacts/epic-36-enemy-pressure-systems.md] — full epic context and acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Implemented leash system in 4 files: gameConfig.js (constant), useEnemies.jsx (constants + tick), GameLoop.jsx (pass leashEnabled option)
- `leashEnabled = options.leashEnabled !== false` pattern ensures backward compat when options not passed (tests calling tick without 3rd arg still leash)
- Leash loop runs AFTER main behavior loop, BEFORE despawn filter — enemies are at their final moved position when checked
- `LEASH_ELIGIBLE = Set(['chase', 'shockwave', 'sniper_mobile'])` — sweep/sniper_fixed/teleport excluded per AC #3 rationale
- Boss safety: BOSS_SPACESHIP is never in useEnemies.enemies array (managed by useBoss), so `bossActive: !bossActive` disables leash during boss fight only
- Teleport VFX automatically handled by existing GameLoop section 5d — no rendering changes needed
- 7 new tests, 2350 total, zero regressions
- Code review fixes (2026-02-23): removed duplicate module-level `ENEMY_LEASH_DISTANCE` constant in useEnemies.jsx — now uses `GAME_CONFIG.ENEMY_LEASH_DISTANCE` directly via `LEASH_DIST_SQ`; fixed inverted test name; added tests for shockwave + sniper_mobile leash; hardened sweep test with unconditional `toHaveLength(1)`. 9 tests total.

### File List

- src/config/gameConfig.js
- src/stores/useEnemies.jsx
- src/GameLoop.jsx
- src/stores/__tests__/useEnemies.leash.test.js (new)

## Change Log

- 2026-02-23: Story 36.1 implemented — Enemy Leash/Teleport System. Added ENEMY_LEASH_DISTANCE constant, leash loop in useEnemies.tick(), GameLoop integration. 7 tests added.
