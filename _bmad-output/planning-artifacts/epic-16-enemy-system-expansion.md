# Epic 16: Enemy System Expansion

The player encounters 8 distinct enemy types with unique behaviors, visual designs, and time-based spawn patterns that create varied combat challenges throughout each system run.

## Epic Goals

- Implement all 8 enemy types from the original brainstorming with distinct behaviors
- Create time-based spawn system (types 1-2 first 2 minutes, type 3 from 1 min, type 4 from 2 min, etc.)
- Apply GLB model variations with size/color modifications per enemy type
- Ensure enemy difficulty scales progressively across systems (n+1, n+2 are harder)

## Epic Context

Currently, only 3 enemy types exist: FODDER_BASIC (drone), FODDER_FAST (scout), and BOSS_SENTINEL. The brainstorming session defined 8 enemy types with unique behaviors (chase, wave sweep, shockwave, orbit, sniper mobile, sniper fixed, teleport). The game needs the full roster to create diverse combat scenarios and meet the original design vision.

Additionally, enemy spawning is currently uniform throughout a run. The design calls for time-gated enemy introductions where simpler enemies dominate early gameplay and complex/dangerous enemies appear in mid-to-late phases.

## Stories

### Story 16.1: Enemy Definitions & Model Integration

As a developer,
I want all 8 enemy types fully defined in enemyDefs.js with their corresponding GLB models and visual configurations,
So that each enemy has unique stats, behaviors, and visuals ready for spawning.

**Acceptance Criteria:**

**Given** enemyDefs.js is updated
**When** enemy definitions are added
**Then** the following 8 enemy types are defined with complete stats:
  - FODDER_BASIC (Type 1): hp=20, speed=17, modelPath='robot-enemy-flying.glb', meshScale=[3,3,3], behavior='chase'
  - FODDER_TANK (Type 2): hp=40, speed=12, modelPath='robot-enemy-flying.glb', meshScale=[4,4,4], behavior='chase'
  - FODDER_SWARM (Type 3): hp=8, speed=35, modelPath='robot-enemy-flying.glb', meshScale=[1.5,1.5,1.5], behavior='sweep'
  - SHOCKWAVE_BLOB (Type 4): hp=15, speed=8, modelPath='enemy-blob.glb', meshScale=[2,2,2], behavior='shockwave'
  - SNIPER_MOBILE (Type 6): hp=25, speed=20, modelPath='robot-enemy-flying-gun.glb', meshScale=[3,3,3], behavior='sniper_mobile', attackRange=40, attackCooldown=2
  - SNIPER_FIXED (Type 7): hp=10, speed=0, modelPath='robot-enemy-flying-gun.glb', meshScale=[3,3,3], color='#ff3333', behavior='sniper_fixed', attackRange=60, attackCooldown=4
  - TELEPORTER (Type 8): hp=18, speed=15, modelPath='robot-enemy-flying.glb', meshScale=[2.5,2.5,2.5], behavior='teleport', teleportCooldown=5

**Given** enemy models
**When** they are rendered
**Then** robot-enemy-flying.glb is used for Types 1, 2, 3, 8 with appropriate meshScale
**And** enemy-blob.glb is used for Type 4
**And** robot-enemy-flying-gun.glb is used for Types 6, 7
**And** Type 7 (sniper_fixed) has a red tint applied via material color override

**Given** enemy collision radii
**When** they are defined
**Then** each enemy's radius is proportional to its meshScale and visual size
**And** Type 4 (blob) has a larger collision radius reflecting its "sac à PV" tanky nature

### Story 16.2: Enemy Behavior System Implementation

As a developer,
I want behavior patterns for sweep, shockwave, sniper_mobile, sniper_fixed, and teleport implemented in the enemy tick logic,
So that each enemy type has distinct AI and attack patterns.

**Acceptance Criteria:**

**Given** useEnemies.tick() is updated
**When** enemies with behavior='sweep' are ticked
**Then** they move in straight lines across the play area (not tracking player position)
**And** they spawn in groups of 3-5 and move together in the same direction
**And** they despawn after crossing the play area or after a timeout (10-15 seconds)

**Given** enemies with behavior='shockwave'
**When** they are active
**Then** they move slowly toward the player
**And** every SHOCKWAVE_INTERVAL (3-4 seconds), they emit a radial shockwave
**And** the shockwave is visualized as an expanding ring that deals damage to the player if overlapping

**Given** enemies with behavior='sniper_mobile'
**When** they are ticked
**Then** they maintain a distance from the player (stay at range ~30-40 units)
**And** they fire red laser projectiles at the player every attackCooldown seconds
**And** their projectiles are distinct from player projectiles (red color, slower speed)

**Given** enemies with behavior='sniper_fixed'
**When** they spawn
**Then** they spawn far from the player (outside visible area initially)
**And** they appear as a red dot on the minimap
**And** they do not move (speed=0)
**And** they fire large telegraphed laser beams at the player with a 1-second charge-up animation
**And** the beam is highly damaging but avoidable if the player moves during charge-up

**Given** enemies with behavior='teleport'
**When** they are ticked
**Then** they chase the player normally but teleport to a random nearby position every teleportCooldown seconds
**And** teleportation is visualized with a particle burst at departure and arrival points
**And** after teleporting, they fire a burst of 3 projectiles

**Given** behavior implementations
**When** performance is tested with 50+ enemies on screen including complex behaviors
**Then** the game maintains 60 FPS
**And** behavior logic is efficient and does not cause frame drops

### Story 16.3: Time-Based Enemy Spawn System

As a player,
I want to encounter simpler enemies early in a run and face progressively more complex and dangerous enemies as time progresses,
So that difficulty ramps up naturally and each phase of the run feels distinct.

**Acceptance Criteria:**

**Given** spawnSystem.js is updated with time-gated spawn logic
**When** gameplay time is 0:00 - 2:00
**Then** Types 1 (FODDER_BASIC) and 2 (FODDER_TANK) spawn with high frequency (spawnWeight 100 and 60)
**And** no other enemy types spawn during this phase

**Given** gameplay time reaches 1:00
**When** the 1-minute mark is crossed
**Then** Type 3 (FODDER_SWARM) begins spawning occasionally (spawnWeight 40)
**And** swarms appear in groups of 3-5 and sweep across the play area

**Given** gameplay time reaches 2:00
**When** the 2-minute mark is crossed
**Then** Type 4 (SHOCKWAVE_BLOB) begins spawning (spawnWeight 30)
**And** Types 1 and 2 continue spawning but at reduced frequency

**Given** gameplay time reaches 3:00
**When** the 3-minute mark is crossed
**Then** Type 6 (SNIPER_MOBILE) begins spawning (spawnWeight 25)
**And** snipers maintain distance and fire red projectiles at the player

**Given** gameplay time reaches 5:00
**When** the 5-minute mark is crossed
**Then** Type 7 (SNIPER_FIXED) begins spawning rarely (spawnWeight 10)
**And** fixed snipers appear far from the player and are visible on the minimap as red dots
**And** they fire telegraphed laser beams with charge-up animations

**Given** gameplay time reaches 6:00
**When** the 6-minute mark is crossed
**Then** Type 8 (TELEPORTER) begins spawning (spawnWeight 20)
**And** teleporters chase and teleport unpredictably

**Given** spawn weights are configured
**When** multiple enemy types are available
**Then** the spawnSystem randomly selects enemy types based on their weights
**And** earlier enemy types continue spawning throughout the run but at lower frequency as new types are introduced

### Story 16.4: Enemy Difficulty Scaling Across Systems

As a player,
I want enemies in System 2 and System 3 to be significantly stronger than in System 1,
So that progression across systems feels meaningful and challenging.

**Acceptance Criteria:**

**Given** the player enters System 2 (after completing System 1)
**When** enemies spawn
**Then** all enemy base stats are multiplied by a scaling factor (e.g., SYSTEM_2_DIFFICULTY_MULTIPLIER = 1.5)
**And** enemy HP increases by 50%
**And** enemy damage increases by 50%
**And** enemy speed increases by 25%
**And** enemy xpReward increases by 30% to compensate for increased difficulty

**Given** the player enters System 3
**When** enemies spawn
**Then** all enemy base stats are multiplied by a higher scaling factor (e.g., SYSTEM_3_DIFFICULTY_MULTIPLIER = 2.2)
**And** HP, damage, and speed scale proportionally

**Given** gameConfig.js
**When** difficulty scaling is configured
**Then** ENEMY_SCALING_PER_SYSTEM object exists with multipliers for hp, damage, speed, xpReward per system level
**And** the scaling is configurable and tunable for balance

**Given** useLevel.currentSystem tracks system number
**When** enemies are spawned
**Then** the spawnSystem applies the correct scaling multiplier based on currentSystem (1, 2, or 3)
**And** enemy instances store their scaled stats in the entity pool

**Given** the player re-enters System 1 in a new run
**When** the run starts
**Then** enemies return to base difficulty (no scaling applied)
**And** scaling only applies based on the current system within a single run

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — Add ENEMY_SCALING_PER_SYSTEM, TIME_GATED_SPAWN_SCHEDULE
- **Data Layer**: enemyDefs.js — Expand to 8 enemy types with full stats
- **Systems Layer**: spawnSystem.js — Time-gated spawn logic, difficulty scaling
- **Stores Layer**: useEnemies.jsx — Behavior tick logic for new enemy types
- **Rendering Layer**: EnemyRenderer.jsx — May need to handle red tint for sniper_fixed, teleport particle effects

**Performance Budget:**
- Shockwave visual effects: Limit to 3-5 active shockwaves on screen (reuse geometry/materials)
- Sniper projectiles: Object pooling for enemy projectiles (separate from player projectiles)
- Teleport particles: Use lightweight particle system (Drei's Sparkles or custom PointsMaterial)

**Behavior Complexity:**
- Sweep: Low (linear motion, no tracking)
- Shockwave: Medium (radial AoE damage check, timer-based)
- Sniper mobile: Medium (distance maintenance, projectile firing)
- Sniper fixed: Medium (telegraphed attack, charge-up animation)
- Teleport: High (random position calculation, particle effects, burst fire)

## Dependencies

- Story 2.2 (Enemy Spawning & Rendering) — existing enemy spawn system
- useEnemies store — existing tick() and entity pool
- spawnSystem.js — existing spawn logic to extend
- EnemyRenderer.jsx — existing instanced rendering
- Minimap — needs to display red dots for sniper_fixed

## Success Metrics

- All 8 enemy types spawn correctly with distinct visuals (visual testing)
- Time-gated spawning feels natural and ramps difficulty (playtest feedback)
- Enemy behaviors are distinct and recognizable (playtest feedback)
- System 2/3 enemies feel noticeably harder (playtest feedback)
- Performance remains at 60 FPS with 50+ mixed enemy types on screen (r3f-perf)

## References

- brainstorming-session-2026-02-04.md — original 8 enemy type definitions
- Story 2.2 (Enemy Spawning & Rendering) — existing enemy system
- enemyDefs.js — current enemy definitions to expand
- gameConfig.js — ENEMY_SCALING_PER_SYSTEM section
