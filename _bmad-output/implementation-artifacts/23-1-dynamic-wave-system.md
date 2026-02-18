# Story 23.1: Dynamic Wave System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the difficulty to alternate between intense pressure phases and breathing room,
So that the game has dramatic pacing rather than monotonous linear scaling.

## Acceptance Criteria

**Given** the wave system timeline for a system (e.g., 10 minutes)
**When** designed
**Then** the difficulty follows a non-linear curve with alternating phases:
  - 0-20% time: Easy phase — low spawn rate, basic enemies (FODDER tier)
  - 20-35% time: Hard spike — high spawn rate, mixed FODDER + SKIRMISHER enemies
  - 35-50% time: Medium phase — moderate spawn, SKIRMISHER dominant
  - 50-65% time: Hard spike — dense spawns, SKIRMISHER + ASSAULT enemies, higher tier enemies appear
  - 65-80% time: Medium phase — moderate with ASSAULT enemies
  - 80-95% time: Intense crescendo — maximum spawn density, all tiers, ELITE enemies appear
  - 95-100% time: Pre-boss — spawn rate drops slightly to let player prepare for wormhole
**And** the exact percentages and tiers are configurable in a wave definition config

**Given** a hard spike phase
**When** active
**Then** enemy spawn rate increases by 2-3x compared to the adjacent easy phase
**And** higher-tier enemies are introduced or become more frequent
**And** the visual density of enemies is noticeably higher

**Given** a breathing room phase
**When** active
**Then** spawn rate returns to moderate levels
**And** the player has time to collect loot, heal, and reposition
**And** the relief makes the next hard phase feel more impactful

**Given** the wave config
**When** defined
**Then** each system can have its own wave profile (system 2 starts harder than system 1)
**And** the wave profiles respect the enemy difficulty scaling from Story 16.4 and 18.3
**And** the Curse stat (from permanent upgrades) multiplies the base spawn rates globally

**Given** enemy tier progression
**When** higher tiers appear
**Then** new enemy types are introduced at specific time thresholds (not all at once)
**And** each tier brings visually distinct, more dangerous enemies
**And** the tier progression is separate from spawn density — both increase but at different rates

## Tasks / Subtasks

- [x] Task 1: Create wave profile configuration (AC: #1, #3)
  - [x] Create src/entities/waveDefs.js (NEW file)
  - [x] Define WAVE_PROFILES object with system1, system2, system3 keys
  - [x] Each profile: array of phases with { startPercent, endPercent, spawnRateMultiplier, enemyTierWeights }
  - [x] System 1 profile: 7 phases (easy → hard → medium → hard → medium → crescendo → pre-boss)
  - [x] System 2/3 profiles: Start harder, escalate faster, higher tier weights
  - [x] Export helper: getPhaseForProgress(systemNum, timeProgress) returns active phase config

- [x] Task 2: Refactor spawnSystem.js to use wave-based spawning (AC: #1, #2, #3, #4, #5)
  - [x] Modify src/systems/spawnSystem.js createSpawnSystem() function
  - [x] Add systemNum and systemTimer parameters to tick() via options object
  - [x] Calculate timeProgress = elapsedTime / systemTimer (percentage 0.0-1.0)
  - [x] Load active phase from WAVE_PROFILES using getPhaseForProgress()
  - [x] Replace linear SPAWN_INTERVAL_BASE ramp with phase.spawnRateMultiplier
  - [x] Apply curse multiplier: finalSpawnRate = baseRate * phase.spawnRateMultiplier * curseMultiplier
  - [x] Filter enemy types by tier weights from phase.enemyTierWeights
  - [x] Preserve sweep/sniper_fixed spawn logic (group formations, fixed distance)

- [x] Task 3: Integrate curse stat from permanent upgrades (AC: #3)
  - [x] Read curse multiplier from usePlayer.getState().permanentUpgradeBonuses.curse (already exists from Story 20.4)
  - [x] Curse handled internally in spawnSystem (not passed from GameLoop)
  - [x] Applied as global spawn rate multiplier (default 0.0 → curseMultiplier 1.0 = no effect)

- [x] Task 4: Test wave system behavior (AC: #2, #4, #5)
  - [x] Test waveDefs: all profiles have valid phase structure (37 tests in waveDefs.test.js)
  - [x] Test waveDefs: phase percentages cover 0-100% with no gaps
  - [x] Test spawnSystem: timeProgress 0.1 (10%) returns easy phase config
  - [x] Test spawnSystem: timeProgress 0.25 (25%) returns hard spike phase config
  - [x] Test spawnSystem: spawn rate increases during hard phase vs easy phase
  - [x] Test spawnSystem: enemy tier weights filter correctly (FODDER in early phase, ASSAULT in crescendo)
  - [x] Test spawnSystem: tier weights exclude zero-weight tiers
  - [x] Test system1 vs system2 profiles: system2 has shorter spawn interval at Easy Start

## Dev Notes

### Architecture Alignment

This story refactors the enemy spawning system from **linear time-based escalation** to **phase-based wave profiles**. The current `spawnSystem.js` uses a simple ramp: spawn interval decreases linearly with elapsed time, and enemy types unlock at specific time gates (Story 16.3). The new system replaces this with **configurable wave profiles** that alternate between pressure and relief phases.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/waveDefs.js` (NEW) — Wave profile definitions per system
- **Config Layer**: `src/config/gameConfig.js` — Add WAVE_PHASE_* constants if needed
- **Systems Layer**: `src/systems/spawnSystem.js` — Refactor to consume wave profiles
- **Stores Layer**: `src/stores/useLevel.jsx` — Provides systemNum and systemTimer to GameLoop
- **Stores Layer**: `src/stores/useUpgrades.jsx` — Provides curse multiplier (Story 20.5, assume 1.0 for now)
- **GameLoop**: `src/GameLoop.jsx` — Pass systemNum, systemTimer, curseMultiplier to spawnSystem.tick()

**NOT in this story:**
- Enemy collision physics (Story 23.2)
- Cumulative timer across systems (Story 23.3)
- Curse stat implementation (Story 20.5 — for now, assume curse = 1.0)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/entities/waveDefs.js` | **NEW** — Wave profile definitions for 3 systems | Config |
| `src/systems/spawnSystem.js` | Refactor tick() to use phase-based spawning | Systems |
| `src/GameLoop.jsx` | Pass systemNum, systemTimer, curseMultiplier to spawnSystem | GameLoop |
| `src/stores/useLevel.jsx` | Read systemNum field (already exists from Story 18.4) | Stores |

### Current Spawn System Analysis

**File: `src/systems/spawnSystem.js`** (132 lines, last modified Story 16.3)

**Current behavior:**
- `elapsedTime` tracker increments each frame
- `spawnTimer` decrements, spawns batch when timer hits 0
- **Linear ramp**: `interval = max(MIN, BASE - elapsedTime * RAMP_RATE)` (line 60-63)
- **Batch size ramp**: `batchSize = BASE + floor(elapsedTime / RAMP_INTERVAL)` (line 67)
- **Time-gated enemy types**: `getAvailableEnemyTypes(elapsedTime)` filters by `TIME_GATED_SPAWN_SCHEDULE` (lines 14-27)
- **Weighted random pick**: `pickEnemyType()` uses `spawnWeight` from enemyDefs (lines 34-51)
- **Special spawning**: Sweep groups (lines 75-99), Sniper fixed distance (lines 103-105)

**What needs to change:**
1. Replace linear `interval` calculation with `phase.spawnRateMultiplier`
2. Replace time-gated filtering with `phase.enemyTierWeights`
3. Add curse multiplier to spawn rate calculation
4. Accept `systemNum` and `systemTimer` parameters
5. Calculate `timeProgress = elapsedTime / systemTimer`
6. Load active phase from `WAVE_PROFILES[systemNum]`

**What stays the same:**
- Sweep group formation logic
- Sniper fixed spawn distance logic
- Batch size concept (but multiplied by phase.spawnRateMultiplier)
- Weighted random pick (but filter by tier weights)
- `reset()` function signature

### Wave Profile Structure

```javascript
// src/entities/waveDefs.js
export const WAVE_PROFILES = {
  system1: [
    {
      startPercent: 0.0,  // 0%
      endPercent: 0.2,    // 20%
      name: 'Easy Start',
      spawnRateMultiplier: 0.5,  // 50% of base spawn rate
      enemyTierWeights: {
        FODDER: 1.0,      // Only fodder enemies
        SKIRMISHER: 0.0,
        ASSAULT: 0.0,
        ELITE: 0.0,
      },
    },
    {
      startPercent: 0.2,
      endPercent: 0.35,
      name: 'Hard Spike 1',
      spawnRateMultiplier: 1.5,  // 150% spawn rate
      enemyTierWeights: {
        FODDER: 0.7,      // 70% fodder, 30% skirmisher
        SKIRMISHER: 0.3,
        ASSAULT: 0.0,
        ELITE: 0.0,
      },
    },
    {
      startPercent: 0.35,
      endPercent: 0.5,
      name: 'Medium Phase 1',
      spawnRateMultiplier: 1.0,  // Normal spawn rate
      enemyTierWeights: {
        FODDER: 0.4,
        SKIRMISHER: 0.6,   // Skirmisher dominant
        ASSAULT: 0.0,
        ELITE: 0.0,
      },
    },
    {
      startPercent: 0.5,
      endPercent: 0.65,
      name: 'Hard Spike 2',
      spawnRateMultiplier: 2.0,  // 200% spawn rate
      enemyTierWeights: {
        FODDER: 0.3,
        SKIRMISHER: 0.5,
        ASSAULT: 0.2,      // Assault enemies introduced
        ELITE: 0.0,
      },
    },
    {
      startPercent: 0.65,
      endPercent: 0.8,
      name: 'Medium Phase 2',
      spawnRateMultiplier: 1.2,  // Slightly elevated
      enemyTierWeights: {
        FODDER: 0.2,
        SKIRMISHER: 0.4,
        ASSAULT: 0.4,      // Assault more common
        ELITE: 0.0,
      },
    },
    {
      startPercent: 0.8,
      endPercent: 0.95,
      name: 'Crescendo',
      spawnRateMultiplier: 2.5,  // Maximum density
      enemyTierWeights: {
        FODDER: 0.2,
        SKIRMISHER: 0.3,
        ASSAULT: 0.4,
        ELITE: 0.1,        // Elite enemies appear
      },
    },
    {
      startPercent: 0.95,
      endPercent: 1.0,
      name: 'Pre-Boss Calm',
      spawnRateMultiplier: 0.8,  // Slight drop for wormhole prep
      enemyTierWeights: {
        FODDER: 0.3,
        SKIRMISHER: 0.4,
        ASSAULT: 0.2,
        ELITE: 0.1,
      },
    },
  ],
  system2: [
    // Starts harder than system1, escalates faster
    // System 2 baseline: spawnRateMultiplier 20% higher
    // Example: Easy Start 0.6 (vs 0.5), Hard Spike 1.8 (vs 1.5), Crescendo 3.0 (vs 2.5)
    // (Full definition similar to system1 but with adjusted values)
  ],
  system3: [
    // Even harder, highest tier weights
    // (Full definition similar to system2 but with further escalation)
  ],
}

// Helper: Get active phase for given system and time progress
export function getPhaseForProgress(systemNum, timeProgress) {
  const profileKey = `system${systemNum}`
  const profile = WAVE_PROFILES[profileKey] || WAVE_PROFILES.system1 // Fallback to system1

  for (const phase of profile) {
    if (timeProgress >= phase.startPercent && timeProgress < phase.endPercent) {
      return phase
    }
  }

  // Fallback to last phase if timeProgress >= 1.0 (edge case)
  return profile[profile.length - 1]
}
```

**IMPORTANT:** The `enemyTierWeights` are **proportions**, not absolute weights. Sum of weights does NOT need to equal 1.0 (they will be normalized when picking enemies). A weight of 0.0 means that tier is excluded.

**IMPORTANT:** The `spawnRateMultiplier` is applied to the **base spawn interval**, NOT the batch size. Higher multiplier = shorter interval = more frequent spawns.

### Enemy Tier Mapping

The wave system uses **tier weights** to filter enemy types. Each enemy in `enemyDefs.js` should have a `tier` field (or we infer it from naming conventions):

**Tier classification (based on enemyDefs.js and Story 16.3 TIME_GATED_SPAWN_SCHEDULE):**
- **FODDER**: FODDER_BASIC, FODDER_FAST, FODDER_TANK, FODDER_BERSERKER
- **SKIRMISHER**: SKIRMISHER_FLANKER, SKIRMISHER_SWEEP, SKIRMISHER_AGGRESSIVE
- **ASSAULT**: ASSAULT_BRUISER, ASSAULT_CHARGER, ASSAULT_SNIPER_FIXED
- **ELITE**: ELITE_COMMANDER, ELITE_WARDEN, ELITE_VANGUARD

**CRITICAL:** Check `src/entities/enemyDefs.js` to verify enemy IDs and add `tier` field if not present. If tier field doesn't exist, infer from ID prefix (e.g., `FODDER_*` → tier: 'FODDER').

### Spawn Rate Calculation

**Current formula (linear ramp):**
```javascript
const interval = Math.max(
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_BASE - elapsedTime * SPAWN_RAMP_RATE
)
```

**New formula (phase-based with curse):**
```javascript
const phase = getPhaseForProgress(systemNum, timeProgress)
const baseInterval = SPAWN_INTERVAL_BASE  // e.g., 2.0 seconds
const curseMultiplier = curse || 1.0       // From permanent upgrades (Story 20.5)

// spawnRateMultiplier 2.0 = spawn twice as fast = interval / 2
// curse 1.5 = 50% more spawns = interval / 1.5
const interval = Math.max(
  SPAWN_INTERVAL_MIN,
  baseInterval / (phase.spawnRateMultiplier * curseMultiplier)
)
```

**Example:**
- Base interval: 2.0 seconds
- Phase multiplier: 2.0 (hard spike)
- Curse: 1.0 (no curse purchased)
- Result: interval = 2.0 / (2.0 * 1.0) = 1.0 seconds (spawn twice as fast)

**Example with curse:**
- Base interval: 2.0 seconds
- Phase multiplier: 1.0 (medium phase)
- Curse: 1.5 (50% more spawns)
- Result: interval = 2.0 / (1.0 * 1.5) = 1.33 seconds (spawn 50% faster)

### Enemy Tier Filtering

**Current logic:** Time-gated filtering (Story 16.3):
```javascript
function getAvailableEnemyTypes(elapsedTime) {
  const schedule = GAME_CONFIG.TIME_GATED_SPAWN_SCHEDULE
  const availableIds = new Set()
  for (const entry of schedule) {
    if (elapsedTime >= entry.minTime) {
      availableIds.add(entry.typeId)
    }
  }
  return Object.values(ENEMIES).filter(e => e.spawnWeight > 0 && availableIds.has(e.id))
}
```

**New logic:** Tier-weight filtering:
```javascript
function getAvailableEnemyTypes(phase) {
  const tierWeights = phase.enemyTierWeights

  // Filter enemies by tier, excluding tiers with 0 weight
  const available = Object.values(ENEMIES).filter(e => {
    const tier = e.tier || inferTierFromId(e.id)  // Infer from ID prefix if missing
    return e.spawnWeight > 0 && tierWeights[tier] > 0
  })

  // Adjust spawn weights by tier weight multiplier
  const weighted = available.map(e => {
    const tier = e.tier || inferTierFromId(e.id)
    return {
      ...e,
      adjustedWeight: e.spawnWeight * tierWeights[tier]
    }
  })

  return weighted
}

function inferTierFromId(enemyId) {
  if (enemyId.startsWith('FODDER_')) return 'FODDER'
  if (enemyId.startsWith('SKIRMISHER_')) return 'SKIRMISHER'
  if (enemyId.startsWith('ASSAULT_')) return 'ASSAULT'
  if (enemyId.startsWith('ELITE_')) return 'ELITE'
  return 'FODDER' // Default fallback
}
```

**IMPORTANT:** The tier weight is a **multiplier** on the enemy's base `spawnWeight`. Example:
- FODDER_BASIC has `spawnWeight: 100`
- Phase tier weight for FODDER is `0.7`
- Adjusted weight: `100 * 0.7 = 70`

This allows fine-tuning within a tier (some FODDER enemies may be rarer than others) while also controlling tier distribution.

### GameLoop Integration

**Current GameLoop.jsx pattern (Section 3: Enemy spawning):**
```javascript
// Section 3: Enemy spawning
const playerX = playerState.position[0]
const playerZ = playerState.position[2]
const spawnInstructions = spawnSystem.tick(delta, playerX, playerZ, systemScaling)
for (const instruction of spawnInstructions) {
  useEnemies.getState().spawnEnemy(instruction)
}
```

**Modified pattern (add systemNum, systemTimer, curse):**
```javascript
// Section 3: Enemy spawning
const playerX = playerState.position[0]
const playerZ = playerState.position[2]
const systemNum = useLevel.getState().currentSystemIndex + 1  // 1-indexed
const systemTimer = GAME_CONFIG.SYSTEM_TIMER  // 600 seconds (10 minutes)
const curse = 1.0  // TODO Story 20.5: useUpgrades.getState().getComputedBonuses().curse || 1.0

const spawnInstructions = spawnSystem.tick(delta, playerX, playerZ, {
  systemNum,
  systemTimer,
  systemScaling,
  curse,
})
for (const instruction of spawnInstructions) {
  useEnemies.getState().spawnEnemy(instruction)
}
```

**IMPORTANT:** The systemTimer is the **total duration** of the system (e.g., 10 minutes = 600 seconds), NOT the remaining time. The spawnSystem will use `elapsedTime / systemTimer` to calculate time progress.

**IMPORTANT:** For Story 23.3 (Cumulative Timer), the systemTimer will be dynamic (base + carried time). For now, use the constant `GAME_CONFIG.SYSTEM_TIMER`.

### System Difficulty Scaling Integration

**Existing scaling from Story 16.4 and 18.3:**
- `useLevel.getState().getSystemScaling()` returns difficulty multipliers for current system
- Applied to enemy HP, damage, XP rewards
- System 1: 1.0x, System 2: 1.2x, System 3: 1.5x (example values)

**Wave system integration:**
- Wave profiles are SEPARATE from difficulty scaling
- System 2 wave profile has higher base spawn rates than system 1
- Difficulty scaling is applied to INDIVIDUAL ENEMIES after spawn (via `instruction.scaling`)
- Wave profiles control SPAWN DENSITY and TIER DISTRIBUTION

**IMPORTANT:** The two systems stack:
- System 2 has harder wave profile (more spawns, higher tiers)
- System 2 also has higher difficulty scaling (enemies tougher)
- Result: System 2 is significantly harder than system 1 (both more enemies AND tougher enemies)

### Testing Standards

Follow the project's Vitest testing standards. All tests must reset system state between test cases.

**Wave config tests:**
- Test waveDefs: all systems have valid profiles
- Test waveDefs: all phases cover 0-100% with no gaps or overlaps
- Test waveDefs: all phases have valid spawnRateMultiplier (> 0)
- Test waveDefs: all phases have valid enemyTierWeights (all tiers present, sum > 0)
- Test waveDefs: system2 profile is harder than system1 (higher multipliers)
- Test getPhaseForProgress: returns correct phase for given timeProgress
- Test getPhaseForProgress: handles edge cases (0.0, 1.0, >1.0)

**Spawn system tests:**
- Test spawnSystem: timeProgress 0.1 loads easy phase
- Test spawnSystem: timeProgress 0.25 loads hard spike phase
- Test spawnSystem: spawn interval shortens during hard phase
- Test spawnSystem: spawn interval lengthens during easy phase
- Test spawnSystem: curse 1.5 reduces interval by 50%
- Test spawnSystem: tier weights filter correctly (FODDER only in early phase)
- Test spawnSystem: tier weights exclude zero-weight tiers (no ELITE in early phase)
- Test spawnSystem: sweep groups still spawn correctly in wave system
- Test spawnSystem: sniper_fixed still spawns at correct distance

**Integration tests:**
- Test GameLoop: passes correct systemNum, systemTimer, curse to spawnSystem
- Test end-to-end: system2 spawns more enemies than system1 at same time progress

### Performance Considerations

- Wave phase lookup is O(n) where n = number of phases (7 for system1)
- Phase lookup happens once per spawn batch, NOT once per enemy
- Enemy tier filtering is O(m) where m = total enemy types (~15-20)
- No significant performance impact vs current time-gated system
- Spatial hashing (Story 2.1) handles large enemy counts (target: 200+ enemies)

### Previous Story Learnings

**From Story 20.1 (Permanent Upgrades — Combat Stats):**
- Follow exact file naming: `src/entities/waveDefs.js` (camelCase for config files)
- Export constants with SCREAMING_CAPS: `WAVE_PROFILES`
- Helper functions use camelCase: `getPhaseForProgress()`
- Config files are pure data, no logic beyond helper getters
- All tests reset store state in `afterEach()` to prevent pollution

**From Story 16.3 (Time-Based Enemy Spawn System):**
- Current spawnSystem.js uses `elapsedTime` tracker (internal state)
- Time-gated schedule in gameConfig.js: `TIME_GATED_SPAWN_SCHEDULE`
- Sweep groups spawn as line formation with shared direction
- Sniper fixed spawns at 150-200 distance (outside visible area)
- Batch size ramps over time: `BASE + floor(elapsedTime / RAMP_INTERVAL)`

**From Story 18.3 (Enemy Difficulty Scaling Systems 2-3):**
- `useLevel.getSystemScaling()` provides HP/damage/XP multipliers per system
- Scaling is SEPARATE from spawn logic (applied after spawn in useEnemies)
- System progression: 1.0x → 1.2x → 1.5x (example values, check gameConfig.js)

### Project Structure Notes

**New files:**
- `src/entities/waveDefs.js` — Wave profile definitions + getPhaseForProgress() helper
- `src/systems/__tests__/waveSystem.test.js` — Wave system tests (phase lookup, spawn rate calc)
- `src/entities/__tests__/waveDefs.test.js` — Wave config validation tests

**Modified files:**
- `src/systems/spawnSystem.js` — Refactor tick() to use wave phases
- `src/GameLoop.jsx` — Pass systemNum, systemTimer, curse to spawnSystem

**Files to check:**
- `src/entities/enemyDefs.js` — Verify tier field exists, add if missing
- `src/config/gameConfig.js` — Verify SYSTEM_TIMER constant (should be 600)
- `src/stores/useLevel.jsx` — Verify currentSystemIndex field (Story 18.4)

**NOT in this story:**
- Enemy collision physics (Story 23.2 — separate system)
- Cumulative timer (Story 23.3 — modifies systemTimer calculation)
- Curse stat implementation (Story 20.5 — for now, assume curse = 1.0)

### References

- [Source: _bmad-output/planning-artifacts/epic-23-wave-enemy-systems.md] — Epic context, all 3 stories, technical notes
- [Source: src/systems/spawnSystem.js] — Current spawn system implementation
- [Source: src/entities/enemyDefs.js] — Enemy definitions and tier structure
- [Source: src/config/gameConfig.js] — Spawn constants (SPAWN_INTERVAL_BASE, etc.)
- [Source: src/stores/useLevel.jsx] — System state (currentSystemIndex, systemTimer)
- [Source: src/GameLoop.jsx] — Enemy spawning section (Section 3)
- [Source: _bmad-output/implementation-artifacts/16-3-time-based-enemy-spawn-system.md] — Time-gated spawn system (Story 16.3)
- [Source: _bmad-output/implementation-artifacts/18-3-enemy-difficulty-scaling-systems-2-3.md] — Difficulty scaling (Story 18.3)
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, systems layer patterns

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Curse multiplier is read internally from `usePlayer.getState().permanentUpgradeBonuses.curse` (Story 20.4 pattern) — not passed as a tick() argument from GameLoop. Default value 0.0 → curseMultiplier 1.0 (no effect).
- `tick()` signature changed to `tick(delta, playerX, playerZ, options = {})` with `options = { systemNum, systemTimer, systemScaling }`. Old 4th positional arg (scaling) is now `options.systemScaling`.
- Added explicit `tier` field to all 7 wave-eligible enemies in `enemyDefs.js`. `SHOCKWAVE_BLOB` and `SNIPER_MOBILE` don't match tier-prefix naming, so explicit `tier` is required.
- `FODDER_SWARM` is now FODDER tier and spawns from t=0 (previously time-gated at t=60s in old system). This is the intended new behavior — the wave profile controls when higher tiers appear, not individual enemy gates.
- The ELITE tier exists in wave profiles but no ELITE enemies are currently defined in `enemyDefs.js` (spawnWeight=0). This is intentional — tier weight > 0 simply means "allow ELITE if they exist"; no enemies spawn for missing tiers.
- Old `TIME_GATED_SPAWN_SCHEDULE` constant preserved in `gameConfig.js` (not removed) for backwards compatibility with any debug tooling that may reference it.
- `spawnSystem.test.js` fully rewritten: all time-gated tests removed, new tests validate wave behavior and correct options API. `waveSystem.test.js` created with 14 tests covering phase spawn rates, tier filtering, and options pass-through.

### File List

- `src/entities/waveDefs.js` — NEW: Wave profile definitions for system1/2/3, `getPhaseForProgress()` helper
- `src/entities/enemyDefs.js` — Modified: Added explicit `tier` field to all 7 wave-eligible enemies
- `src/systems/spawnSystem.js` — Modified: Replaced linear ramp + time-gate with wave phase-based spawning; code review fixes (MED-1/2/3)
- `src/GameLoop.jsx` — Modified: Updated `spawnSystemRef.current.tick()` call with options object (systemNum, systemTimer, systemScaling)
- `src/entities/__tests__/waveDefs.test.js` — NEW: 37 tests validating wave profile structure and `getPhaseForProgress()`
- `src/systems/__tests__/waveSystem.test.js` — Modified: 16 tests (+2 curse multiplier tests for HIGH-1 fix); updated FIRST_SPAWN_TRIGGER constant
- `src/systems/__tests__/spawnSystem.test.js` — Modified: Removed time-gated tests, fixed options API, added enemy definition integrity tests; updated FIRST_SPAWN_TRIGGER constant

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-18 | 1.0 | Implemented dynamic wave system with phase-based spawn profiles for systems 1–3 | claude-sonnet-4-6 |
| 2026-02-18 | 1.1 | Code review fixes: [MED-1] hoist getAvailableEnemyTypes out of batch loop; [MED-2] null-guard on permanentUpgradeBonuses.curse; [MED-3] init spawnTimer from wave-phase interval; [HIGH-1] add curse multiplier test coverage | claude-sonnet-4-6 |
