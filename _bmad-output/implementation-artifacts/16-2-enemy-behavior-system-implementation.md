# Story 16.2: Enemy Behavior System Implementation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want behavior patterns for sweep, shockwave, sniper_mobile, sniper_fixed, and teleport implemented in the enemy tick logic,
So that each enemy type has distinct AI and attack patterns.

## Acceptance Criteria

1. **Given** useEnemies.tick() is updated **When** enemies with behavior='sweep' are ticked **Then** they move in straight lines across the play area (not tracking player position) **And** they spawn in groups of 3-5 and move together in the same direction **And** they despawn after crossing the play area or after a timeout (10-15 seconds)

2. **Given** enemies with behavior='shockwave' **When** they are active **Then** they move slowly toward the player **And** every SHOCKWAVE_INTERVAL (3-4 seconds), they emit a radial shockwave **And** the shockwave is visualized as an expanding ring that deals damage to the player if overlapping

3. **Given** enemies with behavior='sniper_mobile' **When** they are ticked **Then** they maintain a distance from the player (stay at range ~30-40 units) **And** they fire red laser projectiles at the player every attackCooldown seconds **And** their projectiles are distinct from player projectiles (red color, slower speed)

4. **Given** enemies with behavior='sniper_fixed' **When** they spawn **Then** they spawn far from the player (outside visible area initially) **And** they appear as a red dot on the minimap **And** they do not move (speed=0) **And** they fire large telegraphed laser beams at the player with a 1-second charge-up animation **And** the beam is highly damaging but avoidable if the player moves during charge-up

5. **Given** enemies with behavior='teleport' **When** they are ticked **Then** they chase the player normally but teleport to a random nearby position every teleportCooldown seconds **And** teleportation is visualized with a particle burst at departure and arrival points **And** after teleporting, they fire a burst of 3 projectiles

6. **Given** behavior implementations **When** performance is tested with 50+ enemies on screen including complex behaviors **Then** the game maintains 60 FPS **And** behavior logic is efficient and does not cause frame drops

## Tasks / Subtasks

- [x] Task 1: Extend useEnemies.tick() with sweep behavior (AC: #1)
  - [x] 1.1: Add sweepDirection property to enemy instances spawned with behavior='sweep'
  - [x] 1.2: Implement linear movement logic (move along sweepDirection vector, ignore player position)
  - [x] 1.3: Add despawn timer (10-15 seconds from spawn time)
  - [x] 1.4: Despawn when crossing play area bounds or timeout expires
  - [x] 1.5: Update spawnSystem.js to spawn sweep enemies in groups of 3-5 with same direction

- [x] Task 2: Extend useEnemies store with shockwave behavior (AC: #2)
  - [x] 2.1: Add shockwaveTimer property to shockwave enemies (initialized to shockwaveInterval from def)
  - [x] 2.2: Implement slow chase logic (same as 'chase' but speed already defined as slow in defs)
  - [x] 2.3: Implement shockwave emission: decrement timer, when 0 → emit shockwave → reset timer
  - [x] 2.4: Add shockwave entity pool to useEnemies store (separate from enemies array)
  - [x] 2.5: Shockwave entities: { id, x, z, radius, maxRadius, lifetime, damage, active }
  - [x] 2.6: Tick shockwaves: expand radius from 0 to maxRadius over lifetime, then despawn
  - [x] 2.7: Collision check: shockwave vs player (in GameLoop collision section)

- [x] Task 3: Implement sniper_mobile behavior (AC: #3)
  - [x] 3.1: Add attackTimer property to sniper enemies (initialized to attackCooldown from def)
  - [x] 3.2: Implement distance-maintaining AI: if dist < minRange (30), move away; if dist > maxRange (40), move closer; else strafe
  - [x] 3.3: Decrement attackTimer each tick, when 0 → fire projectile → reset timer
  - [x] 3.4: Create enemy projectile pool in useEnemies store or separate useEnemyProjectiles store
  - [x] 3.5: Enemy projectile entity: { id, x, z, vx, vz, speed, damage, radius, color, lifetime, active }
  - [x] 3.6: Tick enemy projectiles: move, decrement lifetime, despawn when inactive or out of bounds
  - [x] 3.7: Collision check: enemy projectiles vs player (in GameLoop)
  - [x] 3.8: Render enemy projectiles (reuse ProjectileRenderer or create separate EnemyProjectileRenderer)

- [x] Task 4: Implement sniper_fixed behavior (AC: #4)
  - [x] 4.1: Add attackTimer and telegraphTimer properties to sniper_fixed enemies
  - [x] 4.2: Behavior state machine: IDLE → TELEGRAPH (1s charge-up) → FIRE → IDLE
  - [x] 4.3: During TELEGRAPH: visual indicator (scale pulse, emissive glow increase)
  - [x] 4.4: During FIRE: spawn high-damage, fast projectile toward player's position at charge start
  - [x] 4.5: Spawn sniper_fixed far from player (modify spawnSystem or add special spawn logic)
  - [x] 4.6: Minimap integration: add red dot rendering for sniper_fixed enemies (HUD minimap component)
  - [x] 4.7: Ensure speed=0 is respected (no movement tick for sniper_fixed)

- [x] Task 5: Implement teleport behavior (AC: #5)
  - [x] 5.1: Add teleportTimer property to teleport enemies (initialized to teleportCooldown from def)
  - [x] 5.2: Normal chase behavior until teleportTimer expires
  - [x] 5.3: On teleport trigger: calculate random position within teleportRange (30 units)
  - [x] 5.4: Validate teleport target (inside play area, not inside obstacles/planets)
  - [x] 5.5: Teleport enemy to new position, reset teleportTimer
  - [x] 5.6: Spawn particle burst at departure and arrival positions (use addExplosion or custom teleport particles)
  - [x] 5.7: Fire 3-projectile burst after teleporting (calculate spread angles)

- [x] Task 6: Add behavior-specific data to enemy instances (AC: all)
  - [x] 6.1: Extend spawnEnemy() and spawnEnemies() in useEnemies to initialize behavior-specific properties
  - [x] 6.2: sweep: sweepDirection (vec2), spawnTime, despawnTimer
  - [x] 6.3: shockwave: shockwaveTimer
  - [x] 6.4: sniper_mobile/sniper_fixed: attackTimer, telegraphTimer (fixed only), state (fixed only)
  - [x] 6.5: teleport: teleportTimer
  - [x] 6.6: Extract behavior-specific constants from enemyDefs.js (shockwaveInterval, attackCooldown, etc.)

- [x] Task 7: Update GameLoop collision checks for new attack patterns (AC: #2, #3, #4, #5)
  - [x] 7.1: Add shockwave vs player collision registration in GameLoop
  - [x] 7.2: Add enemy projectile vs player collision registration
  - [x] 7.3: Apply damage with invulnerability check (same pattern as existing contact damage)
  - [x] 7.4: Play SFX for damage events (enemy-hit, player-damage)
  - [x] 7.5: Add particle effects for shockwave activation and teleport events

- [x] Task 8: Performance optimization for complex behaviors (AC: #6)
  - [x] 8.1: Ensure shockwave entities are object-pooled (reuse array slots, avoid GC pressure)
  - [x] 8.2: Ensure enemy projectiles are object-pooled (same as player projectiles pattern)
  - [x] 8.3: Spatial hash only needs to register active entities (skip inactive shockwaves/projectiles)
  - [x] 8.4: Profile with r3f-perf: test 50+ mixed enemies including shockwave, sniper, teleport
  - [x] 8.5: Optimize tick logic: minimize Math.sqrt calls, use squared distance where possible

- [x] Task 9: Visual feedback for new behaviors (AC: #2, #4, #5)
  - [x] 9.1: Shockwave ring rendering: use Circle geometry with animated scale and opacity shader
  - [x] 9.2: Sniper_fixed telegraph visual: emissive pulse or scaling effect on EnemyRenderer instance
  - [x] 9.3: Teleport particle burst: use ParticleRenderer or addExplosion with custom color/scale
  - [x] 9.4: Enemy projectile rendering: red color, distinct from player projectiles (see AC #3)
  - [x] 9.5: Minimap red dots for sniper_fixed (HUD minimap component update)

- [x] Task 10: Update existing spawnSystem integration (AC: #1)
  - [x] 10.1: Modify spawnSystem.tick() or GameLoop to handle group spawning for sweep enemies
  - [x] 10.2: Calculate shared sweepDirection for group (random angle)
  - [x] 10.3: Spawn 3-5 sweep enemies with same direction and staggered positions (line formation)
  - [x] 10.4: Ensure sweep enemies don't use normal weighted spawn (Story 16.3 will gate by time)

## Dev Notes

### Epic Context

This story is part of **Epic 16: Enemy System Expansion**, which aims to implement all 8 enemy types from the original brainstorming with distinct behaviors, time-based spawn patterns, and progressive difficulty scaling across systems.

**Epic Goals:**
- Implement all 8 enemy types with distinct behaviors (Story 16.1 — previous story)
- **Create behavior patterns** (sweep, shockwave, sniper, teleport) in enemy tick logic **(Story 16.2 — THIS STORY)**
- Implement time-based spawn system (types 1-2 first 2 minutes, type 3 from 1 min, etc.) (Story 16.3)
- Apply difficulty scaling across systems (n+1, n+2 are harder) (Story 16.4)

**Current State:**
Story 16.1 created enemyDefs.js with all 8 enemy types defined with stats, behaviors, models. The current enemyDefs.js in the codebase has only 3 types (FODDER_BASIC, FODDER_FAST, BOSS_SENTINEL). **Story 16.1 must be implemented first** before Story 16.2 can proceed, as the new enemy definitions are required for behavior implementation.

**Story 16.2 Goal:**
Implement the behavior tick logic in useEnemies.tick() for the 5 new behavior types: sweep, shockwave, sniper_mobile, sniper_fixed, teleport. The existing 'chase' behavior already works (used by FODDER_BASIC, FODDER_TANK, TELEPORTER). This story adds AI complexity and attack patterns beyond simple chase.

**Story Sequence in Epic:**
- Story 16.1 (Enemy Definitions & Model Integration) → Create enemyDefs.js with all 8 types
- **Story 16.2 (Enemy Behavior System) → THIS STORY** — Implement behavior tick logic in useEnemies.jsx
- Story 16.3 (Time-Based Spawn System) → Spawn system reads enemyDefs.js, gates types by time
- Story 16.4 (Difficulty Scaling) → Apply system-based multipliers to base stats from enemyDefs.js

### Architecture Context

**6-Layer Architecture Alignment:**
- **Config/Data Layer** → enemyDefs.js (Story 16.1) — Already has behavior-specific data (shockwaveInterval, attackCooldown, teleportCooldown)
- **Systems Layer** → spawnSystem.js (extend for sweep group spawning) — No new system files needed
- **Stores Layer** → useEnemies.jsx (THIS STORY) — Extend tick() with behavior switch statement
- **Stores Layer** → useEnemyProjectiles.jsx (optional, new) — Could extract enemy projectiles to separate store if complexity grows
- **GameLoop Layer** → GameLoop.jsx (THIS STORY) — Add collision checks for shockwaves and enemy projectiles
- **Rendering Layer** → EnemyRenderer.jsx (minor update) — May need telegraph visual feedback for sniper_fixed
- **Rendering Layer** → ShockwaveRenderer.jsx (new, optional) — Render expanding shockwave rings, OR reuse ParticleRenderer
- **Rendering Layer** → ProjectileRenderer.jsx (extend or duplicate) — Render enemy projectiles (red color)
- **Rendering Layer** → ParticleRenderer.jsx (extend) — Teleport particle bursts
- **UI Layer** → HUD.jsx minimap (extend) — Red dots for sniper_fixed enemies
- **No Scenes Changes** — GameplayScene already mounts all renderers

**Architectural Pattern: Behavior in Store Tick Logic (Architecture.md lines 404-430):**

The 6-layer architecture pattern dictates that behavior logic lives in store `tick()` methods, not in entity definitions. enemyDefs.js stores **data** (behavior type string, behavior-specific constants). useEnemies.tick() reads `enemy.behavior` and executes corresponding AI logic.

**Pattern Example:**
```javascript
// useEnemies.jsx tick()
tick: (delta, playerPosition) => {
  const { enemies } = get()
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]

    if (e.behavior === 'chase') {
      // Existing chase logic
    } else if (e.behavior === 'sweep') {
      // NEW: Linear movement, no player tracking
    } else if (e.behavior === 'shockwave') {
      // NEW: Slow chase + periodic shockwave emission
    } else if (e.behavior === 'sniper_mobile') {
      // NEW: Distance maintenance + ranged attacks
    } else if (e.behavior === 'sniper_fixed') {
      // NEW: Stationary + telegraphed beam attacks
    } else if (e.behavior === 'teleport') {
      // NEW: Chase + periodic teleportation + burst fire
    }
  }
}
```

**Key Architectural Rules:**
- **Behavior logic in store tick(), NOT in definitions** — enemyDefs.js is pure data
- **GameLoop calls tick() methods in deterministic order** — See GameLoop.jsx lines 331-515
- **Collision checks in GameLoop, NOT in store tick()** — Stores mutate positions, GameLoop resolves collisions
- **Renderers are read-only** — They read store state via getState() in useFrame, never mutate
- **SFX played from GameLoop**, not from store actions — See MEMORY.md reminder
- **Object pooling for zero-GC pressure** — Shockwaves, enemy projectiles must reuse array slots

### Existing Infrastructure

**Current Enemy System (Story 2.2, 2.5, 2.6, 2.7 Context):**

The enemy system currently has:
- useEnemies.jsx store with tick() method for chase behavior (lines 86-111)
- spawnEnemy() and spawnEnemies() batch spawn actions (lines 11-81)
- damageEnemy() and damageEnemiesBatch() for HP reduction (lines 113-164)
- EnemyRenderer.jsx with InstancedMesh for efficient rendering (existing)
- spatialHash.js + collisionSystem.js for circle-circle collision detection (existing)
- GameLoop.jsx collision section for projectile vs enemy and enemy vs player contact damage (lines 420-496)

**Enemy tick() current implementation (useEnemies.jsx lines 86-111):**
```javascript
tick: (delta, playerPosition) => {
  const { enemies } = get()
  if (enemies.length === 0) return

  const px = playerPosition[0]
  const pz = playerPosition[2]
  const bound = GAME_CONFIG.PLAY_AREA_SIZE

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]

    if (e.behavior === 'chase') {
      const dx = px - e.x
      const dz = pz - e.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist > 0.1) {
        e.x += (dx / dist) * e.speed * delta
        e.z += (dz / dist) * e.speed * delta
      }
    }

    // Clamp to play area
    e.x = Math.max(-bound, Math.min(bound, e.x))
    e.z = Math.max(-bound, Math.min(bound, e.z))
  }
}
```

**Story 16.2 will extend this with behavior switch for sweep, shockwave, sniper_mobile, sniper_fixed, teleport.**

**spawnEnemy() current implementation (useEnemies.jsx lines 11-39):**
```javascript
spawnEnemy: (typeId, x, z) => {
  const state = get()
  if (state.enemies.length >= GAME_CONFIG.MAX_ENEMIES_ON_SCREEN) return

  const def = ENEMIES[typeId]
  if (!def) return

  const id = `enemy_${state.nextId}`
  const enemy = {
    id,
    typeId,
    x,
    z,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed,
    damage: def.damage,
    radius: def.radius,
    behavior: def.behavior,
    color: def.color,
    meshScale: def.meshScale,
    lastHitTime: -Infinity,
  }

  set({
    enemies: [...state.enemies, enemy],
    nextId: state.nextId + 1,
  })
}
```

**Story 16.2 will extend enemy instance with behavior-specific properties:**
- sweep: sweepDirection (vec2), spawnTime, despawnTimer
- shockwave: shockwaveTimer
- sniper_mobile/sniper_fixed: attackTimer, telegraphTimer (fixed only), state (fixed only: 'idle' | 'telegraph' | 'fire')
- teleport: teleportTimer

**GameLoop collision section (GameLoop.jsx lines 420-496):**

Currently handles:
- Player projectiles vs enemies (lines 448-472)
- Enemy contact damage vs player (lines 473-486)
- XP orb collection (lines 488-492)

**Story 16.2 will add:**
- Shockwave entities vs player collision
- Enemy projectile entities vs player collision
- Apply damage with invulnerability check (same pattern as contact damage)

**Projectile System (existing):**

Player projectiles are managed by useWeapons.jsx store (projectiles array) and projectileSystem.js (tick logic for movement, homing, lifetime). Enemy projectiles will follow the same pattern but stored in useEnemies.jsx or new useEnemyProjectiles.jsx.

### Technical Requirements

**Behavior Implementation Details:**

#### 1. Sweep Behavior

**Design Intent:** Fast-moving enemies that cross the play area in straight lines, spawning in groups like waves. Player must dodge the waves rather than chase individual enemies.

**Implementation:**
- On spawn: assign `sweepDirection` (unit vector), `spawnTime` (performance.now()), `despawnTimer` (10-15 seconds random)
- Tick: `e.x += sweepDirection.x * e.speed * delta`, `e.z += sweepDirection.z * e.speed * delta`
- Despawn check: if `(performance.now() - spawnTime) / 1000 > despawnTimer` OR `out of bounds` → remove enemy
- Out of bounds: `Math.abs(e.x) > PLAY_AREA_SIZE + 50 || Math.abs(e.z) > PLAY_AREA_SIZE + 50`
- Group spawning: spawnSystem spawns 3-5 with same sweepDirection, staggered positions (line formation perpendicular to direction)

**Data from enemyDefs.js:**
- FODDER_SWARM: hp=8, speed=35, behavior='sweep'

#### 2. Shockwave Behavior

**Design Intent:** Slow-moving tanky enemy that periodically emits radial damage waves. Player must position between waves.

**Implementation:**
- On spawn: `e.shockwaveTimer = def.shockwaveInterval` (from SHOCKWAVE_BLOB def: 3.5 seconds)
- Tick chase: same as 'chase' (move toward player at speed=8, already slow in def)
- Tick shockwave: `e.shockwaveTimer -= delta`
  - If `shockwaveTimer <= 0`: emit shockwave, reset timer
  - Emit: `spawnShockwave(e.x, e.z, def.shockwaveRadius, def.shockwaveDamage)`
- Shockwave entity: `{ id, x, z, radius: 0, maxRadius: 15, lifetime: 0.5, damage: 8, active: true }`
- Shockwave tick: `radius += (maxRadius / lifetime) * delta`, `lifetime -= delta`
  - If `lifetime <= 0`: `active = false` (pooled, not removed from array)
- Collision: if `dist(player, shockwave) < shockwave.radius + PLAYER_RADIUS` → damage player

**Data from enemyDefs.js:**
- SHOCKWAVE_BLOB: hp=15, speed=8, behavior='shockwave', shockwaveInterval=3.5, shockwaveRadius=15, shockwaveDamage=8

**Shockwave Entity Pool:**
Add to useEnemies store:
```javascript
shockwaves: [], // Array of shockwave entities
nextShockwaveId: 0,
spawnShockwave: (x, z, maxRadius, damage) => {
  // Find inactive slot or push new
  // Set active=true, reset radius/lifetime
}
```

#### 3. Sniper Mobile Behavior

**Design Intent:** Ranged enemy that maintains distance and kites the player while firing red laser projectiles. Forces player to close distance or take consistent poke damage.

**Implementation:**
- On spawn: `e.attackTimer = def.attackCooldown` (2 seconds from SNIPER_MOBILE def)
- Distance maintenance:
  - Calculate `dist = Math.sqrt((px - ex)^2 + (pz - ez)^2)`
  - If `dist < 30`: move away from player (reverse chase vector)
  - If `dist > 40`: move toward player (chase)
  - Else: strafe perpendicular to player direction (maintain range band)
- Attack tick: `e.attackTimer -= delta`
  - If `attackTimer <= 0`: fire projectile toward player, reset timer
  - Fire: `spawnEnemyProjectile(e.x, e.z, targetX, targetZ, speed, damage, color)`
- Enemy projectile entity: `{ id, x, z, vx, vz, speed: 80, damage: 10, radius: 0.5, color: '#ff3333', lifetime: 5.0, active: true }`
- Projectile tick: `x += vx * delta`, `z += vz * delta`, `lifetime -= delta`
  - Despawn if `lifetime <= 0` OR `out of bounds`

**Data from enemyDefs.js:**
- SNIPER_MOBILE: hp=25, speed=20, behavior='sniper_mobile', attackRange=40, attackCooldown=2, projectileSpeed=80, projectileDamage=10, projectileColor='#ff3333'

**Enemy Projectile Pool:**
Add to useEnemies store (or create useEnemyProjectiles.jsx):
```javascript
enemyProjectiles: [],
nextEnemyProjId: 0,
spawnEnemyProjectile: (x, z, targetX, targetZ, speed, damage, color) => {
  // Calculate velocity vector toward target
  // Find inactive slot or push new
}
tickEnemyProjectiles: (delta) => {
  // Update positions, lifetime
  // Despawn inactive
}
```

#### 4. Sniper Fixed Behavior

**Design Intent:** Stationary turret that telegraphs high-damage laser beams with 1-second charge-up. Punishes stationary players but avoidable with observation. High priority target visible on minimap.

**Implementation:**
- On spawn: `e.attackTimer = def.attackCooldown` (4 seconds), `e.state = 'idle'`, `e.telegraphTimer = 0`
- Tick state machine:
  - **IDLE**: `attackTimer -= delta`, if `attackTimer <= 0` → transition to TELEGRAPH
  - **TELEGRAPH**: `telegraphTimer += delta`, visual pulse/glow, if `telegraphTimer >= def.telegraphDuration (1.0)` → transition to FIRE
  - **FIRE**: spawn high-damage projectile toward player's position at telegraph start, transition to IDLE, reset timers
- Telegraph visual: EnemyRenderer reads `e.state === 'telegraph'` → scale pulse, emissive intensity increase
- Spawn logic: modify spawnSystem or add special case to spawn sniper_fixed far from player (distance > 150 units, outside visible area)
- Minimap: HUD minimap component reads enemies array, renders red dot for `e.behavior === 'sniper_fixed'`

**Data from enemyDefs.js:**
- SNIPER_FIXED: hp=10, speed=0, behavior='sniper_fixed', attackRange=60, attackCooldown=4, telegraphDuration=1.0, projectileSpeed=150, projectileDamage=20, projectileColor='#ff0000'

#### 5. Teleport Behavior

**Design Intent:** Unpredictable enemy that blinks around the player and fires burst attacks after teleporting. High threat, hard to pin down.

**Implementation:**
- On spawn: `e.teleportTimer = def.teleportCooldown` (5 seconds from TELEPORTER def)
- Tick chase: same as 'chase' (move toward player)
- Tick teleport: `e.teleportTimer -= delta`
  - If `teleportTimer <= 0`: teleport to random nearby position, fire burst, reset timer
- Teleport logic:
  - Calculate random angle: `angle = Math.random() * Math.PI * 2`
  - Calculate random distance: `dist = Math.random() * def.teleportRange (30)`
  - New position: `newX = e.x + Math.cos(angle) * dist`, `newZ = e.z + Math.sin(angle) * dist`
  - Validate: clamp to play area bounds, avoid planets (optional)
  - Teleport: `e.x = newX`, `e.z = newZ`
  - Visual: `addExplosion(oldX, oldZ, '#cc66ff', 0.5)`, `addExplosion(newX, newZ, '#cc66ff', 0.5)`
- Burst fire: spawn 3 projectiles with spread angles (-0.2, 0, +0.2 radians from player direction)

**Data from enemyDefs.js:**
- TELEPORTER: hp=18, speed=15, behavior='teleport', teleportCooldown=5, teleportRange=30, burstProjectileCount=3, burstProjectileSpeed=100, burstProjectileDamage=5, color='#cc66ff'

### Performance Optimization Strategy

**Target: 60 FPS with 50+ mixed enemies including complex behaviors**

**Optimizations:**
1. **Object pooling for shockwaves and enemy projectiles** — Reuse array slots, set `active: false` instead of splicing. Prevents GC pressure.
2. **Spatial hash only for active entities** — Skip inactive shockwaves/projectiles during registration.
3. **Minimize Math.sqrt calls** — Use squared distance for range checks when possible (e.g., sniper distance maintenance: `if (distSq < 900)` instead of `if (dist < 30)`).
4. **Batch collision checks** — GameLoop already does this. Ensure shockwaves and enemy projectiles follow same pattern.
5. **Efficient behavior switch** — Use if/else if chain (not switch/case) to short-circuit on most common behaviors first (chase, sweep).
6. **Pre-allocate behavior-specific properties** — Set sweepDirection, timers during spawn, not lazily during tick.

**r3f-perf monitoring:**
- Track frame time with 50+ enemies (30 chase, 10 sweep, 5 shockwave, 3 sniper, 2 teleport)
- Target: < 16.67ms per frame (60 FPS)
- Profile with Leva panel: toggle behaviors on/off to isolate bottlenecks

### GameLoop Integration

**Current GameLoop tick order (GameLoop.jsx lines 331-515):**

```
1. Input (useControlsStore)
2. Player movement + dash (usePlayer.tick)
3. Weapons fire (useWeapons.tick)
4. Projectile movement (projectileSystem.tick)
5. Enemy movement + spawning (useEnemies.tick, spawnSystem.tick)
6. Collision detection (spatialHash, collisionSystem)
7. Damage + death (damageEnemy, takeDamage, XP drops)
8. Level-up check (pendingLevelUps)
9. Cleanup (expired projectiles, dead enemies)
```

**Story 16.2 extensions:**

**Section 5 (Enemy tick):** useEnemies.tick() now includes behavior switch for sweep, shockwave, sniper_mobile, sniper_fixed, teleport.

**Section 5.5 (new):** useEnemies.tickShockwaves(delta) — Expand shockwave radii, decrement lifetimes.

**Section 5.6 (new):** useEnemies.tickEnemyProjectiles(delta) — Move enemy projectiles, decrement lifetimes.

**Section 6 (Collision):** Register shockwaves and enemy projectiles in spatial hash.

**Section 6.5 (new):** Check shockwave vs player collision, apply damage.

**Section 6.6 (new):** Check enemy projectiles vs player collision, apply damage, despawn projectiles.

**Section 7 (Damage/Death):** No changes — damage application already handles invulnerability checks.

**Section 9 (Cleanup):** Clean up inactive shockwaves and enemy projectiles (object pooling, reuse slots).

### Rendering Integration

**Existing Renderers:**
- EnemyRenderer.jsx — InstancedMesh for all enemies, reads useEnemies.enemies array
- ProjectileRenderer.jsx — InstancedMesh for player projectiles, reads useWeapons.projectiles array
- ParticleRenderer.jsx — GPU particles for explosions, trails

**Story 16.2 rendering needs:**

1. **Shockwave Rings:** Create ShockwaveRenderer.jsx (new) OR extend ParticleRenderer
   - Read useEnemies.shockwaves array
   - Render expanding rings with Circle geometry, MeshBasicMaterial, opacity fade
   - OR use InstancedMesh if many shockwaves on screen simultaneously

2. **Enemy Projectiles:** Extend ProjectileRenderer.jsx OR create EnemyProjectileRenderer.jsx
   - Read useEnemies.enemyProjectiles array
   - Render red spheres with emissive material (distinct from player projectiles)
   - Can reuse ProjectileRenderer if it supports color per instance (via instanceColor attribute)

3. **Sniper Fixed Telegraph:** Extend EnemyRenderer.jsx
   - Read `enemy.state === 'telegraph'`
   - Apply scale pulse and emissive intensity increase to that instance
   - Reset on state transition to 'fire' or 'idle'

4. **Teleport Particles:** Use ParticleRenderer.jsx (existing)
   - `addExplosion(x, z, '#cc66ff', 0.5)` at departure and arrival positions
   - Existing particle system handles rendering

5. **Minimap Red Dots:** Extend HUD.jsx minimap component
   - Poll sniper_fixed enemies imperatively via `useEnemies.getState()` every 500ms (useEffect + setInterval)
   - NOTE: A reactive Zustand selector causes "Maximum update depth exceeded" because `set()` is called inside tick() for shockwave/projectile spawning. Imperative polling avoids infinite re-render loops.
   - Render red dot at minimap position for each sniper_fixed
   - CSS: `background: #ff0000; width: 4px; height: 4px; border-radius: 50%;`

### Collision System Integration

**Existing collision categories (collisionSystem.js):**
- CATEGORY_PLAYER
- CATEGORY_ENEMY
- CATEGORY_PROJECTILE (player projectiles)
- CATEGORY_XP_ORB
- CATEGORY_BOSS
- CATEGORY_BOSS_PROJECTILE

**Story 16.2 additions:**
- CATEGORY_SHOCKWAVE (new)
- CATEGORY_ENEMY_PROJECTILE (new)

**Collision pairs to check (GameLoop):**
- Shockwave vs Player → Apply shockwave damage
- Enemy Projectile vs Player → Apply projectile damage, despawn projectile

**Implementation in GameLoop:**
```javascript
// Section 6: Collision registration
cs.clear()
// ... existing player, enemies, projectiles registration ...

// Register shockwaves
const shockwaves = useEnemies.getState().shockwaves
for (let i = 0; i < shockwaves.length; i++) {
  if (!shockwaves[i].active) continue
  const sw = shockwaves[i]
  assignEntity(pool[idx], sw.id, sw.x, sw.z, sw.radius, CATEGORY_SHOCKWAVE)
  cs.registerEntity(pool[idx++])
}

// Register enemy projectiles
const enemyProj = useEnemies.getState().enemyProjectiles
for (let i = 0; i < enemyProj.length; i++) {
  if (!enemyProj[i].active) continue
  const ep = enemyProj[i]
  assignEntity(pool[idx], ep.id, ep.x, ep.z, ep.radius, CATEGORY_ENEMY_PROJECTILE)
  cs.registerEntity(pool[idx++])
}

// Section 6.5: Shockwave vs Player
const playerEntity = pool[0]
const swHits = cs.queryCollisions(playerEntity, CATEGORY_SHOCKWAVE)
if (swHits.length > 0 && !usePlayer.getState().isInvulnerable && usePlayer.getState().contactDamageCooldown <= 0) {
  let totalDamage = 0
  for (let i = 0; i < swHits.length; i++) {
    const sw = shockwaves.find(s => s.id === swHits[i].id)
    if (sw) totalDamage += sw.damage
  }
  if (totalDamage > 0) {
    usePlayer.getState().takeDamage(totalDamage, boonModifiers.damageReduction ?? 0)
    playSFX('damage-taken')
  }
}

// Section 6.6: Enemy Projectile vs Player
const epHits = cs.queryCollisions(playerEntity, CATEGORY_ENEMY_PROJECTILE)
if (epHits.length > 0 && !usePlayer.getState().isInvulnerable && usePlayer.getState().contactDamageCooldown <= 0) {
  let totalDamage = 0
  const hitIds = new Set()
  for (let i = 0; i < epHits.length; i++) {
    const ep = enemyProj.find(p => p.id === epHits[i].id)
    if (ep) {
      totalDamage += ep.damage
      hitIds.add(ep.id)
    }
  }
  if (totalDamage > 0) {
    usePlayer.getState().takeDamage(totalDamage, boonModifiers.damageReduction ?? 0)
    playSFX('damage-taken')
  }
  // Despawn hit projectiles
  useEnemies.setState({ enemyProjectiles: enemyProj.filter(p => !hitIds.has(p.id)) })
}
```

### Testing Checklist

**Behavior Functionality:**
- [ ] Sweep enemies move in straight lines, ignore player position
- [ ] Sweep enemies spawn in groups of 3-5 with same direction
- [ ] Sweep enemies despawn after timeout or crossing play area bounds
- [ ] Shockwave enemies move slowly toward player
- [ ] Shockwave enemies emit radial shockwave every 3-4 seconds
- [ ] Shockwave rings expand visually and deal damage when overlapping player
- [ ] Sniper_mobile maintains distance from player (30-40 unit range band)
- [ ] Sniper_mobile fires red projectiles every 2 seconds
- [ ] Sniper_fixed spawns far from player (outside visible area)
- [ ] Sniper_fixed shows red dot on minimap
- [ ] Sniper_fixed does not move (speed=0)
- [ ] Sniper_fixed telegraphs attack with 1-second charge-up visual
- [ ] Sniper_fixed fires high-damage beam after telegraph
- [ ] Teleporter chases player normally between teleports
- [ ] Teleporter teleports to random nearby position every 5 seconds
- [ ] Teleporter shows particle burst at departure and arrival
- [ ] Teleporter fires 3-projectile burst after teleporting

**Collision & Damage:**
- [ ] Shockwave vs player collision applies damage correctly
- [ ] Enemy projectile vs player collision applies damage correctly
- [ ] Damage respects invulnerability frames (no damage during i-frames)
- [ ] Sniper projectiles despawn after hitting player or going out of bounds
- [ ] Shockwaves despawn after lifetime expires
- [ ] SFX plays for damage events (player-damage, enemy-hit)

**Performance:**
- [ ] 60 FPS maintained with 50+ mixed enemies on screen
- [ ] No frame drops during shockwave emissions
- [ ] No frame drops during teleport bursts
- [ ] r3f-perf shows frame time < 16.67ms

**Rendering:**
- [ ] Shockwave rings render and expand visually
- [ ] Enemy projectiles render as red spheres (distinct from player projectiles)
- [ ] Sniper_fixed telegraph shows visual pulse/glow during charge-up
- [ ] Teleport particle bursts appear at departure and arrival positions
- [ ] Minimap shows red dots for sniper_fixed enemies

**Code Quality:**
- [ ] Behavior logic in useEnemies.tick(), not in enemyDefs
- [ ] Shockwaves and enemy projectiles use object pooling (reuse array slots)
- [ ] No GC pressure from spawning/despawning entities
- [ ] Code follows architectural pattern (stores tick, GameLoop coordinates)
- [ ] No magic numbers (all behavior constants from enemyDefs or gameConfig)

### References

- [Source: _bmad-output/planning-artifacts/epic-16-enemy-system-expansion.md#Story 16.2 — Complete AC, behavior specifications, performance requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns — Store tick() methods, inter-store communication (lines 404-430)]
- [Source: _bmad-output/planning-artifacts/architecture.md#useFrame Rules — GameLoop orchestrates tick order (lines 482-525)]
- [Source: src/stores/useEnemies.jsx — Current tick() implementation for chase behavior (lines 86-111)]
- [Source: src/GameLoop.jsx — Current collision checks and tick order (lines 331-515)]
- [Source: src/systems/spawnSystem.js — Weighted enemy type selection (lines 1-65)]
- [Source: src/config/gameConfig.js — Enemy spawn constants, collision settings (lines 14-71)]
- [Source: _bmad-output/implementation-artifacts/16-1-enemy-definitions-model-integration.md — Story 16.1 context, enemyDefs.js structure]
- [Source: ~/.claude/projects/.../memory/MEMORY.md — SFX played from GameLoop, timer decay pattern, architecture quick reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Implemented all 5 behavior patterns (sweep, shockwave, sniper_mobile, sniper_fixed, teleport) in useEnemies.tick()
- Added shockwave entity pool with spawnShockwave(), tickShockwaves() — object-pooled with inactive slot reuse
- Added enemy projectile pool with spawnEnemyProjectile(), tickEnemyProjectiles() — object-pooled
- Extended spawnEnemy/spawnEnemies with initBehaviorData() to initialize behavior-specific properties on spawn
- Added CATEGORY_SHOCKWAVE and CATEGORY_ENEMY_PROJECTILE collision categories
- GameLoop: added shockwave/enemy projectile tick, spatial hash registration, and player damage resolution
- SpawnSystem: sweep enemies spawn in groups of 3-5 with shared sweepDirection and line formation
- Created ShockwaveRenderer.jsx (instanced ring geometry with opacity fade)
- Created EnemyProjectileRenderer.jsx (instanced spheres with per-instance color)
- Added sniper_fixed red dots on HUD minimap (imperative polling every 500ms to avoid infinite re-render from reactive selector)
- 49 new tests in useEnemies.test.js covering all behaviors, shockwaves, enemy projectiles
- 1 new test in spawnSystem.test.js for sweep group spawning
- All 1203 tests pass, 0 regressions

### Code Review Fixes (2026-02-14)

- [Fixed] Teleport particle bursts: added _teleportEvents tracking in useEnemies, consumed by GameLoop with addExplosion at departure/arrival (AC #5)
- [Fixed] Sniper_fixed telegraph visual: added scale pulse in EnemyRenderer during attackState==='telegraph' (AC #4)
- [Fixed] Sniper_fixed spawn distance: added SNIPER_FIXED_SPAWN_DISTANCE_MIN/MAX (150-200) in spawnSystem (AC #4)
- [Fixed] ShockwaveRenderer opacity: removed shared material opacity hack that applied first-active lifetime to all instances
- [Fixed] Sweep batch inflation: sweep group now counts toward batchSize (i += groupSize - 1) to prevent spawn rate explosion
- [Fixed] spawnSystem.test.js: updated batch size assertion to account for sweep group inflation (toBeGreaterThanOrEqual)
- [Noted] Object pooling slot reuse without set() is by architectural design (renderers read via getState() in useFrame, not reactive subscriptions)

### Change Log

- 2026-02-14: Implemented Story 16.2 — Enemy Behavior System (all 10 tasks complete)
- 2026-02-14: Code review fixes — 6 issues fixed (teleport particles, telegraph visual, sniper spawn distance, shockwave opacity, sweep batch, test fix)

### File List

- src/stores/useEnemies.jsx (modified — behavior tick logic, shockwave/projectile pools, initBehaviorData, _teleportEvents, consumeTeleportEvents)
- src/systems/collisionSystem.js (modified — CATEGORY_SHOCKWAVE, CATEGORY_ENEMY_PROJECTILE)
- src/GameLoop.jsx (modified — shockwave/projectile tick, collision registration, damage resolution, teleport particle effects)
- src/systems/spawnSystem.js (modified — sweep group spawning with shared direction, sweep batch counting, sniper_fixed spawn distance)
- src/renderers/EnemyRenderer.jsx (modified — sniper_fixed telegraph scale pulse)
- src/renderers/EnemyProjectileRenderer.jsx (new — instanced enemy projectile rendering)
- src/renderers/ShockwaveRenderer.jsx (new — instanced shockwave ring rendering, fixed opacity)
- src/scenes/GameplayScene.jsx (modified — mount EnemyProjectileRenderer, ShockwaveRenderer)
- src/ui/HUD.jsx (modified — sniper_fixed red dots on minimap)
- src/stores/__tests__/useEnemies.test.js (modified — 31 new behavior tests)
- src/systems/__tests__/spawnSystem.test.js (modified — sweep group spawn test, batch size assertion fix)
