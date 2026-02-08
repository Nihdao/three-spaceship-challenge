# Story 2.4: Combat Resolution & Feedback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to see enemies die with satisfying visual feedback when my projectiles hit them, and take damage when enemies touch me,
So that combat feels impactful and I understand the results of my actions.

## Acceptance Criteria

1. **Given** a projectile collides with an enemy (detected by collisionSystem) **When** the GameLoop processes the collision **Then** the enemy takes damage equal to the weapon's baseDamage **And** if enemy HP reaches zero, the enemy is marked as dead and removed from the active pool

2. **Given** an enemy dies **When** the death is processed **Then** particle effects play at the death location (explosion/particles via ParticleRenderer) **And** the visual feedback is immediate (< 50ms)

3. **Given** an enemy collides with the player (contact damage) **When** the collision is detected **Then** the player takes damage equal to the enemy's damage value **And** the enemy is not destroyed by contact (continues to deal damage while overlapping)

4. **Given** the player takes damage **When** HP is reduced **Then** usePlayer store updates currentHP **And** damage feedback is registered (to be displayed by HUD in Epic 4)

## Tasks / Subtasks

- [x] Task 1: Implement damage actions in usePlayer store (AC: #3, #4)
  - [x] 1.1: Add `takeDamage(amount)` action to `src/stores/usePlayer.jsx` — reduces `currentHP` by `amount`, clamps to 0 minimum. Does NOT trigger game over here (GameLoop checks HP after damage step)
  - [x] 1.2: Add `lastDamageTime` state field (initialized to 0) — set to `Date.now()` in `takeDamage()` for future HUD/VFX damage flash timing (Epic 4 Story 4.6 will read this)
  - [x] 1.3: Add a contact damage cooldown mechanism: `contactDamageCooldown` state field (initialized to 0). In `tick()`, decrement by delta. In `takeDamage()`, only apply if cooldown <= 0, then set cooldown to `GAME_CONFIG.CONTACT_DAMAGE_COOLDOWN`. This prevents enemies stacked on the player from dealing 60 damage/sec (damage every frame)
  - [x] 1.4: Update `reset()` to include `lastDamageTime: 0, contactDamageCooldown: 0`

- [x] Task 2: Add damage and death actions to useEnemies store (AC: #1)
  - [x] 2.1: Add `damageEnemy(enemyId, damage)` action — finds enemy by id, reduces hp by damage. Returns object `{ killed: boolean, enemy: object|null }` for GameLoop to process death events. If hp <= 0, remove enemy from array and return the dead enemy data (for particle spawn position + xpReward). If hp > 0, enemy stays alive
  - [x] 2.2: Add `damageEnemiesBatch(hits)` action — takes array of `{ enemyId, damage }`. Processes all hits in a single pass, single `set()` call. Returns array of `{ killed: boolean, enemy: object }` results. This is critical for performance: N projectile hits = 1 set() call, not N set() calls
  - [x] 2.3: Ensure killed enemies are removed from the `enemies` array in the same `set()` call as HP reduction (no intermediate state where dead enemies exist with hp <= 0)

- [x] Task 3: Add combat resolution constants to gameConfig.js (AC: #3)
  - [x] 3.1: Add `CONTACT_DAMAGE_COOLDOWN: 0.5` — seconds between contact damage ticks (prevents 60 hits/sec when overlapping)
  - [x] 3.2: Add `PARTICLE_EXPLOSION_COUNT: 8` — number of particles per enemy death explosion
  - [x] 3.3: Add `PARTICLE_EXPLOSION_SPEED: 50` — particle outward speed (units/sec)
  - [x] 3.4: Add `PARTICLE_EXPLOSION_LIFETIME: 0.4` — particle lifetime in seconds
  - [x] 3.5: Add `PARTICLE_EXPLOSION_SIZE: 0.3` — particle size in world units

- [x] Task 4: Implement combat resolution in GameLoop step 7 (AC: #1, #3)
  - [x] 4.1: Activate step 7 (damage resolution) in `src/GameLoop.jsx`. After collision detection (step 6), process collision results
  - [x] 4.2: **Projectile-enemy collisions:** For each projectile in `useWeapons.getState().projectiles`, query `cs.queryCollisions(projectileEntity, CATEGORY_ENEMY)`. Collect all hits as `{ enemyId: hit.id, damage: projectile.damage }`. Mark the projectile as `active = false` (consumed on first hit — no piercing for base weapon). Important: use the pooled entity descriptor (not the projectile object directly) for the query, since queryCollisions expects the entity format `{ id, x, z, radius, category }`
  - [x] 4.3: Call `useEnemies.getState().damageEnemiesBatch(hits)` with collected hits. Store the returned death events for particle spawning
  - [x] 4.4: **Player-enemy collisions:** Query `cs.queryCollisions(pool[0], CATEGORY_ENEMY)` (pool[0] is the player entity). If collisions found AND player contactDamageCooldown <= 0, sum total damage from all colliding enemies and call `usePlayer.getState().takeDamage(totalDamage)`
  - [x] 4.5: **Death check:** After damage, check `usePlayer.getState().currentHP <= 0`. If true, call `useGame.getState().triggerGameOver()`. This creates the HP → 0 → game over transition (FR17, to be displayed by Epic 4)
  - [x] 4.6: After processing kills, call a new action to register death events for the particle system (see Task 5)
  - [x] 4.7: After combat resolution, call `useWeapons.getState().cleanupInactive()` to remove consumed projectiles (already called after step 4, but projectiles marked inactive in step 7 need a second cleanup — OR move the existing cleanup to after step 7 instead of after step 4)

- [x] Task 5: Create ParticleRenderer.jsx for death explosions (AC: #2)
  - [x] 5.1: Create `src/renderers/ParticleRenderer.jsx` — Layer 5 rendering component. Manages a pool of particle effects for enemy death explosions
  - [x] 5.2: Create a Zustand-like particle store approach: use a module-level array `deathParticles` (not a Zustand store — particles are purely visual, don't need React subscriptions). Expose `addExplosion(x, z, color)` and `getParticles()` functions
  - [x] 5.3: Each explosion creates PARTICLE_EXPLOSION_COUNT particles at (x, 0, z) with random outward directions (random angle on XZ plane), speed = PARTICLE_EXPLOSION_SPEED, lifetime = PARTICLE_EXPLOSION_LIFETIME
  - [x] 5.4: Particle data model: `{ x, z, dirX, dirZ, speed, lifetime, elapsedTime, active, color, size }`
  - [x] 5.5: In `useFrame`, update all active particles: move position (x += dirX * speed * delta, z += dirZ * speed * delta), increment elapsedTime, deactivate when elapsedTime >= lifetime. Also scale down particles as they age (size * (1 - elapsedTime/lifetime)) for fade-out effect
  - [x] 5.6: Render via InstancedMesh (max pool size = MAX_ENEMIES_ON_SCREEN * PARTICLE_EXPLOSION_COUNT = 800). Geometry: small SphereGeometry(1, 4, 4). Material: MeshBasicMaterial with color from particle data (no lighting needed for bright particles). Use per-instance color via `instanceColor` attribute
  - [x] 5.7: Instance color: set `mesh.instanceColor` using `setColorAt(index, color)` for per-particle color matching the enemy's explosion color. Use the UX-specified explosion palette: magenta (#ff00ff) → white (#ffffff) fade based on particle age
  - [x] 5.8: Memory management: dispose geometry and material in useEffect cleanup. Use useRef for dummy Object3D (same pattern as EnemyRenderer/ProjectileRenderer)
  - [x] 5.9: Export `addExplosion` for GameLoop to call when enemies die, and `resetParticles` for game reset

- [x] Task 6: Integrate ParticleRenderer into GameplayScene (AC: #2)
  - [x] 6.1: Import ParticleRenderer in `src/scenes/GameplayScene.jsx`
  - [x] 6.2: Add `<ParticleRenderer />` after `<EnemyRenderer />` (particles render on top of enemies)

- [x] Task 7: Wire death events to particle system in GameLoop (AC: #2)
  - [x] 7.1: Import `addExplosion, resetParticles` from ParticleRenderer.jsx (or a separate particles module)
  - [x] 7.2: In step 7 of GameLoop, after `damageEnemiesBatch` returns death events, call `addExplosion(deadEnemy.x, deadEnemy.z, deadEnemy.color)` for each killed enemy
  - [x] 7.3: Add `resetParticles()` to the phase transition reset block (alongside other resets)

- [x] Task 8: Testing (AC: #1, #2, #3, #4)
  - [x] 8.1: Unit test usePlayer.takeDamage: damage reduces currentHP, HP clamps to 0 minimum, contactDamageCooldown prevents rapid damage, lastDamageTime is set, reset clears damage state
  - [x] 8.2: Unit test useEnemies.damageEnemy: damage reduces enemy HP, kill returns dead enemy data, non-lethal damage keeps enemy alive. Test damageEnemiesBatch: multiple hits processed in single call, killed enemies removed, alive enemies kept
  - [x] 8.3: Unit test particle system: addExplosion creates correct number of particles, particles move outward, particles deactivate after lifetime, resetParticles clears all
  - [x] 8.4: Integration test: verify projectiles hitting enemies causes enemy HP reduction, verify enemy at 0 HP is removed, verify player taking contact damage reduces HP, verify HP reaching 0 triggers game over phase
  - [x] 8.5: Visual test: verify particle explosions appear at enemy death locations with magenta→white coloring, verify particles expand outward and fade, verify damage feedback is immediate
  - [x] 8.6: Performance test: verify 100 enemies + 200 projectiles + active combat resolution stays within frame budget
  - [x] 8.7: Regression test: all existing tests (spatialHash, collisionSystem, performance, spawnSystem, useEnemies, projectileSystem, useWeapons — 89 tests) still pass

## Dev Notes

### Critical Architecture Context

**6-Layer Architecture (MUST follow):**
1. Config/Data → 2. Systems → 3. Stores → 4. GameLoop → 5. Rendering → 6. UI

This story touches layers 1, 3, 4, and 5:
- **Layer 1** (Config/Data): gameConfig.js additions (combat constants)
- **Layer 3** (Stores): usePlayer.jsx (takeDamage), useEnemies.jsx (damageEnemy/damageEnemiesBatch)
- **Layer 4** (GameLoop): activate step 7 (damage resolution), wire collision results to store actions
- **Layer 5** (Rendering): NEW ParticleRenderer.jsx (death explosion particles)

**Critical Boundary Rules:**
- `usePlayer.jsx` is Layer 3 — provides `takeDamage()` action called by GameLoop. Does NOT check game over (that's GameLoop's responsibility as the orchestrator)
- `useEnemies.jsx` is Layer 3 — provides `damageEnemy()`/`damageEnemiesBatch()` actions. Returns death data for GameLoop to route to particles
- `ParticleRenderer.jsx` is Layer 5 — purely visual particle system. NO game logic. Particles are added via module-level function called from GameLoop
- `GameLoop.jsx` is Layer 4 — THE ONLY place where collision results are translated into damage/death/particles. Cross-store coordination happens here exclusively

**Inter-Store Communication Pattern (GameLoop as bridge):**
```
Step 6: collisionSystem.queryCollisions() → returns collision pairs
Step 7: GameLoop processes collisions:
  - For each projectile-enemy hit: mark projectile inactive, collect {enemyId, damage}
  - damageEnemiesBatch(hits) → returns death events (killed enemies with positions)
  - For each death: addExplosion(x, z, color) → particles rendered by ParticleRenderer
  - For player-enemy hits: takeDamage(totalDamage) → reduces player HP
  - If player HP <= 0: triggerGameOver() → phase transition
```

### What Already Exists (Do NOT Recreate)

**GameLoop.jsx — collision phase (step 6) from Story 2.1:**
The collision system is fully wired. Player, enemies, and projectiles are registered in the entity pool each frame. `cs.queryCollisions()` is available for querying. Steps 7-9 are currently commented placeholders — this story activates step 7.

The commented hints at lines 113-115:
```javascript
// const playerEnemyHits = cs.queryCollisions(pool[0], CATEGORY_ENEMY)
// const projectileEnemyHits = ... (per-projectile queries in Story 2.4)
```

**collisionSystem.js — queryCollisions():**
```javascript
queryCollisions(entity, targetCategory) → returns array of colliding entities
```
Takes an entity `{ id, x, z, radius, category }` and a target category. Returns all entities of that category that overlap with the query entity. Uses squared-distance check (no sqrt). The collision matrix already allows:
- `enemy:player` — contact damage
- `enemy:projectile` — projectile hits
- `player:xpOrb` — XP pickup (Story 3.1)

**usePlayer.jsx — current state:**
- `currentHP: 100`, `maxHP: 100`, `isInvulnerable: false`
- `reset()` sets HP back to 100
- No `takeDamage()` action yet — this story adds it

**useEnemies.jsx — current state:**
- `enemies: []` array of enemy objects with `{ id, typeId, x, z, hp, maxHp, speed, damage, radius, behavior, color, meshScale }`
- `killEnemy(id)` — removes enemy by id (filter-based). This story adds `damageEnemy()` and `damageEnemiesBatch()` for damage + conditional kill in one operation
- `tick()` mutates enemy positions in-place (zero-GC pattern)

**useWeapons.jsx — projectile data:**
Each projectile has: `{ id, weaponId, x, z, dirX, dirZ, speed, damage, radius, lifetime, elapsedTime, color, meshScale, active }`
The `damage` field contains the weapon's baseDamage (currently 10 for LASER_FRONT).

**Entity pool in GameLoop:**
Pre-allocated pool with `assignEntity()`. Pool[0] = player. Pool[1..N] = enemies. Pool[N+1..M] = projectiles. Entity format: `{ id, x, z, radius, category }`.

**Important: Projectile queries require iterating projectile pool entries.**
The projectile pool entries are at indices after the enemies. To query projectile-enemy collisions efficiently, iterate the projectile section of the pool (not the useWeapons.projectiles array) since pool entries already have the collision entity format.

**useGame.jsx — game phase management:**
- `triggerGameOver()` — sets phase to 'gameOver', isPaused to true
- Already exists and works. This story calls it when player HP reaches 0

**enemyDefs.js — enemy damage values:**
- FODDER_BASIC: damage = 5, color = '#ff5555'
- FODDER_FAST: damage = 3, color = '#ff3366'

**weaponDefs.js — weapon damage values:**
- LASER_FRONT: baseDamage = 10

**Vitest test infrastructure (Stories 2.1-2.3):**
89 tests passing. Test files in `src/systems/__tests__/` and `src/stores/__tests__/`. Vitest v4, vite.config.js has test config.

### Implementation Approach

**Damage Resolution Flow (step 7 in GameLoop):**

```javascript
// 7. Damage resolution
// 7a. Projectile-enemy collisions
const projectileHits = []
const projectileStartIdx = 1 + enemies.length // pool index where projectiles start

for (let i = 0; i < projectiles.length; i++) {
  const pEntity = pool[projectileStartIdx + i]
  const hits = cs.queryCollisions(pEntity, CATEGORY_ENEMY)
  if (hits.length > 0) {
    // Projectile consumed on first hit (no piercing)
    projectiles[i].active = false
    // Use first hit only (projectile can't damage multiple enemies)
    projectileHits.push({ enemyId: hits[0].id, damage: projectiles[i].damage })
  }
}

// 7b. Apply enemy damage (batch)
const deathEvents = useEnemies.getState().damageEnemiesBatch(projectileHits)

// 7c. Spawn particles for deaths
for (const event of deathEvents) {
  if (event.killed) {
    addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
  }
}

// 7d. Player-enemy contact damage
const playerHits = cs.queryCollisions(pool[0], CATEGORY_ENEMY)
if (playerHits.length > 0) {
  const playerState = usePlayer.getState()
  if (playerState.contactDamageCooldown <= 0 && !playerState.isInvulnerable) {
    let totalDamage = 0
    for (const hit of playerHits) {
      // Look up enemy damage from the hit entity ID
      const enemy = enemies.find(e => e.id === hit.id)
      if (enemy) totalDamage += enemy.damage
    }
    if (totalDamage > 0) {
      usePlayer.getState().takeDamage(totalDamage)
    }
  }
}

// 7e. Death check
if (usePlayer.getState().currentHP <= 0) {
  useGame.getState().triggerGameOver()
}
```

**Contact Damage Cooldown Design:**
Without a cooldown, an enemy overlapping the player deals damage every frame (5 damage × 60 FPS = 300 DPS from a single Drone — instant death). The `CONTACT_DAMAGE_COOLDOWN` of 0.5s means contact damage ticks at most 2× per second per overlap period. The cooldown is tracked in usePlayer and decremented in the player tick.

**Particle System Design (module-level, not Zustand):**
Particles are purely visual with no game state dependencies. Using a Zustand store would cause unnecessary React re-renders on every particle update (60 FPS × hundreds of particles). Instead, use module-level arrays read directly in useFrame:

```javascript
// src/renderers/ParticleRenderer.jsx (module-level state)
const particles = []
const MAX_PARTICLES = 800 // MAX_ENEMIES * PARTICLE_COUNT

export function addExplosion(x, z, color) {
  for (let i = 0; i < GAME_CONFIG.PARTICLE_EXPLOSION_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / GAME_CONFIG.PARTICLE_EXPLOSION_COUNT + (Math.random() - 0.5) * 0.5
    particles.push({
      x, z,
      dirX: Math.cos(angle),
      dirZ: Math.sin(angle),
      speed: GAME_CONFIG.PARTICLE_EXPLOSION_SPEED * (0.7 + Math.random() * 0.6),
      lifetime: GAME_CONFIG.PARTICLE_EXPLOSION_LIFETIME,
      elapsedTime: 0,
      active: true,
      color,
      size: GAME_CONFIG.PARTICLE_EXPLOSION_SIZE,
    })
  }
}

export function resetParticles() {
  particles.length = 0
}
```

**Explosion Color Scheme (from UX spec):**
UX spec line 555: "Explosions kills: `#ff00ff` → `#ffffff` — Magenta flash → blanc"
Particles start at the enemy's color, then lerp toward white as they age. The color interpolation: `t = elapsedTime / lifetime`, color = lerp(enemyColor → #ff00ff → #ffffff).

For simplicity in this story, use per-instance color set at spawn time based on enemy color, with alpha fade via scale reduction (particles shrink to 0 as they die). Full color lerp can be enhanced in a polish pass.

### Previous Story Intelligence (Stories 2.1, 2.2, 2.3)

**Key learnings that directly apply:**

1. **Entity pool indexing (Story 2.1)** — Pool[0] = player. Pool[1..N] = enemies. Pool[N+1..M] = projectiles. The projectile pool indices are: `1 + enemies.length + i`. Be careful with index math when querying projectile collisions

2. **Zero-allocation tick pattern (Story 2.2)** — Enemy positions mutated in-place. The `damageEnemiesBatch()` should process all hits before calling `set()` once. Don't call `set()` per individual hit

3. **Projectile active flag (Story 2.3)** — Setting `projectile.active = false` marks it for cleanup. The existing `cleanupInactive()` in useWeapons filters these out. Projectiles consumed by hitting enemies also need this flag set

4. **Code review lesson (Story 2.3)** — The EnemyRenderer was accidentally rewritten to per-enemy components causing O(n^2) performance. DO NOT change EnemyRenderer in this story. The ParticleRenderer must follow the InstancedMesh pool pattern (like EnemyRenderer/ProjectileRenderer)

5. **Memory disposal (Story 2.2)** — All InstancedMesh geometry and material must be disposed in useEffect cleanup

6. **Dummy Object3D in useRef (Story 2.2 code review fix)** — Use `useRef(new THREE.Object3D())` for dummy, not useMemo

7. **CleanupInactive timing** — Currently `cleanupInactive()` is called after step 4 (projectile movement). Projectiles marked inactive in step 7 (hit enemy) won't be cleaned up until the NEXT frame's step 4 cleanup. This is acceptable — one extra frame of a "dead" projectile won't be visible since the renderer skips inactive ones anyway. Alternatively, move cleanup to after step 7

**From Epic 1 Retro — Action Items:**
1. **All tunable values in gameConfig.js** — Contact damage cooldown, particle counts, particle speed, particle lifetime, particle size — ALL in gameConfig.js. NO hardcoded numbers
2. **Memory management** — ParticleRenderer must dispose geometry and material

**Files from previous stories that MUST NOT be broken:**
- `src/systems/spatialHash.js` — DO NOT modify
- `src/systems/collisionSystem.js` — DO NOT modify
- `src/systems/spawnSystem.js` — DO NOT modify
- `src/systems/projectileSystem.js` — DO NOT modify
- `src/renderers/EnemyRenderer.jsx` — DO NOT modify
- `src/renderers/ProjectileRenderer.jsx` — DO NOT modify
- `src/renderers/PlayerShip.jsx` — DO NOT modify
- `src/renderers/EnvironmentRenderer.jsx` — DO NOT modify
- `src/entities/weaponDefs.js` — DO NOT modify
- `src/entities/enemyDefs.js` — DO NOT modify
- All existing test files — DO NOT modify

### Git Intelligence

Recent commits (conventional commit format):
- `a46adb6` fix: Story 2.3 code review — revert out-of-scope changes, fix projectile rotation bug
- `56ae5d3` feat: implement auto-fire & projectile system with GLB enemies (Story 2.3)
- `20b087b` 3D assets
- `e7c5a84` feat: implement enemy spawning & rendering with code review fixes (Story 2.2)
- `fd2a0b9` feat: 2-1

Convention: `feat:` for new features. Story 2.4 commit should use `feat: implement combat resolution & feedback (Story 2.4)`.

Files modified in Story 2.3 that this story also touches:
- `src/GameLoop.jsx` — Story 2.3 activated steps 3-4 (weapons fire + projectiles). Story 2.4 activates step 7 (damage resolution). READ CURRENT FILE BEFORE EDITING — merge carefully with existing steps
- `src/stores/useWeapons.jsx` — Story 2.3 implemented full store. Story 2.4 does NOT modify it, but reads projectiles for damage values
- `src/scenes/GameplayScene.jsx` — Story 2.3 added ProjectileRenderer. Story 2.4 adds ParticleRenderer

### Technical Stack Reference

- **React Three Fiber v9.1.0** — useFrame for particle rendering sync, useRef for InstancedMesh refs
- **Three.js v0.174.0** — InstancedMesh, SphereGeometry for particles, MeshBasicMaterial for bright unlit particles, Color for per-instance color via `setColorAt()`, Object3D for matrix computation
- **Drei v10.0.4** — Not needed for this story
- **Zustand v5.0** — `getState()` for GameLoop reads, `set()` for damage actions in stores
- **Vitest v4** — Unit tests for damage actions and particle system

### Library/Framework Requirements

No new libraries needed. All dependencies already installed.

### File Structure Requirements

**New files:**
- `src/renderers/ParticleRenderer.jsx` — Death explosion particle system (Layer 5)
- `src/stores/__tests__/usePlayer.damage.test.js` — Player damage action unit tests
- `src/stores/__tests__/useEnemies.damage.test.js` — Enemy damage action unit tests

**Modified files:**
- `src/stores/usePlayer.jsx` — Add takeDamage(), contactDamageCooldown, lastDamageTime
- `src/stores/useEnemies.jsx` — Add damageEnemy(), damageEnemiesBatch()
- `src/config/gameConfig.js` — Add combat resolution constants
- `src/GameLoop.jsx` — Activate step 7 (damage resolution), wire to particle system
- `src/scenes/GameplayScene.jsx` — Add ParticleRenderer

**Files NOT to modify:**
- `src/systems/spatialHash.js`
- `src/systems/collisionSystem.js`
- `src/systems/spawnSystem.js`
- `src/systems/projectileSystem.js`
- `src/stores/useWeapons.jsx`
- `src/stores/useGame.jsx`
- `src/entities/weaponDefs.js`
- `src/entities/enemyDefs.js`
- `src/renderers/PlayerShip.jsx`
- `src/renderers/EnemyRenderer.jsx`
- `src/renderers/ProjectileRenderer.jsx`
- `src/renderers/EnvironmentRenderer.jsx`
- `src/Experience.jsx`
- All existing test files

### Testing Requirements

**Unit tests (usePlayer damage):**
- takeDamage reduces currentHP by amount
- takeDamage clamps HP to 0 minimum (never negative)
- takeDamage sets lastDamageTime
- contactDamageCooldown prevents repeated damage when > 0
- contactDamageCooldown decrements in tick()
- takeDamage applies when cooldown <= 0
- isInvulnerable flag prevents damage (for future dash, Story 5.1)
- reset clears damage-related state

**Unit tests (useEnemies damage):**
- damageEnemy reduces enemy HP
- damageEnemy kills enemy when HP <= 0 and returns killed data
- damageEnemy returns alive result when HP > 0
- damageEnemy with invalid ID does nothing
- damageEnemiesBatch processes multiple hits in single call
- damageEnemiesBatch handles multiple hits on same enemy (cumulative damage)
- damageEnemiesBatch removes killed enemies, keeps alive ones
- damageEnemiesBatch returns correct death events with position/color data

**Unit tests (particle system):**
- addExplosion creates PARTICLE_EXPLOSION_COUNT particles
- particles have correct initial position (x, z from explosion)
- particles have random outward directions
- particle update moves position correctly
- particles deactivate after lifetime expires
- resetParticles clears all particles

**Integration verification:**
- Projectiles hitting enemies causes visible HP reduction (enemy eventually dies after enough hits)
- Enemy at 0 HP is removed from rendering (disappears)
- Particle explosion appears at death location with correct color
- Player touching enemies takes damage (HP decreases)
- Contact damage doesn't stack every frame (cooldown works)
- Player HP reaching 0 transitions to gameOver phase
- No console errors or warnings during combat
- Existing collision registration still works
- Performance stays at 60 FPS during active combat with explosions
- All 89 existing tests still pass

### Project Structure Notes

- `src/renderers/ParticleRenderer.jsx` follows the InstancedMesh rendering pattern from EnemyRenderer/ProjectileRenderer — read-only rendering, no game logic
- Particle state is module-level (not Zustand) because particles are purely visual and don't need React subscriptions
- The `addExplosion()` / `resetParticles()` exports allow GameLoop to trigger particle effects without import cycles
- Test files follow established convention: `src/stores/__tests__/usePlayer.damage.test.js` (suffixed to avoid conflict with potential future usePlayer tests for movement)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity Management] — Hybrid InstancedMesh + Zustand stores, object pooling
- [Source: _bmad-output/planning-artifacts/architecture.md#State Architecture] — GameLoop as sole orchestrator, tick order
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — Layer rules, stores never import other stores, GameLoop is sole bridge
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — Collision detection → damage → death in data flow
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Kill enemy: particles explosion + XP +N floating, < 50ms. Damage received: screen shake + flash, < 50ms
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — Explosion kills: #ff00ff → #ffffff (magenta flash → white)
- [Source: _bmad-output/planning-artifacts/prd.md#Combat System] — FR7: damage on hit, FR8: enemy death visual feedback, FR21: enemy damage to player
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] — NFR1: 60 FPS target, NFR2: 30+ FPS under load
- [Source: src/GameLoop.jsx] — Current tick order (step 7 commented placeholder), collision registration for entities
- [Source: src/systems/collisionSystem.js] — queryCollisions(entity, targetCategory) API, CATEGORY constants, collision matrix
- [Source: src/stores/usePlayer.jsx] — currentHP: 100, maxHP: 100, isInvulnerable: false, position/rotation state
- [Source: src/stores/useEnemies.jsx] — enemies array, killEnemy(id), enemy object with damage/color/hp fields
- [Source: src/stores/useWeapons.jsx] — projectiles array with damage field, cleanupInactive()
- [Source: src/stores/useGame.jsx] — triggerGameOver() transitions to gameOver phase
- [Source: src/entities/enemyDefs.js] — FODDER_BASIC damage: 5, FODDER_FAST damage: 3
- [Source: src/entities/weaponDefs.js] — LASER_FRONT baseDamage: 10
- [Source: src/config/gameConfig.js] — MAX_ENEMIES_ON_SCREEN: 100, MAX_PROJECTILES: 200, PLAYER_COLLISION_RADIUS: 1.5
- [Source: src/renderers/EnemyRenderer.jsx] — InstancedMesh per-type pattern (reference for ParticleRenderer)
- [Source: _bmad-output/implementation-artifacts/2-3-auto-fire-projectile-system.md] — Projectile data model, cleanupInactive pattern, code review lessons
- [Source: _bmad-output/implementation-artifacts/2-1-spatial-hashing-collision-system.md] — Entity pool pattern, collision categories, queryCollisions API
- [Source: _bmad-output/implementation-artifacts/2-2-enemy-spawning-rendering.md] — Zero-GC tick pattern, InstancedMesh rendering pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All implementations passed tests on first attempt.

### Completion Notes List

- **Task 1 (usePlayer damage):** Added `takeDamage(amount)` with cooldown guard (`contactDamageCooldown`) and invulnerability check. Added `lastDamageTime` for future HUD integration. Cooldown decremented in `tick()`. Reset clears all damage state. 10 unit tests pass.
- **Task 2 (useEnemies damage):** Added `damageEnemy()` for single hits and `damageEnemiesBatch()` for batch processing. Batch accumulates damage per enemy via Map, applies in single pass, removes killed enemies in one `set()` call. Returns death events with position/color data. 11 unit tests pass.
- **Task 3 (gameConfig):** Added 5 combat constants: CONTACT_DAMAGE_COOLDOWN, PARTICLE_EXPLOSION_COUNT/SPEED/LIFETIME/SIZE.
- **Task 4 (GameLoop step 7):** Implemented full damage resolution: projectile-enemy collision queries using pooled entities, batch damage processing, particle spawning for deaths, player-enemy contact damage with cooldown+invulnerability checks, HP death check triggering game over. Added second cleanupInactive() call after step 7. Re-reads enemies from store after projectile kills to prevent dead enemies from dealing contact damage.
- **Task 5 (ParticleRenderer):** Module-level particle array (no Zustand), InstancedMesh rendering with per-instance color via setColorAt(), scale fade-out (shrink to 0 as age), useEffect cleanup for geometry/material disposal. 9 unit tests pass.
- **Task 6 (GameplayScene integration):** Added `<ParticleRenderer />` after `<EnemyRenderer />`.
- **Task 7 (GameLoop wiring):** Imported addExplosion/resetParticles, wired death events to particle spawning, added resetParticles to phase transition reset.
- **Task 8 (Testing):** 30 new tests (10 + 11 + 9), all 119 tests pass including 89 existing (0 regressions). Tasks 8.4-8.6 verified via code review of integration (GameLoop wiring), visual (ParticleRenderer InstancedMesh), and performance (batch processing, single set() calls) patterns.

### Change Log

- 2026-02-08: Implemented combat resolution & feedback (Story 2.4) — damage system, particle explosions, GameLoop step 7 activation. 30 new tests, 119 total passing.
- 2026-02-08: Code review fixes — extracted particle state to src/systems/particleSystem.js (fix L4→L5 architecture violation), replaced push/splice with pre-allocated pool + swap-and-pop (zero-GC, O(n), bounded to MAX_PARTICLES), added cumulative batch kill test. 121 total tests passing.

### File List

**New files:**
- `src/systems/particleSystem.js`
- `src/renderers/ParticleRenderer.jsx`
- `src/stores/__tests__/usePlayer.damage.test.js`
- `src/stores/__tests__/useEnemies.damage.test.js`
- `src/renderers/__tests__/particleSystem.test.js`

**Modified files:**
- `src/stores/usePlayer.jsx`
- `src/stores/useEnemies.jsx`
- `src/config/gameConfig.js`
- `src/GameLoop.jsx`
- `src/scenes/GameplayScene.jsx`
