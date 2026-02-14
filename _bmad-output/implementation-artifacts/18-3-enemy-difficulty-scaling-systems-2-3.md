# Story 18.3: Enemy Difficulty Scaling in Systems 2 & 3

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want enemies in System 2 and System 3 to be significantly stronger than System 1,
So that my increasing power is balanced by meaningful challenge progression.

## Acceptance Criteria

1. **Given** `gameConfig.js` defines `ENEMY_SCALING_PER_SYSTEM` **When** the configuration is set **Then** System 1 has a scaling multiplier of 1.0 (base difficulty) **And** System 2 has multipliers: hp 1.6, damage 1.5, speed 1.3, xpReward 1.4 **And** System 3 has multipliers: hp 2.5, damage 2.2, speed 1.6, xpReward 2.0

2. **Given** the player enters System 2 **When** enemies spawn **Then** all enemy base stats (from `enemyDefs.js`) are multiplied by `ENEMY_SCALING_PER_SYSTEM[2]` per-stat multipliers **And** a FODDER_BASIC with base hp=20 now has hp=32 in System 2 **And** a FODDER_BASIC with base damage=5 now has damage=7.5 (rounded to 8) in System 2

3. **Given** the player enters System 3 **When** enemies spawn **Then** all enemy stats are multiplied by `ENEMY_SCALING_PER_SYSTEM[3]` **And** enemies are noticeably tankier, faster, and more dangerous

4. **Given** `spawnSystem.js` is updated **When** spawning enemies **Then** the system reads `useLevel.currentSystem` (1, 2, or 3) **And** applies the corresponding per-stat scaling multipliers to spawned enemies **And** the scaled stats are stored in the enemy entity data (not recalculated every tick)

5. **Given** enemy xpReward scaling **When** enemies die in System 2 or 3 **Then** they drop XP orbs with scaled xpReward values **And** the increased XP helps the player continue leveling at a reasonable pace despite higher difficulty

6. **Given** balancing **When** the multipliers are reviewed **Then** scaling multipliers can be tuned in `gameConfig.js` for balance **And** the config is the single source of truth for per-system enemy scaling

## Tasks / Subtasks

- [x] Task 1: Replace `SYSTEM_DIFFICULTY_MULTIPLIERS` with `ENEMY_SCALING_PER_SYSTEM` in gameConfig (AC: #1, #6)
  - [x] 1.1: In `src/config/gameConfig.js`, replace the existing `SYSTEM_DIFFICULTY_MULTIPLIERS: { 1: 1.0, 2: 1.3, 3: 1.6 }` with `ENEMY_SCALING_PER_SYSTEM` using per-stat multipliers as specified in AC #1
  - [x] 1.2: Structure: `ENEMY_SCALING_PER_SYSTEM: { 1: { hp: 1.0, damage: 1.0, speed: 1.0, xpReward: 1.0 }, 2: { hp: 1.6, ... }, 3: { hp: 2.5, ... } }`
  - [x] 1.3: Remove or keep `SYSTEM_DIFFICULTY_MULTIPLIERS` — search for all usages first

- [x] Task 2: Update GameLoop to pass per-stat scaling object instead of single multiplier (AC: #4)
  - [x] 2.1: In `src/GameLoop.jsx` lines ~390-393, change `difficultyMult` from a single number to the per-stat scaling object from `ENEMY_SCALING_PER_SYSTEM[currentSystem]`
  - [x] 2.2: Update the `spawnSystem.tick()` call to pass the scaling object (or pass it through to spawn instructions)
  - [x] 2.3: Update `spawnSystem.js` to forward the scaling object in spawn instructions instead of a single `difficultyMult` number

- [x] Task 3: Update `useEnemies.spawnEnemies()` to apply per-stat multipliers (AC: #2, #3, #4)
  - [x] 3.1: In `src/stores/useEnemies.jsx` `spawnEnemies()` (lines 42-81), change from `difficultyMult` (single number) to `scaling` (object with hp, damage, speed, xpReward)
  - [x] 3.2: Apply `scaling.hp` to hp/maxHp, `scaling.damage` to damage, `scaling.speed` to speed
  - [x] 3.3: Store `xpReward: Math.round(def.xpReward * (scaling.xpReward || 1.0))` on the enemy entity — this is currently NOT stored on enemy entities at all
  - [x] 3.4: Maintain backward compatibility: if `difficultyMult` is a number (legacy/debug), treat it as uniform multiplier for all stats

- [x] Task 4: Update GameLoop death handler to use enemy entity's xpReward (AC: #5)
  - [x] 4.1: In `src/GameLoop.jsx` line 482, change `const xpReward = ENEMIES[event.enemy.typeId]?.xpReward ?? 0` to `const xpReward = event.enemy.xpReward ?? ENEMIES[event.enemy.typeId]?.xpReward ?? 0`
  - [x] 4.2: This ensures scaled xpReward is used when available, with fallback to base def

- [x] Task 5: Update debug commands for compatibility (AC: #6)
  - [x] 5.1: In `src/systems/commandSystem.js`, update `spawn` command (line ~107) — pass `difficultyMult: 1.0` as before (backward-compatible since Task 3.4 handles number)
  - [x] 5.2: In `src/systems/commandSystem.js`, update `spawnwave` command — pass scaling object from `ENEMY_SCALING_PER_SYSTEM[waveLevel]` or keep as single number (backward-compatible)

- [x] Task 6: Update `spawnEnemy()` single-spawn for consistency (AC: #4)
  - [x] 6.1: In `src/stores/useEnemies.jsx` `spawnEnemy()` (lines 11-38), add `xpReward: def.xpReward` to the enemy entity so single-spawned enemies also have xpReward stored

- [x] Task 7: Write tests (AC: #1-#6)
  - [x] 7.1: Test: `ENEMY_SCALING_PER_SYSTEM` has entries for systems 1, 2, 3 with hp, damage, speed, xpReward keys
  - [x] 7.2: Test: System 1 scaling is all 1.0 (no modification)
  - [x] 7.3: Test: `spawnEnemies` with System 2 scaling — FODDER_BASIC hp=32, damage=8, speed=22.1, xpReward=17
  - [x] 7.4: Test: `spawnEnemies` with System 3 scaling — FODDER_BASIC hp=50, damage=11, speed=27.2, xpReward=24
  - [x] 7.5: Test: backward compatibility — `spawnEnemies` with `difficultyMult: 1.5` (number) still works
  - [x] 7.6: Test: enemy entity has `xpReward` field after spawn
  - [x] 7.7: All existing tests pass with no regressions

## Dev Notes

### Architecture Analysis — Current State

**Current implementation (pre-story):**

The system already has a partial difficulty scaling pipeline:

1. **Config**: `SYSTEM_DIFFICULTY_MULTIPLIERS: { 1: 1.0, 2: 1.3, 3: 1.6 }` — a single multiplier per system
2. **GameLoop** (lines ~390-393): Reads `currentSystem` from `useLevel`, looks up multiplier, passes to `spawnSystem.tick()`
3. **spawnSystem.js**: Receives `difficultyMult` and includes it in spawn instructions
4. **useEnemies.spawnEnemies()**: Applies `difficultyMult` uniformly to hp, speed, and damage

**What's wrong / needs changing:**

1. **Single multiplier vs per-stat**: Epic AC specifies different multipliers per stat (hp: 1.6, damage: 1.5, speed: 1.3, xpReward: 1.4 for System 2). Current implementation uses one number for all stats.

2. **xpReward NOT scaled at all**: When enemies die (`GameLoop.jsx:482`), xpReward is read from `ENEMIES[event.enemy.typeId]?.xpReward` — the **base definition**, completely ignoring the system scaling. xpReward is also not stored on the spawned enemy entity.

3. **xpReward NOT stored on enemy entities**: The enemy object created in `spawnEnemies()` does not include `xpReward` as a field. It must be added so the scaled value is available at death time.

### Data Flow — Before vs After

**BEFORE (current):**
```
gameConfig.SYSTEM_DIFFICULTY_MULTIPLIERS[2] = 1.3 (single number)
  → GameLoop passes difficultyMult=1.3 to spawnSystem
  → spawnSystem includes difficultyMult=1.3 in instructions
  → useEnemies.spawnEnemies: hp *= 1.3, speed *= 1.3, damage *= 1.3
  → Enemy dies: xpReward = ENEMIES[typeId].xpReward (BASE, unscaled!)
```

**AFTER (this story):**
```
gameConfig.ENEMY_SCALING_PER_SYSTEM[2] = { hp: 1.6, damage: 1.5, speed: 1.3, xpReward: 1.4 }
  → GameLoop passes scaling object to spawnSystem
  → spawnSystem includes scaling object in instructions
  → useEnemies.spawnEnemies: hp *= 1.6, damage *= 1.5, speed *= 1.3, xpReward stored on entity
  → Enemy dies: xpReward = enemy.xpReward (SCALED, from entity)
```

### Files to MODIFY

1. **`src/config/gameConfig.js`** — Replace `SYSTEM_DIFFICULTY_MULTIPLIERS` with `ENEMY_SCALING_PER_SYSTEM`
2. **`src/GameLoop.jsx`** — Update difficultyMult lookup (line ~392) to use new config key; update death handler (line ~482) to read xpReward from enemy entity
3. **`src/systems/spawnSystem.js`** — Rename `difficultyMult` parameter/field to `scaling` (object)
4. **`src/stores/useEnemies.jsx`** — Update `spawnEnemies()` to destructure per-stat multipliers; add `xpReward` to enemy entity; update `spawnEnemy()` for consistency
5. **`src/systems/commandSystem.js`** — Update debug commands for compatibility

### Files NOT to MODIFY

- `src/entities/enemyDefs.js` — Base definitions stay unchanged
- `src/stores/useLevel.jsx` — `currentSystem` and `advanceSystem()` are correct
- `src/stores/useBoss.jsx` — Boss scaling is separate (boss has fixed stats from GAME_CONFIG)
- `src/renderers/EnemyRenderer.jsx` — Rendering uses typeId for models, not stats

### Behavior-Specific Properties (NOT in scope)

The enemy definitions include behavior-specific properties (projectileDamage, shockwaveDamage, attackRange, attackCooldown, burstProjectileDamage, etc.) but these are **NOT currently used** — only the `chase` behavior is implemented in `useEnemies.tick()`. The other behaviors (sniper_mobile, sniper_fixed, shockwave, teleport, sweep) are defined in `enemyDefs.js` but their behavior system is Story 16.2 (ready-for-dev, not yet implemented).

**Decision:** Do NOT scale behavior-specific properties in this story. When Story 16.2 implements those behaviors, it can read base values from `ENEMIES[typeId]` and apply scaling at that time. This story focuses on the core stats: hp, damage, speed, xpReward.

### Backward Compatibility in spawnEnemies

The `spawnEnemies` function must handle both:
- **New format**: `{ scaling: { hp: 1.6, damage: 1.5, speed: 1.3, xpReward: 1.4 } }` — per-stat object
- **Legacy format**: `{ difficultyMult: 1.0 }` — single number (used by debug `spawn` command)

Implementation approach:
```javascript
const { typeId, x, z, scaling, difficultyMult = 1.0 } = instructions[i]
// If scaling object provided, use per-stat; otherwise fall back to uniform difficultyMult
const hpMult = scaling?.hp ?? difficultyMult
const damageMult = scaling?.damage ?? difficultyMult
const speedMult = scaling?.speed ?? difficultyMult
const xpMult = scaling?.xpReward ?? difficultyMult
```

### Concrete Stat Examples

**FODDER_BASIC (base: hp=20, damage=5, speed=17, xpReward=12):**
- System 1: hp=20, damage=5, speed=17, xpReward=12
- System 2: hp=32, damage=8, speed=22.1, xpReward=17
- System 3: hp=50, damage=11, speed=27.2, xpReward=24

**FODDER_TANK (base: hp=40, damage=5, speed=12, xpReward=15):**
- System 1: hp=40, damage=5, speed=12, xpReward=15
- System 2: hp=64, damage=8, speed=15.6, xpReward=21
- System 3: hp=100, damage=11, speed=19.2, xpReward=30

**SNIPER_FIXED (base: hp=10, damage=0, speed=0, xpReward=30):**
- System 1: hp=10, damage=0, speed=0, xpReward=30
- System 2: hp=16, damage=0, speed=0, xpReward=42
- System 3: hp=25, damage=0, speed=0, xpReward=60

### SYSTEM_DIFFICULTY_MULTIPLIERS Usage Search

Before removing `SYSTEM_DIFFICULTY_MULTIPLIERS`, verify all usages:
- `src/GameLoop.jsx:392` — enemy spawn scaling (replace with ENEMY_SCALING_PER_SYSTEM)
- Any other files? Search the codebase for all references before removing.

### Testing Approach

**Config tests:**
- `ENEMY_SCALING_PER_SYSTEM` has entries for 1, 2, 3
- Each entry has hp, damage, speed, xpReward keys
- System 1 values are all 1.0

**Spawn scaling tests:**
- Spawn FODDER_BASIC with System 2 scaling → verify hp=32, damage=8, speed=22.1, xpReward=17
- Spawn FODDER_BASIC with System 3 scaling → verify hp=50, damage=11, speed=27.2, xpReward=24
- Backward compat: spawn with difficultyMult=1.5 (number) → hp=30, damage=8, speed=25.5, xpReward=18

**Entity field tests:**
- Enemy entity has `xpReward` field after spawn
- `xpReward` reflects scaled value, not base def value

**Death handler tests (optional, integration):**
- Enemy spawned with System 2 scaling → killed → spawnOrb called with scaled xpReward

### Anti-Patterns to Avoid

- Do NOT scale behavior-specific properties (projectileDamage, shockwaveDamage, etc.) — those behaviors aren't implemented yet
- Do NOT modify enemyDefs.js base values — scaling is applied at spawn time
- Do NOT recalculate scaling every tick — store scaled stats on entity at spawn
- Do NOT hardcode system numbers — use `ENEMY_SCALING_PER_SYSTEM[currentSystem]` lookup
- Do NOT break the debug `spawn` command — maintain backward compatibility with single difficultyMult

### Project Structure Notes

- **Config Layer** (`gameConfig.js`): Single source of truth for scaling multipliers
- **Systems Layer** (`spawnSystem.js`): Passes scaling through, no stat calculation
- **Stores Layer** (`useEnemies.jsx`): Applies scaling at spawn time, stores on entity
- **GameLoop**: Orchestrates the flow — reads currentSystem, looks up scaling, passes to spawn, reads xpReward from entity at death

### References

- [Source: src/config/gameConfig.js:147-148] — Current SYSTEM_DIFFICULTY_MULTIPLIERS definition
- [Source: src/GameLoop.jsx:390-396] — Enemy spawn section reading currentSystem and difficultyMult
- [Source: src/GameLoop.jsx:477-488] — Enemy death handler reading xpReward from ENEMIES base defs (BUG)
- [Source: src/stores/useEnemies.jsx:42-81] — spawnEnemies() applying difficultyMult to hp/speed/damage only
- [Source: src/stores/useEnemies.jsx:11-38] — spawnEnemy() single spawn without xpReward field
- [Source: src/systems/spawnSystem.js:22-56] — tick() passing difficultyMult in instructions
- [Source: src/systems/commandSystem.js:100-162] — Debug spawn/spawnwave commands
- [Source: src/entities/enemyDefs.js] — Enemy base stat definitions
- [Source: src/stores/useLevel.jsx:5] — currentSystem field (1, 2, or 3)
- [Source: _bmad-output/planning-artifacts/epic-18-cross-system-progression.md#Story 18.3] — Epic AC source
- [Source: _bmad-output/implementation-artifacts/18-1-progression-state-persistence-across-systems.md] — Previous story (18.1) context
- [Source: _bmad-output/implementation-artifacts/18-2-system-specific-state-reset.md] — Previous story (18.2) context

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- **Task 1**: Added `ENEMY_SCALING_PER_SYSTEM` config with per-stat multipliers for systems 1-3. Kept `SYSTEM_DIFFICULTY_MULTIPLIERS` because `useBoss.jsx` still references it for boss HP scaling (out of scope for this story).
- **Task 2**: Updated GameLoop to read `ENEMY_SCALING_PER_SYSTEM[currentSystem]` and pass the scaling object through spawnSystem to useEnemies.
- **Task 3**: Updated `spawnEnemies()` to destructure per-stat multipliers (hp, damage, speed, xpReward) with backward compatibility for single `difficultyMult` number. Added `xpReward` field to spawned enemy entities.
- **Task 4**: Updated GameLoop death handler to read `xpReward` from enemy entity first (`event.enemy.xpReward`), with fallback to base def.
- **Task 5**: Debug commands (`spawn`, `spawnwave`) remain backward compatible — they pass `difficultyMult` as a number, which the updated `spawnEnemies()` handles via `scaling?.hp ?? difficultyMult` fallback. No code changes needed.
- **Task 6**: Added `xpReward: def.xpReward` to single `spawnEnemy()` entity creation for consistency.
- **Task 7**: Updated `difficultyScaling.test.js` with 23 tests covering config validation, per-stat spawn scaling (System 1/2/3), multi-type scaling (FODDER_TANK, SNIPER_FIXED), backward compatibility with single difficultyMult, xpReward entity field, death event xpReward pipeline (AC #5), and boss scaling regression. Added 2 tests to `spawnSystem.test.js` for scaling pass-through verification.

### Change Log

- 2026-02-14: Implemented per-stat enemy difficulty scaling for Systems 2 & 3 (Story 18.3)
- 2026-02-14: Code review fixes — added 5 tests (multi-type scaling, death event xpReward pipeline) + 2 spawnSystem scaling pass-through tests

### File List

- src/config/gameConfig.js — Added ENEMY_SCALING_PER_SYSTEM config
- src/GameLoop.jsx — Updated spawn scaling lookup + death handler xpReward
- src/systems/spawnSystem.js — Changed difficultyMult parameter to scaling object
- src/stores/useEnemies.jsx — Per-stat scaling in spawnEnemies(), xpReward on entities
- src/systems/__tests__/difficultyScaling.test.js — Updated with 23 tests for Story 18.3
- src/systems/__tests__/spawnSystem.test.js — Added 2 tests for scaling pass-through verification
