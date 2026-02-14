# Epic 19: Enemy Loot System

The player collects varied drops from defeated enemies including rare XP gems, heal gems, and Fragments, adding strategic depth and reward variety to combat.

## Epic Goals

- Enemies occasionally drop rare XP gems worth 3x standard XP
- Enemies rarely drop small heal gems that restore HP
- Enemies have a chance to drop Fragments (purple gem) for tunnel upgrades
- Lay groundwork for future item chest/loot crate system (Tier 3)
- Ensure Fragment icon in HUD and drops use consistent purple color (#cc66ff or similar)

## Epic Context

Currently, enemies only drop standard XP orbs (cyan-green glow) when defeated. The brainstorming session and PRD outlined a richer loot economy with Fragments as a persistent currency for tunnel upgrades. Adding rare XP gems, heal gems, and Fragment drops increases combat reward variance and gives players more reasons to engage with enemies beyond standard XP.

Fragment drops provide an alternative way to earn tunnel upgrade currency beyond just boss rewards, making exploration and combat more rewarding. Heal gems add a survival resource that rewards aggressive play.

## Stories

### Story 19.1: Rare XP Gem Drops

As a player,
I want enemies to occasionally drop rare XP gems worth significantly more experience,
So that I'm rewarded for staying engaged in combat and have exciting "jackpot" moments.

**Acceptance Criteria:**

**Given** an enemy dies
**When** the death is processed
**Then** there is a 8-12% chance (configurable in gameConfig.js as XP_GEM_RARE_DROP_CHANCE) that a rare XP gem drops instead of a standard XP orb

**Given** a rare XP gem drops
**When** it spawns
**Then** the gem is worth 3x the enemy's base xpReward (e.g., FODDER_BASIC drops a gem worth 36 XP instead of 12)
**And** the gem has a distinct visual appearance (larger, golden-yellow glow, sparkle particles)

**Given** the rare XP gem is rendered
**When** XPOrbRenderer displays it
**Then** the gem uses a different color/material than standard orbs (gold #ffdd00 or bright yellow)
**And** the gem has a subtle pulse or sparkle effect to distinguish it from standard orbs
**And** the gem uses the same InstancedMesh system as standard orbs for performance

**Given** the player collects a rare XP gem
**When** pickup collision is detected
**Then** the XP value (3x base) is added to usePlayer.currentXP
**And** a distinct sound effect plays (higher pitch or "ding" sound different from standard XP pickup)
**And** a brief visual feedback appears (sparkle burst, "+36 XP" floating text optional)

**Given** rare XP gems and XP magnetization (Story 11.1)
**When** the player is within magnetization radius
**Then** rare XP gems are also magnetized and move toward the player
**And** rare gems use the same magnetization radius and speed as standard orbs

### Story 19.2: Heal Gem Drops

As a player,
I want enemies to rarely drop small heal gems that restore my HP,
So that I have an additional survival resource and am rewarded for aggressive play.

**Acceptance Criteria:**

**Given** an enemy dies
**When** the death is processed
**Then** there is a 3-5% chance (configurable in gameConfig.js as HEAL_GEM_DROP_CHANCE) that a heal gem drops

**Given** a heal gem drops
**When** it spawns
**Then** the gem restores a fixed amount of HP (e.g., HEAL_GEM_RESTORE_AMOUNT = 15-20 HP)
**And** the gem has a distinct visual appearance (red or pink glow, heart shape optional, pulse effect)

**Given** the heal gem is rendered
**When** it appears on the field
**Then** the gem uses a red (#ff3366) or pink (#ff66aa) color to distinguish it from XP orbs
**And** the gem has a gentle pulse animation (scale 0.9 → 1.1, 1-second loop)
**And** the gem uses InstancedMesh or a simple mesh for efficient rendering

**Given** the player collects a heal gem
**When** pickup collision is detected
**Then** usePlayer.currentHP increases by HEAL_GEM_RESTORE_AMOUNT
**And** currentHP is capped at maxHP (no overhealing)
**And** a distinct sound effect plays (soft chime or "heal" sound)
**And** visual feedback appears (green "+20 HP" floating text optional, heal particle burst)

**Given** heal gems on the field
**When** the player is at full HP
**Then** heal gems remain on the field (not auto-consumed)
**And** the player can collect them later if HP drops
**Or** (alternative design) heal gems despawn after 15-20 seconds if not collected

**Given** heal gem magnetization
**When** the player is within pickup radius
**Then** heal gems are attracted toward the player (same radius as XP orbs)
**And** heal gems move at the same magnetization speed as XP orbs

### Story 19.3: Fragment Drops

As a player,
I want enemies to sometimes drop Fragments (purple gems) that I can spend on permanent upgrades in the tunnel,
So that I earn tunnel currency through combat and have more agency over my progression.

**Acceptance Criteria:**

**Given** an enemy dies
**When** the death is processed
**Then** there is a 10-15% chance (configurable in gameConfig.js as FRAGMENT_DROP_CHANCE) that a Fragment gem drops

**Given** a Fragment gem drops
**When** it spawns
**Then** the gem is worth 1-3 Fragments (configurable, can scale with enemy type or system level)
**And** the gem has a distinct purple visual (#cc66ff or #aa66ff glow, hexagonal or crystal shape optional)

**Given** the Fragment gem is rendered
**When** it appears on the field
**Then** the gem uses a purple color matching the UI Fragment icon (#cc66ff)
**And** the gem has a distinct shape or particle effect (sparkles, rotating crystal)
**And** the gem is easily distinguishable from XP orbs (yellow/cyan) and heal gems (red/pink)

**Given** the player collects a Fragment gem
**When** pickup collision is detected
**Then** usePlayer.totalFragments (or useGame.totalFragments) increases by the gem's Fragment value
**And** a distinct sound effect plays (crystalline chime, different from XP and heal pickups)
**And** visual feedback appears (purple sparkle burst, "+2 ◆" floating text optional)

**Given** Fragment gem magnetization
**When** the player is within pickup radius
**Then** Fragment gems are attracted toward the player
**And** Fragment gems move at the same magnetization speed as other collectibles

**Given** the HUD displays Fragments
**When** the player collects a Fragment gem
**Then** the Fragment count in the top stats display (Story 10.2) updates immediately
**And** the Fragment icon in the HUD is purple (#cc66ff), not blue

### Story 19.4: Loot Visual Consistency & Drop Pool Management

As a developer,
I want loot drop logic centralized and visuals consistent across all collectible types,
So that the system is maintainable and players can easily distinguish loot types.

**Acceptance Criteria:**

**Given** lootSystem.js (new system file) is created
**When** an enemy dies
**Then** lootSystem.rollDrops(enemy) is called
**And** the function determines which loot items to spawn based on drop chances
**And** the function spawns the appropriate collectibles (XP orb, rare XP gem, heal gem, Fragment gem)

**Given** drop chances are configured
**When** gameConfig.js is updated
**Then** a LOOT_DROP_CHANCES section exists with:
  - XP_GEM_RARE_DROP_CHANCE: 0.10 (10%)
  - HEAL_GEM_DROP_CHANCE: 0.04 (4%)
  - FRAGMENT_DROP_CHANCE: 0.12 (12%)
  - LOOT_DROP_RATES can vary by enemy type (e.g., bosses have higher Fragment drop chance)

**Given** multiple loot types
**When** drop rolls are calculated
**Then** drops are independent (an enemy can drop both a rare XP gem AND a Fragment if both rolls succeed)
**Or** (alternative design) drops are mutually exclusive (one roll determines a single drop type with weighted probabilities)
**And** the chosen approach is clearly documented in lootSystem.js

**Given** loot visual design
**When** all collectibles are on screen
**Then** each type is immediately distinguishable by color:
  - Standard XP orb: cyan-green (#00ffcc)
  - Rare XP gem: golden-yellow (#ffdd00)
  - Heal gem: red-pink (#ff3366)
  - Fragment gem: purple (#cc66ff)
**And** shapes, sizes, or particle effects further differentiate types

**Given** loot rendering
**When** multiple collectible types exist
**Then** each type uses its own InstancedMesh or rendering system
**And** all collectibles use object pooling for performance
**And** the game maintains 60 FPS with 50+ mixed collectibles on screen

**Given** Fragment icon in HUD
**When** the Fragment count is displayed (Story 10.2)
**Then** the icon uses the same purple color (#cc66ff) as Fragment gem drops
**And** the color is consistent across HUD, tunnel UI, and in-game drops

### Story 19.5: Loot System Extensibility & Future Chest Preparation

As a developer,
I want the loot system architected to easily support future item types and loot crates,
So that adding item chests or new loot types (Tier 3) requires minimal refactoring.

**Acceptance Criteria:**

**Given** lootSystem.js architecture
**When** it is designed
**Then** the system uses a loot table pattern with configurable drop pools
**And** new loot types can be added by defining them in lootDefs.js and updating drop pool configs

**Given** lootDefs.js (new data file) is created
**When** loot definitions are structured
**Then** each loot type has:
  - id (e.g., 'XP_ORB_RARE', 'HEAL_GEM', 'FRAGMENT_GEM')
  - value (XP amount, HP restore amount, Fragment count)
  - visual config (color, size, particle effect)
  - pickup sound
**And** the structure is consistent and easily extensible

**Given** future item chest system
**When** planning extensibility
**Then** lootSystem.spawnLoot(position, lootId) is a generic spawn function
**And** chests (Tier 3) can call spawnLoot() to drop weapons, boons, or special items
**And** the collectible rendering system can handle new entity types without major refactoring

**Given** rare enemy variants (future enhancement)
**When** considering elite enemies or mini-bosses
**Then** lootSystem supports per-enemy drop rate overrides
**And** elite enemies can have guaranteed Fragment drops or higher rare XP gem rates

**Given** boss loot (existing)
**When** bosses are defeated
**Then** bosses already drop Fragments as a guaranteed reward (Story 6.3)
**And** the boss Fragment reward is separate from random loot drops (boss gives bulk Fragments, combat enemies give small Fragment gems)

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — Add LOOT_DROP_CHANCES, HEAL_GEM_RESTORE_AMOUNT, XP_GEM_MULTIPLIER
- **Data Layer**: lootDefs.js (new) — Define loot types with visual and value configs
- **Systems Layer**: lootSystem.js (new) — Centralized drop roll logic, spawn functions
- **Stores Layer**: useXP (or equivalent) — Track and manage collectibles (XP orbs, gems, Fragments)
- **Rendering Layer**: CollectibleRenderer.jsx (adapt XPOrbRenderer) — Render all loot types via InstancedMesh

**Performance Budget:**
- 50-100 collectibles on screen at once (mixed XP orbs, gems, Fragments)
- InstancedMesh per collectible type (4-5 instanced meshes total)
- Object pooling for all collectibles (no GC pressure)
- Particle effects per collectible type: lightweight (5-10 particles per gem, reuse geometry)

**Drop Rate Balancing:**
- Rare XP gem: 10% (frequent enough to feel rewarding, rare enough to be special)
- Heal gem: 4% (scarce resource, encourages strategic HP management)
- Fragment gem: 12% (primary source of tunnel currency besides boss rewards)
- Drop rates can be tuned per enemy type (e.g., elite enemies have higher rates)

**Visual Design:**
- Color-coded for instant recognition (gold, red, purple vs cyan)
- Size variations: rare XP gems slightly larger, heal gems medium, Fragments medium-large
- Particle effects: sparkles for rare XP, pulse for heal, crystalline glow for Fragments

## Dependencies

- Story 3.1 (XP System & Orb Collection) — existing XP orb system to extend
- Story 11.1 (XP Magnetization) — magnetization applies to all collectibles
- Story 10.2 (Top Stats Display) — Fragment count display in HUD
- usePlayer store — totalFragments tracking
- XPOrbRenderer.jsx — existing rendering pattern to adapt for multiple loot types

## Success Metrics

- Rare XP gems feel rewarding and noticeable (playtest feedback)
- Heal gems provide meaningful survival resource (playtest feedback on HP recovery balance)
- Fragment drops provide steady tunnel currency income (playtest: can afford 2-3 upgrades per tunnel visit)
- All loot types are visually distinct and easy to identify (visual testing)
- Fragment icon color is consistent across HUD and drops (visual verification)
- Performance remains at 60 FPS with heavy combat and 50+ collectibles on screen (r3f-perf)

## References

- brainstorming-session-2026-02-04.md — Fragments as persistent currency
- Story 3.1 (XP System & Orb Collection) — existing XP orb mechanics
- Story 11.1 (XP Magnetization) — magnetization radius and behavior
- Story 7.2 (Fragment Upgrades & Dilemmas) — Fragment spending in tunnel
- Vampire Survivors loot variety — gold coins, chests, rare drops
- Hades Darkness/Gems — persistent currency drops from enemies
