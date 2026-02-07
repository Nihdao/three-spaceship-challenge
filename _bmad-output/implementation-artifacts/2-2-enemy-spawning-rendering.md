# Story 2.2: Enemy Spawning & Rendering

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see waves of enemies spawning progressively with increasing difficulty, each type visually distinct,
So that the game feels dynamic, challenging, and visually readable.

## Acceptance Criteria

1. **Given** the player is in the gameplay scene **When** gameplay begins **Then** enemies start spawning outside the visible area and move toward the player **And** spawn rate increases over time following a difficulty curve defined in spawnSystem.js

2. **Given** enemy definitions exist in enemyDefs.js **When** enemies spawn **Then** at least 2 enemy types are available (FODDER_BASIC chase, FODDER_FAST chase) with distinct stats (hp, speed, damage, xpReward) **And** each enemy type is visually distinct (different color)

3. **Given** enemies are rendering **When** up to MAX_ENEMIES_ON_SCREEN enemies exist **Then** enemies render via InstancedMesh (EnemyRenderer.jsx) with one draw call per type **And** enemy state (positions, HP) is stored in Float32Array pools in useEnemies store **And** the EnemyRenderer syncs instance matrices from store data each frame via useFrame

4. **Given** the useEnemies store **When** tick(delta) is called by GameLoop **Then** enemies move according to their behavior (chase = move toward player position) **And** the spatial hash is updated with current enemy positions

## Tasks / Subtasks

- [x] Task 1: Expand enemyDefs.js with FODDER_FAST (AC: #2)
  - [x] 1.1: Add FODDER_FAST enemy definition to `src/entities/enemyDefs.js` with: id: 'FODDER_FAST', name: 'Scout', hp: 12, speed: 90, damage: 3, radius: 0.4, xpReward: 8, behavior: 'chase', spawnWeight: 60, color: '#ff3366' (distinct from FODDER_BASIC)
  - [x] 1.2: Add `color` field to FODDER_BASIC definition: '#ff5555' (enemy red). This is used by EnemyRenderer for visual distinction since we don't have GLB models yet
  - [x] 1.3: Add `meshScale` field to both definitions: FODDER_BASIC: [1, 1, 1], FODDER_FAST: [0.7, 0.7, 1.2] — visual size/shape difference

- [x] Task 2: Add spawn-related constants to gameConfig.js (AC: #1)
  - [x] 2.1: Add spawn constants: `SPAWN_INTERVAL_BASE: 2.0` (seconds between spawns at start), `SPAWN_INTERVAL_MIN: 0.3` (fastest spawn rate), `SPAWN_RAMP_RATE: 0.02` (interval decrease per second of game time), `SPAWN_DISTANCE_MIN: 80` (minimum spawn distance from player), `SPAWN_DISTANCE_MAX: 120` (maximum spawn distance from player), `SPAWN_BATCH_SIZE_BASE: 1` (enemies per spawn at start), `SPAWN_BATCH_RAMP_INTERVAL: 30` (seconds between batch size increases)
  - [x] 2.2: Verify MAX_ENEMIES_ON_SCREEN: 100 already in gameConfig.js — no change needed

- [x] Task 3: Implement spawnSystem.js (AC: #1)
  - [x] 3.1: Create `src/systems/spawnSystem.js` — pure logic module (Layer 2: Systems), no React, no stores. Imports GAME_CONFIG and ENEMIES from enemyDefs
  - [x] 3.2: Implement `createSpawnSystem()` factory returning object with `{ tick, reset }` methods. Internal state tracks: spawnTimer (accumulator), elapsedTime (total game time for difficulty ramp)
  - [x] 3.3: Implement `tick(delta)` — decrements spawnTimer, when <= 0: calculates current spawn interval based on elapsedTime (interval = max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - elapsedTime * SPAWN_RAMP_RATE)), picks enemy type by weighted random using spawnWeight, computes spawn position (random angle at SPAWN_DISTANCE_MIN..MAX from player), returns spawn instructions array: `[{ typeId, x, z }]` or empty array if no spawn needed. Calculates batch size: `SPAWN_BATCH_SIZE_BASE + Math.floor(elapsedTime / SPAWN_BATCH_RAMP_INTERVAL)`
  - [x] 3.4: Implement `reset()` — resets spawnTimer and elapsedTime to 0
  - [x] 3.5: Implement weighted random selection: sum all spawnWeights, pick random value in range, iterate enemy types to find which one it falls into
  - [x] 3.6: Spawn position calculation: random angle (0-2π), random distance between SPAWN_DISTANCE_MIN and SPAWN_DISTANCE_MAX, compute x = playerX + cos(angle) * distance, z = playerZ + sin(angle) * distance. Clamp to play area bounds (±PLAY_AREA_SIZE)
  - [x] 3.7: The function returns spawn instructions only — it does NOT create enemies. The GameLoop passes these to useEnemies.spawnEnemy()

- [x] Task 4: Implement useEnemies store with Float32Array pools (AC: #3, #4)
  - [x] 4.1: Redesign `src/stores/useEnemies.jsx` with pooled enemy data. State: `enemies` (array of active enemy objects), `count` (active enemy count), `nextId` (incrementing integer for unique IDs). Each enemy object: `{ id, typeId, x, z, hp, maxHp, speed, damage, radius, behavior, color, meshScale, active }`
  - [x] 4.2: Implement `spawnEnemy(typeId, x, z)` action — looks up ENEMIES[typeId] for stats, creates enemy object with unique id (`enemy_${nextId++}`), adds to enemies array. Respects MAX_ENEMIES_ON_SCREEN cap (if at cap, silently skip spawn)
  - [x] 4.3: Implement `tick(delta, playerPosition)` — for each active enemy: apply behavior logic. For 'chase' behavior: compute direction vector from enemy to player, normalize, move enemy by speed * delta in that direction. Update x, z. Clamp to play area bounds
  - [x] 4.4: Implement `killEnemy(id)` action — marks enemy for removal, to be used by Story 2.4. For now, only implement the removal logic so enemies can be cleaned up
  - [x] 4.5: Implement `reset()` — clears all enemies, resets count and nextId
  - [x] 4.6: Note on Float32Array pools: For MVP with <=100 enemies, plain object arrays are acceptable. The InstancedMesh matrix updates in EnemyRenderer already batch-write to GPU. Optimization to true Float32Array pools can be done in a performance pass if profiling shows GC pressure. This aligns with "avoid over-engineering" — the architecture doc describes the pattern but 100 plain objects at 60fps is well within budget

- [x] Task 5: Implement EnemyRenderer.jsx (AC: #3)
  - [x] 5.1: Create `src/renderers/EnemyRenderer.jsx` — Layer 5 rendering component. Reads enemy data from useEnemies store, renders via InstancedMesh
  - [x] 5.2: Strategy: One InstancedMesh per enemy type (FODDER_BASIC, FODDER_FAST). Each has its own geometry, material (with type-specific color), and instance count. Use refs to InstancedMesh objects
  - [x] 5.3: Use `useFrame` to sync instance matrices each frame: for each active enemy of a given type, compute a Matrix4 from position (x, 0, z), rotation (face toward player or movement direction), and scale (meshScale from def). Write to instanceMatrix via `instancedMesh.setMatrixAt(index, matrix)`
  - [x] 5.4: Use simple geometry for now: `BoxGeometry` or `OctahedronGeometry` as placeholder since no GLB models exist yet. FODDER_BASIC = OctahedronGeometry (chunky), FODDER_FAST = ConeGeometry or elongated shape (sleek). Materials: `MeshStandardMaterial` with emissive matching type color for glow effect
  - [x] 5.5: Set `instancedMesh.count` to the actual number of active enemies of that type each frame (not MAX_ENEMIES_ON_SCREEN) — Three.js will only render count instances
  - [x] 5.6: Set `instancedMesh.instanceMatrix.needsUpdate = true` after writing matrices
  - [x] 5.7: Use `instancedMesh.frustumCulled = false` for InstancedMesh (default is per-object but InstancedMesh bounding sphere may not cover all instances correctly — disable and let individual distance handle it, or compute correct bounding sphere)
  - [x] 5.8: IMPERATIVE APPROACH preferred for geometry creation (lesson from Epic 1 retro: R3F v9 declarative API unreliable for custom geometries). Use useMemo for geometry/material creation, useRef for InstancedMesh reference
  - [x] 5.9: Memory management: dispose geometries and materials in useEffect cleanup (Epic 1 Action Item #3)

- [x] Task 6: Integrate into GameLoop (AC: #4)
  - [x] 6.1: Import createSpawnSystem from spawnSystem.js in GameLoop.jsx. Instantiate with useRef (like collisionSystem)
  - [x] 6.2: Activate step 5 in tick order: call `spawnSystem.tick(delta)` to get spawn instructions, then for each instruction call `useEnemies.getState().spawnEnemy(typeId, x, z)`. Pass player position to spawn system for spawn-around-player calculation
  - [x] 6.3: Call `useEnemies.getState().tick(clampedDelta, playerState.position)` for enemy movement. This must run BEFORE the collision phase (step 6) so enemy positions are current when registered in spatial hash
  - [x] 6.4: Update collision registration: the existing enemy registration loop in GameLoop already reads from `useEnemies.getState().enemies` — verify it correctly reads x, z, radius, id from the new enemy object format
  - [x] 6.5: Ensure tick order is: input → player movement → weapons → projectiles → **enemy spawning + movement** → collisions → damage → XP → cleanup
  - [x] 6.6: Add spawnSystem.reset() call when game resets (listen for phase changes or add to a reset method)

- [x] Task 7: Integrate EnemyRenderer into GameplayScene (AC: #3)
  - [x] 7.1: Import EnemyRenderer in `src/scenes/GameplayScene.jsx`
  - [x] 7.2: Add `<EnemyRenderer />` after `<PlayerShip />` and before `<EnvironmentRenderer />`
  - [x] 7.3: Verify render order doesn't affect anything (R3F renders by Three.js draw order, InstancedMesh will be in the scene graph)

- [x] Task 8: Testing (AC: #1, #2, #3, #4)
  - [x] 8.1: Unit test spawnSystem.js: verify spawn timing, difficulty ramp, weighted selection, position calculation, MAX cap respect
  - [x] 8.2: Unit test useEnemies store: verify spawnEnemy creates correct objects, tick moves enemies toward player, MAX_ENEMIES_ON_SCREEN cap enforced, killEnemy removes correctly, reset clears all
  - [x] 8.3: Integration test: verify enemies appear in game, move toward player, increase in frequency over time
  - [x] 8.4: Visual test: verify two enemy types are visually distinct (different shape, different color)
  - [x] 8.5: Performance test: verify 100 enemies render + tick within frame budget (check with r3f-perf in debug mode)

## Dev Notes

### Critical Architecture Context

**6-Layer Architecture (MUST follow):**
1. Config/Data → 2. Systems → 3. Stores → 4. GameLoop → 5. Rendering → 6. UI

This story touches ALL main layers except UI:
- **Layer 1** (Config/Data): gameConfig.js additions, enemyDefs.js expansion
- **Layer 2** (Systems): NEW spawnSystem.js
- **Layer 3** (Stores): useEnemies.jsx full implementation
- **Layer 4** (GameLoop): activate step 5 (enemy spawning + movement)
- **Layer 5** (Rendering): NEW EnemyRenderer.jsx

**Critical Boundary Rules:**
- `spawnSystem.js` is Layer 2 — pure logic, NO React, NO stores, NO rendering. It returns spawn instructions, it does NOT create enemies
- `useEnemies.jsx` is Layer 3 — state + actions. It does NOT call spawnSystem directly. GameLoop bridges them
- `EnemyRenderer.jsx` is Layer 5 — read-only from stores. It reads enemy data and writes to GPU. NO game logic, NO state mutations
- The GameLoop is the ONLY place where spawnSystem talks to useEnemies

**Inter-Store Communication Pattern (same as Story 2.1):**
```
GameLoop reads usePlayer.getState() → gets player position
GameLoop calls spawnSystem.tick(delta) → gets spawn instructions
GameLoop calls useEnemies.getState().spawnEnemy(typeId, x, z) for each instruction
GameLoop calls useEnemies.getState().tick(delta, playerPosition) → enemies move
GameLoop reads useEnemies.getState().enemies → registers in collision system (already done in Story 2.1)
```

### What Already Exists (Do NOT Recreate)

**GameLoop.jsx — collision phase (Story 2.1):**
Steps 1-2 are implemented (input + player movement). Step 6 (collision detection) is implemented with entity registration for player, enemies, and projectiles. Steps 3-5, 7-9 are commented placeholders. This story activates step 5 (enemy spawning + movement). The collision registration loop at step 6 already reads `useEnemies.getState().enemies` — just verify the enemy object shape matches `{ id, x, z, radius }`.

**collisionSystem.js + spatialHash.js (Story 2.1):**
Fully working. Supports CATEGORY_ENEMY. Enemy entities are already registered in the collision loop. No changes needed to these files.

**Entity descriptor pool in GameLoop (Story 2.1):**
The `assignEntity(pool[idx], id, x, z, radius, category)` pattern with pre-allocated pool avoids per-frame GC. Already loops over `enemies` array — no changes needed for collision registration, just verify field names match.

**useEnemies.jsx — skeleton:**
Currently has `enemies: [], count: 0, tick: () => {}, reset: ()`. This story replaces the skeleton with full implementation.

**enemyDefs.js — FODDER_BASIC:**
Has id, name, hp, speed, damage, radius, xpReward, behavior, spawnWeight, modelKey. This story adds `color` and `meshScale` fields, plus adds FODDER_FAST type.

**gameConfig.js — relevant existing constants:**
- `MAX_ENEMIES_ON_SCREEN: 100`
- `PLAY_AREA_SIZE: 2000`
- `SPATIAL_HASH_CELL_SIZE: 2`
- `PLAYER_COLLISION_RADIUS: 1.5`

**GameplayScene.jsx:**
Currently mounts Controls, CameraRig, PlayerShip, EnvironmentRenderer. This story adds EnemyRenderer.

**Experience.jsx:**
GameLoop mounts before GameplayScene — tick runs before rendering. Correct for this story.

**Vitest test infrastructure (Story 2.1):**
Vitest v4 installed, test scripts in package.json, vite.config.js has test config. Tests go in `src/systems/__tests__/` for systems or new `src/stores/__tests__/` for store tests.

### Implementation Approach

**Enemy Data Model:**
Each enemy in the `enemies` array is a plain object:
```javascript
{
  id: 'enemy_42',        // unique ID for collision system
  typeId: 'FODDER_BASIC', // key into ENEMIES lookup
  x: 150.5,              // world position X
  z: -80.2,              // world position Z
  hp: 20,                // current HP
  maxHp: 20,             // max HP (from def)
  speed: 50,             // movement speed (from def)
  damage: 5,             // contact damage (from def)
  radius: 0.5,           // collision radius (from def)
  behavior: 'chase',     // movement behavior
  color: '#ff5555',      // visual color (from def)
  meshScale: [1,1,1],    // visual scale (from def)
}
```

**Spawn System Design:**
The spawnSystem is a stateful factory (like collisionSystem). It tracks internal timers and returns spawn instructions — it never directly creates entities. This keeps it pure and testable.

```javascript
// spawnSystem returns instructions like:
[
  { typeId: 'FODDER_BASIC', x: 120.5, z: -45.2 },
  { typeId: 'FODDER_FAST', x: -80.1, z: 90.7 },
]
```

The difficulty curve is linear ramp: spawn interval decreases from 2.0s to 0.3s over time. Batch size increases by 1 every 30 seconds. This creates smooth difficulty scaling without sudden spikes.

**InstancedMesh Rendering Pattern:**
One InstancedMesh per enemy type. Each frame:
1. Count active enemies of each type
2. Set `instancedMesh.count = activeCount`
3. For each active enemy, compute transform matrix and write via `setMatrixAt(index, matrix)`
4. Set `instanceMatrix.needsUpdate = true`

Pre-allocate InstancedMesh with MAX_ENEMIES_ON_SCREEN capacity but only render `count` instances.

**Matrix computation (reuse a single Matrix4/Object3D):**
```javascript
const dummy = new THREE.Object3D()
// per enemy:
dummy.position.set(enemy.x, 0, enemy.z)
dummy.rotation.set(0, facingAngle, 0)
dummy.scale.set(...enemy.meshScale)
dummy.updateMatrix()
instancedMesh.setMatrixAt(index, dummy.matrix)
```
Create `dummy` once in useMemo, reuse every frame.

**Enemy facing direction:**
For 'chase' behavior, enemies face toward the player. Compute angle: `Math.atan2(playerX - enemyX, -(playerZ - enemyZ))` to get yaw rotation.

### Previous Story Intelligence (Story 2.1)

**Key learnings that directly apply:**
1. **Entity object pool pattern** — Story 2.1 established a pool of pre-allocated entity descriptors in GameLoop to avoid per-frame GC. The enemy registration loop already uses this pattern. Don't duplicate or conflict with it
2. **Collision system already reads enemies** — The loop `for (let i = 0; i < enemies.length; i++)` with `assignEntity(pool[idx], e.id, e.x, e.z, e.radius, CATEGORY_ENEMY)` already works. Just ensure the enemy objects from useEnemies have the right field names: `id`, `x`, `z`, `radius`
3. **useRef for persistent instances** — collisionSystem uses `useRef` in GameLoop. spawnSystem should follow the same pattern
4. **Test infrastructure ready** — Vitest installed, `__tests__/` directory exists in `src/systems/`. Create `src/stores/__tests__/` for store tests if needed
5. **Code review findings from Story 2.1** — Removed unused imports, added entity object pool, renamed misleading test. Be careful about unused imports and naming clarity

**From Epic 1 Retro — Action Items to follow:**
1. **GLB model orientation: -Z forward** — Not directly relevant yet (using placeholder geometry), but when models are added later, apply rotation at load time
2. **All tunable values in gameConfig.js** — ALL spawn rates, distances, intervals, caps must be in gameConfig.js. NO hardcoded numbers in spawnSystem or useEnemies
3. **Memory management checklist** — EnemyRenderer must dispose geometries and materials in useEffect cleanup. InstancedMesh needs disposal too. The `dummy` Object3D for matrix computation doesn't need disposal (no GPU resources)

**Files from Story 2.1 that MUST NOT be broken:**
- `src/systems/spatialHash.js` — DO NOT modify
- `src/systems/collisionSystem.js` — DO NOT modify
- `src/systems/__tests__/spatialHash.test.js` — DO NOT modify
- `src/systems/__tests__/collisionSystem.test.js` — DO NOT modify
- `src/systems/__tests__/performance.test.js` — DO NOT modify
- `src/stores/usePlayer.jsx` — DO NOT modify (movement tick is complete)
- `src/renderers/EnvironmentRenderer.jsx` — DO NOT modify
- `src/renderers/PlayerShip.jsx` — DO NOT modify

### Git Intelligence

Recent commits (conventional commit format):
- `fd2a0b9` feat: 2-1
- `4d9556e` feat: implement space environment & boundaries (Story 1.3)
- `02c8ab6` fix: apply Story 1.2 code review fixes
- `ddd4dee` feat: implement ship movement, rotation & banking (Story 1.2)
- `765ed38` bmad and US1 OK
- `676d322` bmad-part1
- `7dda110` Initial commit

Convention: `feat:` for new features. Story 2.2 commit should use `feat: implement enemy spawning & rendering (Story 2.2)`.

Files modified in Story 2.1 that this story also touches:
- `src/GameLoop.jsx` — Story 2.1 added collision phase. Story 2.2 adds enemy spawning + movement step. MERGE CAREFULLY — read current file before editing
- `src/config/gameConfig.js` — Story 2.1 added PLAYER_COLLISION_RADIUS. Story 2.2 adds spawn constants. APPEND to existing config

### Technical Stack Reference

- **React Three Fiber v9.1.0** — R3F hooks: useFrame for rendering sync, useRef for InstancedMesh refs
- **Three.js v0.174.0** — InstancedMesh, Matrix4, Object3D for matrix computation, BoxGeometry/OctahedronGeometry/ConeGeometry for placeholder enemies, MeshStandardMaterial with emissive
- **Drei v10.0.4** — Not directly needed for this story (no preloading GLB models yet)
- **Zustand v5.0** — create() for useEnemies store, getState() for GameLoop reads
- **Vitest v4** — Unit tests for spawnSystem and useEnemies
- **R3F v9 InstancedMesh pattern:** Use `<instancedMesh>` JSX tag OR create imperatively. JSX approach: `<instancedMesh ref={ref} args={[geometry, material, maxCount]}>`. Prefer JSX if it works in R3F v9, fall back to imperative if it doesn't (Epic 1 lesson)

### Library/Framework Requirements

No new libraries needed. All dependencies already installed.

### File Structure Requirements

**New files:**
- `src/systems/spawnSystem.js` — Enemy spawn logic (Layer 2)
- `src/renderers/EnemyRenderer.jsx` — InstancedMesh enemy rendering (Layer 5)
- `src/systems/__tests__/spawnSystem.test.js` — Spawn system unit tests
- `src/stores/__tests__/useEnemies.test.js` — Enemy store unit tests (create directory if needed)

**Modified files:**
- `src/entities/enemyDefs.js` — Add FODDER_FAST, add color/meshScale fields
- `src/config/gameConfig.js` — Add spawn-related constants
- `src/stores/useEnemies.jsx` — Full implementation (replace skeleton)
- `src/GameLoop.jsx` — Activate step 5 (spawn + enemy movement), add spawnSystem
- `src/scenes/GameplayScene.jsx` — Add EnemyRenderer

**Files NOT to modify:**
- `src/systems/spatialHash.js`
- `src/systems/collisionSystem.js`
- `src/stores/usePlayer.jsx`
- `src/stores/useWeapons.jsx`
- `src/renderers/PlayerShip.jsx`
- `src/renderers/EnvironmentRenderer.jsx`
- `src/Experience.jsx`

### Testing Requirements

**Unit tests (spawnSystem.js):**
- Spawn timer decrements correctly
- Spawn interval decreases over elapsed time (difficulty ramp)
- Spawn interval never goes below SPAWN_INTERVAL_MIN
- Weighted random selects enemy types proportionally
- Spawn position is at correct distance from player
- Spawn position is clamped to play area
- Batch size increases over time
- reset() clears all internal state
- No spawns when at MAX_ENEMIES_ON_SCREEN (caller responsibility, but system should still produce instructions — the cap is enforced by useEnemies)

**Unit tests (useEnemies store):**
- spawnEnemy creates enemy with correct stats from enemyDefs
- spawnEnemy respects MAX_ENEMIES_ON_SCREEN cap
- tick moves enemies toward player position (chase behavior)
- tick clamps enemy positions to play area
- killEnemy removes enemy from array
- reset clears all enemies
- Enemy IDs are unique across spawns

**Integration verification:**
- Enemies appear when game starts
- Enemies move toward the ship
- Two distinct enemy types visible (different shape + color)
- Spawn rate increases over ~60 seconds of play
- No console errors or warnings
- Existing collision registration still works (check collision debug if available)
- Performance stays at 60 FPS with 50+ enemies (check r3f-perf)
- All existing tests (spatialHash, collisionSystem, performance) still pass

### Project Structure Notes

- `src/systems/spawnSystem.js` follows the same factory pattern as spatialHash.js and collisionSystem.js — `createSpawnSystem()` returns object with methods
- `src/renderers/EnemyRenderer.jsx` follows the same layer as PlayerShip.jsx and EnvironmentRenderer.jsx — read-only from stores, rendering only
- `src/stores/__tests__/` directory may need to be created for store unit tests
- All files follow naming conventions: camelCase.js for systems, PascalCase.jsx for components, camelCase.jsx for stores

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity Management] — Hybrid InstancedMesh + Zustand stores, Float32Array pools
- [Source: _bmad-output/planning-artifacts/architecture.md#State Architecture] — GameLoop as sole orchestrator, tick order
- [Source: _bmad-output/planning-artifacts/architecture.md#Game Entity Definition Patterns] — Enemy definition pattern (ENEMIES object)
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop for game logic, renderers for visual sync only
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — Layer rules, stores never import other stores
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — Complete data flow from input to rendering
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — SCREAMING_CAPS for entity IDs, PascalCase for components
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — Enemy projectile color #ff3333, enemy visuals should be readable against dark space
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Kill feedback: particles, XP +N floating, < 50ms (Story 2.4, not this story)
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] — NFR2: 30+ FPS with 100+ enemies, NFR1: 60 FPS target
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-02-07.md#Action Items] — Constants in gameConfig, memory management checklist, GLB orientation convention
- [Source: _bmad-output/implementation-artifacts/2-1-spatial-hashing-collision-system.md#Completion Notes] — Entity pool pattern in GameLoop, collision system integration, Vitest infrastructure
- [Source: src/GameLoop.jsx] — Current tick order, collision registration loop, entity pool pattern
- [Source: src/stores/useEnemies.jsx] — Current skeleton (enemies: [], empty tick)
- [Source: src/entities/enemyDefs.js] — Current FODDER_BASIC definition
- [Source: src/config/gameConfig.js] — MAX_ENEMIES_ON_SCREEN: 100, PLAY_AREA_SIZE: 2000
- [Source: src/scenes/GameplayScene.jsx] — Current scene composition (needs EnemyRenderer)
- [Source: src/stores/usePlayer.jsx] — Player position format: [x, 0, z]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered during implementation.

### Completion Notes List

- Task 1: Added FODDER_FAST enemy type and color/meshScale fields to both enemy defs in enemyDefs.js
- Task 2: Added all 7 spawn-related constants to gameConfig.js (SPAWN_INTERVAL_BASE, SPAWN_INTERVAL_MIN, SPAWN_RAMP_RATE, SPAWN_DISTANCE_MIN, SPAWN_DISTANCE_MAX, SPAWN_BATCH_SIZE_BASE, SPAWN_BATCH_RAMP_INTERVAL)
- Task 3: Created spawnSystem.js as a pure Layer 2 factory with tick/reset, weighted random enemy selection, difficulty ramp, and batch size scaling
- Task 4: Fully implemented useEnemies store with spawnEnemy (MAX cap enforced), tick (chase behavior with direction normalization, play area clamping), killEnemy, and reset
- Task 5: Created EnemyRenderer.jsx with one InstancedMesh per enemy type (OctahedronGeometry for FODDER_BASIC, ConeGeometry for FODDER_FAST), emissive MeshStandardMaterial, proper disposal in useEffect cleanup, frustumCulled=false
- Task 6: Integrated spawnSystem into GameLoop with useRef pattern, activated step 5 in tick order before collision detection, added phase-transition-based reset for spawnSystem
- Task 7: Added EnemyRenderer to GameplayScene between PlayerShip and EnvironmentRenderer
- Task 8: 10 unit tests for spawnSystem, 16 unit tests for useEnemies — all 56 tests pass (including 30 existing regression tests)
- **AC#3 Deviation Note**: Float32Array pools deferred per Task 4.6 rationale — plain object arrays used for MVP (<=100 enemies). InstancedMesh matrix updates still batch-write to GPU. Optimization to typed arrays if profiling shows GC pressure.

### Change Log

- 2026-02-07: Implemented enemy spawning and rendering system (Story 2.2) — 2 enemy types, spawn difficulty ramp, InstancedMesh rendering, full test coverage
- 2026-02-07: Code review fixes — (H2) tick() refactored to in-place mutation for zero GC pressure, (H3) added spawnEnemies() batch method with single set() call, (M1) dummy Object3D moved to useRef per component, (M2) EnemyRenderer made dynamic via Object.keys(ENEMIES) with fallback geometry, (M3) removed redundant count field from store, (L2) guarded needsUpdate when count=0

### File List

**New files:**
- src/systems/spawnSystem.js
- src/renderers/EnemyRenderer.jsx
- src/systems/__tests__/spawnSystem.test.js
- src/stores/__tests__/useEnemies.test.js

**Modified files:**
- src/entities/enemyDefs.js
- src/config/gameConfig.js
- src/stores/useEnemies.jsx
- src/GameLoop.jsx
- src/scenes/GameplayScene.jsx
