# Epic 23: Wave & Enemy Systems (Dynamic Pressure)

The enemy wave system creates non-linear difficulty with alternating hard/easy phases, enemies physically collide to prevent stacking, and the timer carries over between systems for cumulative time management.

## Epic Goals

- Implement non-linear dynamic wave system with hard/easy alternation and progressive enemy tiers
- Add collision physics between enemies to prevent visual stacking and create tactical "walls"
- Make the system timer cumulative: remaining time from system N carries to system N+1

## Epic Context

Currently, enemy difficulty scales linearly over time — a steady increase in spawn rates and enemy types. This feels monotonous and doesn't create the tension/relief cycles that make rogue-lites exciting. The proposed system alternates between pressure phases (dense spawns, higher-tier enemies) and breathing room, creating dramatic pacing.

Enemies currently overlap and stack visually, making dense groups look like a single blob the player can walk through. Adding separation physics creates tactical implications — enemy groups form walls that require strategic positioning or dash to navigate. This combines powerfully with the dual-stick controls (Epic 21) where the player has precise aiming to manage these situations.

The cumulative timer rewards fast play: finishing system 1 with time remaining gives a head start on system 2, encouraging aggressive play rather than passive survival.

## Stories

### Story 23.1: Dynamic Wave System

As a player,
I want the difficulty to alternate between intense pressure phases and breathing room,
So that the game has dramatic pacing rather than monotonous linear scaling.

**Acceptance Criteria:**

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

### Story 23.2: Enemy Collision Physics

As a player,
I want enemies to physically collide with each other and not stack/overlap,
So that dense enemy groups form tactical walls I must navigate strategically.

**Acceptance Criteria:**

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

### Story 23.3: Cumulative Timer Across Systems

As a player,
I want remaining time from the current system to carry over to the next system,
So that fast, aggressive play is rewarded with more time in later systems.

**Acceptance Criteria:**

**Given** the player completes system 1 with remaining time
**When** the system timer had 2 minutes remaining at boss defeat/wormhole entry
**Then** the next system's timer is base duration + 2 minutes (e.g., 10 + 2 = 12 minutes)

**Given** the timer display
**When** in system 2+
**Then** the displayed timer shows the full cumulative time (12:00, not 10:00)
**And** the player understands they have bonus time from efficient previous system play

**Given** the wave system interaction
**When** the timer is longer due to carryover
**Then** the wave phases scale proportionally to the actual system duration
**And** the same percentage-based phase structure applies to the extended time
**And** bonus time effectively extends the "pre-boss" phase or gives more breathing room

**Given** the transition flow
**When** the player enters the tunnel between systems
**Then** the remaining time is stored in the run state (useLevel or similar)
**And** tunnel time does NOT count against the timer (tunnel is a safe zone)
**And** the cumulative timer resumes when the next system starts

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: waveDefs.js (new) — Wave profiles per system with phase definitions, spawn rates, enemy tier weights
- **Config Layer**: gameConfig.js — ENEMY_SEPARATION_RADIUS, SEPARATION_FORCE_STRENGTH
- **Systems Layer**: waveSystem.js — Refactor to use non-linear phase-based spawning
- **Systems Layer**: enemySystem.js — Add separation force computation using spatial hashing
- **Stores Layer**: useLevel.js — Track cumulative timer, carry time between systems

**Wave System Design:**
- Each wave profile is an array of phases: { startPercent, endPercent, spawnRateMultiplier, enemyTierWeights }
- waveSystem.tick(delta) checks current time percentage, applies matching phase config
- Spawn rate = baseRate * phaseMultiplier * curseMultiplier * systemScaling

**Separation Physics:**
- Per-frame: for each enemy, query spatial hash for neighbors within SEPARATION_RADIUS
- For each neighbor pair: compute overlap, apply push force inversely proportional to distance
- Force: direction = normalize(posA - posB), magnitude = (SEPARATION_RADIUS - distance) * FORCE_STRENGTH
- Apply half the force to each enemy (Newton's third law)
- Clamp maximum displacement per frame to prevent jitter

**Performance Budget:**
- Spatial hashing already exists (Story 2.1) — reuse for enemy-enemy checks
- Average enemy has 3-5 neighbors to check (not all enemies)
- Target: <1ms for separation computation with 200 enemies
- Profile with r3f-perf during dense wave phases

**Timer Carry:**
- Simple: useLevel.remainingTime persists through tunnel transition
- On new system init: systemTimer = BASE_SYSTEM_DURATION + carriedTime
- Wave phase percentages recalculate based on actual system duration

## Dependencies

- Story 2.1 (Spatial Hashing & Collision System) — Reuse spatial hash for enemy-enemy checks
- Story 16.3 (Time-Based Enemy Spawn System) — Current spawn system to refactor
- Story 16.4 (Enemy Difficulty Scaling) — Tier and scaling system to integrate
- Story 18.3 (Enemy Difficulty Scaling Systems 2-3) — Cross-system scaling
- Epic 20 (Permanent Upgrades) — Curse stat affects spawn rates
- Epic 21 (Dual-Stick Controls) — Player needs precise controls to handle tactical walls

## Success Metrics

- Hard/easy wave alternation creates noticeable tension/relief cycles (playtest)
- Enemy clusters form visible walls that require strategic navigation (visual testing)
- Separation physics maintain 60 FPS with 200+ enemies (performance profiling)
- Cumulative timer rewards aggressive play — players feel motivated to be efficient (playtest)
- Wave phases feel handcrafted despite being system-driven (playtest: pacing feels intentional)

## References

- adam-vision-notes-2026-02-15.md — Sections 2.4/, 2.6/, 3.4/
- brainstorming-session-2026-02-15.md — Epic 23 roadmap
- Vampire Survivors — Wave density escalation reference
- Hades — Enemy push/separation behavior reference
- Brotato — Wave-based difficulty with breathing room between waves
