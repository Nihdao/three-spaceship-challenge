# Story 2.1: Spatial Hashing & Collision System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a performant spatial hashing and collision detection system in place,
So that all combat interactions (projectile hits, enemy contact damage) can be resolved efficiently even with 100+ entities.

## Acceptance Criteria

1. **Given** the systems/ directory **When** spatialHash.js is implemented **Then** it provides a grid-based spatial partitioning system with configurable cell size (SPATIAL_HASH_CELL_SIZE from gameConfig) **And** it supports insert, update, clear, and query-nearby operations **And** it works with any entity that has a position (x, z) and radius

2. **Given** spatialHash.js is in place **When** collisionSystem.js is implemented **Then** it provides circle-vs-circle collision queries using the spatial hash **And** it returns collision pairs (entity A, entity B) for the GameLoop to process **And** it supports different collision categories (player-enemy, projectile-enemy, enemy-player)

3. **Given** 100+ entities are registered in the spatial hash **When** collision queries run each frame **Then** performance remains within frame budget (< 2ms for collision phase)

## Tasks / Subtasks

- [x] Task 1: Implement spatialHash.js (AC: #1)
  - [x] 1.1: Create `src/systems/spatialHash.js` — pure logic module (Layer 2: Systems), no React, no stores, no imports beyond gameConfig
  - [x] 1.2: Implement `SpatialHash` class (or factory function) with constructor taking `cellSize` parameter (default: `GAME_CONFIG.SPATIAL_HASH_CELL_SIZE` = 2 world units). NOTE: SPATIAL_HASH_CELL_SIZE is currently 2 but play area is 4000×4000 (±2000). Cell size should be tuned relative to entity sizes: typical enemy radius ~0.5-5 units, so cell size 2-5 is appropriate for grouping nearby entities. Consider bumping to 4 or 5 if performance testing shows too many cells.
  - [x] 1.3: Implement `clear()` — resets the grid each frame (called at start of collision phase). Use a Map or plain object keyed by cell key string `"x,z"` where x,z are integer cell coordinates
  - [x] 1.4: Implement `insert(entity)` — takes any object with `{ x, z, radius, id }` (or index). Computes cell key(s) the entity overlaps (entities larger than cell size may span multiple cells). Adds entity reference to each overlapping cell bucket
  - [x] 1.5: Implement `queryNearby(x, z, radius)` — returns all entities in cells overlapping the query circle. Check the cell the point is in plus surrounding cells (3×3 minimum, or more for larger query radii). Return unique set of entity references (avoid duplicates from multi-cell entities)
  - [x] 1.6: Expose as module export: `createSpatialHash(cellSize)` returning an object with `{ clear, insert, queryNearby }` methods — functional style preferred over class for consistency with systems/ pattern
  - [x] 1.7: All tunable values from gameConfig.js — no magic numbers in the module

- [x] Task 2: Implement collisionSystem.js (AC: #2)
  - [x] 2.1: Create `src/systems/collisionSystem.js` — pure logic module (Layer 2: Systems), imports spatialHash.js
  - [x] 2.2: Implement collision category constants: `CATEGORY_PLAYER`, `CATEGORY_ENEMY`, `CATEGORY_PROJECTILE`, `CATEGORY_XP_ORB`. These define which entity types can collide with which (collision matrix)
  - [x] 2.3: Implement `createCollisionSystem(cellSize)` factory that creates and owns a SpatialHash instance internally. Returns object with `{ clear, registerEntity, queryCollisions, checkPair }` methods
  - [x] 2.4: Implement `clear()` — delegates to spatialHash.clear(). Called once per frame at start of collision phase
  - [x] 2.5: Implement `registerEntity(entity)` — inserts entity into spatial hash. Entity must have `{ x, z, radius, id, category }`. This is called for ALL active entities each frame after movement: player, all enemies, all projectiles, XP orbs
  - [x] 2.6: Implement `queryCollisions(entity, targetCategory)` — queries spatial hash around entity position+radius, then performs circle-vs-circle distance check against all returned entities of `targetCategory`. Returns array of colliding entity references. Distance check: `sqrt((ax-bx)² + (az-bz)²) < (a.radius + b.radius)`. OPTIMIZATION: compare squared distances to avoid sqrt: `(ax-bx)² + (az-bz)² < (a.radius + b.radius)²`
  - [x] 2.7: Implement collision matrix — not all categories collide with each other. Define valid pairs: projectile↔enemy (damage), player↔enemy (contact damage), player↔xpOrb (pickup). Enemy↔enemy should NOT collide. Projectile↔player should NOT collide (friendly fire off)
  - [x] 2.8: Export the `createCollisionSystem` factory and category constants

- [x] Task 3: Integrate into GameLoop (AC: #2, #3)
  - [x] 3.1: In GameLoop.jsx, import createCollisionSystem and instantiate it once (useRef to persist across renders). Pass SPATIAL_HASH_CELL_SIZE from gameConfig
  - [x] 3.2: In the tick function, after enemy movement (step 5) and before damage resolution (step 7), add collision phase: `collisionSystem.clear()` → register all entities (player from usePlayer, enemies from useEnemies, projectiles from useWeapons) → query collision pairs. Store results for damage step to consume
  - [x] 3.3: For now (Story 2.1), the collision phase runs but no damage is applied — that's Story 2.4. Just log collision pairs in debug mode or leave the results available for the next step
  - [x] 3.4: Ensure collision phase respects the existing tick order: input → movement → weapons → projectiles → enemies → **collisions** → damage → XP → cleanup

- [x] Task 4: Performance validation (AC: #3)
  - [x] 4.1: Create a simple stress test approach — temporarily spawn 100+ "fake" entities in the spatial hash and time the collision queries using `performance.now()`. Can be done in a debug-only code block or temporary useEffect
  - [x] 4.2: Verify collision phase completes in < 2ms with 100+ entities registered
  - [x] 4.3: Verify no memory leaks — clear() properly resets all buckets each frame, no growing arrays
  - [x] 4.4: Remove any temporary stress test code after validation. Consider adding a Leva debug panel showing collision phase timing for ongoing monitoring

- [x] Task 5: Add collision config constants (AC: #1)
  - [x] 5.1: Verify SPATIAL_HASH_CELL_SIZE already in gameConfig.js (currently 2). Consider if tuning is needed based on play area scale (4000×4000) and expected entity sizes
  - [x] 5.2: Add to gameConfig.js: `PLAYER_COLLISION_RADIUS: 1.5` — the player ship's collision radius (approximate half-width of ship model)
  - [x] 5.3: Verify enemyDefs.js already has `radius: 0.5` for FODDER_BASIC — this is the collision radius for enemy entities. Future enemy types will define their own radius

## Dev Notes

### Critical Architecture Context

**6-Layer Architecture (MUST follow):**
1. Config/Data → 2. Systems → 3. Stores → 4. GameLoop → 5. Rendering → 6. UI

This story touches layers 1 (config constants), 2 (new systems: spatialHash.js, collisionSystem.js), and 4 (GameLoop integration). No renderers, no UI, no new stores. This is a **pure logic foundation** for all combat in Epic 2.

**Layer Boundaries — CRITICAL for this story:**
- `systems/` = pure game logic functions. NO React, NO stores, NO rendering. Testable in isolation
- spatialHash.js and collisionSystem.js must be pure JavaScript modules — no `import { create } from 'zustand'`, no `useFrame`, no JSX
- GameLoop.jsx (Layer 4) is the only place where systems connect to stores — it reads entity data from stores and passes to collision system
- Stores NEVER import systems directly at module level — GameLoop bridges them

**Inter-Store Communication Pattern:**
The GameLoop reads from all stores and orchestrates the collision check:
```
GameLoop reads usePlayer.getState() → extracts {x, z, radius} → registers in collision system
GameLoop reads useEnemies.getState() → extracts all enemy {x, z, radius} → registers each in collision system
GameLoop reads useWeapons.getState() → extracts all projectile {x, z, radius} → registers each in collision system
GameLoop calls collisionSystem.queryCollisions() → gets collision pairs
GameLoop dispatches damage actions to appropriate stores (Story 2.4)
```

### What Already Exists (Do NOT Recreate)

**GameLoop.jsx — tick order skeleton:**
Steps 1-2 are implemented (input + player movement). Steps 3-9 are commented placeholders. This story activates step 6 (collision detection) and prepares the registration pipeline. The collision system runs after all entity movement is complete.

**gameConfig.js — SPATIAL_HASH_CELL_SIZE: 2**
Already defined. Value may need tuning during implementation.

**Entity definitions — radius field:**
- `enemyDefs.js`: FODDER_BASIC has `radius: 0.5`
- Player ship: no collision radius defined yet → add PLAYER_COLLISION_RADIUS to gameConfig

**Stores — skeleton tick() methods:**
- `useEnemies.jsx`: empty tick(), enemies: [] — Story 2.2 will populate this
- `useWeapons.jsx`: empty tick(), projectiles: [] — Story 2.3 will populate this
- `usePlayer.jsx`: full tick() with position, but no collision radius exposed

**src/systems/ directory — EMPTY:**
This story creates the first files in this directory.

### Implementation Approach

**Spatial Hash Design:**
A spatial hash divides 2D space into a uniform grid. Each cell stores references to entities that overlap it. To find potential collisions, query the cell an entity is in plus neighbors — this reduces O(n²) all-pairs checks to O(n × k) where k is average entities per cell neighborhood.

```javascript
// Key computation: world position → cell coordinate
const cellX = Math.floor(x / cellSize)
const cellZ = Math.floor(z / cellSize)
const key = `${cellX},${cellZ}`
```

**Entity Interface Convention:**
All entities registered in the collision system must provide:
```javascript
{
  id: string | number,   // unique identifier
  x: number,             // world position X
  z: number,             // world position Z  (Y is always 0 in top-down)
  radius: number,        // collision circle radius
  category: string,      // CATEGORY_PLAYER | CATEGORY_ENEMY | CATEGORY_PROJECTILE | CATEGORY_XP_ORB
}
```
This is a lightweight interface — stores transform their internal data to this format when registering entities. The collision system does not reference store-specific fields.

**Circle-vs-Circle Distance Check (optimized):**
```javascript
const dx = a.x - b.x
const dz = a.z - b.z
const distSq = dx * dx + dz * dz
const radiusSum = a.radius + b.radius
return distSq < radiusSum * radiusSum  // avoid sqrt
```

**Performance Budget:**
- 100 enemies + 50 projectiles + 1 player = ~151 entities
- Cell size 2-5 means most cells have 0-5 entities
- Each query checks ~9-25 cells depending on radius
- Estimated < 0.5ms for full collision pass — well within 2ms budget

### Previous Story Intelligence (Story 1.3 + Epic 1 Retro)

**Key learnings from Epic 1 that directly apply to this story:**

1. **All tunable values in gameConfig.js from the start** — Action Item #2 from Epic 1 retro. DO NOT hardcode cell sizes, collision radii, or any constants. Everything in gameConfig.js
2. **Memory management checklist** — Action Item #3. spatialHash.clear() must properly reset all data each frame. No growing arrays, no leaked references
3. **Store-based tick pattern validated** — GameLoop calls tick() on stores in order. Collision system is called between enemy movement and damage resolution
4. **R3F v9 imperative approach preferred** — For this story, not directly relevant (pure JS modules), but good to know for future InstancedMesh work in Story 2.2
5. **No store code needs modification in this story** — useEnemies and useWeapons have empty arrays right now. The collision system will be ready to receive data when those stores are populated in Stories 2.2/2.3. The GameLoop integration should gracefully handle empty entity arrays (0 entities = 0 collisions, no errors)

**Files from previous stories that MUST NOT be modified:**
- `src/stores/usePlayer.jsx` — Movement tick is complete, do not change
- `src/renderers/EnvironmentRenderer.jsx` — Visual only, unrelated
- `src/renderers/PlayerShip.jsx` — Visual only, unrelated
- `src/scenes/GameplayScene.jsx` — Scene composition, unrelated to this story

### Git Intelligence

Recent commits (all follow conventional commit format):
- `4d9556e` feat: implement space environment & boundaries (Story 1.3)
- `02c8ab6` fix: apply Story 1.2 code review fixes
- `ddd4dee` feat: implement ship movement, rotation & banking (Story 1.2)
- `765ed38` bmad and US1 OK
- `676d322` bmad-part1
- `7dda110` Initial commit

Convention: `feat:` for new features, `fix:` for bug fixes. Story 2.1 should use `feat: implement spatial hashing & collision system (Story 2.1)`.

### Technical Stack Reference

- **Pure JavaScript** — spatialHash.js and collisionSystem.js are vanilla JS modules. No React, no Three.js, no R3F
- **ES Modules** — `export function` / `export const` pattern
- **Zustand v5** — GameLoop reads stores via `useStore.getState()` (synchronous, outside React render cycle)
- **Performance API** — `performance.now()` for timing collision phase in debug mode

### Library/Framework Requirements

No new libraries needed for this story. This is pure JavaScript game logic.

### File Structure Requirements

**New files (Layer 2: Systems):**
- `src/systems/spatialHash.js` — Spatial hash grid implementation
- `src/systems/collisionSystem.js` — Collision detection using spatial hash

**Modified files:**
- `src/GameLoop.jsx` — Add collision phase (step 6) to tick order
- `src/config/gameConfig.js` — Add PLAYER_COLLISION_RADIUS constant

**Entity defs (verify only, no changes needed):**
- `src/entities/enemyDefs.js` — FODDER_BASIC already has `radius: 0.5`

### Testing Requirements

**Functional testing:**
- spatialHash: insert entities, query nearby, verify correct results (entities in range returned, entities out of range excluded)
- collisionSystem: register entities of different categories, query collisions, verify circle-vs-circle works correctly
- Collision matrix: verify player↔enemy works, projectile↔enemy works, enemy↔enemy does NOT trigger

**Performance testing:**
- Register 150+ entities, time collision phase, verify < 2ms
- Run several frames, verify no memory growth (clear resets properly)

**Integration testing:**
- GameLoop calls collision phase after movement, before damage
- Empty entity arrays (current state) don't cause errors
- Player position is correctly extracted and registered

### Project Structure Notes

- `src/systems/` directory exists but is empty — this story creates the first files there
- Follows the architectural boundary: systems/ contains pure logic, no React/R3F dependencies
- Naming convention: camelCase.js for utility modules (`spatialHash.js`, `collisionSystem.js`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Collision Detection] — Custom spatial hashing decision, circle-vs-circle rationale
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity Management] — Hybrid InstancedMesh + Zustand stores
- [Source: _bmad-output/planning-artifacts/architecture.md#State Architecture] — GameLoop as sole orchestrator
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — Layer 2 (Systems) rules
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop has game logic useFrame
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — spatialHash.update() → collisionSystem.resolve() position in data flow
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] — NFR2: 30+ FPS with 100+ enemies
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-02-07.md#Action Items] — Constants in gameConfig, memory management checklist
- [Source: _bmad-output/implementation-artifacts/1-3-space-environment-boundaries.md#Completion Notes] — PLAY_AREA_SIZE: 2000
- [Source: src/GameLoop.jsx] — Tick order skeleton with steps 3-9 commented
- [Source: src/config/gameConfig.js] — SPATIAL_HASH_CELL_SIZE: 2, PLAY_AREA_SIZE: 2000
- [Source: src/entities/enemyDefs.js] — FODDER_BASIC radius: 0.5
- [Source: src/stores/usePlayer.jsx] — position: [x, 0, z] format, tick() method
- [Source: src/stores/useEnemies.jsx] — Skeleton with empty tick()
- [Source: src/stores/useWeapons.jsx] — Skeleton with empty tick()

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1 (spatialHash.js):** Implemented `createSpatialHash(cellSize)` factory function using Map-based grid. Supports `clear()`, `insert(entity)`, and `queryNearby(x, z, radius)`. Entities spanning multiple cells are inserted into all overlapping buckets. Query deduplication uses Set on entity.id. 11 unit tests pass.
- **Task 2 (collisionSystem.js):** Implemented `createCollisionSystem(cellSize)` factory wrapping a spatial hash. Collision categories (PLAYER, ENEMY, PROJECTILE, XP_ORB) with collision matrix using Set of sorted pair keys. `queryCollisions()` uses optimized squared-distance check (no sqrt). 17 unit tests pass.
- **Task 3 (GameLoop integration):** Added collision phase (step 6) to GameLoop tick order. Uses `useRef` to persist collision system across renders. Registers player (from usePlayer), enemies (from useEnemies), and projectiles (from useWeapons) each frame. Collision results available for damage resolution in Story 2.4. Gracefully handles empty entity arrays.
- **Task 4 (Performance validation):** Vitest performance test with 151 entities (1 player + 100 enemies + 50 projectiles) confirms collision phase averages well under 2ms. Memory leak test confirms clear() properly resets across 100 simulated frames. Performance tests kept as permanent regression tests (not temporary).
- **Task 5 (Config constants):** Added `PLAYER_COLLISION_RADIUS: 1.5` to gameConfig.js. Verified `SPATIAL_HASH_CELL_SIZE: 2` already present. Verified `enemyDefs.js` FODDER_BASIC has `radius: 0.5`.
- **Test infrastructure:** Installed Vitest v4 as dev dependency. Added `test` and `test:watch` npm scripts. Added `test.root` to vite.config.js. Wrapped config in `defineConfig()`.

### Change Log

- 2026-02-07: Implemented spatial hashing & collision system (Story 2.1) — all 5 tasks complete, 30 tests passing, build verified
- 2026-02-07: Code review (AI) — 4 MEDIUM issues fixed: removed unused CATEGORY_XP_ORB import, added entity object pool to avoid per-frame GC pressure in GameLoop, added package-lock.json to File List, renamed misleading memory leak test

### File List

New files:
- src/systems/spatialHash.js
- src/systems/collisionSystem.js
- src/systems/__tests__/spatialHash.test.js
- src/systems/__tests__/collisionSystem.test.js
- src/systems/__tests__/performance.test.js

Modified files:
- src/GameLoop.jsx (added collision phase integration)
- src/config/gameConfig.js (added PLAYER_COLLISION_RADIUS)
- vite.config.js (added test config, wrapped in defineConfig)
- package.json (added vitest, test scripts)
- package-lock.json (updated from vitest installation)
