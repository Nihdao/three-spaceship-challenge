# Story 23.2: Enemy Collision Physics

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want enemies to physically collide with each other and not stack/overlap,
So that dense enemy groups form tactical walls I must navigate strategically.

## Acceptance Criteria

**Given** multiple enemies near each other
**When** their positions would overlap
**Then** a separation force pushes them apart
**And** enemies never visually overlap (maintain minimum distance between centers)
**And** enemy groups form organic clusters rather than stacking into single blobs

**Given** a large group of enemies converging on the player
**When** they reach the player's vicinity
**Then** they form a semicircle or wall around the player rather than all occupying the same point
**And** the player cannot simply walk through a dense enemy group (except during dash invincibility)
**And** this creates strategic pressure to not let enemies surround you

**Given** the separation physics
**When** computed each frame
**Then** only nearby enemies are checked against each other (use spatial hashing from Story 2.1)
**And** the separation force is proportional to overlap distance (soft push, not rigid body)
**And** the force is capped to prevent enemies from being launched across the map

**Given** performance with 100+ enemies
**When** the separation system runs
**Then** spatial hashing limits checks to local neighbors only (O(n) average, not O(n^2))
**And** the system maintains 60 FPS with 200+ enemies on screen
**And** the separation radius is configurable (ENEMY_SEPARATION_RADIUS in gameConfig.js)

**Given** the player's ship collision
**When** the player touches an enemy (no dash)
**Then** the existing damage/knockback system applies (from Story 3.5)
**And** enemies do not push through each other to reach the player — they queue up

**Given** boss interaction
**When** the boss is present
**Then** regular enemies are also pushed away from the boss (boss has larger separation radius)
**And** the boss maintains clear visual presence amidst waves

## Tasks / Subtasks

- [x] Task 1: Add separation constants to gameConfig.js (AC: #4)
  - [x] Add ENEMY_SEPARATION_RADIUS constant (suggested: 3.0 world units)
  - [x] Add SEPARATION_FORCE_STRENGTH constant (suggested: 50.0 units/sec^2)
  - [x] Add MAX_SEPARATION_DISPLACEMENT constant (suggested: 5.0 units/frame to prevent jitter)
  - [x] Add BOSS_SEPARATION_RADIUS constant (suggested: 8.0 world units)

- [x] Task 2: Create separationSystem.js for separation force computation (AC: #1, #2, #3, #4)
  - [x] Create src/systems/separationSystem.js (NEW file)
  - [x] Export createSeparationSystem() factory function
  - [x] Implement applySeparation(enemies, boss, delta) function
  - [x] For each enemy: query spatialHash.queryNearby() with ENEMY_SEPARATION_RADIUS
  - [x] For each neighbor pair: compute separation vector and overlap distance
  - [x] Apply soft push force: magnitude = (SEPARATION_RADIUS - distance) * FORCE_STRENGTH * delta
  - [x] Split force equally: apply half to each enemy (Newton's third law)
  - [x] Clamp displacement per frame to MAX_SEPARATION_DISPLACEMENT (prevent jitter)
  - [x] If boss present: apply boss separation (larger radius) to nearby enemies
  - [x] Mutate enemy x/z positions directly (performance optimization)

- [x] Task 3: Integrate separationSystem into GameLoop (AC: #1, #2, #3, #5)
  - [x] Import createSeparationSystem in GameLoop.jsx
  - [x] Create separationSystemRef with useRef (same pattern as collisionSystemRef)
  - [x] Call separationSystem.applySeparation() in Section 5b (Enemy movement) AFTER enemy tick
  - [x] Pass enemies array, boss object, and delta
  - [x] Separation runs AFTER enemy movement but BEFORE collision detection
  - [x] Ensure separation does not interfere with sweep/teleport behaviors (sniper_fixed exempted)

- [x] Task 4: Test separation system behavior (AC: #1, #2, #3, #4)
  - [x] Test separationSystem: two overlapping enemies are pushed apart
  - [x] Test separationSystem: force magnitude increases with overlap
  - [x] Test separationSystem: force is capped by MAX_SEPARATION_DISPLACEMENT
  - [x] Test separationSystem: separation applies symmetrically (both enemies move)
  - [x] Test separationSystem: spatial hash queries only nearby enemies (not all)
  - [x] Test separationSystem: boss pushes away nearby enemies with larger radius
  - [x] Test separationSystem: sweep enemies still follow sweep direction (not stuck)
  - [x] Test separationSystem: sniper_fixed enemies not pushed by separation

## Dev Notes

### Architecture Alignment

This story adds **enemy-to-enemy collision physics** using the existing spatial hashing system (Story 2.1). Enemies currently overlap freely, forming visual blobs when densely spawned. The separation system applies soft push forces each frame to maintain minimum distance, creating organic clusters and tactical walls.

**6-Layer Architecture:**
- **Config Layer**: `src/config/gameConfig.js` — Add ENEMY_SEPARATION_RADIUS, SEPARATION_FORCE_STRENGTH, MAX_SEPARATION_DISPLACEMENT, BOSS_SEPARATION_RADIUS
- **Systems Layer**: `src/systems/separationSystem.js` (NEW) — Separation force computation using spatial hashing
- **Systems Layer**: `src/systems/spatialHash.js` (EXISTING) — Already provides efficient neighbor queries (Story 2.1)
- **Stores Layer**: `src/stores/useEnemies.jsx` — Enemy positions mutated directly by separationSystem
- **GameLoop**: `src/GameLoop.jsx` — Call separationSystem.applySeparation() in Section 5 after enemy movement

**NOT in this story:**
- Dynamic wave system (Story 23.1 — already implemented, uses phase-based spawning)
- Cumulative timer across systems (Story 23.3 — future story)
- Player-enemy collision (already exists from Story 3.5)
- Projectile collision (already exists from Story 2.1)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/systems/separationSystem.js` | **NEW** — Separation force computation | Systems |
| `src/GameLoop.jsx` | Call separationSystem.applySeparation() in Section 5 | GameLoop |
| `src/config/gameConfig.js` | Add separation constants | Config |

**Files to read for context:**
- `src/systems/spatialHash.js` — Existing spatial hashing (Story 2.1)
- `src/stores/useEnemies.jsx` — Enemy state structure and behaviors
- `src/GameLoop.jsx` — Current enemy movement section (Section 5)
- `src/entities/enemyDefs.js` — Enemy definitions (radius per type)

### Current Spatial Hashing System (Story 2.1)

**File: `src/systems/spatialHash.js`** (67 lines)

The spatial hash already exists and is used for player-enemy collision, projectile-enemy collision, and XP orb pickup. It divides the play area into a grid of cells (SPATIAL_HASH_CELL_SIZE = 2 world units) and provides efficient neighbor queries.

**API:**
```javascript
const spatialHash = createSpatialHash(cellSize)

spatialHash.clear()                          // Clear all entities from grid
spatialHash.insert({ id, x, z, radius })     // Insert entity into grid cells
spatialHash.queryNearby(x, z, radius)        // Query entities in radius (returns array)
```

**How it works:**
- Each entity is inserted into all grid cells it overlaps
- Query returns all entities in cells overlapping the query circle
- Deduplication via Set to avoid returning same entity multiple times
- O(n) average complexity where n = number of entities in nearby cells (not all entities)

**Current usage in GameLoop.jsx:**
```javascript
// Section 6: Collision detection
const collisionSystem = collisionSystemRef.current
collisionSystem.clear()

// Register player
collisionSystem.insert({ id: 'player', x: playerState.position[0], z: playerState.position[2], radius: GAME_CONFIG.PLAYER_COLLISION_RADIUS, category: CATEGORY_PLAYER })

// Register enemies
for (const enemy of enemyState.enemies) {
  collisionSystem.insert({ id: enemy.id, x: enemy.x, z: enemy.z, radius: enemy.radius, category: CATEGORY_ENEMY })
}

// ... projectiles, orbs, etc.

const collisions = collisionSystem.resolve()
// ... handle collisions
```

**CRITICAL:** The separationSystem will use the SAME spatial hash instance (collisionSystemRef.current.spatialHash) AFTER the hash is populated in Section 6 but BEFORE collision resolution. This requires moving separation to Section 6 (after hash population) OR using a separate spatial hash pass in Section 5.

**DECISION:** Use a separate spatial hash pass in Section 5 for separation. This keeps separation independent and allows it to run immediately after enemy movement.

### Separation System Design

**Physics Model:**

Separation uses a **soft spring force** model, not rigid body collision. Enemies push each other apart when overlapping, but the force is gradual and proportional to overlap distance.

**Force calculation:**
```javascript
// For each enemy pair (A, B) within ENEMY_SEPARATION_RADIUS:
const dx = enemyA.x - enemyB.x
const dz = enemyA.z - enemyB.z
const distance = Math.sqrt(dx * dx + dz * dz)

if (distance < ENEMY_SEPARATION_RADIUS && distance > 0.001) {
  const overlap = ENEMY_SEPARATION_RADIUS - distance
  const forceMagnitude = overlap * SEPARATION_FORCE_STRENGTH * delta

  // Clamp to prevent excessive displacement
  const displacement = Math.min(forceMagnitude, MAX_SEPARATION_DISPLACEMENT)

  // Normalize direction
  const nx = dx / distance
  const nz = dz / distance

  // Apply half force to each enemy (Newton's third law)
  enemyA.x += nx * displacement * 0.5
  enemyA.z += nz * displacement * 0.5
  enemyB.x -= nx * displacement * 0.5
  enemyB.z -= nz * displacement * 0.5
}
```

**Why soft force instead of rigid body?**
- Gradual separation looks organic (enemies slide apart smoothly)
- No discontinuous jumps (rigid collision would teleport enemies)
- Handles overlapping groups gracefully (3+ enemies all pushing each other)
- Computationally cheaper than full physics engine

**Why clamp displacement?**
- Prevents jitter when many enemies overlap in same spot
- Prevents enemies from being launched across the map
- Ensures stable convergence to minimum distance

### Boss Separation

The boss (BOSS_SENTINEL) has a larger collision radius and should push regular enemies away to maintain visual presence.

**Boss separation logic:**
```javascript
// If boss is active (useLevel.phase === 'boss')
const bossState = useBoss.getState()
if (bossState && bossState.hp > 0) {
  for (const enemy of enemies) {
    const dx = enemy.x - bossState.x
    const dz = enemy.z - bossState.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance < BOSS_SEPARATION_RADIUS) {
      const overlap = BOSS_SEPARATION_RADIUS - distance
      const forceMagnitude = overlap * SEPARATION_FORCE_STRENGTH * delta
      const displacement = Math.min(forceMagnitude, MAX_SEPARATION_DISPLACEMENT)

      // Push enemy away from boss (boss doesn't move)
      const nx = dx / distance
      const nz = dz / distance
      enemy.x += nx * displacement
      enemy.z += nz * displacement
    }
  }
}
```

**IMPORTANT:** Boss separation is ONE-WAY. Boss pushes enemies, enemies don't push boss.

### GameLoop Integration

**Current GameLoop.jsx Section 5 (Enemy movement):**
```javascript
// Section 5: Enemy movement, projectiles, boss, behaviors
const enemyState = useEnemies.getState()

enemyState.tick(delta, playerState, boonModifiers.projectileSpeedMultiplier)

// ... shockwave, sniper, teleporter behaviors
```

**Modified Section 5 (add separation AFTER enemy tick):**
```javascript
// Section 5: Enemy movement, projectiles, boss, behaviors
const enemyState = useEnemies.getState()

enemyState.tick(delta, playerState, boonModifiers.projectileSpeedMultiplier)

// NEW: Apply enemy separation (Story 23.2)
const separationSystem = separationSystemRef.current
const bossState = useBoss.getState()
separationSystem.applySeparation(enemyState.enemies, bossState, delta)

// ... shockwave, sniper, teleporter behaviors
```

**CRITICAL:** Separation must run AFTER `enemyState.tick()` (which updates positions) but BEFORE collision detection (Section 6). This ensures enemies are separated before damage/death checks.

**Execution order in GameLoop:**
1. Section 4: Weapon firing (creates projectiles)
2. Section 5a: Enemy movement (useEnemies.tick)
3. Section 5b: **Enemy separation (NEW)** ← separationSystem.applySeparation()
4. Section 5c: Boss movement, shockwave, sniper, teleporter behaviors
5. Section 6: Collision detection (populate spatial hash → resolve collisions)
6. Section 7: Damage/death/XP
7. Section 8: Cleanup dead entities

### Separation System Implementation

**File: `src/systems/separationSystem.js`** (NEW)

```javascript
import { GAME_CONFIG } from '../config/gameConfig.js'
import { createSpatialHash } from './spatialHash.js'

export function createSeparationSystem() {
  // Create dedicated spatial hash for separation (independent from collision hash)
  const spatialHash = createSpatialHash(GAME_CONFIG.SPATIAL_HASH_CELL_SIZE)

  function applySeparation(enemies, bossState, delta) {
    if (enemies.length === 0) return

    // 1. Rebuild spatial hash with current enemy positions
    spatialHash.clear()
    for (const enemy of enemies) {
      spatialHash.insert({
        id: enemy.id,
        x: enemy.x,
        z: enemy.z,
        radius: GAME_CONFIG.ENEMY_SEPARATION_RADIUS,
      })
    }

    // 2. Apply enemy-enemy separation
    const processed = new Set() // Avoid processing same pair twice

    for (const enemyA of enemies) {
      const neighbors = spatialHash.queryNearby(
        enemyA.x,
        enemyA.z,
        GAME_CONFIG.ENEMY_SEPARATION_RADIUS
      )

      for (const neighbor of neighbors) {
        if (neighbor.id === enemyA.id) continue // Skip self
        if (processed.has(`${enemyA.id}-${neighbor.id}`) || processed.has(`${neighbor.id}-${enemyA.id}`)) continue

        const enemyB = enemies.find(e => e.id === neighbor.id)
        if (!enemyB) continue

        // Compute separation force
        const dx = enemyA.x - enemyB.x
        const dz = enemyA.z - enemyB.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance < GAME_CONFIG.ENEMY_SEPARATION_RADIUS && distance > 0.001) {
          const overlap = GAME_CONFIG.ENEMY_SEPARATION_RADIUS - distance
          const forceMagnitude = overlap * GAME_CONFIG.SEPARATION_FORCE_STRENGTH * delta
          const displacement = Math.min(forceMagnitude, GAME_CONFIG.MAX_SEPARATION_DISPLACEMENT)

          // Normalize direction
          const nx = dx / distance
          const nz = dz / distance

          // Apply half force to each enemy
          enemyA.x += nx * displacement * 0.5
          enemyA.z += nz * displacement * 0.5
          enemyB.x -= nx * displacement * 0.5
          enemyB.z -= nz * displacement * 0.5
        }

        processed.add(`${enemyA.id}-${enemyB.id}`)
      }
    }

    // 3. Apply boss separation (boss pushes enemies, not vice versa)
    if (bossState && bossState.hp > 0) {
      for (const enemy of enemies) {
        const dx = enemy.x - bossState.x
        const dz = enemy.z - bossState.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance < GAME_CONFIG.BOSS_SEPARATION_RADIUS && distance > 0.001) {
          const overlap = GAME_CONFIG.BOSS_SEPARATION_RADIUS - distance
          const forceMagnitude = overlap * GAME_CONFIG.SEPARATION_FORCE_STRENGTH * delta
          const displacement = Math.min(forceMagnitude, GAME_CONFIG.MAX_SEPARATION_DISPLACEMENT)

          const nx = dx / distance
          const nz = dz / distance

          // Push enemy away from boss (boss doesn't move)
          enemy.x += nx * displacement
          enemy.z += nz * displacement
        }
      }
    }
  }

  return { applySeparation }
}
```

**Performance analysis:**
- Spatial hash rebuild: O(n) where n = enemy count
- Neighbor queries: O(k) per enemy where k = average neighbors (3-5 in dense areas, 0-1 in sparse)
- Total: O(n * k) ≈ O(n) average, O(n^2) worst case (all enemies in same cell)
- With 200 enemies, average 4 neighbors each = 800 pair checks per frame (manageable)
- Target: <2ms for separation computation at 200 enemies

### Tuning Constants

**Recommended starting values:**

```javascript
// gameConfig.js
ENEMY_SEPARATION_RADIUS: 3.0,       // Minimum distance between enemy centers
SEPARATION_FORCE_STRENGTH: 50.0,    // Force multiplier (units/sec^2)
MAX_SEPARATION_DISPLACEMENT: 5.0,   // Max displacement per frame (prevents jitter)
BOSS_SEPARATION_RADIUS: 8.0,        // Boss pushes enemies away at larger radius
```

**Tuning guide:**
- **ENEMY_SEPARATION_RADIUS**: Should be ~2x average enemy radius (1.5-2.0) to ensure visual separation. Too small = enemies still overlap, too large = enemies spread too far.
- **SEPARATION_FORCE_STRENGTH**: Higher = faster separation, lower = slower/softer push. Balance against MAX_SEPARATION_DISPLACEMENT.
- **MAX_SEPARATION_DISPLACEMENT**: Prevents jitter and launch. Should be <= enemy speed * delta (at 60 FPS, delta ≈ 0.016, enemy speed ~15-20, so 5.0 is safe).
- **BOSS_SEPARATION_RADIUS**: Boss visual radius is ~4-5 units (meshScale [8,8,8] with base radius 0.5), so 8.0 gives breathing room.

**Playtesting goals:**
- Dense enemy groups form visible walls (not blobs)
- Player cannot walk through 5+ enemies without taking damage or dashing
- Enemies don't jitter or bounce when converging on player
- Boss remains visually distinct amidst waves (not buried in enemies)

### Interaction with Enemy Behaviors

**Sweep enemies:**
- Sweep enemies move in a fixed direction (`sweepDirection`)
- Separation force may deflect them slightly, but sweep direction should dominate
- If separation pushes sweep enemy too far off course, consider reducing SEPARATION_FORCE_STRENGTH or exempting sweep from separation

**Sniper fixed:**
- Sniper fixed enemies don't move (speed = 0)
- Separation will push nearby enemies away from stationary snipers
- Snipers themselves won't be pushed (since their position is set by spawn)

**Teleporter:**
- Teleporter enemies blink to new positions (teleportTimer)
- Separation applies normally between teleports
- Teleport destination should check for overlap and adjust if needed (separate fix, not this story)

**Shockwave:**
- Shockwave enemies emit periodic AoE damage
- Separation applies normally (shockwave doesn't affect separation)

**Chase (default):**
- Most enemies use chase behavior (move toward player)
- Separation will cause enemies to form semicircle/wall around player instead of stacking
- This is the PRIMARY use case for separation physics

### Testing Standards

Follow the project's Vitest testing standards. All tests must reset system state between test cases.

**Separation system tests:**
- Test separationSystem: two enemies closer than ENEMY_SEPARATION_RADIUS are pushed apart
- Test separationSystem: separation force increases with overlap (closer = stronger push)
- Test separationSystem: separation displacement is clamped to MAX_SEPARATION_DISPLACEMENT
- Test separationSystem: force is applied symmetrically (both enemies move equal distance)
- Test separationSystem: spatial hash queries only nearby enemies (mock spatialHash.queryNearby)
- Test separationSystem: boss pushes away nearby enemies (one-way force)
- Test separationSystem: boss separation uses BOSS_SEPARATION_RADIUS (larger than enemy radius)
- Test separationSystem: no separation when enemies are far apart (distance > radius)

**Integration tests:**
- Test GameLoop: separationSystem called after enemy movement in Section 5
- Test GameLoop: separation runs before collision detection
- Test end-to-end: 10 enemies converge on player → form semicircle instead of blob (visual test)
- Test performance: 200 enemies maintain 60 FPS with separation enabled (benchmark)

**Edge cases:**
- Test separationSystem: handles zero enemies gracefully
- Test separationSystem: handles single enemy (no neighbors)
- Test separationSystem: handles identical positions (distance = 0, avoid division by zero)

### Performance Considerations

**Spatial hash efficiency:**
- Cell size = 2 world units (SPATIAL_HASH_CELL_SIZE)
- Separation radius = 3 world units (ENEMY_SEPARATION_RADIUS)
- Query radius 3.0 covers ~2-4 cells (1.5 cells radius)
- Average 5-10 entities per cell in dense areas
- Deduplication via Set prevents double-counting

**Optimization strategies:**
- Spatial hash is rebuilt once per frame (O(n))
- Pair processing Set prevents duplicate pair checks (O(1) lookup)
- Direct position mutation (no array copies, no React re-renders)
- Force calculation uses Math.sqrt only once per pair (not twice)
- Clamping displacement avoids unstable oscillations

**Performance budget:**
- Target: <2ms for separation with 200 enemies
- Spatial hash rebuild: ~0.3ms (200 enemies × 1.5µs)
- Pair checks: ~1.5ms (800 pairs × 2µs per pair)
- Boss separation: ~0.2ms (200 enemies × 1µs)
- Total: ~2ms (well within 16.67ms frame budget)

**Fallback if performance issues:**
- Reduce MAX_ENEMIES_ON_SCREEN from 100 to 80
- Reduce ENEMY_SEPARATION_RADIUS from 3.0 to 2.5 (fewer neighbor checks)
- Skip separation every other frame (halves cost, still effective)

### Previous Story Learnings

**From Story 23.1 (Dynamic Wave System):**
- spawnSystem.js refactored to use wave phases (not time-gated schedule)
- Wave profiles define spawn rate multipliers and enemy tier weights
- System 2/3 have harder wave profiles (more enemies, higher tiers)
- Curse stat from permanent upgrades (Story 20.5) multiplies spawn rates

**From Story 2.1 (Spatial Hashing & Collision System):**
- `spatialHash.js` provides efficient broad-phase collision (O(n) average)
- Cell size = 2 world units (matches entity sizes)
- Used for player-enemy, projectile-enemy, orb-player collision
- Query deduplicates results via Set

**From Story 3.5 (HP System & Death):**
- Player-enemy collision deals damage + knockback
- Dash provides temporary invincibility (no collision during dash)
- Enemy contact damage varies by enemy type (5-20 HP)

**From Story 16.2 (Enemy Behavior System):**
- Chase behavior: move toward player (most common)
- Sweep behavior: move in fixed direction (line formation)
- Sniper behaviors: maintain range, fire projectiles
- Teleporter: blink to new positions periodically

**From Story 18.3 (Enemy Difficulty Scaling):**
- System 2/3 enemies have higher HP/damage via scaling multiplier
- Scaling applied at spawn time (instruction.scaling)
- Wave system (Story 23.1) and difficulty scaling are separate systems

### Project Structure Notes

**New files:**
- `src/systems/separationSystem.js` — Separation force computation + spatial hash
- `src/systems/__tests__/separationSystem.test.js` — Separation system tests

**Modified files:**
- `src/GameLoop.jsx` — Call separationSystem.applySeparation() in Section 5
- `src/config/gameConfig.js` — Add separation constants

**Files to check:**
- `src/systems/spatialHash.js` — Existing spatial hash API (Story 2.1)
- `src/stores/useEnemies.jsx` — Enemy state structure (enemies array)
- `src/stores/useBoss.jsx` — Boss state (x, z, hp)
- `src/entities/enemyDefs.js` — Enemy definitions (radius per type)

**NOT in this story:**
- Player-enemy collision (already exists from Story 3.5)
- Projectile-enemy collision (already exists from Story 2.1)
- Dynamic wave spawning (Story 23.1 — already implemented)
- Cumulative timer (Story 23.3 — future story)

### References

- [Source: _bmad-output/planning-artifacts/epic-23-wave-enemy-systems.md] — Epic context, Story 23.2 requirements, technical notes
- [Source: src/systems/spatialHash.js] — Existing spatial hashing system (Story 2.1)
- [Source: src/stores/useEnemies.jsx] — Enemy state structure and behaviors
- [Source: src/GameLoop.jsx] — Game loop orchestration and enemy movement section
- [Source: src/entities/enemyDefs.js] — Enemy definitions with radius per type
- [Source: src/config/gameConfig.js] — Game constants and configuration
- [Source: _bmad-output/implementation-artifacts/23-1-dynamic-wave-system.md] — Previous story (wave system)
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, systems layer patterns
- [Source: _bmad-output/implementation-artifacts/2-1-spatial-hashing-collision-system.md] — Spatial hashing foundation (Story 2.1)
- [Source: _bmad-output/implementation-artifacts/3-5-hp-system-death.md] — Player-enemy collision damage (Story 3.5)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented `applySeparation(enemies, boss, delta)` — boss parameter is the boss object directly (not the full store state), null-safe.
- Fixed FM-1 from code review: built an `id→enemy` Map before inner loops to avoid O(n) `Array.find()` per pair (O(1) lookup instead).
- Fixed FM-3 from code review: `sniper_fixed` enemies are exempted from receiving push forces (they are stationary by design), but they can still push mobile neighbors.
- Canonical pair key (`min|max`) prevents double-processing the same pair regardless of iteration order.
- 19/19 tests pass. Two test assertions were corrected during red-green cycle (direction of push was correct in code, assertions were written backwards).

### File List

- `src/config/gameConfig.js` — Added ENEMY_SEPARATION_RADIUS, SEPARATION_FORCE_STRENGTH, MAX_SEPARATION_DISPLACEMENT, BOSS_SEPARATION_RADIUS
- `src/systems/separationSystem.js` — NEW: Separation force system with spatial hashing and boss separation
- `src/systems/__tests__/separationSystem.test.js` — NEW: 19 tests covering separation physics, boss separation, edge cases
- `src/GameLoop.jsx` — Added separationSystemRef + applySeparation call in Section 5b (after enemy tick, before collision)
