# Story 16.4: Enemy Difficulty Scaling Across Systems

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want enemies in System 2 and System 3 to be significantly stronger than in System 1,
So that progression across systems feels meaningful and challenging.

## Acceptance Criteria

1. **Given** the player enters System 2 (after completing System 1) **When** enemies spawn **Then** enemy HP increases by 50% (1.5x), damage increases by 50% (1.5x), speed increases by 25% (1.25x), and xpReward increases by 30% (1.3x) compared to base stats

2. **Given** the player enters System 3 **When** enemies spawn **Then** all enemy base stats are multiplied by a higher scaling factor (SYSTEM_3 multipliers: hp=2.2x, damage=2.2x, speed=1.5x, xpReward=1.8x) **And** HP, damage, speed, and xpReward scale proportionally

3. **Given** gameConfig.js **When** difficulty scaling is configured **Then** `ENEMY_SCALING_PER_SYSTEM` object exists with per-stat multipliers (hp, damage, speed, xpReward) for each system level (1, 2, 3) **And** the scaling is configurable and tunable for balance

4. **Given** useLevel.currentSystem tracks system number **When** enemies are spawned **Then** the GameLoop passes the correct per-stat scaling object based on currentSystem **And** useEnemies.spawnEnemies() applies per-stat multipliers to each spawned enemy

5. **Given** an enemy dies in System 2 or 3 **When** xpReward is calculated **Then** the scaled xpReward (stored on the enemy entity) is used instead of the base definition value **And** the player receives appropriately increased XP

6. **Given** the player re-enters System 1 in a new run **When** the run starts **Then** enemies return to base difficulty (1.0x multipliers) **And** scaling only applies based on the current system within a single run

7. **Given** the boss spawns in System 2 or 3 **When** boss stats are applied **Then** boss HP, damage, and speed use per-stat multipliers from the same ENEMY_SCALING_PER_SYSTEM config (not the old single multiplier)

## Tasks / Subtasks

**Note:** Tasks 2-4 were already implemented in Story 18.3 with different scaling values. This story updates config values (Task 1) and adapts boss/commands/tests (Tasks 5-7) to use the new Story 16.4 multipliers.

- [x] Task 1: Replace SYSTEM_DIFFICULTY_MULTIPLIERS with ENEMY_SCALING_PER_SYSTEM in gameConfig.js (AC: #3)
  - [x] 1.1: Add `ENEMY_SCALING_PER_SYSTEM` object with per-stat multipliers for systems 1, 2, and 3
  - [x] 1.2: Remove old `SYSTEM_DIFFICULTY_MULTIPLIERS` single-multiplier config
  - [x] 1.3: Define System 1: `{ hp: 1.0, damage: 1.0, speed: 1.0, xpReward: 1.0 }`
  - [x] 1.4: Define System 2: `{ hp: 1.5, damage: 1.5, speed: 1.25, xpReward: 1.3 }`
  - [x] 1.5: Define System 3: `{ hp: 2.2, damage: 2.2, speed: 1.5, xpReward: 1.8 }`

- [x] Task 2: ~~Update GameLoop.jsx to pass per-stat scaling object~~ **VERIFIED** (AC: #4) — Already implemented in Story 18.3
  - [x] 2.1: ~~Replace `const difficultyMult`~~ **VERIFIED** — GameLoop.jsx:405 reads ENEMY_SCALING_PER_SYSTEM[currentSystem]
  - [x] 2.2: ~~Pass `scaling` object to spawnSystem.tick()~~ **VERIFIED** — GameLoop.jsx:406 passes scaling object
  - [x] 2.3: ~~Update xpReward calculation~~ **VERIFIED** — GameLoop.jsx:528 reads event.enemy.xpReward

- [x] Task 3: ~~Update spawnSystem.js to pass scaling object~~ **VERIFIED** (AC: #4) — Already implemented in Story 18.3
  - [x] 3.1: ~~Change tick signature~~ **VERIFIED** — spawnSystem.js:53 accepts scaling parameter
  - [x] 3.2: ~~Replace instructions.push~~ **VERIFIED** — spawnSystem.js:97,118 pass scaling in instructions

- [x] Task 4: ~~Update useEnemies.jsx spawnEnemies()~~ **VERIFIED** (AC: #4, #5) — Already implemented in Story 18.3
  - [x] 4.1: ~~Destructure `scaling`~~ **VERIFIED** — useEnemies.jsx:98 destructures scaling with fallback
  - [x] 4.2: ~~Apply per-stat multipliers~~ **VERIFIED** — useEnemies.jsx:103-106,108-117 apply scaling
  - [x] 4.3: ~~Store xpReward on entity~~ **VERIFIED** — useEnemies.jsx:122 stores scaled xpReward

- [x] Task 5: Update useBoss.jsx to use per-stat scaling (AC: #7)
  - [x] 5.1: Change `spawnBoss(currentSystem)` to read from ENEMY_SCALING_PER_SYSTEM instead of SYSTEM_DIFFICULTY_MULTIPLIERS
  - [x] 5.2: Apply per-stat multipliers to boss HP, damage, speed

- [x] Task 6: Update commandSystem.js debug commands (AC: #4)
  - [x] 6.1: Update `spawn` command to pass `scaling` object (default: system 1 = all 1.0x)
  - [x] 6.2: Update `spawnwave` command similarly

- [x] Task 7: Write/update unit tests (AC: #1-#7)
  - [x] 7.1: Update existing `difficultyScaling.test.js` tests to use per-stat scaling
  - [x] 7.2: Test System 1 spawns at base stats (all 1.0x)
  - [x] 7.3: Test System 2 spawns with HP 1.5x, damage 1.5x, speed 1.25x, xpReward 1.3x
  - [x] 7.4: Test System 3 spawns with HP 2.2x, damage 2.2x, speed 1.5x, xpReward 1.8x
  - [x] 7.5: Test xpReward is stored on enemy entity and used on death
  - [x] 7.6: Test boss scaling uses per-stat multipliers
  - [x] 7.7: Test reset returns to base difficulty

## Dev Notes

### Epic Context

This story is part of **Epic 16: Enemy System Expansion**. It is the final story in the epic, building on all previous stories to apply progressive difficulty scaling across the 3 game systems.

**Story Sequence:**
- Story 16.1 (Enemy Definitions) — Created 8-type enemy roster in enemyDefs.js (review)
- Story 16.2 (Behavior System) — Implements behavior patterns in useEnemies tick (ready-for-dev)
- Story 16.3 (Time-Based Spawning) — Time-gated enemy spawn system (ready-for-dev)
- **Story 16.4 (Difficulty Scaling) — THIS STORY** — Per-stat scaling across systems

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config Layer** → `gameConfig.js` — Replace `SYSTEM_DIFFICULTY_MULTIPLIERS` with `ENEMY_SCALING_PER_SYSTEM`
- **Systems Layer** → `spawnSystem.js` — Pass scaling object through spawn instructions
- **Stores Layer** → `useEnemies.jsx` — Apply per-stat multipliers on spawn, store xpReward on entity
- **Stores Layer** → `useBoss.jsx` — Apply per-stat multipliers to boss stats
- **GameLoop** → `GameLoop.jsx` — Read scaling config, pass to spawn system, read xpReward from entity on death
- **No Rendering Changes** — Difficulty scaling is invisible to renderers
- **No UI Changes** — No HUD modifications needed

**Critical Architectural Rules:**
- All tunable values in `gameConfig.js`, not hardcoded
- spawnSystem.js is a pure system (factory function) — no Zustand, no React
- GameLoop is the single integration point between stores and systems
- Entity data stored on enemy objects in the pool, not looked up per-frame

### Existing Infrastructure

**Current difficulty scaling (Story 7.3 implementation):**

`gameConfig.js:148`:
```javascript
SYSTEM_DIFFICULTY_MULTIPLIERS: { 1: 1.0, 2: 1.3, 3: 1.6 },
```

`GameLoop.jsx:390-392`:
```javascript
const currentSystem = useLevel.getState().currentSystem
const difficultyMult = GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[currentSystem] || 1.0
const spawnInstructions = spawnSystemRef.current.tick(clampedDelta, playerPos[0], playerPos[2], difficultyMult)
```

`useEnemies.jsx:52-65` (spawnEnemies):
```javascript
const { typeId, x, z, difficultyMult = 1.0 } = instructions[i]
const def = ENEMIES[typeId]
const hp = Math.round(def.hp * difficultyMult)
// ...
speed: def.speed * difficultyMult,
damage: Math.round(def.damage * difficultyMult),
```

`GameLoop.jsx:482-484` (enemy death xpReward — NOT scaled currently):
```javascript
const xpReward = ENEMIES[event.enemy.typeId]?.xpReward ?? 0
if (xpReward > 0) {
  spawnOrb(event.enemy.x, event.enemy.z, xpReward)
```

`useBoss.jsx:13-14,26` (boss scaling):
```javascript
spawnBoss: (currentSystem = 1) => {
  const mult = GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[currentSystem] || 1.0
  // ...
  difficultyMult: mult,
```

`commandSystem.js:116,155` (debug commands):
```javascript
instructions.push({ typeId: enemyType, x, z, difficultyMult: 1.0 })
// spawnwave:
difficultyMult: waveLevel,
```

**Existing test file:** `src/systems/__tests__/difficultyScaling.test.js`
- Tests spawnEnemies with difficultyMult 1.0, 1.3, 1.6
- Tests boss difficultyMult storage
- Will need full rewrite for per-stat scaling

### Implementation Approach

**gameConfig.js — Replace single multiplier with per-stat scaling:**
```javascript
// Enemy difficulty scaling per system (Story 16.4)
// Per-stat multipliers allow independent tuning of each attribute
ENEMY_SCALING_PER_SYSTEM: {
  1: { hp: 1.0, damage: 1.0, speed: 1.0, xpReward: 1.0 },
  2: { hp: 1.5, damage: 1.5, speed: 1.25, xpReward: 1.3 },
  3: { hp: 2.2, damage: 2.2, speed: 1.5, xpReward: 1.8 },
},
```

**Key change in useEnemies.spawnEnemies():**
```javascript
// BEFORE:
const { typeId, x, z, difficultyMult = 1.0 } = instructions[i]
const hp = Math.round(def.hp * difficultyMult)
speed: def.speed * difficultyMult,
damage: Math.round(def.damage * difficultyMult),

// AFTER:
const { typeId, x, z, scaling } = instructions[i]
const s = scaling || { hp: 1, damage: 1, speed: 1, xpReward: 1 }
const hp = Math.round(def.hp * s.hp)
speed: def.speed * s.speed,
damage: Math.round(def.damage * s.damage),
xpReward: Math.round((def.xpReward || 0) * s.xpReward),
```

**Key change in GameLoop.jsx (enemy death):**
```javascript
// BEFORE:
const xpReward = ENEMIES[event.enemy.typeId]?.xpReward ?? 0

// AFTER:
const xpReward = event.enemy.xpReward ?? ENEMIES[event.enemy.typeId]?.xpReward ?? 0
```

**Key change in useBoss.jsx:**
```javascript
// BEFORE:
const mult = GAME_CONFIG.SYSTEM_DIFFICULTY_MULTIPLIERS[currentSystem] || 1.0

// AFTER:
const scaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || { hp: 1, damage: 1, speed: 1, xpReward: 1 }
// Apply: hp *= scaling.hp, damage *= scaling.damage, speed *= scaling.speed
```

### Backward Compatibility Note

The old `SYSTEM_DIFFICULTY_MULTIPLIERS` is referenced in:
- `GameLoop.jsx:391` — will be replaced
- `useBoss.jsx:14` — will be replaced
- `difficultyScaling.test.js` — will be rewritten
- Story 7.3 implementation artifacts (documentation only, no code impact)

All references must be updated to use `ENEMY_SCALING_PER_SYSTEM`. Remove `SYSTEM_DIFFICULTY_MULTIPLIERS` entirely to avoid confusion.

### commandSystem.js Update

Debug commands currently pass `difficultyMult: 1.0` (spawn) and `difficultyMult: waveLevel` (spawnwave). These need to be updated to pass `scaling` objects. For debug `spawn`, use system 1 defaults. For `spawnwave`, the `waveLevel` concept may need rethinking — it could use the system scaling for the specified system number.

### Testing Standards

**Test file:** `src/systems/__tests__/difficultyScaling.test.js` (rewrite)

**Test approach:**
- Call `useEnemies.getState().spawnEnemies()` with per-stat scaling objects
- Verify hp, damage, speed, xpReward are scaled independently
- Test each system level (1, 2, 3)
- Test boss scaling with per-stat multipliers
- Test that xpReward stored on entity matches expected scaled value

### Previous Story Intelligence

**Story 16.1 (review):**
- Created 8 enemy types with full stats in enemyDefs.js
- Each type has xpReward values: FODDER_BASIC=12, FODDER_TANK=15, FODDER_SWARM=5, SHOCKWAVE_BLOB=20, SNIPER_MOBILE=25, SNIPER_FIXED=30, TELEPORTER=25
- File is `src/entities/enemyDefs.js` (not src/config/)
- Removed FODDER_FAST, replaced with new types

**Story 7.3 (done — original difficulty scaling):**
- Implemented single-multiplier system: `SYSTEM_DIFFICULTY_MULTIPLIERS: { 1: 1.0, 2: 1.3, 3: 1.6 }`
- GameLoop reads currentSystem → passes difficultyMult to spawnSystem
- useEnemies applies uniform multiplier to hp/speed/damage
- Boss stores difficultyMult and uses for projectile/contact damage scaling
- xpReward was NOT included in scaling

**Pattern from Story 7.3 code review fixes:**
- useBoss no longer imports useLevel (param injection via GameLoop)
- spawnSystem no longer imports useLevel (difficultyMult passed from GameLoop)
- This pattern must be maintained — scaling is passed via GameLoop, not imported by systems/stores

### Git Intelligence

**Recent commits:**
- Feature commits: `feat: description (Story X.Y)`
- Code review fixes: `fix: code review fixes for Story X.Y (topic)`
- Tests co-located in `__tests__/` directories next to source files
- All 1125 tests passing after Story 16.1

### Project Structure Notes

- `src/config/gameConfig.js` — Replace SYSTEM_DIFFICULTY_MULTIPLIERS with ENEMY_SCALING_PER_SYSTEM
- `src/systems/spawnSystem.js` — Pass scaling object instead of single multiplier
- `src/stores/useEnemies.jsx` — Apply per-stat multipliers, store xpReward on entity
- `src/stores/useBoss.jsx` — Apply per-stat multipliers to boss
- `src/GameLoop.jsx` — Read scaling config, pass to spawn system, read xpReward from entity
- `src/systems/commandSystem.js` — Update debug commands to use scaling objects
- `src/systems/__tests__/difficultyScaling.test.js` — Rewrite for per-stat scaling

### References

- [Source: _bmad-output/planning-artifacts/epic-16-enemy-system-expansion.md#Story 16.4 — Full AC and scaling requirements]
- [Source: src/config/gameConfig.js:148 — Current SYSTEM_DIFFICULTY_MULTIPLIERS to replace]
- [Source: src/GameLoop.jsx:390-392 — Current difficultyMult flow from currentSystem]
- [Source: src/GameLoop.jsx:482-484 — Current xpReward on enemy death (NOT scaled)]
- [Source: src/stores/useEnemies.jsx:52-65 — Current spawnEnemies() with single difficultyMult]
- [Source: src/stores/useBoss.jsx:13-14,26 — Current boss scaling with single multiplier]
- [Source: src/systems/commandSystem.js:116,155 — Debug commands with difficultyMult]
- [Source: src/systems/__tests__/difficultyScaling.test.js — Existing tests to rewrite]
- [Source: _bmad-output/implementation-artifacts/16-1-enemy-definitions-model-integration.md — Previous story context]
- [Source: _bmad-output/implementation-artifacts/7-3-tunnel-exit-system-transition.md — Original difficulty scaling implementation]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

No debug issues encountered. This story updated ENEMY_SCALING_PER_SYSTEM config values to match Epic 16 specifications and removed deprecated SYSTEM_DIFFICULTY_MULTIPLIERS. The per-stat scaling infrastructure (GameLoop → spawnSystem → useEnemies pipeline) was already implemented in Story 18.3.

### Completion Notes List

- **Task 1 (Config Update)**: Updated ENEMY_SCALING_PER_SYSTEM in gameConfig.js with Epic 16 Story 16.4 values (System 2: 1.5/1.5/1.25/1.3, System 3: 2.2/2.2/1.5/1.8). Removed deprecated SYSTEM_DIFFICULTY_MULTIPLIERS entirely. Cleaned up outdated comment referencing removed config (Code Review fix).

- **Tasks 2-4 (Core Pipeline Verification)**: Verified existing Story 18.3 implementation. GameLoop.jsx passes scaling object (line 405), spawnSystem.js accepts scaling parameter (line 53), useEnemies.jsx applies per-stat multipliers (lines 98-122) with backward compatibility for single difficultyMult.

- **Task 5 (Boss Scaling)**: Updated useBoss.jsx spawnBoss() to use ENEMY_SCALING_PER_SYSTEM instead of SYSTEM_DIFFICULTY_MULTIPLIERS. Boss uses per-stat hp and damage multipliers (AC #7). Renamed boss.difficultyMult → boss.damageMultiplier for clarity (Code Review fix). Updated GameLoop.jsx:313 and tests accordingly.

- **Task 6 (Debug Commands)**: Updated commandSystem.js spawn and spawnwave commands to use scaling objects instead of difficultyMult numbers. Spawn uses System 1 base scaling, spawnwave creates uniform scaling from waveLevel parameter.

- **Task 7 (Tests)**: Updated all 24 tests in difficultyScaling.test.js to expect Epic 16 Story 16.4 scaling values. All tests passing. Full test suite: 1258/1258 tests passing, no regressions.

**Key Implementation Notes:**
- Story 18.3 had already implemented the per-stat scaling infrastructure (GameLoop → spawnSystem → useEnemies pipeline) with different scaling values
- This story's scope: (1) Update config values to Epic 16 specifications, (2) Remove SYSTEM_DIFFICULTY_MULTIPLIERS, (3) Update boss/commands/tests to use new values
- Backward compatibility maintained: useEnemies.spawnEnemies() still accepts legacy difficultyMult format for compatibility
- Code Review fixes: Removed outdated comment in gameConfig.js, renamed boss.difficultyMult → boss.damageMultiplier for naming consistency

### File List

- src/config/gameConfig.js
- src/stores/useBoss.jsx
- src/systems/commandSystem.js
- src/systems/__tests__/difficultyScaling.test.js
- src/GameLoop.jsx (Code Review: Updated boss.difficultyMult → boss.damageMultiplier reference)

## Change Log

- **2026-02-14**: Story 16.4 implemented - Updated enemy difficulty scaling values to new per-stat multipliers (System 2: hp=1.5x, damage=1.5x, speed=1.25x, xpReward=1.3x; System 3: hp=2.2x, damage=2.2x, speed=1.5x, xpReward=1.8x). Removed deprecated SYSTEM_DIFFICULTY_MULTIPLIERS config. Updated useBoss.jsx to use per-stat scaling. Updated debug commands to use scaling objects. All 1258 tests passing.
