---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflowCompleted: true
completedAt: '2026-02-06'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# three-spaceship-challenge - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for three-spaceship-challenge, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Player Control (FR1-FR5)**
FR1: Player can move the spaceship in all directions using keyboard (WASD/arrows)
FR2: Player can see the spaceship rotate smoothly toward movement direction
FR3: Player can see the spaceship bank/tilt during turns
FR4: Player can perform a dash/barrel roll to become temporarily invulnerable (Tier 2)
FR5: Player can see visual feedback when invulnerable during dash

**Combat System (FR6-FR11)**
FR6: Player's spaceship automatically fires weapons in facing direction
FR7: Player can deal damage to enemies when projectiles hit them
FR8: Player can see enemies die with visual feedback (explosion/particles)
FR9: Player can equip up to 4 weapons simultaneously (slot 1 = base weapon fixed)
FR10: Player can see weapon projectiles with distinct visuals per weapon type
FR11: Player can upgrade weapons through level-up choices (levels 1-9)

**Progression System (FR12-FR17)**
FR12: Player can gain XP by killing enemies
FR13: Player can see XP bar filling toward next level
FR14: Player can choose between weapon or boon options when leveling up
FR15: Player can equip up to 3 boons that affect all weapons globally
FR16: Player can see current HP and take damage from enemies
FR17: Player can die when HP reaches zero (game over)

**Enemy System (FR18-FR22)**
FR18: System spawns enemies progressively over time
FR19: Player can encounter different enemy types with distinct behaviors
FR20: Player can see enemies visually distinct by type
FR21: Enemies can deal damage to player on contact or via projectiles
FR22: System increases enemy spawn rate/difficulty over time

**Environment & Exploration (FR23-FR27)**
FR23: Player can navigate a space environment with visual boundaries
FR24: Player can see planets of different tiers (silver/gold/platinum) (Tier 2)
FR25: Player can scan planets by staying within their zone (Tier 2)
FR26: Player can receive rewards (weapons/boons) from scanned planets (Tier 2)
FR27: Player loses scan progress if leaving planet zone before completion (Tier 2)

**Boss Encounters (FR28-FR32) — Tier 2**
FR28: Player can find and activate a dormant wormhole
FR29: System clears all enemies with shockwave when wormhole activates
FR30: Player can fight a boss in isolated 1v1 arena
FR31: Player can see boss attack patterns (telegraphed attacks)
FR32: Player can defeat boss to complete the system

**Tunnel Hub (FR33-FR37) — Tier 2**
FR33: Player can enter wormhole tunnel between systems
FR34: Player can spend Fragments on permanent upgrades in tunnel
FR35: Player can accept or refuse dilemmas (bonus with malus)
FR36: Player can sacrifice Fragments to recover HP (Tier 3)
FR37: Player can exit tunnel to enter next system

**Game Flow & UI (FR38-FR43)**
FR38: Player can see main menu with Play option
FR39: Player can see HUD displaying HP, timer, XP, and minimap
FR40: Player can see game over screen with stats when dying
FR41: Player can see victory screen when completing all systems (Tier 2)
FR42: Player can restart from main menu after game over/victory
FR43: System enforces 10-minute timer per system (game over if time expires)

**Audio & Feedback (FR44-FR46)**
FR44: Player can hear background music during gameplay
FR45: Player can hear sound effects for weapons, hits, level-ups
FR46: Player can see visual feedback for damage taken (screen flash/shake)

### NonFunctional Requirements

**Performance (NFR1-NFR5)**
NFR1: Game maintains 60 FPS on Chrome with mid-range hardware (GTX 1060 / M1 equivalent)
NFR2: Game maintains 30+ FPS minimum during intense combat (100+ enemies on screen)
NFR3: Initial load time < 10 seconds on average broadband connection
NFR4: Scene transitions (tunnel, boss arena) complete within 2 seconds
NFR5: No frame drops during level-up selection UI

**Compatibility (NFR6-NFR9)**
NFR6: Full functionality on Chrome (latest 2 versions) — primary target
NFR7: Playable on Firefox and Safari (latest versions) — secondary target
NFR8: Graceful degradation on older browsers (error message, not crash)
NFR9: Mobile browser playable as bonus (touch controls optional)

**Reliability (NFR10-NFR12)**
NFR10: No crashes during a full 30-minute run
NFR11: Game state auto-saves to localStorage between systems (Tier 2)
NFR12: Graceful handling of browser tab unfocus (pause or continue)

**Usability (NFR13-NFR15)**
NFR13: Controls learnable within 30 seconds without tutorial
NFR14: Core gameplay understandable within first run
NFR15: UI readable at 1080p resolution minimum

### Additional Requirements

**From Architecture:**
- Starter template: Three.js Journey Template (existing project) — no initialization needed, `npm install && npm run dev`
- Tailwind CSS + PostCSS + Autoprefixer must be added to the existing setup
- Howler.js for cross-browser audio management (~10kb gzipped)
- Custom Spatial Hashing for collision detection (circle-vs-circle distance checks, not Rapier)
- Hybrid InstancedMesh (rendering) + Zustand stores (state) for entity management — Float32Array pools, object pooling
- Centralized Game Loop (`<GameLoop>` component with master useFrame) — deterministic execution order: input → movement → weapons → projectiles → collisions → damage → spawning → cleanup
- Hybrid Mount/Unmount + Asset Preload for scene management (phase-based rendering, Drei preload)
- Hybrid Critical Upfront + Lazy per Phase asset loading — critical assets <5s, preload Tier 2 assets silently during gameplay
- Vercel deployment (primary), itch.io (post-contest)
- 6-layer architecture: Config/Data → Systems → Stores → GameLoop → Rendering → UI
- Stores never import other stores — GameLoop is the sole bridge
- All gameplay constants in config/gameConfig.js — no magic numbers
- Entity definitions as plain objects in entities/ directory
- Specific naming conventions: PascalCase components, camelCase hooks/stores/utils, SCREAMING_CAPS entity IDs
- Rapier installed but unused for core gameplay — may use for visual physics (Tier 2/3) or remove

**From UX Design:**
- Keyboard-first navigation throughout all menus and modals (arrows + Enter/Space, 1/2/3/4 for level-up quick-select)
- Game over cinematic sequence: flash (100ms) → fade to black (300ms) → ship explosion (500ms) → taunt message → stats slide-up → actions
- HUD layout: HP bar top-left, timer top-right, minimap top-right corner, XP bar bottom-left, dash cooldown bottom-right, weapon slots bottom-right
- Level-up modal: 3-4 cards horizontal, gameplay paused, overlay dark 60%, cascade animation (50ms delay each)
- "Cyber Minimal" design direction: dark UI, neon effects in gameplay only
- Color system: UI palette (dark/sober) separate from 3D effects palette (saturated neon cyan/magenta)
- Typography: Inter font, tabular-nums for HUD numbers, specific size hierarchy (32px H1 → 14px small)
- Spacing unit: 4px base
- Animation timing: ease-out default (150-300ms), spring for rewards (300ms), linear for alerts
- All feedback < 100ms response time for player actions
- Responsive: Desktop-first (1920x1080 primary, 1280x720 must work)
- Accessibility: contrast > 4.5:1, focus visible ring, keyboard-navigable throughout
- UI primitives to build: Button, ProgressBar, Card, Modal, StatLine
- UI composites: HUD, LevelUpModal, GameOverScreen, MainMenu, TunnelHub (Tier 2), BossHPBar (Tier 2)
- Pre-run flow: Play → Ship Select (proto: 1 only) → Galaxy Select (proto: 1 only) → Tunnel Hub → Enter System
- Retry flow: Game Over → direct to Tunnel (skip menu), < 3 seconds to be in-game

### FR Coverage Map

FR1: Epic 1 - Ship movement (WASD/arrows)
FR2: Epic 1 - Ship rotation toward movement direction
FR3: Epic 1 - Ship banking/tilt during turns
FR4: Epic 5 - Dash/barrel roll invulnerability (Tier 2)
FR5: Epic 5 - Visual feedback during dash
FR6: Epic 2 - Auto-fire in facing direction
FR7: Epic 2 - Projectile damage to enemies
FR8: Epic 2 - Enemy death visual feedback
FR9: Epic 3 - Equip up to 4 weapons (slot 1 fixed)
FR10: Epic 3 - Distinct weapon projectile visuals
FR11: Epic 3 - Weapon upgrades via level-up (lvl 1-9)
FR12: Epic 3 - XP gain from kills
FR13: Epic 3 - XP bar display
FR14: Epic 3 - Level-up weapon/boon choice
FR15: Epic 3 - Equip up to 3 boons (global effects)
FR16: Epic 3 - HP display and damage from enemies
FR17: Epic 3 - Death when HP reaches zero
FR18: Epic 2 - Progressive enemy spawning
FR19: Epic 2 - Different enemy types with distinct behaviors
FR20: Epic 2 - Visually distinct enemies by type
FR21: Epic 2 - Enemy damage (contact + projectiles)
FR22: Epic 2 - Increasing spawn rate/difficulty over time
FR23: Epic 1 - Space environment with visual boundaries
FR24: Epic 5 - Planets with tiers (silver/gold/platinum)
FR25: Epic 5 - Planet scanning mechanic
FR26: Epic 5 - Rewards from scanned planets
FR27: Epic 5 - Scan progress lost on zone exit
FR28: Epic 6 - Find and activate dormant wormhole
FR29: Epic 6 - Shockwave clears enemies on wormhole activation
FR30: Epic 6 - Boss fight in isolated 1v1 arena
FR31: Epic 6 - Boss telegraphed attack patterns
FR32: Epic 6 - Defeat boss to complete system
FR33: Epic 7 - Enter wormhole tunnel between systems
FR34: Epic 7 - Spend Fragments on permanent upgrades
FR35: Epic 7 - Accept/refuse dilemmas (bonus with malus)
FR36: Epic 7 - Sacrifice Fragments to recover HP (Tier 3)
FR37: Epic 7 - Exit tunnel to enter next system
FR38: Epic 4 - Main menu with Play option
FR39: Epic 4 - HUD (HP, timer, XP, minimap)
FR40: Epic 4 - Game over screen with stats
FR41: Epic 4 - Victory screen (Tier 2)
FR42: Epic 4 - Restart from main menu
FR43: Epic 4 - 10-minute system timer
FR44: Epic 4 - Background music
FR45: Epic 4 - Sound effects (weapons, hits, level-ups)
FR46: Epic 4 - Visual feedback for damage (screen flash/shake)

## Epic List

### Epic 1: Ship Flight & Space Environment
The player can pilot a spaceship with smooth movement, rotation, and banking in a 3D space environment with visual boundaries. Includes project foundation setup (folder restructuring, Tailwind CSS, GameLoop skeleton, gameConfig).
**FRs covered:** FR1, FR2, FR3, FR23

### Epic 2: Combat & Enemy Waves
The player fights progressively spawning waves of enemies with auto-fire weapons, sees satisfying kill feedback, and faces increasing difficulty with distinct enemy types.
**FRs covered:** FR6, FR7, FR8, FR18, FR19, FR20, FR21, FR22

### Epic 3: Progression & Build Crafting
The player gains XP from kills, levels up to choose weapons and boons, equips up to 4 weapons and 3 boons, upgrades weapons through levels, and experiences the power fantasy of becoming increasingly powerful. Includes HP system and death.
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17

### Epic 4: Complete Game Loop & Polish
The player has a full game experience with main menu, HUD displaying all critical info, game over cinematic sequence with stats, victory screen, restart capability, 10-minute system timer, background music, sound effects, and visual damage feedback.
**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46

### Epic 5: Dash & Planet Exploration (Tier 2)
The player can perform a dash/barrel roll for temporary invulnerability as an advanced survival tool, and can discover and scan planets of different tiers to receive weapon/boon rewards.
**FRs covered:** FR4, FR5, FR24, FR25, FR26, FR27

### Epic 6: Boss Encounters & System Completion (Tier 2)
The player can find and activate a dormant wormhole, witness a shockwave clearing all enemies, fight a boss in an isolated 1v1 arena with telegraphed attack patterns, and defeat the boss to complete the system.
**FRs covered:** FR28, FR29, FR30, FR31, FR32

### Epic 7: Tunnel Hub & Multi-System Progression (Tier 2/3)
The player enters the wormhole tunnel between systems, spends Fragments on permanent upgrades, faces dilemmas (bonus with malus), optionally sacrifices Fragments for HP recovery, and exits to enter the next system.
**FRs covered:** FR33, FR34, FR35, FR36, FR37

## Epic 1: Ship Flight & Space Environment

The player can pilot a spaceship with smooth movement, rotation, and banking in a 3D space environment with visual boundaries. Includes project foundation setup.

### Story 1.1: Project Foundation & Architecture Setup

As a developer,
I want the project restructured to match the target architecture with all foundational configs in place,
So that all future stories can be built on a consistent, well-organized codebase.

**Acceptance Criteria:**

**Given** the existing Three.js Journey template project
**When** the project setup is complete
**Then** the src/ directory matches the target structure (stores/, hooks/, systems/, entities/, scenes/, renderers/, ui/, ui/primitives/, effects/, shaders/, audio/, config/)
**And** Tailwind CSS + PostCSS + Autoprefixer are installed and configured with the game design tokens (colors, fonts, spacing, animations from UX spec)
**And** config/gameConfig.js exists with initial constants (SYSTEM_TIMER, PLAYER_BASE_HP, PLAYER_BASE_SPEED, MAX_ENEMIES_ON_SCREEN, SPATIAL_HASH_CELL_SIZE, etc.)
**And** config/assetManifest.js exists with the priority-categorized asset structure (critical, gameplay, tier2)
**And** GameLoop.jsx exists as a skeleton component with a master useFrame and commented tick order (input → movement → weapons → projectiles → collisions → damage → spawning → cleanup)
**And** empty entity definition files exist (weaponDefs.js, enemyDefs.js, boonDefs.js, planetDefs.js) following the plain object pattern from Architecture
**And** store skeletons exist for usePlayer.jsx, useEnemies.jsx, useWeapons.jsx, useBoons.jsx, useLevel.jsx with initial state and empty tick() methods
**And** existing stores (useGame, useCameraStore, useControlsStore) and hooks are preserved in their new locations
**And** Experience.jsx is updated with phase-based scene routing (menu, gameplay, boss, tunnel, gameOver)
**And** `npm run dev` starts successfully with no errors
**And** Howler.js is installed as a dependency

### Story 1.2: Ship Movement, Rotation & Banking

As a player,
I want to move my spaceship smoothly in all directions using WASD or arrow keys, with the ship rotating toward my movement direction and banking during turns,
So that piloting feels responsive, fluid, and visually satisfying.

**Acceptance Criteria:**

**Given** the player is in the gameplay scene
**When** the player presses WASD or arrow keys
**Then** the spaceship moves in the corresponding direction at PLAYER_BASE_SPEED
**And** the spaceship rotates smoothly toward the movement direction (~200ms interpolation for 180°)
**And** the spaceship banks/tilts visibly during turns, proportional to turn sharpness
**And** input-to-visible-movement latency is < 16ms (1 frame at 60 FPS)

**Given** the player releases all movement keys
**When** the spaceship decelerates
**Then** there is a slight overshoot then stabilization (weight feel)
**And** the ship returns to level (no banking) when stationary

**Given** the player is moving
**When** the camera follows the ship
**Then** the camera follows with smooth interpolation (top-down follow)
**And** the ship remains centered or near-center of the viewport

**Given** the existing useHybridControls and usePlayerMovement hooks
**When** they are adapted for gameplay
**Then** input is read via useControlsStore and movement is computed in usePlayer.tick() called by GameLoop

### Story 1.3: Space Environment & Boundaries

As a player,
I want to navigate a visually rich space environment with clear boundaries,
So that I feel immersed in a 3D space world and understand the playable area.

**Acceptance Criteria:**

**Given** the player is in the gameplay scene
**When** the scene loads
**Then** the environment displays a space skybox/background with stars
**And** the play area has defined boundaries

**Given** the player approaches the edge of the play area
**When** the ship gets close to a boundary
**Then** the player sees visual feedback indicating they are near the limit (grid lines, color shift, or barrier effect)
**And** the ship cannot move beyond the boundary

**Given** the environment is rendering
**When** the player looks around
**Then** performance remains at 60 FPS with the environment rendering
**And** the GameplayScene.jsx composes the environment renderer + player ship + lighting

## Epic 2: Combat & Enemy Waves

The player fights progressively spawning waves of enemies with auto-fire weapons, sees satisfying kill feedback, and faces increasing difficulty with distinct enemy types.

### Story 2.1: Spatial Hashing & Collision System

As a developer,
I want a performant spatial hashing and collision detection system in place,
So that all combat interactions (projectile hits, enemy contact damage) can be resolved efficiently even with 100+ entities.

**Acceptance Criteria:**

**Given** the systems/ directory
**When** spatialHash.js is implemented
**Then** it provides a grid-based spatial partitioning system with configurable cell size (SPATIAL_HASH_CELL_SIZE from gameConfig)
**And** it supports insert, update, clear, and query-nearby operations
**And** it works with any entity that has a position (x, z) and radius

**Given** spatialHash.js is in place
**When** collisionSystem.js is implemented
**Then** it provides circle-vs-circle collision queries using the spatial hash
**And** it returns collision pairs (entity A, entity B) for the GameLoop to process
**And** it supports different collision categories (player-enemy, projectile-enemy, enemy-player)

**Given** 100+ entities are registered in the spatial hash
**When** collision queries run each frame
**Then** performance remains within frame budget (< 2ms for collision phase)

### Story 2.2: Enemy Spawning & Rendering

As a player,
I want to see waves of enemies spawning progressively with increasing difficulty, each type visually distinct,
So that the game feels dynamic, challenging, and visually readable.

**Acceptance Criteria:**

**Given** the player is in the gameplay scene
**When** gameplay begins
**Then** enemies start spawning outside the visible area and move toward the player
**And** spawn rate increases over time following a difficulty curve defined in spawnSystem.js

**Given** enemy definitions exist in enemyDefs.js
**When** enemies spawn
**Then** at least 2 enemy types are available (e.g., FODDER_BASIC chase, FODDER_FAST chase) with distinct stats (hp, speed, damage, xpReward)
**And** each enemy type is visually distinct (different model or color)

**Given** enemies are rendering
**When** up to MAX_ENEMIES_ON_SCREEN enemies exist
**Then** enemies render via InstancedMesh (EnemyRenderer.jsx) with one draw call per type
**And** enemy state (positions, HP) is stored in Float32Array pools in useEnemies store
**And** the EnemyRenderer syncs instance matrices from store data each frame via useFrame

**Given** the useEnemies store
**When** tick(delta) is called by GameLoop
**Then** enemies move according to their behavior (chase = move toward player position)
**And** the spatial hash is updated with current enemy positions

### Story 2.3: Auto-Fire & Projectile System

As a player,
I want my spaceship to automatically fire weapons in the direction it faces,
So that I can focus on movement and survival while dealing damage to enemies.

**Acceptance Criteria:**

**Given** the player is in the gameplay scene with a base weapon equipped
**When** the weapon cooldown expires
**Then** a projectile spawns from the ship's position, traveling in the ship's facing direction at the weapon's baseSpeed
**And** firing is automatic with no player input required

**Given** projectiles are firing
**When** projectiles are rendered
**Then** they display with distinct visuals matching the weapon type (projectileType from weaponDefs)
**And** projectiles render via InstancedMesh (ProjectileRenderer.jsx) with object pooling

**Given** projectileSystem.js is implemented
**When** tick(delta) is called
**Then** projectiles move based on their speed and direction each frame
**And** projectiles are removed when they exceed their lifetime or leave the play area
**And** removed projectiles return to the pool for reuse (no GC pressure)

**Given** the useWeapons store
**When** it is initialized
**Then** weaponDefs.js contains at least the LASER_FRONT base weapon with baseDamage, baseCooldown, baseSpeed
**And** the store tracks active weapons and their cooldown timers

### Story 2.4: Combat Resolution & Feedback

As a player,
I want to see enemies die with satisfying visual feedback when my projectiles hit them, and take damage when enemies touch me,
So that combat feels impactful and I understand the results of my actions.

**Acceptance Criteria:**

**Given** a projectile collides with an enemy (detected by collisionSystem)
**When** the GameLoop processes the collision
**Then** the enemy takes damage equal to the weapon's baseDamage
**And** if enemy HP reaches zero, the enemy is marked as dead and removed from the active pool

**Given** an enemy dies
**When** the death is processed
**Then** particle effects play at the death location (explosion/particles via ParticleRenderer)
**And** the visual feedback is immediate (< 50ms)

**Given** an enemy collides with the player (contact damage)
**When** the collision is detected
**Then** the player takes damage equal to the enemy's damage value
**And** the enemy is not destroyed by contact (continues to deal damage while overlapping)

**Given** the player takes damage
**When** HP is reduced
**Then** usePlayer store updates currentHP
**And** damage feedback is registered (to be displayed by HUD in Epic 4)

### Story 2.7: Hitbox Tuning & Hit Visual Feedback

As a player,
I want enemy collision radii to match their visual size and see a visible reaction when my projectiles hit an enemy,
So that combat feels responsive and I can tell my shots are connecting.

**Acceptance Criteria:**

**Given** enemies are rendered with GLB models scaled to [3,3,3] or [2.5,2.5,2.5]
**When** the collision system checks for projectile-enemy overlap
**Then** the enemy collision radius is proportional to the visible model size (not the tiny base radius of 0.5)
**And** projectiles that visually overlap the enemy model register as hits

**Given** a projectile hits an enemy but does not kill it
**When** the damage is applied
**Then** the enemy displays a brief visual flash or color change (hit feedback)
**And** the feedback is immediate (< 50ms) and clearly distinguishable from idle state

### Story 2.8: Player Rotation Responsiveness

As a player,
I want my ship to face my input direction quickly when using keyboard controls,
So that my projectiles fire where I intend and the ship feels snappy to control.

**Acceptance Criteria:**

**Given** the player presses a direction key (8 discrete directions on keyboard)
**When** the ship rotates toward the input direction
**Then** the ship reaches the target yaw significantly faster than current (PLAYER_ROTATION_SPEED tuning)
**And** the smooth visual interpolation (lerp) and banking animation are preserved
**And** the ship's movement direction already matches input (velocity is unchanged)

## Epic 3: Progression & Build Crafting

The player gains XP from kills, levels up to choose weapons and boons, equips up to 4 weapons and 3 boons, upgrades weapons through levels, and experiences the power fantasy of becoming increasingly powerful. Includes HP system and death.

### Story 3.1: XP System & Orb Collection

As a player,
I want enemies to drop XP orbs when they die that I collect by flying near them, filling my XP bar toward the next level,
So that I feel rewarded for every kill and see tangible progress.

**Acceptance Criteria:**

**Given** an enemy dies
**When** the death is processed
**Then** an XP orb spawns at the enemy's death location with a value equal to the enemy's xpReward

**Given** XP orbs exist on the field
**When** the player's ship moves within pickup radius of an orb
**Then** the orb is collected automatically (proximity pickup via collisionSystem)
**And** the player's XP increases by the orb's value in usePlayer store

**Given** XP orbs are on screen
**When** they are rendered
**Then** they display via InstancedMesh (XPOrbRenderer.jsx) with a distinct visual (cyan-green glow from UX color spec)
**And** collected orbs return to the object pool for reuse

**Given** the player has collected XP
**When** XP reaches the threshold for the current level (XP_LEVEL_CURVE from gameConfig)
**Then** a level-up is triggered (to be handled by Story 3.2)
**And** XP resets for the next level threshold

### Story 3.2: Level-Up System & Choice UI

As a player,
I want the game to pause when I level up and present me with 3-4 upgrade choices that I can quickly select with keyboard,
So that I can make meaningful build decisions without losing gameplay momentum.

**Acceptance Criteria:**

**Given** the player's XP reaches the level threshold
**When** a level-up triggers
**Then** the gameplay pauses (GameLoop stops ticking)
**And** a level-up modal appears with overlay dark 60% over the frozen gameplay
**And** the modal displays "LEVEL UP!" title and 3-4 choice cards

**Given** the level-up modal is displayed
**When** progressionSystem.js generates the choice pool
**Then** options include a mix of new weapons (if slots available), weapon upgrades (for equipped weapons), and new boons (if slots available)
**And** each card shows: icon, name, level (or "NEW"), and short description

**Given** the choice cards are displayed
**When** the player presses 1, 2, 3, or 4
**Then** the corresponding choice is applied immediately
**And** the modal closes with fade-out animation
**And** gameplay resumes instantly

**Given** the modal animation
**When** it appears
**Then** the modal fades in and cards appear in cascade (50ms delay each) per UX spec
**And** no frame drops occur during the modal display (NFR5)

### Story 3.3: Weapon Slots & Upgrades

As a player,
I want to equip up to 4 weapons with distinct visuals and upgrade them through levels,
So that my firepower grows and I can craft diverse offensive builds.

**Acceptance Criteria:**

**Given** the useWeapons store
**When** the game starts
**Then** slot 1 is pre-equipped with LASER_FRONT (base weapon, cannot be removed)
**And** slots 2-4 are empty and available for new weapons

**Given** the player selects a new weapon from level-up
**When** an empty slot exists
**Then** the weapon is added to the next available slot
**And** the weapon starts firing automatically alongside other equipped weapons

**Given** the player selects a weapon upgrade from level-up
**When** the upgrade is applied
**Then** the weapon's stats update according to the upgrade curve in weaponDefs.js (damage, cooldown improvements per level, up to level 9)
**And** the visual appearance of projectiles may change at certain upgrade thresholds

**Given** weaponDefs.js
**When** it contains weapon definitions
**Then** at least 3-4 weapon types exist with distinct projectileType, baseDamage, baseCooldown, baseSpeed, and upgrade curves
**And** each weapon type produces visually distinct projectiles via ProjectileRenderer

**Given** multiple weapons are equipped
**When** the GameLoop ticks
**Then** each weapon fires independently based on its own cooldown timer

### Story 3.4: Boon System

As a player,
I want to equip up to 3 boons that provide global passive effects to all my weapons,
So that I can enhance my build with synergistic bonuses and feel increasingly powerful.

**Acceptance Criteria:**

**Given** the useBoons store
**When** the game starts
**Then** no boons are equipped and 3 slots are available

**Given** the player selects a boon from level-up
**When** an empty boon slot exists
**Then** the boon is added to the active boons
**And** its effect is immediately computed and applied globally

**Given** boonDefs.js contains boon definitions
**When** boons are defined
**Then** at least 3-4 boon types exist (e.g., SPEED_BOOST, DAMAGE_AMP, CRIT_CHANCE, COOLDOWN_REDUCTION) with clear effect values
**And** each boon definition includes stacking rules (if the same boon is offered again at higher level)

**Given** active boons exist
**When** useBoons computes modifiers
**Then** the computed modifiers (damage multiplier, speed multiplier, cooldown multiplier, etc.) are available for GameLoop to pass to useWeapons.tick()
**And** boon effects apply to ALL equipped weapons globally

### Story 3.5: HP System & Death

As a player,
I want to see my current HP, take damage from enemies, and trigger game over when HP reaches zero,
So that I understand the stakes and feel the tension of survival.

**Acceptance Criteria:**

**Given** the usePlayer store
**When** the game starts
**Then** currentHP is set to PLAYER_BASE_HP (from gameConfig)
**And** maxHP equals PLAYER_BASE_HP

**Given** the player takes damage (from enemy contact in Epic 2)
**When** currentHP is reduced
**Then** the new HP value is stored in usePlayer
**And** HP cannot go below 0

**Given** currentHP reaches 0
**When** the death is detected
**Then** useGame transitions to the "gameOver" phase
**And** the GameLoop stops ticking
**And** the game over sequence is triggered (to be displayed by Epic 4)

**Given** the player is alive
**When** currentHP is above 0
**Then** gameplay continues normally
**And** HP data is available for HUD display (Epic 4)

## Epic 4: Complete Game Loop & Polish

The player has a full game experience with main menu, HUD displaying all critical info, game over cinematic sequence with stats, victory screen, restart capability, 10-minute system timer, background music, sound effects, and visual damage feedback.

### Story 4.1: Main Menu & Game Phase Management

As a player,
I want to see a main menu when the game loads and have the game manage transitions between phases smoothly,
So that I have a polished entry point and the game feels complete.

**Acceptance Criteria:**

**Given** the game loads
**When** the main menu is displayed
**Then** it shows the game title, "PLAY" option, and optionally "OPTIONS" and "CREDITS"
**And** a 3D background scene renders (MenuScene.jsx — idle ship + stars)
**And** menu items are navigable via keyboard (arrows ↑↓ + Enter) and clickable with mouse

**Given** the player selects "PLAY"
**When** the transition begins
**Then** the game transitions to the gameplay phase with a fade animation (300ms per UX spec)
**And** useGame phase updates to "gameplay"

**Given** useGame manages phases
**When** phases are defined
**Then** the following phases exist: menu, gameplay, levelUp, boss, tunnel, gameOver, victory
**And** Experience.jsx renders the correct scene and UI based on the current phase

**Given** the 10-minute system timer (FR43)
**When** gameplay begins
**Then** the timer starts counting down from SYSTEM_TIMER (600 seconds)
**And** when the timer reaches 0, useGame transitions to "gameOver" phase

**Given** the player is on the game over or victory screen
**When** the player selects restart
**Then** all game stores reset to initial state
**And** the game returns to the appropriate phase (menu or gameplay)

### Story 4.2: Gameplay HUD

As a player,
I want to see critical game information displayed clearly during gameplay,
So that I can make informed survival decisions at a glance.

**Acceptance Criteria:**

**Given** the player is in the gameplay phase
**When** the HUD renders
**Then** HP bar displays in the top-left (red, segments or continuous bar from ProgressBar primitive)
**And** system timer displays in the top-right (white, tabular-nums, countdown format MM:SS)
**And** minimap displays in the top-right corner (semi-transparent, showing play area boundaries and player position)
**And** XP bar displays in the bottom-left (green/cyan, with current level number)
**And** weapon slots display in the bottom-right (3-4 icons, equipped weapons highlighted)

**Given** player HP drops below 25%
**When** the HUD updates
**Then** the HP bar pulses red
**And** a subtle red vignette appears on screen edges

**Given** the XP bar is nearly full
**When** the player is close to leveling up
**Then** the XP bar subtly pulses to indicate imminent level-up

**Given** the HUD is rendering
**When** gameplay is active
**Then** all HUD elements use the Tailwind design tokens (game-bg, game-danger, game-success colors)
**And** text uses Inter font with tabular-nums for numbers
**And** HUD elements use clamp() for responsive sizing (readable at 1080p minimum, NFR15)

### Story 4.3: Game Over Cinematic Screen

As a player,
I want to experience a cinematic game over sequence with my run stats and quick options to retry or return to menu,
So that death feels dramatic rather than frustrating and I'm motivated to try again.

**Acceptance Criteria:**

**Given** the player dies (HP = 0) or the timer expires
**When** the game over sequence begins
**Then** a white flash appears (100ms)
**Then** the screen fades to black (300ms) with the ship remaining visible
**Then** the ship explodes/fades (500ms)
**Then** a taunt message fades in (randomly selected from a pool: "THE GALAXY IS TOO BIG FOR YOU", "SPACE DOESN'T FORGIVE", "THE VOID CLAIMS ANOTHER", etc.)
**Then** run stats slide up (200ms after message): time survived, enemies killed, level reached, weapons equipped
**Then** action buttons appear: [R] RETRY, [M] MENU

**Given** the game over screen is displayed
**When** the player presses R
**Then** the game resets stores and transitions to gameplay (< 3 seconds to be in-game)

**Given** the game over screen is displayed
**When** the player presses M
**Then** the game returns to the main menu

**Given** the stats display
**When** stats are rendered
**Then** they use StatLine components with label-value aligned layout and tabular-nums
**And** keyboard shortcuts [R] and [M] are displayed alongside clickable buttons

### Story 4.4: Victory Screen

As a player,
I want to see a victory screen when I complete all systems,
So that I feel accomplished and my run feels complete.

**Acceptance Criteria:**

**Given** the player completes all available systems (boss defeated in final system)
**When** the victory condition is met
**Then** useGame transitions to "victory" phase

**Given** the victory screen displays
**When** it renders
**Then** it shows a congratulatory message
**And** displays full run stats (total time, total kills, final level, weapons, boons)
**And** provides options: [R] NEW RUN, [M] MENU
**And** keyboard and mouse navigation work

### Story 4.5: Audio System

As a player,
I want to hear background music during gameplay and sound effects for key actions,
So that the game feels immersive and every action has satisfying audio feedback.

**Acceptance Criteria:**

**Given** the audioManager.js wraps Howler.js
**When** it is initialized
**Then** it provides methods to play, stop, loop music and trigger one-shot SFX
**And** it manages volume levels per category (music, SFX, UI) per UX audio patterns
**And** critical sounds (damage, level-up) are never covered by music

**Given** the player is on the main menu
**When** the menu loads
**Then** menu background music starts looping

**Given** the player enters gameplay
**When** the phase transitions
**Then** gameplay music crossfades from menu music
**And** weapon fire SFX plays on each shot
**And** enemy death SFX plays on kills
**And** level-up SFX plays when leveling up
**And** damage SFX plays when player takes damage

**Given** audio assets
**When** they are loaded
**Then** critical audio (menu music, core SFX) loads with the critical asset manifest
**And** gameplay music loads with the gameplay asset manifest

### Story 4.6: Visual Damage Feedback

As a player,
I want to see screen flash and shake when I take damage,
So that hits feel impactful and I have immediate visual confirmation of danger.

**Acceptance Criteria:**

**Given** the player takes damage
**When** the damage is applied
**Then** a brief red screen flash appears (100ms, subtle opacity)
**And** the camera shakes briefly (100-200ms, linear easing, small amplitude)
**And** the feedback is immediate (< 50ms after damage event)

**Given** the player takes critical damage (HP drops below 25%)
**When** low HP state activates
**Then** a persistent red vignette effect appears at screen edges
**And** the vignette pulses (500ms loop, ease-in-out)

**Given** visual effects are rendering
**When** multiple damage events occur rapidly
**Then** effects stack gracefully without becoming disorienting
**And** performance remains at 60 FPS

## Epic 5: Dash & Planet Exploration (Tier 2)

The player can perform a dash/barrel roll for temporary invulnerability as an advanced survival tool, and can discover and scan planets of different tiers to receive weapon/boon rewards.

### Story 5.1: Dash / Barrel Roll

As a player,
I want to perform a dash/barrel roll that makes me temporarily invulnerable with a clear cooldown indicator,
So that I have an active survival skill that creates clutch moments.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the player presses Space or Shift
**Then** if dash is off cooldown, the ship performs a barrel roll animation
**And** the player becomes invulnerable for DASH_DURATION (0.3s from gameConfig)
**And** a magenta trail visual effect displays during the dash
**And** a distinctive whoosh sound plays

**Given** the dash completes
**When** the invulnerability ends
**Then** the cooldown starts (DASH_COOLDOWN, 3s from gameConfig)
**And** the dash cooldown indicator in the HUD shows remaining time (radial or bar)

**Given** the dash cooldown finishes
**When** it reaches 0
**Then** a subtle glow appears on the dash icon in HUD
**And** a subtle "ding" sound plays to signal readiness

**Given** the dash is on cooldown
**When** the player presses Space or Shift
**Then** nothing happens (input ignored, no feedback needed)

### Story 5.2: Planet Placement & Rendering

As a player,
I want to see planets of different tiers scattered in the space environment,
So that I have points of interest to discover and explore.

**Acceptance Criteria:**

**Given** the gameplay scene loads
**When** planets are placed
**Then** planets of different tiers (silver, gold, platinum) are positioned in the play area according to planetDefs.js
**And** each tier has a visually distinct appearance (size, color, effects)

**Given** planets are in the scene
**When** the player navigates near a planet
**Then** the planet is visible on the minimap
**And** the planet renders with appropriate 3D model/visual from the asset manifest

**Given** the useLevel store
**When** it tracks planet state
**Then** each planet has: position, tier, scanned status, scan progress

### Story 5.3: Planet Scanning & Rewards

As a player,
I want to scan planets by staying within their zone to receive weapon or boon rewards based on planet tier,
So that exploration is rewarded and I have another strategic layer to my build.

**Acceptance Criteria:**

**Given** the player enters a planet's scanning zone
**When** the player remains within the zone
**Then** a scan progress indicator appears (0% to 100%)
**And** scan progress fills over time (speed varies by tier — silver fastest, platinum slowest)

**Given** scan progress reaches 100%
**When** the scan completes
**Then** the player receives a reward (weapon or boon) based on the planet tier (better tier = better reward pool from planetDefs.js)
**And** the planet is marked as scanned (cannot be re-scanned)
**And** reward feedback plays (visual + audio)

**Given** the player leaves the planet zone before scan completes
**When** the player exits the zone radius
**Then** scan progress resets to 0 (FR27)
**And** the scan indicator disappears

**Given** scanning is in progress
**When** enemies are attacking
**Then** the player must balance staying in zone vs dodging enemies (strategic tension)

## Epic 6: Boss Encounters & System Completion (Tier 2)

The player can find and activate a dormant wormhole, witness a shockwave clearing all enemies, fight a boss in an isolated 1v1 arena with telegraphed attack patterns, and defeat the boss to complete the system.

### Story 6.1: Wormhole Discovery & Activation

As a player,
I want to find a dormant wormhole in the environment and activate it to trigger a dramatic shockwave that clears all enemies,
So that I experience a cinematic transition into the boss encounter.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the wormhole spawns (triggered by timer threshold or exploration)
**Then** a dormant wormhole appears at a specific location in the play area
**And** the wormhole is visible on the minimap

**Given** the player moves to the wormhole
**When** the player enters the activation zone
**Then** the wormhole activates with a dramatic visual effect
**And** a shockwave emanates outward clearing ALL enemies on screen (FR29)
**And** a dramatic sound effect plays
**And** the screen briefly intensifies (bloom/flash)

**Given** all enemies are cleared
**When** the shockwave completes
**Then** the game transitions to the boss phase
**And** useGame phase updates to "boss"

### Story 6.2: Boss Arena & Combat

As a player,
I want to fight a boss in an isolated 1v1 arena with telegraphed attack patterns,
So that I face a climactic challenge that tests my skills.

**Acceptance Criteria:**

**Given** the boss phase activates
**When** the boss arena loads
**Then** BossScene.jsx renders an isolated arena (different from gameplay environment)
**And** a single boss enemy spawns with its name and HP bar displayed (BossHPBar component, top center)
**And** the boss HP bar slides down with fade-in animation
**And** dramatic boss music plays

**Given** the boss is active
**When** it attacks
**Then** attack patterns are telegraphed visually before executing (warning indicators, charge-up animations)
**And** attacks use distinct orange-colored projectiles/beams (per UX color spec for boss attacks)
**And** the player can dodge attacks using movement and dash

**Given** the player attacks the boss
**When** projectiles hit the boss
**Then** the boss takes damage and the HP bar updates
**And** hit feedback is visible on the boss (flash, particles)

**Given** the boss has multiple attack phases
**When** boss HP crosses thresholds (e.g., 75%, 50%, 25%)
**Then** the boss may change attack patterns or intensify

### Story 6.3: Boss Defeat & System Completion

As a player,
I want to defeat the boss to complete the current system and trigger the transition to the next phase,
So that I feel accomplished and progress through the game.

**Acceptance Criteria:**

**Given** the boss HP reaches 0
**When** the boss is defeated
**Then** a dramatic death animation plays (large explosion, particles)
**And** the boss HP bar fades out
**And** victory music/fanfare plays

**Given** the boss is defeated
**When** the system is marked complete
**Then** if more systems remain, the game transitions to the tunnel phase (Epic 7)
**And** if this is the final system, the game transitions to victory (Story 4.4)
**And** the player receives Fragment rewards for boss defeat

**Given** the player dies during the boss fight
**When** HP reaches 0
**Then** the game over sequence triggers (Story 4.3) as normal

## Epic 7: Tunnel Hub & Multi-System Progression (Tier 2/3)

The player enters the wormhole tunnel between systems, spends Fragments on permanent upgrades, faces dilemmas (bonus with malus), optionally sacrifices Fragments for HP recovery, and exits to enter the next system.

### Story 7.1: Tunnel Entry & 3D Scene

As a player,
I want to enter the wormhole tunnel and see an immersive 3D tunnel environment,
So that the transition between systems feels dramatic and provides a moment of respiration.

**Acceptance Criteria:**

**Given** the boss is defeated and the system is complete
**When** the tunnel transition begins
**Then** a wormhole entry animation plays (800ms per UX spec)
**And** TunnelScene.jsx renders an infinite-tunnel visual with the ship heading toward the exit

**Given** the tunnel scene is active
**When** the player views it
**Then** the layout is split — 3D tunnel on the left, UI panel on the right (per UX tunnel spec)
**And** the player's current Fragment count is displayed
**And** keyboard navigation works between sections (Tab between upgrade list, dilemma, exit button)

**Given** the tunnel loads
**When** game state is checked
**Then** game state auto-saves to localStorage (NFR11)

### Story 7.2: Fragment Upgrades & Dilemmas

As a player,
I want to spend Fragments on permanent upgrades and face dilemmas with risk/reward trade-offs,
So that I make strategic decisions that shape my run between systems.

**Acceptance Criteria:**

**Given** the tunnel UI is displayed
**When** the upgrade panel renders
**Then** it shows available permanent upgrades with Fragment costs (e.g., +Attack 50◆, +Speed 30◆, +HP Max 40◆)
**And** the player can purchase upgrades by pressing the corresponding key or clicking
**And** Fragment count decreases on purchase
**And** upgrades that the player cannot afford are disabled/grayed out

**Given** a dilemma is presented
**When** the dilemma card renders
**Then** it shows a trade-off (e.g., "+30% DMG / -20% HP")
**And** the player can [Accept] or [Refuse] via keyboard or click
**And** if accepted, both the bonus and malus are applied to the player's stats
**And** if refused, no change occurs

**Given** Fragment rewards from enemies and boss
**When** Fragments are tracked
**Then** usePlayer (or useGame) tracks total Fragments accumulated during the run
**And** Fragments persist across systems within a run

### Story 7.3: Tunnel Exit & System Transition

As a player,
I want to exit the tunnel and enter the next system with my upgrades applied,
So that I continue my run with increased power in a fresh challenge.

**Acceptance Criteria:**

**Given** the player is in the tunnel
**When** the player selects "ENTER SYSTEM" (prominent exit button)
**Then** a tunnel exit animation plays (500ms fade per UX spec)
**And** the game transitions to the gameplay phase in the next system
**And** useLevel resets the system timer, enemy spawns, and difficulty curve for the new system
**And** the player retains all weapons, boons, HP, and purchased upgrades

**Given** the new system loads
**When** gameplay begins
**Then** the environment may have visual variations from the previous system (if assets allow)
**And** enemy difficulty baseline is higher than the previous system's starting difficulty
**And** a new wormhole and boss are available to discover

### Story 7.4: HP Sacrifice (Tier 3)

As a player,
I want to sacrifice Fragments to recover HP in the tunnel,
So that I can trade resources for survival when running low on health.

**Acceptance Criteria:**

**Given** the player is in the tunnel with low HP
**When** the HP sacrifice option is available
**Then** the player can spend a defined amount of Fragments to recover a portion of HP
**And** the exchange rate is displayed clearly (e.g., "50◆ → +25 HP")

**Given** the player confirms the sacrifice
**When** Fragments are spent
**Then** HP increases by the defined amount (capped at maxHP)
**And** Fragment count decreases
**And** visual/audio feedback confirms the transaction

**Given** the player has insufficient Fragments
**When** viewing the sacrifice option
**Then** the option is disabled/grayed out

## Epic 8: Enhanced Main Menu & Metagame UI

The player has access to an enriched main menu with options, credits, high score display, and an organic animated space background.

### Story 8.1: Main Menu Visual Overhaul

As a player,
I want to see an immersive and lively main menu with an organic space background featuring planets and an animated spaceship,
So that the game feels polished and engaging from the first screen.

**Acceptance Criteria:**

**Given** the game loads
**When** the main menu is displayed
**Then** the background shows a 3D space environment with planets visible in the scene
**And** planets are positioned dynamically with subtle orbital animations
**And** the player's spaceship flies through the scene on a looping path (idle patrol animation)
**And** the background feels "organic" with slow camera movement or parallax

**Given** the main menu UI
**When** menu buttons are displayed
**Then** OPTIONS button is visible and functional
**And** CREDITS button is visible and functional
**And** high score display is visible (top-right or prominent location)
**And** PLAY button remains the primary CTA (centered, largest)

**Given** the background animation
**When** it plays
**Then** performance remains at 60 FPS
**And** the ship animation loops seamlessly every 30-60 seconds
**And** lighting and atmosphere create depth and visual interest

### Story 8.2: Options Menu

As a player,
I want to adjust audio settings and clear my local save data from an options menu,
So that I have control over my game experience and can reset progress if needed.

**Acceptance Criteria:**

**Given** the player clicks OPTIONS from the main menu
**When** the options screen opens
**Then** an overlay modal appears with dark background (60% opacity)
**And** the modal displays "OPTIONS" title

**Given** the options modal is open
**When** audio controls are displayed
**Then** a master volume slider (0-100%) is available
**And** separate sliders for Music volume and SFX volume are available
**And** volume changes apply immediately with audio preview
**And** volume settings persist to localStorage

**Given** the options modal is open
**When** the clear save option is displayed
**Then** a "CLEAR LOCAL SAVE" button is visible with warning styling (red/danger)
**And** clicking it prompts a confirmation dialog ("Are you sure? This cannot be undone.")
**And** confirming clears all localStorage data (progress, high score, settings)
**And** canceling returns to options without clearing

**Given** the options modal is open
**When** the player wants to return
**Then** a BACK or CLOSE button returns to the main menu
**And** ESC key also closes the modal

### Story 8.3: Credits Screen

As a player,
I want to see credits acknowledging the ThreeJS Journey challenge and asset creators,
So that proper attribution is given to the contest and community resources.

**Acceptance Criteria:**

**Given** the player clicks CREDITS from the main menu
**When** the credits screen opens
**Then** an overlay modal appears with scrollable content

**Given** the credits content
**When** it is displayed
**Then** the top section states: "Created for the ThreeJS Journey Challenge - Spaceship"
**And** a link to https://threejs-journey.com/challenges/022-spaceship is visible
**And** credit is given to Bruno Simon for the ThreeJS Journey course

**Given** the credits content
**When** asset attribution is shown
**Then** a section titled "Assets & Resources" is present
**And** placeholder entries exist for: 3D Models, Sound Effects, Music, Textures
**And** format allows easy future updating with specific asset names and authors

**Given** the credits screen
**When** the player wants to return
**Then** a BACK button returns to the main menu
**And** ESC key also closes the modal

### Story 8.4: High Score Display & Persistence

As a player,
I want to see my personal best score prominently displayed on the main menu,
So that I feel motivated to beat my previous runs.

**Acceptance Criteria:**

**Given** the player has completed at least one run
**When** the main menu loads
**Then** the high score is displayed in a prominent location (top-right corner or dedicated panel)
**And** the display shows: "BEST RUN: [score]" or "HIGH SCORE: [score]"
**And** the score uses tabular-nums font for clean alignment

**Given** the player completes a run with a new high score
**When** the game over or victory screen is shown
**Then** a "NEW HIGH SCORE!" message is displayed with celebration animation
**And** the new score is saved to localStorage immediately
**And** the main menu updates the high score display on return

**Given** the player has never completed a run
**When** the main menu loads
**Then** the high score displays as "---" or "0" as a placeholder

**Given** the player clears their local save via options
**When** returning to the main menu
**Then** the high score resets to the placeholder state

## Epic 9: Ship Selection System

The player can choose their spaceship variant with displayed base stats before starting a run.

### Story 9.1: Ship Selection UI

As a player,
I want to select my spaceship from a grid of variants before starting a run,
So that I can choose a playstyle that fits my preferences.

**Acceptance Criteria:**

**Given** the player clicks PLAY from the main menu
**When** the ship selection screen appears
**Then** the screen layout is split: left side shows a grid of ship variants, right side shows selected ship details

**Given** the ship grid (left side)
**When** it renders
**Then** ship variants are displayed as cards in a grid (2-3 columns)
**And** each card shows: ship icon/thumbnail, ship name
**And** locked ships are grayed out with a lock icon (for future unlockable variants)
**And** at least 1 ship is unlocked by default

**Given** the player hovers or selects a ship card
**When** interaction occurs
**Then** the card highlights with visual feedback
**And** the right panel updates to show the selected ship's details

**Given** the ship selection screen
**When** the player confirms their choice
**Then** a "START" button is available (bottom-right or center-bottom)
**And** clicking START begins the gameplay with the selected ship
**And** the selected ship persists for the run

**Given** the player wants to return
**When** a BACK button is clicked
**Then** the player returns to the main menu

### Story 9.2: Ship Variants Definition & Stats Display

As a player,
I want to see detailed stats for each ship variant,
So that I can make an informed choice based on base stats.

**Acceptance Criteria:**

**Given** shipDefs.js exists
**When** ship variants are defined
**Then** at least 2-3 ship variants exist (e.g., BALANCED, GLASS_CANNON, TANK)
**And** each variant has: name, description, baseHP, baseSpeed, baseDamageMultiplier, and any unique traits

**Given** a ship is selected in the ship selection UI
**When** the right panel displays stats
**Then** the selected ship's 3D model or preview image is shown
**And** ship name and description are displayed
**And** base stats are shown in a clean StatLine format:
  - HP: [value]
  - Speed: [value]
  - Damage: [multiplier] (e.g., "1.0x" or "+10%")
**And** any unique traits are listed (e.g., "Starts with Shield Boon" or "Extra weapon slot")

**Given** stats are displayed
**When** the player views them
**Then** stats use tabular-nums for alignment
**And** tooltips or descriptions clarify what each stat affects

### Story 9.3: Ship Selection Persistence & Integration

As a player,
I want my selected ship to be used throughout my run with its stats applied,
So that my choice has meaningful impact on gameplay.

**Acceptance Criteria:**

**Given** the player selects a ship and starts a run
**When** gameplay begins
**Then** usePlayer store initializes with the selected ship's baseHP, baseSpeed, and baseDamageMultiplier
**And** the selected ship's 3D model renders in the gameplay scene

**Given** the player dies or completes a run
**When** returning to ship selection or main menu
**Then** the player can select a different ship for the next run

**Given** multiple ship variants exist
**When** balancing is implemented
**Then** each ship offers a distinct playstyle (tank, speed, damage-focused)
**And** no single ship is objectively superior in all situations

## Epic 10: HUD Overhaul & Advanced In-Game UI

The player sees a modern, comprehensive HUD inspired by Vampire Survivors with full-width XP bar, visible boon slots, stats display, enhanced minimap, and a pause menu with detailed inventory.

### Story 10.1: XP Bar Redesign (Full-Width Top)

As a player,
I want to see a highly visible XP bar spanning the full width of the screen at the very top,
So that I can instantly track my progress toward the next level.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the HUD renders
**Then** the XP bar is positioned at the absolute top of the screen (y: 0)
**And** the bar spans the full width of the viewport (100vw)
**And** the bar height is prominent but not obstructive (e.g., 8-12px)

**Given** the XP bar is displayed
**When** XP increases
**Then** the bar fills from left to right proportional to progress toward next level (e.g., 250/500 XP = 50% filled)
**And** the fill uses a vibrant color (cyan/green gradient from UX color spec)
**And** the bar animates smoothly when XP is collected (ease-out, 200-300ms)

**Given** the XP bar is nearly full (>80%)
**When** the player is close to leveling up
**Then** the bar subtly pulses or glows to indicate imminent level-up

**Given** the player levels up
**When** XP resets for the next level
**Then** the bar plays a brief flash/fill animation before resetting to 0%
**And** the animation is satisfying and clear

### Story 10.2: Top Stats Display (Score, Fragments, Level, Kills)

As a player,
I want to see my current score, fragment count, kill count, and timer prominently displayed at the top of the screen,
So that I can track my performance at a glance.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the top bar renders
**Then** the following stats are displayed in the top-left quadrant:
  - Kill count with icon (e.g., "💀 273" or skull icon + number)
  - Fragment count with icon (e.g., "◆ 384" or gem icon + number)
  - Score with icon (e.g., "⭐ 44180" or score icon + number)
**And** each stat uses tabular-nums for alignment
**And** stats are horizontally aligned with consistent spacing

**Given** the player is in gameplay
**When** the top-right displays the timer
**Then** the timer shows MM:SS format counting down (e.g., "6:08")
**And** the timer is centered at the very top or slightly offset right
**And** when timer drops below 1 minute, it pulses red as a warning

**Given** the player is in gameplay
**When** the top-right displays level and score
**Then** the current level is shown prominently (e.g., "LVL 102")
**And** optionally, secondary score display is shown (if not already in top-left)

**Given** stats update during gameplay
**When** kills, fragments, or score increase
**Then** the updated values animate briefly (scale up slightly, then back to normal)
**And** updates are immediate (< 50ms)

### Story 10.3: Enhanced Minimap Styling

As a player,
I want to see a stylized minimap positioned clearly in the top-right corner,
So that I can navigate the play area and locate planets/objectives.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the minimap renders
**Then** the minimap is a circular or rounded-square shape
**And** it is positioned in the top-right corner, slightly below the timer/level display
**And** the minimap has a border and semi-transparent background for readability

**Given** the minimap displays game elements
**When** it renders entities
**Then** the player ship is shown as a bright cyan dot at the center or current position
**And** planets are shown as colored dots matching their tier (silver, gold, platinum)
**And** the wormhole (when active) is shown as a distinct icon
**And** the play area boundaries are clearly indicated

**Given** the minimap is displayed
**When** the player moves
**Then** the minimap updates in real-time with smooth transitions
**And** the compass direction indicator (N, S, E, W) is visible if space allows

**Given** the minimap rendering
**When** performance is measured
**Then** minimap updates do not cause frame drops

### Story 10.4: HP & Item Slots Reorganization (Top-Left Cluster)

As a player,
I want to see my HP bar and equipped weapon slots clearly grouped in the top-left area,
So that I can monitor my health and active loadout at a glance.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the top-left HUD section renders
**Then** the HP bar is displayed prominently at the very top of the cluster
**And** the HP bar uses segments or a continuous fill (red for HP, darker background for missing HP)
**And** current/max HP values are displayed as text (e.g., "533 / 867")

**Given** the HP bar is displayed
**When** the player takes damage
**Then** the bar animates smoothly as HP decreases
**And** when HP drops below 25%, the bar pulses red

**Given** the weapon slots are displayed
**When** they render below the HP bar
**Then** up to 4 weapon slots are shown as square icons in a row or 2x2 grid
**And** each equipped weapon shows its icon with its current level (e.g., "Laser Lv3")
**And** empty slots are grayed out or show a placeholder icon

**Given** a weapon is equipped or upgraded
**When** the slot updates
**Then** a brief animation (glow, scale) indicates the change

### Story 10.5: Boon Slots Visibility & Display

As a player,
I want to see my equipped boons as visible icons with their names or effects,
So that I know which passive bonuses are currently active.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** boon slots render in the HUD
**Then** up to 3 boon slots are displayed in the top-left cluster, below or adjacent to weapon slots
**And** each equipped boon shows its icon with a small indicator (level or stack count if applicable)

**Given** boons are equipped
**When** they are displayed
**Then** boon icons are visually distinct from weapon icons (different border color or shape)
**And** hovering or a tooltip shows the boon name and effect description (optional for quick reference)

**Given** a boon slot is empty
**When** it renders
**Then** the empty slot shows a grayed-out placeholder

**Given** a boon is equipped or upgraded during level-up
**When** the player returns to gameplay
**Then** the boon slot updates with a brief animation (glow, scale)

### Story 10.6: Pause Menu with Detailed Inventory

As a player,
I want to pause the game and view my detailed inventory with all equipped weapons, boons, stats, and options to resume or quit,
So that I can review my build and take a break without losing information.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the player presses ESC or P
**Then** the game pauses (GameLoop stops ticking)
**And** a pause menu overlay appears with dark background (60% opacity)

**Given** the pause menu is open
**When** it renders
**Then** the top displays "PAUSED" title
**And** the menu is divided into sections: Inventory, Stats, Actions

**Given** the Inventory section
**When** it displays
**Then** all equipped weapons are listed with: icon, name, level, damage, cooldown
**And** all equipped boons are listed with: icon, name, effect description
**And** weapon and boon lists are clearly separated and labeled

**Given** the Stats section
**When** it displays
**Then** player stats are shown: Current HP, Max HP, Speed, Damage Multiplier (from boons)
**And** run stats are shown: Time Elapsed, Kills, Level, Score, Fragments
**And** stats use StatLine components with tabular-nums

**Given** the Actions section
**When** it displays
**Then** a [R] RESUME button is available and highlighted
**And** a [Q] QUIT TO MENU button is available with a warning color
**And** keyboard shortcuts (R, Q, ESC) are displayed alongside buttons

**Given** the player clicks RESUME or presses ESC/R
**When** the action is triggered
**Then** the pause menu closes with fade-out animation
**And** gameplay resumes immediately

**Given** the player clicks QUIT TO MENU
**When** the action is triggered
**Then** a confirmation dialog appears: "Quit to menu? Progress will be lost."
**And** confirming returns to the main menu and resets the run
**And** canceling returns to the pause menu

### Story 10.7: Bottom Item Library Bar

As a player,
I want to see a full library of all collected weapons and boons displayed at the bottom of the screen with their levels,
So that I can track my complete build progression like in Vampire Survivors.

**Acceptance Criteria:**

**Given** the player is in gameplay
**When** the bottom HUD bar renders
**Then** a horizontal bar spans the full width at the bottom of the screen
**And** the bar displays icons for all weapons and boons the player has collected during the run

**Given** weapons and boons are displayed
**When** they render in the bar
**Then** each item shows: icon, level/stack indicator (e.g., "x3" or "Lv5")
**And** items are grouped: weapons on the left, boons on the right (or separated by dividers)
**And** items are displayed in order of acquisition or by type

**Given** the player collects a new weapon or boon
**When** it is added to the collection
**Then** the new icon appears in the bar with a slide-in or pop animation

**Given** a weapon or boon is upgraded
**When** the level increases
**Then** the level indicator updates with a brief glow/scale animation

**Given** the bar is displayed
**When** space is limited (many items)
**Then** the bar scrolls horizontally or uses a compact grid layout
**And** all items remain readable at 1080p resolution

## Epic 11: Gameplay Balance & Content Completion

The player benefits from balanced progression with XP magnetization, faster leveling, and a complete roster of weapons and boons.

### Story 11.1: XP Magnetization System

As a player,
I want XP orbs to be attracted toward me when I'm within a certain radius,
So that collecting XP feels less tedious and I can focus on combat.

**Acceptance Criteria:**

**Given** XP orbs are on the field
**When** the player moves within the magnetization radius of an orb
**Then** the orb begins moving toward the player's position
**And** the magnetization radius is configurable in gameConfig.js (e.g., XP_MAGNET_RADIUS = 5.0)

**Given** an orb is magnetized
**When** it moves toward the player
**Then** it accelerates smoothly toward the player (lerp or ease-in speed curve)
**And** the orb is automatically collected when it reaches the player's collision radius

**Given** the player is not within the magnetization radius
**When** an orb is outside the radius
**Then** the orb remains stationary (or drifts slowly as before) until the player approaches

**Given** magnetization is active
**When** performance is measured with 50+ orbs on screen
**Then** the system maintains 60 FPS with no noticeable lag

### Story 11.2: XP Curve Rebalancing

As a player,
I want to level up more frequently in the early and mid game,
So that progression feels rewarding and I gain power at a satisfying pace.

**Acceptance Criteria:**

**Given** the XP curve is defined in gameConfig.js
**When** XP_LEVEL_CURVE is adjusted
**Then** the XP required for early levels (1-5) is reduced by ~20-30%
**And** mid-game levels (6-12) are reduced by ~10-15%
**And** late-game levels (13+) remain challenging but reachable

**Given** the adjusted XP curve
**When** playtesting a full run
**Then** players reach level 5 within the first 2-3 minutes
**And** players reach level 10 by approximately 5-6 minutes
**And** leveling remains frequent enough to maintain engagement throughout a 10-minute run

**Given** enemy xpReward values in enemyDefs.js
**When** they are reviewed
**Then** xpReward values are increased by ~15-25% across all enemy types
**And** higher-tier enemies provide proportionally more XP

### Story 11.3: Complete Weapon Roster Implementation

As a developer,
I want all planned weapon types fully implemented with distinct visuals and behaviors,
So that players have diverse offensive options for build crafting.

**Acceptance Criteria:**

**Given** weaponDefs.js
**When** weapon definitions are reviewed
**Then** at least 8-12 unique weapon types are fully defined
**And** each weapon has: name, description, baseDamage, baseCooldown, baseSpeed, projectileType, upgrade curve (levels 1-9)

**Given** weapon variety
**When** weapons are categorized
**Then** weapons cover diverse archetypes:
  - Frontal: Laser, Plasma Cannon, Railgun
  - Spread: Shotgun, Tri-Shot
  - Orbital: Satellites, Drones
  - Special: Missiles (homing), Beam (continuous), Area (explosions)

**Given** each weapon type
**When** it is rendered
**Then** projectiles have distinct visuals (color, shape, particle effects)
**And** weapons have unique sound effects per type

**Given** weapons are integrated
**When** they appear in level-up choices
**Then** all weapon types can be offered to the player
**And** weapon descriptions clearly communicate their unique behavior

### Story 11.4: Complete Boon Roster Implementation

As a developer,
I want all planned boon types fully implemented with clear effects,
So that players have diverse passive options for build crafting.

**Acceptance Criteria:**

**Given** boonDefs.js
**When** boon definitions are reviewed
**Then** at least 8-12 unique boon types are fully defined
**And** each boon has: name, description, effect values, stacking rules

**Given** boon variety
**When** boons are categorized
**Then** boons cover diverse effects:
  - Damage: Damage Amp, Crit Chance, Crit Multiplier
  - Speed: Attack Speed, Movement Speed, Projectile Speed
  - Survivability: Max HP Up, HP Regen, Damage Reduction
  - Utility: XP Gain, Fragment Gain, Pickup Radius

**Given** each boon type
**When** it is applied
**Then** its effect is computed and integrated into gameplay systems
**And** boon effects stack correctly if the same boon is selected multiple times (additive or multiplicative as defined)

**Given** boons are integrated
**When** they appear in level-up choices
**Then** all boon types can be offered to the player
**And** boon descriptions clearly communicate their effect and magnitude

## Epic 12: Visual Polish & Player Readability

The player clearly sees their ship, projectiles, and interactive zones with improved lighting and visual feedback.

### Story 12.1: Player Ship Lighting Improvements

As a player,
I want my spaceship to be well-lit and clearly visible at all times,
So that I can always see my ship's position and orientation.

**Acceptance Criteria:**

**Given** the player ship is rendered
**When** lighting is applied
**Then** the ship has increased ambient or emissive lighting to make it stand out
**And** the ship is never too dark to see clearly, even in darker environment areas

**Given** the ship uses a GLB model
**When** materials are adjusted
**Then** material emissive values are increased or emissive maps are applied
**And** the ship may have subtle glow or rim lighting effects

**Given** lighting adjustments
**When** performance is tested
**Then** the lighting changes do not negatively impact frame rate

### Story 12.2: Projectile Visibility Enhancements

As a player,
I want projectiles to be bright and clearly visible,
So that I can see my attacks and understand what's happening on screen.

**Acceptance Criteria:**

**Given** projectiles are rendered
**When** their materials are applied
**Then** projectile colors are more saturated and vibrant (neon cyan, magenta, yellow per UX spec)
**And** projectiles have emissive materials or glow effects

**Given** projectiles are in motion
**When** they travel across the screen
**Then** they leave subtle particle trails or motion blur effects
**And** projectiles are clearly distinguishable from enemy projectiles (player = cyan/green, enemy = red/orange)

**Given** visibility enhancements
**When** intense combat occurs (50+ projectiles on screen)
**Then** projectiles remain visible and readable
**And** performance remains at 60 FPS

### Story 12.3: Planet Capture Zone Aura System

As a player,
I want to see a visual aura around planets indicating the capture zone,
So that I understand where I need to position my ship to scan the planet.

**Acceptance Criteria:**

**Given** the player approaches a planet
**When** the ship enters the planet's capture zone radius
**Then** a circular aura appears around the planet indicating the zone boundary
**And** the aura uses a glowing ring or particle effect (color matches planet tier: silver, gold, platinum)

**Given** the aura is displayed
**When** the player is inside the zone
**Then** the aura remains visible and gently pulses or rotates
**And** the scan progress UI is also displayed (from Epic 5)

**Given** the player exits the capture zone
**When** the ship leaves the radius
**Then** the aura fades out with a smooth animation (300-500ms)
**And** the scan progress resets as per existing behavior

**Given** multiple planets exist
**When** the player is near multiple planets
**Then** only the closest planet's aura is shown (or all within range, if multiple captures are supported)

**Given** a planet is fully scanned
**When** it is marked as complete
**Then** the aura disappears or changes to a "completed" visual state (e.g., dimmed or different color)

## Epic 13: Tunnel Hub Fixes & UX Improvements

The player navigates the tunnel hub without bugs, without scrolling, and sees the ship in the 3D tunnel scene.

### Story 13.1: Tunnel Rendering & Interaction Bugs Resolution

As a developer,
I want to identify and fix all bugs in the tunnel hub scene and UI,
So that players have a smooth experience between systems.

**Acceptance Criteria:**

**Given** the tunnel phase activates
**When** TunnelScene.jsx and TunnelHub UI render
**Then** no console errors are thrown
**And** the 3D tunnel scene renders correctly without visual glitches

**Given** tunnel interactions (upgrades, dilemmas)
**When** the player clicks buttons or makes selections
**Then** all interactions work as expected without errors
**And** Fragment spending updates correctly
**And** stat changes apply correctly

**Given** the tunnel exit
**When** the player clicks "ENTER SYSTEM"
**Then** the transition to the next gameplay system occurs without errors
**And** the game state resets correctly for the new system

**Given** playtesting
**When** multiple tunnel visits occur in a single run
**Then** no state pollution or bugs accumulate across visits

### Story 13.2: Sidebar Layout Compaction (No Scroll)

As a player,
I want all tunnel options visible without scrolling,
So that I can see all my choices at a glance.

**Acceptance Criteria:**

**Given** the tunnel UI sidebar (right panel)
**When** it renders on a 1080p screen
**Then** all UI sections fit within the viewport without requiring vertical scroll
**And** sections are: Fragment count (top), Upgrades list, Dilemma card, HP Sacrifice (if applicable), Enter System button (bottom)

**Given** the upgrade list is long
**When** many upgrades exist
**Then** the list is compacted with smaller card sizes or a grid layout
**And** font sizes and spacing are reduced to fit more items
**And** readability is maintained (no text smaller than 12px)

**Given** the dilemma card
**When** it is displayed
**Then** it is concise and fits within a compact card format
**And** accept/refuse buttons are clearly visible

**Given** the HP Sacrifice option
**When** it is included
**Then** it is compactly integrated (e.g., a single button with cost/benefit inline)

**Given** the "ENTER SYSTEM" button
**When** it is displayed
**Then** it is always visible at the bottom of the sidebar without scrolling
**And** the button is prominent and easy to reach

### Story 13.3: Tunnel 3D Scene Ship Visibility

As a player,
I want to see my spaceship flying through the tunnel in the 3D scene on the left side,
So that the tunnel feels immersive and connected to gameplay.

**Acceptance Criteria:**

**Given** the tunnel scene (left side 3D view)
**When** TunnelScene.jsx renders
**Then** the player's spaceship is visible in the scene, positioned as if flying through the tunnel
**And** the ship is illuminated and clearly visible (not too dark)

**Given** the tunnel animation
**When** the scene plays
**Then** the tunnel creates the illusion of infinite forward motion (scrolling texture or geometry)
**And** the ship may have subtle idle animation (banking, nose dip) to add life

**Given** the ship in the tunnel
**When** lighting is applied
**Then** appropriate lighting (directional, ambient, or point lights) ensures the ship stands out
**And** the tunnel environment has depth and visual interest (stars, particles, etc.)

**Given** performance
**When** the tunnel scene renders
**Then** it maintains 60 FPS with the ship and tunnel effects active
