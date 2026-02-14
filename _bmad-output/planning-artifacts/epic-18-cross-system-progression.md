# Epic 18: Cross-System Progression Persistence

The player's level, weapons, boons, stats, and HP persist across systems within a single run, while enemy difficulty scales progressively in Systems 2 and 3 to maintain challenge.

## Epic Goals

- Player progression (level, XP, weapons, boons, stats) persists when transitioning between systems
- Player HP persists across systems (no reset to full on system transition)
- Enemy difficulty scales significantly in System 2 and System 3 (higher HP, damage, speed)
- System timer resets to 10 minutes for each new system
- Fragment and score totals persist and accumulate across the run

## Epic Context

Currently (as of Story 7.3), the tunnel exit transitions to a new system but the progression behavior across systems is undefined. The original roguelite design calls for a single continuous run where the player becomes increasingly powerful through multiple systems, facing escalating difficulty.

In games like Hades and Vampire Survivors, player power persists across stages/biomes while enemy difficulty ramps to compensate. This epic ensures that three-spaceship-challenge follows the same pattern: the player retains their hard-earned upgrades while enemies become formidable challenges in later systems.

## Stories

### Story 18.1: Progression State Persistence Across Systems

As a player,
I want to keep my level, weapons, boons, and stats when entering a new system,
So that my build and power progression feel continuous throughout the run.

**Acceptance Criteria:**

**Given** the player completes System 1 (defeats the boss)
**When** the player enters the tunnel and then exits to System 2
**Then** usePlayer.currentLevel is preserved (does not reset to 1)
**And** usePlayer.currentXP and xpForNextLevel are preserved
**And** all equipped weapons (useWeapons.equippedWeapons) remain equipped with their current levels

**Given** the player has equipped boons in System 1
**When** transitioning to System 2
**Then** all equipped boons (useBoons.equippedBoons) remain active with their current levels/stacks
**And** boon effects continue to apply to weapons and stats

**Given** the player has purchased permanent upgrades in the tunnel
**When** entering System 2
**Then** permanent stat upgrades (e.g., +max HP, +damage %, +speed %) remain applied
**And** the upgraded stats are reflected in usePlayer state

**Given** the player's current HP at the end of System 1
**When** transitioning to System 2
**Then** currentHP is preserved (does NOT reset to maxHP)
**And** the player starts System 2 with whatever HP they had when defeating the boss
**And** if the player used HP sacrifice in the tunnel, the reduced HP is reflected

**Given** the player's Fragment and score totals
**When** transitioning to System 2
**Then** total Fragments and score accumulate across systems (not reset)
**And** Fragments earned in System 1 can be spent in the tunnel before System 2
**And** score continues to increase in System 2

### Story 18.2: System-Specific State Reset

As a player,
I want the system timer, enemy waves, and collectibles to reset when entering a new system,
So that each system feels like a fresh challenge while my build persists.

**Acceptance Criteria:**

**Given** the player enters System 2
**When** the system loads
**Then** useLevel.systemTimer resets to SYSTEM_TIMER (600 seconds / 10 minutes)
**And** the timer counts down from 10:00 as in System 1

**Given** enemy state from System 1
**When** transitioning to System 2
**Then** all enemies from System 1 are cleared (already done via boss shockwave in Story 6.1)
**And** useEnemies.activeEnemies pool is reset
**And** enemy spawning begins fresh based on System 2 difficulty (Story 18.3)

**Given** XP orbs and other collectibles on the field in System 1
**When** transitioning to System 2
**Then** all remaining XP orbs are cleared (not carried over)
**And** the XP orb pool in useXP (or equivalent) is reset

**Given** wormhole state in System 1
**When** entering System 2
**Then** a new wormhole spawns in System 2 at a different location
**And** the new wormhole is dormant and must be discovered/activated
**And** the old wormhole from System 1 does not carry over

**Given** planet scanning state
**When** entering System 2
**Then** new planets spawn in System 2 (if planets are system-specific)
**Or** planets from System 1 that were not scanned remain available in System 2 (if planets are persistent across systems)
**And** the planet scan state is handled consistently per design choice

### Story 18.3: Enemy Difficulty Scaling in Systems 2 & 3

As a player,
I want enemies in System 2 and System 3 to be significantly stronger than System 1,
So that my increasing power is balanced by meaningful challenge progression.

**Acceptance Criteria:**

**Given** gameConfig.js defines ENEMY_SCALING_PER_SYSTEM
**When** the configuration is set
**Then** System 1 has a scaling multiplier of 1.0 (base difficulty)
**And** System 2 has multipliers:
  - hp: 1.6 (60% more HP)
  - damage: 1.5 (50% more damage)
  - speed: 1.3 (30% faster)
  - xpReward: 1.4 (40% more XP to compensate)
**And** System 3 has multipliers:
  - hp: 2.5 (150% more HP)
  - damage: 2.2 (120% more damage)
  - speed: 1.6 (60% faster)
  - xpReward: 2.0 (100% more XP)

**Given** the player enters System 2
**When** enemies spawn
**Then** all enemy base stats (from enemyDefs.js) are multiplied by ENEMY_SCALING_PER_SYSTEM[2]
**And** a FODDER_BASIC with base hp=20 now has hp=32 in System 2
**And** a FODDER_BASIC with base damage=5 now has damage=7.5 in System 2

**Given** the player enters System 3
**When** enemies spawn
**Then** all enemy stats are multiplied by ENEMY_SCALING_PER_SYSTEM[3]
**And** enemies are noticeably tankier, faster, and more dangerous

**Given** spawnSystem.js is updated
**When** spawning enemies
**Then** the system reads useLevel.currentSystem (1, 2, or 3)
**And** applies the corresponding scaling multipliers to spawned enemies
**And** the scaled stats are stored in the enemy entity data (not recalculated every tick)

**Given** enemy xpReward scaling
**When** enemies die in System 2 or 3
**Then** they drop XP orbs with scaled xpReward values
**And** the increased XP helps the player continue leveling at a reasonable pace despite higher difficulty

**Given** balancing
**When** playtesting System 2 and 3
**Then** enemies feel noticeably harder but not unfair or frustrating
**And** the player's accumulated weapons and boons make the increased difficulty manageable
**And** scaling multipliers can be tuned in gameConfig.js for balance

### Story 18.4: Run Continuity & State Management

As a developer,
I want clear state management for run-persistent vs system-specific state,
So that transitions are reliable and bugs are minimized.

**Acceptance Criteria:**

**Given** usePlayer, useWeapons, useBoons stores
**When** transitioning between systems
**Then** these stores do NOT call reset() during system transitions
**And** only specific fields are reset if needed (e.g., invulnerability timers, dash cooldown)

**Given** useLevel store
**When** transitioning to a new system
**Then** useLevel.currentSystem increments (1 → 2 → 3)
**And** useLevel.systemTimer resets to SYSTEM_TIMER
**And** useLevel.wormholeActive resets to false (new wormhole must be discovered)

**Given** useEnemies, useProjectiles, useXP stores
**When** transitioning to a new system
**Then** these stores call their reset() or clear() methods to remove System 1 entities
**And** entity pools are cleared and ready for System 2 spawning

**Given** useGame store
**When** managing system transitions
**Then** useGame tracks currentRun metadata (runStartTime, systemsCompleted, totalKills, totalFragments)
**And** this metadata persists across systems and is displayed on game over or victory screens

**Given** localStorage (if applicable)
**When** the player exits the game mid-run
**Then** optionally save run state to localStorage for resume capability (Tier 3 feature)
**Or** run state is lost and player must restart from System 1 (acceptable for Tier 2)

**Given** debugging
**When** testing system transitions
**Then** console logs or debug UI clearly show:
  - Current system number
  - Enemy scaling multipliers applied
  - Player stats before and after tunnel upgrades
  - Persistent vs reset state fields
**And** this aids in identifying state pollution or reset bugs

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — Add ENEMY_SCALING_PER_SYSTEM object
- **Stores Layer**: usePlayer, useWeapons, useBoons — Do NOT reset on system transition
- **Stores Layer**: useLevel — Increment currentSystem, reset timer and wormhole state
- **Stores Layer**: useEnemies, useProjectiles, useXP — Clear entity pools on system transition
- **Systems Layer**: spawnSystem.js — Apply scaling multipliers based on currentSystem

**State Persistence Strategy:**
- **Persistent**: level, XP, weapons, boons, stats, HP, Fragments, score, permanent upgrades
- **Reset per system**: timer, enemies, projectiles, XP orbs, wormhole, planets (depending on design)
- **Cleared once per run**: Run starts fresh from menu, all stores reset on game over/victory

**Scaling Rationale:**
- System 2: ~50-60% harder (player has 5-10 levels of upgrades by this point)
- System 3: ~100-150% harder (player has 10-20 levels and strong synergies)
- XP scaling ensures player can continue leveling despite higher enemy HP

## Dependencies

- Story 7.3 (Tunnel Exit & System Transition) — existing system transition logic
- Story 18.3 from Epic 16 (Enemy Difficulty Scaling) — may overlap, can be merged or referenced
- usePlayer, useWeapons, useBoons, useLevel stores — existing state management
- spawnSystem.js — enemy spawning to adapt with scaling

## Success Metrics

- Player level, weapons, boons, and HP persist correctly across systems (manual testing)
- System timer resets to 10:00 in each system (visual verification)
- Enemies in System 2 feel ~50% harder, System 3 feels ~100% harder (playtest feedback)
- No state pollution bugs (player doesn't lose weapons, gain phantom boons, etc.)
- Performance remains stable across system transitions (no memory leaks)

## References

- brainstorming-session-2026-02-04.md — multi-system run design, tunnel upgrades
- Story 7.3 (Tunnel Exit & System Transition) — existing transition logic
- Hades progression design — biome-to-biome persistence with scaling difficulty
- Vampire Survivors stage progression — player power persists, enemy waves scale
