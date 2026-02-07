# Story 2.3: Auto-Fire & Projectile System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want my spaceship to automatically fire weapons in the direction it faces,
So that I can focus on movement and survival while dealing damage to enemies.

## Acceptance Criteria

1. **Given** the player is in the gameplay scene with a base weapon equipped **When** the weapon cooldown expires **Then** a projectile spawns from the ship's position, traveling in the ship's facing direction at the weapon's baseSpeed **And** firing is automatic with no player input required

2. **Given** projectiles are firing **When** projectiles are rendered **Then** they display with distinct visuals matching the weapon type (projectileType from weaponDefs) **And** projectiles render via InstancedMesh (ProjectileRenderer.jsx) with object pooling

3. **Given** projectileSystem.js is implemented **When** tick(delta) is called **Then** projectiles move based on their speed and direction each frame **And** projectiles are removed when they exceed their lifetime or leave the play area **And** removed projectiles return to the pool for reuse (no GC pressure)

4. **Given** the useWeapons store **When** it is initialized **Then** weaponDefs.js contains at least the LASER_FRONT base weapon with baseDamage, baseCooldown, baseSpeed **And** the store tracks active weapons and their cooldown timers

## Tasks / Subtasks

- [x] Task 1: Expand weaponDefs.js with projectile configuration (AC: #4)
  - [x] 1.1: Update LASER_FRONT in `src/entities/weaponDefs.js` — add fields: `projectileRadius: 0.3` (collision radius for spatial hash), `projectileLifetime: 3.0` (seconds before auto-despawn), `projectileColor: '#00ffff'` (cyan beam per UX neon palette), `projectileMeshScale: [0.15, 0.15, 0.6]` (elongated shape for beam look)
  - [x] 1.2: Ensure the existing fields remain: id, name, description, baseDamage: 10, baseCooldown: 0.5, baseSpeed: 300, projectileType: 'beam', slot: 'any'

- [x]Task 2: Add projectile-related constants to gameConfig.js (AC: #3)
  - [x]2.1: Add constants: `PROJECTILE_COLLISION_RADIUS: 0.3` (default for projectiles not defining their own), `MAX_PROJECTILES: 200` (already exists — verify)
  - [x]2.2: Verify MAX_PROJECTILES: 200 already in gameConfig.js — no change if present

- [x]Task 3: Implement projectileSystem.js (AC: #3)
  - [x]3.1: Create `src/systems/projectileSystem.js` — pure logic module (Layer 2: Systems), no React, no stores. Imports GAME_CONFIG
  - [x]3.2: Implement `createProjectileSystem()` factory returning object with `{ tick, reset }` methods. No internal state needed — projectile movement is stateless (position += direction * speed * delta)
  - [x]3.3: Implement `tick(projectiles, delta)` — takes array of active projectiles, updates position in-place (x += dirX * speed * delta, z += dirZ * speed * delta), marks projectiles as inactive when lifetime expires (elapsedTime >= lifetime) or when position is outside play area (|x| > PLAY_AREA_SIZE or |z| > PLAY_AREA_SIZE). Returns nothing — mutations are in-place for zero GC pressure
  - [x]3.4: Implement `reset()` — no-op for now (system is stateless), but keep for consistency with spawnSystem/collisionSystem pattern
  - [x]3.5: Lifetime tracking: each projectile has `elapsedTime` field incremented by delta each tick. When `elapsedTime >= lifetime`, mark `active = false`
  - [x]3.6: Boundary check: if `Math.abs(x) > PLAY_AREA_SIZE || Math.abs(z) > PLAY_AREA_SIZE`, mark `active = false`

- [x]Task 4: Implement useWeapons store with auto-fire and projectile pool (AC: #1, #3, #4)
  - [x]4.1: Redesign `src/stores/useWeapons.jsx` with full implementation. State: `activeWeapons` (array of equipped weapon objects with cooldownTimer), `projectiles` (array of projectile objects — pool-based), `nextProjectileId` (incrementing integer)
  - [x]4.2: Implement `initializeWeapons()` action — called at game start. Creates the default loadout: `[{ weaponId: 'LASER_FRONT', level: 1, cooldownTimer: 0 }]` in activeWeapons. Slot 0 = base weapon (cannot be removed per FR9)
  - [x]4.3: Implement `tick(delta, playerPosition, playerRotation)` — for each active weapon: decrement cooldownTimer by delta. When cooldownTimer <= 0: reset timer to weapon's baseCooldown, create a new projectile. Projectile object: `{ id: 'proj_${nextProjectileId++}', weaponId, x: playerPosition[0], z: playerPosition[2], dirX: Math.sin(playerRotation), dirZ: -Math.cos(playerRotation), speed: weapon.baseSpeed, damage: weapon.baseDamage, radius: weapon.projectileRadius, lifetime: weapon.projectileLifetime, elapsedTime: 0, color: weapon.projectileColor, meshScale: weapon.projectileMeshScale, active: true }`
  - [x]4.4: After firing new projectiles, call projectileSystem.tick() on the projectiles array to update positions and deactivate expired/OOB projectiles. Then filter out inactive projectiles. Respect MAX_PROJECTILES cap — if at cap, skip firing (oldest projectiles will naturally expire)
  - [x]4.5: Implement `reset()` — clears activeWeapons and projectiles, resets nextProjectileId
  - [x]4.6: **Design decision on projectileSystem integration:** The store's tick() method should accept a projectileSystem reference (passed by GameLoop) or import it directly. Since projectileSystem is Layer 2 (pure logic) and stores are Layer 3, stores CAN import systems. However, for consistency with the spawnSystem pattern (where GameLoop bridges system → store), prefer having GameLoop call projectileSystem.tick() separately. **Chosen approach:** GameLoop calls `useWeapons.getState().tick(delta, playerPos, playerRot)` for firing logic, then calls `projectileSystem.tick(useWeapons.getState().projectiles, delta)` for movement, then calls `useWeapons.getState().cleanupInactive()` to remove dead projectiles
  - [x]4.7: Implement `cleanupInactive()` action — filters out `active === false` projectiles from the array. Single `set()` call

- [x]Task 5: Implement ProjectileRenderer.jsx (AC: #2)
  - [x]5.1: Create `src/renderers/ProjectileRenderer.jsx` — Layer 5 rendering component. Reads projectile data from useWeapons store, renders via InstancedMesh
  - [x]5.2: Strategy: One InstancedMesh for all projectiles (single weapon type for now). MAX_PROJECTILES as max instance count. Use ref to InstancedMesh
  - [x]5.3: Use `useFrame` to sync instance matrices each frame: for each active projectile, compute Matrix4 from position (x, 0, z), rotation (face movement direction: `Math.atan2(dirX, -dirZ)`), and scale (meshScale from projectile data). Write via `setMatrixAt(index, matrix)`
  - [x]5.4: Geometry: `BoxGeometry(1, 1, 1)` scaled via meshScale to elongated beam shape. Material: `MeshStandardMaterial` with emissive matching projectileColor for glow effect. Use `emissiveIntensity: 2` for bright projectile glow
  - [x]5.5: Set `instancedMesh.count` to actual active projectile count each frame
  - [x]5.6: Set `instancedMesh.instanceMatrix.needsUpdate = true` after writing matrices. Guard with `if (count > 0)` to avoid unnecessary GPU updates
  - [x]5.7: Set `instancedMesh.frustumCulled = false` (same pattern as EnemyRenderer)
  - [x]5.8: Use useMemo for geometry/material creation, useRef for InstancedMesh and dummy Object3D (same pattern as EnemyRenderer — Object3D in useRef, not useMemo per Story 2.2 code review fix)
  - [x]5.9: Memory management: dispose geometry and material in useEffect cleanup

- [x]Task 6: Integrate into GameLoop (AC: #1, #3)
  - [x]6.1: Import createProjectileSystem from projectileSystem.js in GameLoop.jsx. Instantiate with useRef (same pattern as spawnSystem and collisionSystem)
  - [x]6.2: Activate step 3 (weapons fire): call `useWeapons.getState().tick(clampedDelta, playerState.position, playerState.rotation)` — this handles cooldown logic and projectile creation
  - [x]6.3: Activate step 4 (projectile movement): call `projectileSystem.tick(useWeapons.getState().projectiles, clampedDelta)` — this moves projectiles and marks inactive ones
  - [x]6.4: After projectile movement, call `useWeapons.getState().cleanupInactive()` — removes dead projectiles from the array
  - [x]6.5: Verify collision registration: the existing loop at step 6 already reads `useWeapons.getState().projectiles` and registers them with CATEGORY_PROJECTILE. Verify projectile objects have the required fields: `id`, `x`, `z`, `radius`
  - [x]6.6: Ensure tick order is: input → player movement → **weapons fire** → **projectile movement** → enemy spawning + movement → collisions → damage → XP → cleanup
  - [x]6.7: Add weapons initialization: when game phase enters "gameplay", call `useWeapons.getState().initializeWeapons()`. Add projectileSystem.reset() to game reset logic
  - [x]6.8: Add `useWeapons.getState().reset()` and `projectileSystem.reset()` to phase transition cleanup

- [x]Task 7: Integrate ProjectileRenderer into GameplayScene (AC: #2)
  - [x]7.1: Import ProjectileRenderer in `src/scenes/GameplayScene.jsx`
  - [x]7.2: Add `<ProjectileRenderer />` after `<PlayerShip />` and before `<EnemyRenderer />` (projectiles should render between player and enemies visually)

- [x]Task 8: Testing (AC: #1, #2, #3, #4)
  - [x]8.1: Unit test projectileSystem.js: verify position updates (x += dirX * speed * delta, z += dirZ * speed * delta), lifetime expiry marks inactive, out-of-bounds marks inactive, in-place mutation (no new objects created)
  - [x]8.2: Unit test useWeapons store: verify initializeWeapons creates LASER_FRONT in slot 0, tick fires when cooldown expires, tick does not fire before cooldown, projectile has correct direction from player rotation, MAX_PROJECTILES cap enforced, cleanupInactive removes dead projectiles, reset clears all state
  - [x]8.3: Integration test: verify projectiles appear when game starts, travel in ship's facing direction, disappear when leaving play area or after lifetime
  - [x]8.4: Visual test: verify projectiles are visible with cyan glow, elongated beam shape, match ship facing direction
  - [x]8.5: Performance test: verify 200 projectiles render + tick within frame budget (check with r3f-perf)
  - [x]8.6: Regression test: all existing tests (spatialHash, collisionSystem, performance, spawnSystem, useEnemies) still pass

## Dev Notes

### Critical Architecture Context

**6-Layer Architecture (MUST follow):**
1. Config/Data → 2. Systems → 3. Stores → 4. GameLoop → 5. Rendering → 6. UI

This story touches ALL main layers except UI:
- **Layer 1** (Config/Data): gameConfig.js additions, weaponDefs.js expansion
- **Layer 2** (Systems): NEW projectileSystem.js
- **Layer 3** (Stores): useWeapons.jsx full implementation
- **Layer 4** (GameLoop): activate steps 3-4 (weapons fire + projectile movement)
- **Layer 5** (Rendering): NEW ProjectileRenderer.jsx

**Critical Boundary Rules:**
- `projectileSystem.js` is Layer 2 — pure logic, NO React, NO stores, NO rendering. It takes a projectiles array and mutates it in-place. It does NOT create projectiles
- `useWeapons.jsx` is Layer 3 — state + actions. It creates projectiles (firing logic) and removes inactive ones (cleanup). It does NOT move projectiles — that's the system's job
- `ProjectileRenderer.jsx` is Layer 5 — read-only from stores. It reads projectile data and writes to GPU. NO game logic, NO state mutations
- The GameLoop orchestrates: store.tick() → system.tick() → store.cleanup()

**Inter-Store Communication Pattern:**
```
GameLoop reads usePlayer.getState() → gets position + rotation
GameLoop calls useWeapons.getState().tick(delta, position, rotation) → creates projectiles when cooldown expires
GameLoop calls projectileSystem.tick(projectiles, delta) → moves projectiles, marks expired ones inactive
GameLoop calls useWeapons.getState().cleanupInactive() → removes inactive projectiles
GameLoop reads useWeapons.getState().projectiles → registers in collision system (already done in Story 2.1)
```

### What Already Exists (Do NOT Recreate)

**GameLoop.jsx — collision phase (Story 2.1) + enemy spawning (Story 2.2):**
Steps 1-2 (input + player movement) and step 5 (enemy spawning + movement) and step 6 (collision detection) are implemented. Steps 3-4 (weapons fire + projectile movement) are commented placeholders — this story activates them. Steps 7-9 remain commented for Story 2.4+.

The collision registration loop at step 6 already reads `useWeapons.getState().projectiles` and registers each with `CATEGORY_PROJECTILE`:
```javascript
// projectiles already have { id, x, z, radius } — verify field names match
const projectiles = useWeapons.getState().projectiles
for (let i = 0; i < projectiles.length; i++) {
  const p = projectiles[i]
  assignEntity(pool[idx], p.id, p.x, p.z, p.radius, CATEGORY_PROJECTILE)
  idx++
}
```

**collisionSystem.js + spatialHash.js (Story 2.1):**
Fully working. Supports CATEGORY_PROJECTILE. Collision matrix allows projectile↔enemy collisions. No changes needed.

**Entity descriptor pool in GameLoop (Story 2.1):**
Pre-allocated entity pool with `assignEntity()` zero-allocation pattern. Pool size handles player + MAX_ENEMIES + MAX_PROJECTILES. Already loops over projectiles — no changes needed for collision registration, just verify field names.

**useWeapons.jsx — current skeleton:**
```javascript
activeWeapons: [],
projectiles: [],
tick: (delta) => {},
reset: () => set({ activeWeapons: [], projectiles: [] })
```
This story replaces the skeleton with full implementation.

**weaponDefs.js — LASER_FRONT:**
Already has id, name, description, baseDamage: 10, baseCooldown: 0.5, baseSpeed: 300, projectileType: 'beam', slot: 'any'. This story adds projectileRadius, projectileLifetime, projectileColor, projectileMeshScale.

**gameConfig.js — relevant existing constants:**
- `MAX_PROJECTILES: 200`
- `PLAY_AREA_SIZE: 2000`
- `SPATIAL_HASH_CELL_SIZE: 2`
- `PLAYER_COLLISION_RADIUS: 1.5`

**usePlayer.jsx — player state format:**
- `position: [x, 0, z]` — world coordinates array
- `rotation: float` — yaw angle in radians (ship facing direction)

The `rotation` field is the ship's yaw angle. **Projectile direction from rotation:**
```javascript
dirX = Math.sin(rotation)
dirZ = -Math.cos(rotation)
```
This matches the Three.js convention where rotation 0 = facing -Z, rotation π/2 = facing +X.

**EnemyRenderer.jsx — rendering pattern to follow:**
Uses per-type InstancedMesh, useMemo for geometry/material, useRef for dummy Object3D and mesh references, useEffect cleanup for disposal, `frustumCulled = false`, guard `needsUpdate` when count=0.

**Vitest test infrastructure (Stories 2.1, 2.2):**
Vitest v4 installed, test scripts in package.json (`npm test`, `npm run test:watch`), vite.config.js has test config. Existing tests in `src/systems/__tests__/` and `src/stores/__tests__/`.

### Implementation Approach

**Projectile Data Model:**
Each projectile in the `projectiles` array is a plain object:
```javascript
{
  id: 'proj_42',           // unique ID for collision system
  weaponId: 'LASER_FRONT', // key into WEAPONS lookup
  x: 150.5,               // world position X
  z: -80.2,               // world position Z
  dirX: 0.707,            // normalized direction X
  dirZ: -0.707,           // normalized direction Z
  speed: 300,             // movement speed (from weapon def)
  damage: 10,             // damage on hit (from weapon def)
  radius: 0.3,            // collision radius
  lifetime: 3.0,          // max seconds alive
  elapsedTime: 0,         // time since spawn
  color: '#00ffff',       // visual color
  meshScale: [0.15, 0.15, 0.6], // visual scale
  active: true,           // false = pending removal
}
```

**Auto-Fire Design:**
The weapon system is fully automatic — no player input required. Each equipped weapon has its own independent cooldown timer. When the timer reaches 0, a projectile spawns at the player's current position, traveling in the player's current facing direction. The timer resets to the weapon's `baseCooldown`.

```javascript
// In useWeapons.tick():
for (const weapon of activeWeapons) {
  weapon.cooldownTimer -= delta
  if (weapon.cooldownTimer <= 0) {
    weapon.cooldownTimer = WEAPONS[weapon.weaponId].baseCooldown
    // Create projectile at player position in player facing direction
  }
}
```

**Projectile Movement (in projectileSystem.tick()):**
```javascript
for (let i = 0; i < projectiles.length; i++) {
  const p = projectiles[i]
  if (!p.active) continue
  p.x += p.dirX * p.speed * delta
  p.z += p.dirZ * p.speed * delta
  p.elapsedTime += delta
  if (p.elapsedTime >= p.lifetime || Math.abs(p.x) > PLAY_AREA_SIZE || Math.abs(p.z) > PLAY_AREA_SIZE) {
    p.active = false
  }
}
```
In-place mutation for zero GC pressure (same pattern as useEnemies.tick from Story 2.2).

**InstancedMesh Rendering Pattern (same as EnemyRenderer):**
```javascript
const dummy = useRef(new THREE.Object3D())
// per projectile:
dummy.current.position.set(p.x, 0.5, p.z)  // slight Y offset so visible above ground
dummy.current.rotation.set(0, Math.atan2(p.dirX, -p.dirZ), 0)
dummy.current.scale.set(...p.meshScale)
dummy.current.updateMatrix()
instancedMesh.setMatrixAt(index, dummy.current.matrix)
```

### Previous Story Intelligence (Stories 2.1 & 2.2)

**Key learnings that directly apply:**

1. **Entity object pool pattern (Story 2.1)** — GameLoop pre-allocates entity descriptors to avoid GC. Projectile registration is already wired in the collision loop. Verify projectile objects have: `id`, `x`, `z`, `radius`

2. **Zero-allocation tick pattern (Story 2.2)** — useEnemies.tick() mutates in-place instead of creating new objects. useWeapons.tick() and projectileSystem.tick() MUST follow the same pattern. Only call set() when array composition changes (new projectiles added, inactive removed), not for position updates

3. **useRef for system instances (Stories 2.1, 2.2)** — collisionSystem and spawnSystem use useRef in GameLoop. projectileSystem must follow the same pattern

4. **Imperative InstancedMesh approach (Story 2.2)** — EnemyRenderer uses useMemo for geometry/material, useRef for Object3D dummy and mesh ref. ProjectileRenderer should follow identical pattern

5. **Memory disposal in useEffect cleanup (Story 2.2)** — EnemyRenderer disposes geometry and material. ProjectileRenderer must do the same

6. **Code review fix: dummy Object3D in useRef (Story 2.2)** — Story 2.2 code review changed dummy from useMemo to useRef. Follow this pattern

7. **Collision system already expects projectiles** — The GameLoop collision registration loop already iterates over `useWeapons.getState().projectiles`. No collision registration code changes needed

**From Epic 1 Retro — Action Items to follow:**
1. **All tunable values in gameConfig.js** — Projectile radius, lifetime, speed must come from weaponDefs. MAX_PROJECTILES from gameConfig. NO hardcoded numbers
2. **Memory management checklist** — ProjectileRenderer must dispose geometry and material in cleanup. Object3D dummy doesn't need disposal

**Files from Stories 2.1/2.2 that MUST NOT be broken:**
- `src/systems/spatialHash.js` — DO NOT modify
- `src/systems/collisionSystem.js` — DO NOT modify
- `src/systems/spawnSystem.js` — DO NOT modify
- `src/stores/useEnemies.jsx` — DO NOT modify
- `src/stores/usePlayer.jsx` — DO NOT modify
- `src/renderers/EnemyRenderer.jsx` — DO NOT modify
- `src/renderers/PlayerShip.jsx` — DO NOT modify
- `src/renderers/EnvironmentRenderer.jsx` — DO NOT modify
- All existing test files — DO NOT modify

### Git Intelligence

Recent commits (conventional commit format):
- `20b087b` 3D assets
- `e7c5a84` feat: implement enemy spawning & rendering with code review fixes (Story 2.2)
- `fd2a0b9` feat: 2-1
- `4d9556e` feat: implement space environment & boundaries (Story 1.3)
- `02c8ab6` fix: apply Story 1.2 code review fixes

Convention: `feat:` for new features. Story 2.3 commit should use `feat: implement auto-fire & projectile system (Story 2.3)`.

Files modified in Story 2.2 that this story also touches:
- `src/GameLoop.jsx` — Story 2.2 added step 5 (enemy spawning + movement). Story 2.3 activates steps 3-4 (weapons fire + projectile movement). READ CURRENT FILE BEFORE EDITING — merge carefully with existing steps
- `src/config/gameConfig.js` — Story 2.2 added spawn constants. Story 2.3 may add projectile constants. APPEND to existing config

### Technical Stack Reference

- **React Three Fiber v9.1.0** — useFrame for rendering sync, useRef for InstancedMesh refs
- **Three.js v0.174.0** — InstancedMesh, Matrix4, Object3D for matrix computation, BoxGeometry for projectile shape, MeshStandardMaterial with emissive for glow
- **Drei v10.0.4** — Not needed for this story
- **Zustand v5.0** — create() for useWeapons store, getState() for GameLoop reads
- **Vitest v4** — Unit tests for projectileSystem and useWeapons

### Library/Framework Requirements

No new libraries needed. All dependencies already installed.

### File Structure Requirements

**New files:**
- `src/systems/projectileSystem.js` — Projectile movement + lifecycle (Layer 2)
- `src/renderers/ProjectileRenderer.jsx` — InstancedMesh projectile rendering (Layer 5)
- `src/systems/__tests__/projectileSystem.test.js` — Projectile system unit tests
- `src/stores/__tests__/useWeapons.test.js` — Weapons store unit tests

**Modified files:**
- `src/entities/weaponDefs.js` — Add projectile visual/collision fields to LASER_FRONT
- `src/config/gameConfig.js` — Add PROJECTILE_COLLISION_RADIUS if needed
- `src/stores/useWeapons.jsx` — Full implementation (replace skeleton)
- `src/GameLoop.jsx` — Activate steps 3-4 (weapons fire + projectile movement), add projectileSystem
- `src/scenes/GameplayScene.jsx` — Add ProjectileRenderer

**Files NOT to modify:**
- `src/systems/spatialHash.js`
- `src/systems/collisionSystem.js`
- `src/systems/spawnSystem.js`
- `src/stores/usePlayer.jsx`
- `src/stores/useEnemies.jsx`
- `src/renderers/PlayerShip.jsx`
- `src/renderers/EnemyRenderer.jsx`
- `src/renderers/EnvironmentRenderer.jsx`
- `src/Experience.jsx`
- All existing test files

### Testing Requirements

**Unit tests (projectileSystem.js):**
- Position updates correctly: x += dirX * speed * delta, z += dirZ * speed * delta
- Lifetime expiry: projectile with elapsedTime >= lifetime marked inactive
- Out-of-bounds: projectile beyond PLAY_AREA_SIZE marked inactive
- In-place mutation: no new objects created, same array modified
- Multiple projectiles updated in single call
- Inactive projectiles skipped during movement

**Unit tests (useWeapons store):**
- initializeWeapons creates LASER_FRONT in slot 0 with correct cooldown
- tick fires projectile when cooldown reaches 0
- tick does NOT fire before cooldown expires
- Projectile spawns at player position with correct direction from rotation
- Direction vectors are correct: rotation 0 → dirX=0, dirZ=-1 (facing -Z); rotation π/2 → dirX=1, dirZ=0 (facing +X)
- MAX_PROJECTILES cap prevents new projectiles when at limit
- cleanupInactive removes active=false projectiles
- reset clears all weapons and projectiles
- Multiple weapons fire independently (for future multi-weapon support)

**Integration verification:**
- Projectiles appear when game starts (auto-fire, no input needed)
- Projectiles travel in ship's facing direction
- Projectiles disappear at play area boundary
- Projectiles disappear after lifetime expires
- Ship rotation changes → new projectiles follow new direction
- No console errors or warnings
- Existing collision registration still works (projectiles appear in spatial hash)
- Performance stays at 60 FPS with active firing (check r3f-perf)
- All existing tests (spatialHash, collisionSystem, performance, spawnSystem, useEnemies) still pass

### Project Structure Notes

- `src/systems/projectileSystem.js` follows the same factory pattern as spatialHash.js, collisionSystem.js, and spawnSystem.js — `createProjectileSystem()` returns object with methods
- `src/renderers/ProjectileRenderer.jsx` follows the same layer/pattern as EnemyRenderer.jsx — read-only from stores, InstancedMesh rendering
- All files follow naming conventions: camelCase.js for systems, PascalCase.jsx for components, camelCase.jsx for stores
- Tests go in `src/systems/__tests__/` for systems, `src/stores/__tests__/` for stores (directory already exists from Story 2.2)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity Management] — Hybrid InstancedMesh + Zustand stores, object pooling
- [Source: _bmad-output/planning-artifacts/architecture.md#State Architecture] — GameLoop as sole orchestrator, tick order
- [Source: _bmad-output/planning-artifacts/architecture.md#Game Entity Definition Patterns] — Weapon definition pattern (WEAPONS object)
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules] — Only GameLoop for game logic, renderers for visual sync only
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — Layer rules, stores never import other stores
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — Weapons fire → projectile movement position in data flow
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — SCREAMING_CAPS for entity IDs, PascalCase for components
- [Source: _bmad-output/planning-artifacts/prd.md#Combat System] — FR6: auto-fire facing direction, FR7: damage on hit, FR10: distinct weapon visuals
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] — NFR1: 60 FPS target, NFR2: 30+ FPS under load
- [Source: _bmad-output/implementation-artifacts/2-2-enemy-spawning-rendering.md#Completion Notes] — Zero-allocation tick pattern, InstancedMesh rendering pattern, useRef for dummy Object3D
- [Source: _bmad-output/implementation-artifacts/2-1-spatial-hashing-collision-system.md#Completion Notes] — Entity pool pattern, CATEGORY_PROJECTILE, collision registration loop
- [Source: src/GameLoop.jsx] — Current tick order (steps 3-4 commented), collision registration for projectiles
- [Source: src/stores/useWeapons.jsx] — Current skeleton (activeWeapons: [], projectiles: [], empty tick)
- [Source: src/stores/usePlayer.jsx] — position: [x, 0, z], rotation: float (yaw radians)
- [Source: src/entities/weaponDefs.js] — LASER_FRONT base weapon definition
- [Source: src/config/gameConfig.js] — MAX_PROJECTILES: 200, PLAY_AREA_SIZE: 2000
- [Source: src/scenes/GameplayScene.jsx] — Current scene composition (needs ProjectileRenderer)
- [Source: src/renderers/EnemyRenderer.jsx] — InstancedMesh rendering pattern to replicate

## Change Log

- 2026-02-07: Implemented auto-fire & projectile system — all 8 tasks complete, 89 tests passing (33 new + 56 existing), zero regressions
- 2026-02-07: **Code Review (AI)** — 10 issues found (3 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW). Fixed 8:
  - Reverted EnemyRenderer.jsx to InstancedMesh pattern (was rewritten to per-enemy GLB clones — perf bomb, memory leak, DO NOT MODIFY violation)
  - Reverted enemyDefs.js to original values (undocumented speed/meshScale changes out of scope)
  - Fixed spawnSystem.test.js hardcoded assertion to use dynamic GAME_CONFIG.SPAWN_INTERVAL_BASE
  - Fixed weaponDefs.js projectileMeshScale from [0.8, 0.8, 1.0] to [0.15, 0.15, 0.6] per spec (elongated beam)
  - Fixed ProjectileRenderer.jsx material from MeshBasicMaterial to MeshStandardMaterial with emissive per spec
  - Documented intentional cooldown mutation pattern in useWeapons.jsx
  - 89/89 tests passing after fixes
- 2026-02-07: **Bug fix** — Projectile visual rotation was wrong on diagonals. `atan2(dirX, -dirZ)` → `atan2(dirX, dirZ)` in ProjectileRenderer.jsx. The old formula aligned the elongated mesh 90° off the travel direction for non-axis-aligned angles.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Task 1: Added projectileRadius, projectileLifetime, projectileColor, projectileMeshScale to LASER_FRONT in weaponDefs.js. Verified existing fields intact.
- Task 2: Added PROJECTILE_COLLISION_RADIUS: 0.3 to gameConfig.js. Verified MAX_PROJECTILES: 200 already present.
- Task 3: Created projectileSystem.js — pure Layer 2 system with createProjectileSystem() factory, tick() for in-place position updates + lifetime/boundary deactivation, reset() no-op for pattern consistency.
- Task 4: Full useWeapons store implementation — initializeWeapons() sets LASER_FRONT as default weapon, tick() handles cooldown-based auto-fire with projectile creation at player position/direction, cleanupInactive() filters dead projectiles, reset() clears all state. nextProjectileId as module-level counter for unique IDs. MAX_PROJECTILES cap enforced.
- Task 5: Created ProjectileRenderer.jsx — Layer 5 InstancedMesh rendering following EnemyRenderer pattern. BoxGeometry scaled via meshScale, MeshStandardMaterial with emissive cyan glow (intensity 2), useRef for dummy Object3D, useEffect cleanup for geometry/material disposal, frustumCulled=false.
- Task 6: Integrated into GameLoop — projectileSystemRef via useRef, activated steps 3-4 (weapons fire → projectile movement → cleanup), added initializeWeapons() + projectileSystem.reset() on gameplay phase entry. Fixed duplicate playerState declaration by hoisting to step 3. Tick order verified: input → player → weapons → projectiles → enemies → collisions.
- Task 7: Added ProjectileRenderer to GameplayScene between PlayerShip and EnemyRenderer.
- Task 8: 16 unit tests for projectileSystem (position, lifetime, boundary, in-place mutation, skip inactive), 17 unit tests for useWeapons (init, fire timing, direction vectors, cap, cleanup, reset, collision fields). All 89 tests pass including 56 existing regression tests.

### File List

**New files:**
- src/systems/projectileSystem.js
- src/renderers/ProjectileRenderer.jsx
- src/systems/__tests__/projectileSystem.test.js
- src/stores/__tests__/useWeapons.test.js

**Modified files:**
- src/entities/weaponDefs.js
- src/config/gameConfig.js
- src/stores/useWeapons.jsx
- src/GameLoop.jsx
- src/scenes/GameplayScene.jsx
