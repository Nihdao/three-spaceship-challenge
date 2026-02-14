# Story 16.3: Time-Based Enemy Spawn System

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to encounter simpler enemies early in a run and face progressively more complex and dangerous enemies as time progresses,
So that difficulty ramps up naturally and each phase of the run feels distinct.

## Acceptance Criteria

1. **Given** spawnSystem.js is updated with time-gated spawn logic **When** gameplay time is 0:00-2:00 **Then** only Types 1 (FODDER_BASIC) and 2 (FODDER_FAST/FODDER_TANK) spawn with high frequency (spawnWeight 100 and 60) **And** no other enemy types spawn during this phase

2. **Given** gameplay time reaches 1:00 **When** the 1-minute mark is crossed **Then** Type 3 (FODDER_SWARM) begins spawning occasionally (spawnWeight 40) **And** swarms appear in groups of 3-5 and sweep across the play area

3. **Given** gameplay time reaches 2:00 **When** the 2-minute mark is crossed **Then** Type 4 (SHOCKWAVE_BLOB) begins spawning (spawnWeight 30) **And** Types 1 and 2 continue spawning but remain available

4. **Given** gameplay time reaches 3:00 **When** the 3-minute mark is crossed **Then** Type 6 (SNIPER_MOBILE) begins spawning (spawnWeight 25)

5. **Given** gameplay time reaches 5:00 **When** the 5-minute mark is crossed **Then** Type 7 (SNIPER_FIXED) begins spawning rarely (spawnWeight 10)

6. **Given** gameplay time reaches 6:00 **When** the 6-minute mark is crossed **Then** Type 8 (TELEPORTER) begins spawning (spawnWeight 20)

7. **Given** spawn weights are configured **When** multiple enemy types are available **Then** the spawnSystem randomly selects enemy types based on their weights from the available pool (time-gated) **And** earlier enemy types continue spawning throughout the run

## Tasks / Subtasks

- [ ] Task 1: Add TIME_GATED_SPAWN_SCHEDULE to gameConfig.js (AC: #1-#6)
  - [ ] 1.1: Define spawn schedule array with `{ minTime, typeId }` entries for each unlock threshold
  - [ ] 1.2: Include all 7 spawnable enemy types (excluding BOSS_SENTINEL) with their time gates

- [ ] Task 2: Refactor spawnSystem.js pickEnemyType() for time-gated selection (AC: #1-#7)
  - [ ] 2.1: Replace static `enemyTypes` / `totalWeight` pre-computation with dynamic filtering based on `elapsedTime`
  - [ ] 2.2: Create `getAvailableEnemyTypes(elapsedTime)` function that filters ENEMIES by the spawn schedule
  - [ ] 2.3: Compute `totalWeight` dynamically from the available types at current time
  - [ ] 2.4: Update `pickEnemyType()` to accept `elapsedTime` parameter and use filtered list

- [ ] Task 3: Handle FODDER_SWARM group spawning (AC: #2)
  - [ ] 3.1: When pickEnemyType() selects FODDER_SWARM, spawn 3-5 enemies in a tight cluster instead of 1
  - [ ] 3.2: Cluster spawn positions offset from base position by small random amounts (within ~10-15 unit radius)

- [ ] Task 4: Write unit tests for time-gated spawn logic
  - [ ] 4.1: Test that only FODDER_BASIC and FODDER_FAST spawn at elapsedTime=0
  - [ ] 4.2: Test that FODDER_SWARM becomes available at elapsedTime=60
  - [ ] 4.3: Test that SHOCKWAVE_BLOB becomes available at elapsedTime=120
  - [ ] 4.4: Test that SNIPER_MOBILE becomes available at elapsedTime=180
  - [ ] 4.5: Test that SNIPER_FIXED becomes available at elapsedTime=300
  - [ ] 4.6: Test that TELEPORTER becomes available at elapsedTime=360
  - [ ] 4.7: Test that all types remain available once unlocked (no type is ever removed)
  - [ ] 4.8: Test weighted random selection distributes proportionally among available types

- [ ] Task 5: Update debug commands if needed (AC: #7)
  - [ ] 5.1: Verify `spawn <type>` debug command still works with new enemy types (bypasses time gate)
  - [ ] 5.2: Verify `spawnwave` debug command still works (bypasses time gate)

## Dev Notes

### Epic Context

This story is part of **Epic 16: Enemy System Expansion**. It builds on Story 16.1 (enemy definitions in enemyDefs.js) and works alongside Story 16.2 (behavior implementations). This story modifies the spawn system to introduce enemies progressively over time.

**Story Sequence:**
- Story 16.1 (Enemy Definitions) — Creates the 8-type enemy roster in `src/entities/enemyDefs.js` (ready-for-dev)
- Story 16.2 (Behavior System) — Implements sweep, shockwave, sniper, teleport behaviors in useEnemies tick (backlog)
- **Story 16.3 (Time-Based Spawning) — THIS STORY** — Gates which enemy types can spawn based on elapsed game time
- Story 16.4 (Difficulty Scaling) — Applies system-based stat multipliers (backlog)

**Dependency Note:** This story depends on Story 16.1 having created the expanded enemyDefs.js with all 8 types. If Story 16.1 is not yet implemented, the developer should implement the `TIME_GATED_SPAWN_SCHEDULE` config and the `getAvailableEnemyTypes()` filtering logic referencing the enemy type IDs that will exist after 16.1. The current enemyDefs.js only has FODDER_BASIC, FODDER_FAST, and BOSS_SENTINEL.

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config Layer** → `gameConfig.js` — Add `TIME_GATED_SPAWN_SCHEDULE` config
- **Systems Layer** → `spawnSystem.js` — Modify `pickEnemyType()` to filter by elapsed time
- **Entities Layer** → `enemyDefs.js` — Read-only; enemy types referenced by ID from schedule
- **No Store Changes** — useEnemies.jsx is unchanged; it already handles any typeId from spawn instructions
- **No Rendering Changes** — EnemyRenderer is unaffected
- **No UI Changes** — No HUD modifications needed

**Critical Architectural Rules:**
- All tunable values in `gameConfig.js`, not hardcoded in spawnSystem.js
- spawnSystem.js is a **pure system** (factory function returning tick/reset) — no Zustand, no React
- Entity definitions are plain objects in `src/entities/enemyDefs.js`
- GameLoop calls `spawnSystemRef.current.tick()` in Section 5 of tick order

### Existing Infrastructure

**Current spawnSystem.js (`src/systems/spawnSystem.js`):**
```javascript
// CURRENT: Static pre-computation at module load — MUST BE CHANGED
const enemyTypes = Object.values(ENEMIES).filter(e => e.spawnWeight > 0)
const totalWeight = enemyTypes.reduce((sum, e) => sum + e.spawnWeight, 0)

// pickEnemyType() uses flat weighted random from ALL enemies with spawnWeight
// No time-based filtering exists
```

**Key Change:** Move `enemyTypes` and `totalWeight` computation inside a function that accepts `elapsedTime` and filters by the spawn schedule.

**Current enemyDefs.js (`src/entities/enemyDefs.js`):**
- Only 3 types: FODDER_BASIC (spawnWeight: 100), FODDER_FAST (spawnWeight: 60), BOSS_SENTINEL (no spawnWeight, excluded from spawning)
- After Story 16.1: 8 types with spawnWeight values matching the epic spec

**GameLoop integration (`src/GameLoop.jsx`):**
- Section 5 calls `spawnSystemRef.current.tick(clampedDelta, playerPos[0], playerPos[2], difficultyMult)`
- Returns array of `{ typeId, x, z, difficultyMult }` instructions
- `useEnemies.getState().spawnEnemies(instructions)` processes them
- No GameLoop changes needed — spawn system API (tick/reset) stays the same

**useEnemies.spawnEnemies() (`src/stores/useEnemies.jsx`):**
- Accepts instructions array and creates enemies based on typeId lookup in ENEMIES
- Applies difficultyMult to hp/speed/damage
- Respects MAX_ENEMIES_ON_SCREEN cap (100)
- No changes needed — already handles any typeId

**Debug commands (`src/systems/commandSystem.js`):**
- `spawn <type> [count]` — Bypasses spawnSystem, calls spawnEnemies directly
- `spawnwave <level>` — Has its own inline pickEnemyType() logic that also needs updating
- `stopspawn` / `resumespawn` — Sets `_debugSpawnPaused` flag, no changes needed

### Implementation Approach

**gameConfig.js — Add spawn schedule:**
```javascript
// Time-gated enemy spawn schedule (Story 16.3)
// Each entry defines when an enemy type becomes available for spawning
// minTime: seconds of elapsed gameplay time before this type can spawn
// typeId: enemy ID from enemyDefs.js
TIME_GATED_SPAWN_SCHEDULE: [
  { minTime: 0,   typeId: 'FODDER_BASIC' },
  { minTime: 0,   typeId: 'FODDER_FAST' },       // FODDER_FAST replaces FODDER_TANK in current defs
  { minTime: 60,  typeId: 'FODDER_SWARM' },       // 1 minute
  { minTime: 120, typeId: 'SHOCKWAVE_BLOB' },     // 2 minutes
  { minTime: 180, typeId: 'SNIPER_MOBILE' },      // 3 minutes
  { minTime: 300, typeId: 'SNIPER_FIXED' },       // 5 minutes
  { minTime: 360, typeId: 'TELEPORTER' },          // 6 minutes
],
```

**Note on FODDER_TANK:** The epic spec mentions "Types 1 and 2" for the 0-2 minute phase. The current enemyDefs.js has FODDER_FAST as the second type. After Story 16.1, FODDER_TANK may replace or coexist with FODDER_FAST. The schedule should reference whichever types actually exist in enemyDefs.js. If both FODDER_FAST and FODDER_TANK exist post-16.1, add both at minTime: 0.

**spawnSystem.js — Refactored approach:**
```javascript
// REPLACE static module-level enemyTypes/totalWeight with:
function getAvailableEnemyTypes(elapsedTime) {
  const schedule = GAME_CONFIG.TIME_GATED_SPAWN_SCHEDULE
  const availableIds = new Set()
  for (const entry of schedule) {
    if (elapsedTime >= entry.minTime) {
      availableIds.add(entry.typeId)
    }
  }
  return Object.values(ENEMIES).filter(
    e => e.spawnWeight > 0 && availableIds.has(e.id)
  )
}

// pickEnemyType now takes elapsedTime
function pickEnemyType(elapsedTime) {
  const available = getAvailableEnemyTypes(elapsedTime)
  if (available.length === 0) return enemyTypes[0]?.id // fallback
  const totalWeight = available.reduce((sum, e) => sum + e.spawnWeight, 0)
  let roll = Math.random() * totalWeight
  for (const enemy of available) {
    roll -= enemy.spawnWeight
    if (roll <= 0) return enemy.id
  }
  return available[available.length - 1].id
}
```

**FODDER_SWARM group spawning:**
When `pickEnemyType()` returns a FODDER_SWARM type, the tick function should spawn 3-5 enemies in a cluster instead of the single enemy. This means adding extra instructions to the batch with slight position offsets from the base spawn point.

**Performance consideration:** `getAvailableEnemyTypes()` is called once per spawn event (when spawnTimer reaches 0), not every frame. At worst, this is every 1.5 seconds (SPAWN_INTERVAL_MIN). The filtering is trivial (7 entries, O(n) filter). No caching needed.

### commandSystem.js Update

The `spawnwave` command has inline enemy type selection logic. Check if it needs to be updated to use the same `getAvailableEnemyTypes()` function. However, since debug commands intentionally bypass normal spawning, it may be fine to leave them as-is (they already bypass the time gate by design).

### Testing Standards

**Test file:** `src/systems/__tests__/spawnSystem.test.js`

**Test approach:**
- Mock `Math.random` for deterministic spawn type selection
- Create spawn system instance, manually advance `elapsedTime` by calling tick with large delta
- Verify returned instructions contain only expected typeIds at each time threshold
- Test edge cases: exactly at threshold time, just below threshold

**Key test scenarios:**
- At t=0: only FODDER_BASIC and FODDER_FAST in instructions
- At t=59: still no FODDER_SWARM
- At t=60: FODDER_SWARM now possible
- At t=360+: all 7 spawnable types available
- Reset clears elapsedTime, returns to t=0 behavior

### Previous Story Intelligence

**Story 16.1 (ready-for-dev) context:**
- Will create expanded enemyDefs.js with 8 types
- Each type has `spawnWeight` property used by pickEnemyType()
- File location: `src/entities/enemyDefs.js` (NOT src/config/ as 16.1 story template suggests — actual location is entities/)
- BOSS_SENTINEL has no spawnWeight and is excluded from spawn selection

**Existing pattern from spawnSystem.js:**
- Factory pattern: `createSpawnSystem()` returns `{ tick, reset }`
- `tick()` returns array of spawn instructions `{ typeId, x, z, difficultyMult }`
- `elapsedTime` already tracked and used for interval/batch ramping
- `reset()` already clears elapsedTime to 0

### Git Intelligence

**Recent commits (relevant patterns):**
- Feature commits use format: `feat: description (Story X.Y)`
- Code review fixes: `fix: code review fixes for Story X.Y (topic)`
- Multi-story commits exist when related changes are bundled
- Tests are co-located in `__tests__/` directories next to source files

### Project Structure Notes

- `src/systems/spawnSystem.js` — System to modify (time-gated filtering)
- `src/entities/enemyDefs.js` — Read-only reference (enemy type IDs and spawnWeights)
- `src/config/gameConfig.js` — Add TIME_GATED_SPAWN_SCHEDULE config
- `src/systems/commandSystem.js` — Verify debug commands still work
- `src/GameLoop.jsx` — No changes (spawn system API unchanged)
- `src/stores/useEnemies.jsx` — No changes (already handles any typeId)

### References

- [Source: _bmad-output/planning-artifacts/epic-16-enemy-system-expansion.md#Story 16.3 — Full AC and spawn schedule]
- [Source: src/systems/spawnSystem.js — Current spawn system to modify]
- [Source: src/entities/enemyDefs.js — Current enemy definitions (3 types, will be 8 after 16.1)]
- [Source: src/config/gameConfig.js lines 64-71 — Current SPAWN config constants]
- [Source: src/GameLoop.jsx Section 5 — Spawn system integration point]
- [Source: src/systems/commandSystem.js — Debug spawn commands]
- [Source: _bmad-output/implementation-artifacts/16-1-enemy-definitions-model-integration.md — Previous story context]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
