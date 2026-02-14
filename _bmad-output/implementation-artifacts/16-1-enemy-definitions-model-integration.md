# Story 16.1: Enemy Definitions & Model Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want all 8 enemy types fully defined in enemyDefs.js with their corresponding GLB models and visual configurations,
So that each enemy has unique stats, behaviors, and visuals ready for spawning.

## Acceptance Criteria

1. **Given** enemyDefs.js is updated **When** enemy definitions are added **Then** the following 8 enemy types are defined with complete stats:
   - FODDER_BASIC (Type 1): hp=20, speed=17, modelPath='robot-enemy-flying.glb', meshScale=[3,3,3], behavior='chase'
   - FODDER_TANK (Type 2): hp=40, speed=12, modelPath='robot-enemy-flying.glb', meshScale=[4,4,4], behavior='chase'
   - FODDER_SWARM (Type 3): hp=8, speed=35, modelPath='robot-enemy-flying.glb', meshScale=[1.5,1.5,1.5], behavior='sweep'
   - SHOCKWAVE_BLOB (Type 4): hp=15, speed=8, modelPath='enemy-blob.glb', meshScale=[2,2,2], behavior='shockwave'
   - SNIPER_MOBILE (Type 6): hp=25, speed=20, modelPath='robot-enemy-flying-gun.glb', meshScale=[3,3,3], behavior='sniper_mobile', attackRange=40, attackCooldown=2
   - SNIPER_FIXED (Type 7): hp=10, speed=0, modelPath='robot-enemy-flying-gun.glb', meshScale=[3,3,3], color='#ff3333', behavior='sniper_fixed', attackRange=60, attackCooldown=4
   - TELEPORTER (Type 8): hp=18, speed=15, modelPath='robot-enemy-flying.glb', meshScale=[2.5,2.5,2.5], behavior='teleport', teleportCooldown=5

2. **Given** enemy models **When** they are rendered **Then** robot-enemy-flying.glb is used for Types 1, 2, 3, 8 with appropriate meshScale **And** enemy-blob.glb is used for Type 4 **And** robot-enemy-flying-gun.glb is used for Types 6, 7 **And** Type 7 (sniper_fixed) has a red tint applied via material color override

3. **Given** enemy collision radii **When** they are defined **Then** each enemy's radius is proportional to its meshScale and visual size **And** Type 4 (blob) has a larger collision radius reflecting its "sac à PV" tanky nature

## Tasks / Subtasks

- [x] Task 1: Create enemyDefs.js with all 8 enemy type definitions (AC: #1, #2, #3)
  - [x] 1.1: Updated existing src/entities/enemyDefs.js (not src/config/) following entity definition pattern
  - [x] 1.2: Define FODDER_BASIC (Type 1) with chase behavior
  - [x] 1.3: Define FODDER_TANK (Type 2) with chase behavior, higher HP
  - [x] 1.4: Define FODDER_SWARM (Type 3) with sweep behavior, fast speed
  - [x] 1.5: Define SHOCKWAVE_BLOB (Type 4) with shockwave behavior, enemy-blob.glb model
  - [x] 1.6: Define SNIPER_MOBILE (Type 6) with sniper_mobile behavior, attackRange, attackCooldown
  - [x] 1.7: Define SNIPER_FIXED (Type 7) with sniper_fixed behavior, red color override, speed=0
  - [x] 1.8: Define TELEPORTER (Type 8) with teleport behavior, teleportCooldown

- [x] Task 2: Calculate and assign collision radii for each enemy type (AC: #3)
  - [x] 2.1: FODDER_BASIC radius: 1.5 (meshScale [3,3,3])
  - [x] 2.2: FODDER_TANK radius: 2.0 (meshScale [4,4,4], larger tanky enemy)
  - [x] 2.3: FODDER_SWARM radius: 0.75 (meshScale [1.5,1.5,1.5], small and fast)
  - [x] 2.4: SHOCKWAVE_BLOB radius: 2.5 (meshScale [2,2,2], "sac à PV" large collision for tanky nature)
  - [x] 2.5: SNIPER_MOBILE radius: 1.5 (meshScale [3,3,3])
  - [x] 2.6: SNIPER_FIXED radius: 1.5 (meshScale [3,3,3])
  - [x] 2.7: TELEPORTER radius: 1.25 (meshScale [2.5,2.5,2.5])

- [x] Task 3: Verify GLB model paths match existing files (AC: #2)
  - [x] 3.1: Confirmed public/models/enemies/robot-enemy-flying.glb exists (for Types 1, 2, 3, 8)
  - [x] 3.2: Confirmed public/models/enemies/enemy-blob.glb exists (for Type 4)
  - [x] 3.3: Confirmed public/models/enemies/robot-enemy-flying-gun.glb exists (for Types 6, 7)
  - [x] 3.4: modelPath in enemyDefs.js matches actual file paths

- [x] Task 4: Add gameConfig.js constants for enemy system (AC: #1)
  - [x] 4.1: Not needed — enemy type count is implicit from ENEMIES object keys
  - [x] 4.2: Not needed — color override is per-enemy in defs (color field, null = no override)
  - [x] 4.3: Verified MAX_ENEMIES_ON_SCREEN: 100 is sufficient for new types

- [x] Task 5: Update architecture documentation if needed
  - [x] 5.1: enemyDefs.js is in src/entities/ (alongside planetDefs.js, shipDefs.js) — correct placement
  - [x] 5.2: enemyDefs.js follows plain object entity definition pattern (no classes, no methods)
  - [x] 5.3: Behavior logic is handled in useEnemies store tick(), not in defs

- [x] Task 6: Prepare for future integration with existing enemy system
  - [x] 6.1: Reviewed useEnemies.jsx — reads ENEMIES[typeId] for all spawned enemy properties
  - [x] 6.2: spawnSystem.js imports ENEMIES, uses spawnWeight for weighted random selection — new types auto-included
  - [x] 6.3: EnemyRenderer.jsx will need future update to read modelPath, meshScale, color per enemy type

## Dev Notes

### Epic Context

This story is part of **Epic 16: Enemy System Expansion**, which aims to implement all 8 enemy types from the original brainstorming with distinct behaviors, time-based spawn patterns, and progressive difficulty scaling across systems.

**Epic Goals:**
- Implement all 8 enemy types with distinct behaviors (Story 16.1 — THIS STORY)
- Create behavior patterns (sweep, shockwave, sniper, teleport) in enemy tick logic (Story 16.2)
- Implement time-based spawn system (types 1-2 first 2 minutes, type 3 from 1 min, etc.) (Story 16.3)
- Apply difficulty scaling across systems (n+1, n+2 are harder) (Story 16.4)

**Current Problem:**
Currently, only 3 enemy types exist: FODDER_BASIC (drone), FODDER_FAST (scout), and BOSS_SENTINEL. The brainstorming session defined 8 enemy types with unique behaviors (chase, wave sweep, shockwave, orbit, sniper mobile, sniper fixed, teleport). The game needs the full roster to create diverse combat scenarios and meet the original design vision.

**Story 16.1 Goal:**
Create the foundational enemy definitions file (enemyDefs.js) with all 8 enemy types fully defined with stats, behaviors, models, and visual configurations. This file serves as the single source of truth for all enemy data, following the architecture's entity definition pattern (plain objects, no logic).

**Story Sequence in Epic:**
- **Story 16.1 (Enemy Definitions & Model Integration) → THIS STORY** — Create enemyDefs.js with all 8 types
- Story 16.2 (Enemy Behavior System) → Implement behavior tick logic in useEnemies.jsx
- Story 16.3 (Time-Based Spawn System) → Spawn system reads enemyDefs.js, gates types by time
- Story 16.4 (Difficulty Scaling) → Apply system-based multipliers to base stats from enemyDefs.js

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config/Data Layer** → enemyDefs.js (THIS STORY) — Pure data definitions, imported by Systems and Stores
- **Systems Layer** → spawnSystem.js (Story 16.3) — Reads enemyDefs to spawn enemies
- **Stores Layer** → useEnemies.jsx (Story 16.2) — Reads enemyDefs for behavior logic
- **Rendering Layer** → EnemyRenderer.jsx (existing) — Will read modelPath, meshScale, color from enemyDefs
- **No Scenes Changes** — GameplayScene already uses EnemyRenderer
- **No UI Changes** — Enemy roster expansion is purely backend/rendering

**Architectural Pattern: Entity Definitions (Architecture.md lines 349-481):**

```javascript
// entities/enemyDefs.js — Plain objects, no classes, no methods
export const ENEMIES = {
  FODDER_BASIC: {
    id: 'FODDER_BASIC',
    name: 'Drone',
    hp: 20,
    speed: 17,
    damage: 5,
    radius: 0.5,          // collision radius
    xpReward: 10,
    behavior: 'chase',    // chase | orbit | ranged | boss
    spawnWeight: 100,     // relative spawn probability
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    color: '#ff5555',
    meshScale: [3, 3, 3],
  },
  // ... more enemies
}
```

**Critical Architectural Rules:**
- **All entity definitions are plain objects** — No classes, no methods, no logic
- **Systems read these defs and apply logic** — Behavior is in useEnemies.tick(), not in defs
- **No magic numbers** — All tunable values in defs or gameConfig.js
- **SCREAMING_CAPS for entity IDs** — FODDER_BASIC, SHOCKWAVE_BLOB, SNIPER_MOBILE, etc.
- **camelCase for properties** — hp, speed, behavior, spawnWeight, modelPath, meshScale

### Existing Infrastructure

**Current Enemy System (Story 2.2, 2.5 Context):**

Currently, 3 enemy types exist but are not centralized in an enemyDefs.js file. They are likely defined inline in useEnemies.jsx or spawnSystem.js. Epic 16 refactors this to centralized enemyDefs.js file for maintainability.

**Existing Enemy Types (to be migrated to enemyDefs.js):**
- FODDER_BASIC (drone) — Basic chase enemy
- FODDER_FAST (scout) — Faster chase enemy
- BOSS_SENTINEL — Boss enemy (not part of 8-type roster, separate boss system)

**Story 16.1 will replace/expand these definitions** with the 8-type roster from Epic 16 planning.

**GLB Models Already Available (verified via Glob):**
- `/public/models/enemies/robot-enemy-flying.glb` — For Types 1, 2, 3, 8
- `/public/models/enemies/enemy-blob.glb` — For Type 4
- `/public/models/enemies/robot-enemy-flying-gun.glb` — For Types 6, 7
- `/public/models/enemies/SpaceshipBoss.glb` — Boss model (not part of this story)

**All required models exist** — No model creation needed, only definitions.

**Current gameConfig.js Enemy Constants (lines 16-18):**
```javascript
MAX_ENEMIES_ON_SCREEN: 100,
MAX_PROJECTILES: 200,
MAX_XP_ORBS: 50,
```

**No changes needed to these constants** — Story 16.1 only creates definitions file.

**EnemyRenderer.jsx (existing):**
- Uses InstancedMesh for efficient rendering of many enemies
- Currently renders all enemies with same model/scale (likely)
- **Will need update in future story** to read modelPath, meshScale, color from enemyDefs
- **Story 16.1 does NOT modify EnemyRenderer** — only creates data definitions

### Technical Requirements

**enemyDefs.js Complete Structure:**

Create new file: `src/config/enemyDefs.js`

```javascript
// Enemy Definitions
// Plain data objects following architecture.md entity definition pattern
// All enemy types for Epic 16: Enemy System Expansion

export const ENEMIES = {
  // Type 1: Basic Chaser
  FODDER_BASIC: {
    id: 'FODDER_BASIC',
    name: 'Drone',
    type: 1, // Enemy type number from design doc
    hp: 20,
    speed: 17, // units/sec
    damage: 5, // Contact damage
    radius: 1.5, // Collision radius (proportional to meshScale)
    xpReward: 10,
    behavior: 'chase', // Behavior key for useEnemies tick logic
    spawnWeight: 100, // Relative spawn probability (higher = more common)
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [3, 3, 3],
    color: null, // No color override, use model's base color
  },

  // Type 2: Tank Chaser
  FODDER_TANK: {
    id: 'FODDER_TANK',
    name: 'Tank Drone',
    type: 2,
    hp: 40, // 2x hp of FODDER_BASIC
    speed: 12, // Slower than basic
    damage: 5, // Same contact damage
    radius: 2.0, // Larger collision for tank
    xpReward: 15, // Higher reward for tougher enemy
    behavior: 'chase',
    spawnWeight: 60, // Less common than basic
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [4, 4, 4], // Larger scale for visual differentiation
    color: null,
  },

  // Type 3: Swarm Fast Sweep
  FODDER_SWARM: {
    id: 'FODDER_SWARM',
    name: 'Swarm Scout',
    type: 3,
    hp: 8, // Low HP, high speed
    speed: 35, // Very fast
    damage: 3, // Lower contact damage
    radius: 0.75, // Small collision
    xpReward: 5, // Low reward
    behavior: 'sweep', // Moves in straight lines, spawns in groups
    spawnWeight: 40, // Moderate spawn rate
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [1.5, 1.5, 1.5], // Smallest scale
    color: null,
  },

  // Type 4: Shockwave Blob
  SHOCKWAVE_BLOB: {
    id: 'SHOCKWAVE_BLOB',
    name: 'Shockwave Blob',
    type: 4,
    hp: 15,
    speed: 8, // Slow moving
    damage: 5, // Contact damage
    radius: 2.5, // Large collision for "sac à PV" tanky nature
    xpReward: 20, // Higher reward for dangerous enemy
    behavior: 'shockwave', // Emits periodic radial shockwaves
    spawnWeight: 30, // Less common
    modelPath: '/models/enemies/enemy-blob.glb', // Unique model
    meshScale: [2, 2, 2],
    color: null,
    shockwaveInterval: 3.5, // Seconds between shockwaves (behavior-specific data)
    shockwaveRadius: 15, // Shockwave damage radius (behavior-specific)
    shockwaveDamage: 8, // Shockwave damage amount
  },

  // Type 6: Sniper Mobile
  SNIPER_MOBILE: {
    id: 'SNIPER_MOBILE',
    name: 'Mobile Sniper',
    type: 6,
    hp: 25,
    speed: 20, // Moderate speed for kiting
    damage: 0, // No contact damage, fires projectiles
    radius: 1.5,
    xpReward: 25, // High reward for ranged threat
    behavior: 'sniper_mobile', // Maintains distance, fires red lasers
    spawnWeight: 25, // Rare
    modelPath: '/models/enemies/robot-enemy-flying-gun.glb', // Gun variant model
    meshScale: [3, 3, 3],
    color: null,
    attackRange: 40, // Max attack distance (behavior-specific)
    attackCooldown: 2, // Seconds between shots
    projectileSpeed: 80, // Slower than player projectiles
    projectileDamage: 10, // Projectile damage
    projectileColor: '#ff3333', // Red laser
  },

  // Type 7: Sniper Fixed
  SNIPER_FIXED: {
    id: 'SNIPER_FIXED',
    name: 'Fixed Turret',
    type: 7,
    hp: 10, // Low HP, stationary
    speed: 0, // Does not move
    damage: 0, // No contact damage
    radius: 1.5,
    xpReward: 30, // High reward for priority target
    behavior: 'sniper_fixed', // Spawns far, fires telegraphed beams
    spawnWeight: 10, // Very rare
    modelPath: '/models/enemies/robot-enemy-flying-gun.glb',
    meshScale: [3, 3, 3],
    color: '#ff3333', // Red tint for visual distinction
    attackRange: 60, // Long range
    attackCooldown: 4, // Slow fire rate
    telegraphDuration: 1.0, // Charge-up time before firing (1 second)
    projectileSpeed: 150, // Very fast beam
    projectileDamage: 20, // High damage, avoidable
    projectileColor: '#ff0000', // Bright red beam
  },

  // Type 8: Teleporter
  TELEPORTER: {
    id: 'TELEPORTER',
    name: 'Phase Shifter',
    type: 8,
    hp: 18,
    speed: 15, // Moderate speed
    damage: 5, // Contact damage
    radius: 1.25,
    xpReward: 25, // High reward for unpredictable enemy
    behavior: 'teleport', // Chases normally, teleports periodically
    spawnWeight: 20, // Moderate spawn rate
    modelPath: '/models/enemies/robot-enemy-flying.glb',
    meshScale: [2.5, 2.5, 2.5],
    color: '#cc66ff', // Purple tint for visual distinction
    teleportCooldown: 5, // Seconds between teleports (behavior-specific)
    teleportRange: 30, // Max teleport distance
    burstProjectileCount: 3, // Fires 3 projectiles after teleporting
    burstProjectileSpeed: 100,
    burstProjectileDamage: 5,
  },
}

// Helper function to get enemy by ID (optional, for convenience)
export function getEnemy(id) {
  return ENEMIES[id]
}

// Helper function to get all enemies as array (optional, for spawning)
export function getAllEnemies() {
  return Object.values(ENEMIES)
}

// Helper function to get enemies by behavior type (optional, for filtering)
export function getEnemiesByBehavior(behavior) {
  return Object.values(ENEMIES).filter(enemy => enemy.behavior === behavior)
}
```

**Key Design Decisions in enemyDefs.js:**

1. **Behavior-Specific Data in Definitions:** Properties like `shockwaveInterval`, `attackRange`, `teleportCooldown` are stored directly in enemy defs, not in separate config. This keeps all enemy data centralized.

2. **Collision Radii Proportional to meshScale:** Radii scale with visual size for intuitive collision feedback. SHOCKWAVE_BLOB has disproportionately large radius (2.5 vs meshScale 2) to emphasize "sac à PV" tanky nature.

3. **Color Overrides:** SNIPER_FIXED uses red tint (#ff3333) for instant visual threat recognition. TELEPORTER uses purple tint (#cc66ff) for "phase shifter" thematic consistency. Others use null (no override).

4. **Model Reuse with Scale Variation:** robot-enemy-flying.glb is reused for 4 types (Types 1, 2, 3, 8) with different meshScale values. This reduces asset loading and memory footprint while providing visual variety.

5. **XP Rewards Scale with Threat:** Harder/rarer enemies give more XP (SNIPER_FIXED: 30, TELEPORTER: 25, SNIPER_MOBILE: 25). Basic enemies give less (FODDER_BASIC: 10, FODDER_SWARM: 5).

6. **Spawn Weights for Variety:** FODDER_BASIC (100) is most common baseline. Rare/dangerous enemies have lower weights (SNIPER_FIXED: 10, TELEPORTER: 20). Story 16.3 will use these weights for time-gated spawning.

### Collision Radius Calculation Strategy

**Rationale for Each Radius:**

- **FODDER_BASIC (radius 1.5):** meshScale [3,3,3] → radius ~0.5 * scale = 1.5. Moderate collision for basic chase enemy.
- **FODDER_TANK (radius 2.0):** meshScale [4,4,4] → radius ~0.5 * scale = 2.0. Larger collision emphasizes tank nature.
- **FODDER_SWARM (radius 0.75):** meshScale [1.5,1.5,1.5] → radius ~0.5 * scale = 0.75. Small collision for fast swarm enemy.
- **SHOCKWAVE_BLOB (radius 2.5):** meshScale [2,2,2] → radius would be ~1.0, but increased to 2.5 for "sac à PV" design intent. Large collision makes blob a tanky threat.
- **SNIPER_MOBILE (radius 1.5):** meshScale [3,3,3] → radius ~0.5 * scale = 1.5. Same as FODDER_BASIC.
- **SNIPER_FIXED (radius 1.5):** meshScale [3,3,3] → radius ~0.5 * scale = 1.5. Stationary, same baseline collision.
- **TELEPORTER (radius 1.25):** meshScale [2.5,2.5,2.5] → radius ~0.5 * scale = 1.25. Moderate collision for unpredictable enemy.

**Formula:** `radius ≈ 0.5 * max(meshScale)` as baseline, adjusted for gameplay feel.

### gameConfig.js Additions (Optional)

If needed for future extensibility, add these constants to gameConfig.js:

```javascript
// Enemy System (Epic 16)
ENEMY_SYSTEM: {
  MAX_ENEMY_TYPES: 8, // Total enemy types defined in enemyDefs.js
  ENEMY_COLOR_OVERRIDE_ENABLED: true, // Enable material color overrides (Type 7, Type 8)
  ENEMY_BEHAVIOR_TYPES: ['chase', 'sweep', 'shockwave', 'sniper_mobile', 'sniper_fixed', 'teleport'], // Valid behavior keys
},
```

**Note:** This is optional for Story 16.1. Can be added in Story 16.2 when behavior logic is implemented if validation is needed.

### Integration Notes for Future Stories

**Story 16.2 (Behavior Implementation):**
- useEnemies.tick() will read `enemy.behavior` from enemyDefs to determine tick logic
- Behavior-specific data (shockwaveInterval, attackRange, etc.) will be read from enemy def object
- Example: `if (enemy.behavior === 'shockwave') { /* read enemy.shockwaveInterval */ }`

**Story 16.3 (Time-Based Spawning):**
- spawnSystem.js will import ENEMIES from enemyDefs.js
- Time-gated spawn logic: `if (gameTime >= 120) { availableTypes.push(ENEMIES.SHOCKWAVE_BLOB) }`
- Spawn weight selection: `selectEnemyByWeight(availableTypes)`

**Story 16.4 (Difficulty Scaling):**
- When spawning in System 2/3, multiply enemy.hp, enemy.damage, enemy.speed by system multiplier
- Example: `spawnEnemy(ENEMIES.FODDER_BASIC, systemMultiplier = 1.5)`
- enemyDefs.js stores base stats, systems apply scaling dynamically

**EnemyRenderer.jsx (Future Update):**
- Read `enemy.modelPath` to load correct GLB model per instance
- Read `enemy.meshScale` to scale InstancedMesh per enemy type
- Read `enemy.color` to apply material color override (if not null)
- Likely requires switching from single InstancedMesh to per-type InstancedMesh or dynamic model loading

### Testing Checklist

**File Creation & Structure:**
- [ ] enemyDefs.js created in src/config/
- [ ] ENEMIES object exported with all 8 types defined
- [ ] Each enemy has all required properties: id, name, type, hp, speed, damage, radius, xpReward, behavior, spawnWeight, modelPath, meshScale, color
- [ ] Behavior-specific properties included where needed (shockwaveInterval, attackRange, teleportCooldown, etc.)
- [ ] Helper functions (getEnemy, getAllEnemies, getEnemiesByBehavior) exported

**Data Validation:**
- [ ] All enemy IDs are SCREAMING_CAPS (FODDER_BASIC, SHOCKWAVE_BLOB, etc.)
- [ ] All property names are camelCase (hp, xpReward, modelPath, meshScale, etc.)
- [ ] All model paths match existing files in public/models/enemies/
- [ ] Collision radii are proportional to meshScale (except SHOCKWAVE_BLOB intentionally larger)
- [ ] XP rewards scale with enemy difficulty/rarity
- [ ] Spawn weights total to reasonable distribution (FODDER_BASIC high, SNIPER_FIXED low)

**Model Path Verification:**
- [ ] robot-enemy-flying.glb used for Types 1, 2, 3, 8 (verified exists)
- [ ] enemy-blob.glb used for Type 4 (verified exists)
- [ ] robot-enemy-flying-gun.glb used for Types 6, 7 (verified exists)
- [ ] All model paths use forward slashes: '/models/enemies/...'

**Color Overrides:**
- [ ] SNIPER_FIXED has color '#ff3333' (red tint)
- [ ] TELEPORTER has color '#cc66ff' (purple tint)
- [ ] All other enemies have color: null (no override)

**Architectural Compliance:**
- [ ] enemyDefs.js contains only plain objects (no classes, no functions inside ENEMIES object)
- [ ] No game logic in definitions (behavior logic handled by useEnemies.tick() in Story 16.2)
- [ ] File follows architecture.md entity definition pattern (lines 349-481)
- [ ] File placement in src/config/ aligns with architecture.md structure (lines 620-673)

**Import Testing (Manual):**
- [ ] Import ENEMIES from enemyDefs.js in a test component or console
- [ ] Verify ENEMIES.FODDER_BASIC returns expected object
- [ ] Verify getEnemy('SHOCKWAVE_BLOB') returns expected object
- [ ] Verify getAllEnemies() returns array of 8 enemies

### References

- [Source: _bmad-output/planning-artifacts/epic-16-enemy-system-expansion.md#Story 16.1 — Complete AC, enemy stats, model paths]
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity Management — Entity definition pattern (lines 349-481)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure — Config layer, file placement (lines 569-673)]
- [Source: src/config/gameConfig.js — Existing enemy constants (lines 16-18)]
- [Source: public/models/enemies/ — GLB model files verified via Glob]
- [Source: Epic 16 brainstorming session (referenced in epic-16 planning doc) — Original 8 enemy type designs]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no debug issues encountered.

### Completion Notes List

- Updated existing `src/entities/enemyDefs.js` with 7 new enemy types (FODDER_TANK, FODDER_SWARM, SHOCKWAVE_BLOB, SNIPER_MOBILE, SNIPER_FIXED, TELEPORTER) + kept BOSS_SENTINEL
- Removed FODDER_FAST (replaced by new enemy types in the 8-type roster)
- Each enemy has complete stats, collision radius, model path, meshScale, behavior key, and behavior-specific data
- SNIPER_FIXED has red color override (#ff3333), TELEPORTER has purple (#cc66ff)
- All 3 GLB model files verified to exist in public/models/enemies/
- Updated all tests referencing FODDER_FAST to use FODDER_TANK (natural replacement as another chase-type)
- Rewrote enemyDefs.test.js with comprehensive tests for all 8 types covering AC#1, AC#2, AC#3
- Updated enemyDefs.xpReward.test.js with new enemy type assertions
- Updated spawnSystem.test.js to dynamically validate against all types with spawnWeight > 0
- Updated commandSystem.test.js to reference FODDER_TANK instead of FODDER_FAST
- Full regression suite: 73 files, 1125 tests — all passing

### File List

- src/entities/enemyDefs.js (modified — expanded from 3 to 8 enemy types, BOSS_SENTINEL schema completed)
- src/entities/__tests__/enemyDefs.test.js (modified — comprehensive Story 16.1 tests, strengthened required props)
- src/entities/__tests__/enemyDefs.xpReward.test.js (modified — updated for new types, filter by spawnWeight)
- src/stores/__tests__/useEnemies.test.js (modified — FODDER_FAST → FODDER_TANK)
- src/stores/__tests__/resetFlow.test.js (modified — FODDER_FAST → FODDER_TANK)
- src/systems/__tests__/spawnSystem.test.js (modified — dynamic enemy type validation, require→import fix)
- src/systems/__tests__/commandSystem.test.js (modified — FODDER_FAST → FODDER_TANK)

### Change Log

- 2026-02-13: Story 16.1 — Expanded enemy definitions from 3 to 8 types with full stats, behaviors, models, and collision radii. Removed FODDER_FAST, added FODDER_TANK, FODDER_SWARM, SHOCKWAVE_BLOB, SNIPER_MOBILE, SNIPER_FIXED, TELEPORTER.
- 2026-02-14: Code review fixes — Added missing fields to BOSS_SENTINEL (type, xpReward, spawnWeight, modelPath) for schema consistency. Strengthened required-props test to include xpReward/spawnWeight/modelPath. Fixed require() → import in spawnSystem.test.js. Updated xpReward test to filter by spawnWeight > 0.
