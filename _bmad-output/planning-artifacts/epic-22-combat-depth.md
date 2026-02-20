# Epic 22: Combat Depth (Strategic Systems)

The player gains strategic tools during runs — revival on death, reroll/banish/skip during level-up selections, and rarity tiers on boons/weapons — creating deeper decision-making and build diversity.

## Epic Goals

- Implement revival/respawn system: revive at 50% HP with 2-3s invincibility
- Add Reroll, Banish, and Skip buttons to the level-up selection screen
- Introduce boon/weapon rarity tiers (Common/Rare/Epic/Legendary) with color-coded UI and scaled bonuses
- Overhaul boss encounter: use SpaceshipBoss.glb model, massive HP pool, coexist with normal enemy waves

## Epic Context

Currently, death is final — the game over screen appears immediately. Level-up selections offer flat upgrades with no strategic tools to manipulate choices. All boons/weapons have uniform power levels. The boss wipes all enemies when it spawns.

This epic adds layers of strategic depth. Revival gives the player a safety net proportional to their meta-progression (Epic 20 revival upgrades). Reroll/Banish/Skip transform level-up selections from passive acceptance to active curation of a build. Rarity tiers add excitement and variance to selections — a Legendary boon appearing is a "jackpot" moment. The boss overhaul makes boss fights an endurance challenge rather than a gimmick encounter.

## Stories

### Story 22.1: Revival/Respawn System

As a player,
I want to revive after death if I have revival charges,
So that I get a second chance and my meta-progression investment in Revival upgrades pays off.

**Acceptance Criteria:**

**Given** the player's HP reaches 0
**When** death is triggered
**Then** instead of immediately showing Game Over, a "REVIVE?" choice screen appears
**And** the screen shows remaining revival charges (e.g., "1 Revival Remaining")

**Given** the revive prompt appears
**When** the player has >= 1 revival charge
**Then** a "REVIVE" button is available
**And** clicking it revives the player at 50% of max HP
**And** the revival charge count decreases by 1
**And** the player gains 2-3 seconds of invincibility after reviving (visual: flashing/ghost effect)
**And** enemies are pushed back slightly from the player's position on revive (breathing room)

**Given** the revive prompt appears
**When** the player has 0 revival charges
**Then** only "GAME OVER" is available (no revive option)
**And** standard game over flow proceeds

**Given** the player chooses not to revive
**When** they click "GAME OVER" instead of "REVIVE"
**Then** the standard game over screen appears
**And** remaining revival charges are lost (not refunded)

**Given** revival charges at run start
**When** computed
**Then** total charges = ship base revival stat + permanent upgrade revival (Epic 20, Story 20.5)

**Given** the HUD
**When** the player has revival charges
**Then** the remaining revival count is displayed in the HUD (small icon + number)
**And** the display is always visible during gameplay

### Story 22.2: Reroll/Banish/Skip Mechanics

As a player,
I want to reroll, banish, or skip during level-up selections,
So that I have strategic control over my build progression.

**Acceptance Criteria:**

**Given** the level-up selection screen (weapon or boon choice)
**When** displayed
**Then** three additional buttons appear below the choices:
  - REROLL (icon + remaining count): Re-randomize all choices
  - SKIP (icon + remaining count): Close selection without choosing (no upgrade)
  - BANISH (small X icon on each choice card): Remove this specific option from the entire run

**Given** the player clicks REROLL
**When** they have >= 1 reroll charge
**Then** all current choices are re-randomized (new random weapons/boons/rarity)
**And** the reroll charge decreases by 1
**And** a previously shown option CAN appear again in the reroll
**And** the reroll count display updates

**Given** the player clicks SKIP
**When** they have >= 1 skip charge
**Then** the selection screen closes without applying any upgrade
**And** the skip charge decreases by 1
**And** gameplay resumes as if no level-up occurred (XP threshold still advances)

**Given** the player clicks BANISH on a specific choice
**When** they have >= 1 banish charge
**Then** that specific weapon/boon is removed from the selection pool for the ENTIRE current run
**And** the banish applies across all systems in the same run (banished in system 1 = banished in system 2)
**And** the banish charge decreases by 1
**And** the banished choice is replaced with a new random choice in the current selection
**And** a visual indicator shows the item being banished (strikethrough, fade-out)

**Given** charges at run start
**When** computed
**Then** total reroll charges = ship base + permanent upgrade reroll (Epic 20, Story 20.5)
**And** total skip charges = ship base + permanent upgrade skip
**And** total banish charges = ship base + permanent upgrade banish

**Given** the banish list
**When** stored per run
**Then** banished items are tracked in useLevel or a run-state store
**And** the selection generation system excludes banished items from the pool
**And** the banish list resets when a new run starts

**Given** late-game scenarios
**When** all weapon/boon slots are filled and maxed
**Then** reroll may keep showing the same limited options (this is expected)
**And** skip becomes particularly valuable to avoid wasting time

### Story 22.3: Boon/Weapon Rarity System

As a player,
I want boons and weapons to appear with different rarity tiers during level-up,
So that selections feel more exciting with variance in power levels.

**Acceptance Criteria:**

**Given** the rarity tiers
**When** defined
**Then** four tiers exist:
  - Common (white): Base bonus value (e.g., +10% attack speed)
  - Rare (blue #3399ff): Enhanced bonus (e.g., +15% attack speed)
  - Epic (purple #9933ff): Strong bonus (e.g., +20% attack speed)
  - Legendary (gold #ffcc00): Maximum bonus (e.g., +25% attack speed)

**Given** a weapon/boon appears in level-up selection
**When** generated
**Then** a rarity tier is randomly assigned based on weighted probabilities
**And** base probabilities: Common 60%, Rare 25%, Epic 12%, Legendary 3%
**And** the Luck stat (from permanent upgrades + ship base + in-run boons) shifts probabilities toward higher rarities

**Given** rarity is assigned to a choice
**When** displayed in the selection UI
**Then** the choice card has a border/glow matching its rarity color (white/blue/purple/gold)
**And** the bonus value text reflects the rarity-scaled amount
**And** the rarity tier name is shown on the card (e.g., "RARE" label)

**Given** a weapon/boon in the selection
**When** duplicate prevention is applied
**Then** the same weapon/boon CANNOT appear twice in the same selection (e.g., not both Rare and Epic versions)
**And** if a weapon/boon is shown, it appears at ONE randomly determined rarity

**Given** the HUD weapon/boon slots
**When** displaying acquired items
**Then** the HUD icons remain mono-color (no rarity coloring in HUD)
**And** rarity color is ONLY shown during the level-up selection screen
**And** the applied bonus reflects the rarity tier (the player received the boosted value)

**Given** weapons specifically
**When** rarity is applied
**Then** weapon damage/effects scale with rarity (e.g., Rare Plasma Cannon does 15% more damage than Common)
**And** the scaling is defined per weapon in weaponDefs.js (rarity multipliers)

### Story 22.4: Tough Boss Overhaul

As a player,
I want the boss to be a massive HP sponge using the SpaceshipBoss model that fights alongside normal enemy waves,
So that boss encounters are epic endurance challenges rather than gimmick fights.

**Acceptance Criteria:**

**Given** the boss encounter
**When** the boss spawns (via wormhole activation per Story 17.4)
**Then** the boss uses the SpaceshipBoss.glb model from assets
**And** the boss does NOT clear existing enemies from the map
**And** normal enemy waves CONTINUE spawning during the boss fight
**And** the boss coexists with wave enemies in the same scene

**Given** the boss HP
**When** in system 1
**Then** the boss has approximately 100,000 HP (configurable in gameConfig.js)
**And** the HP is displayed in the boss HP bar at screen top (existing from Story 6.2)

**Given** boss HP scaling
**When** in system 2 or 3
**Then** boss HP is multiplied by the system difficulty scaling (same as enemy stat scaling from Story 18.3)
**And** the scaling makes each subsequent boss significantly tougher

**Given** the boss behavior
**When** active in the scene
**Then** the boss uses existing enemy behavior patterns but scaled for its size and power
**And** the boss is significantly larger than regular enemies
**And** the boss has a distinct visual presence (glow, particles, lighting)

**Given** the boss defeat
**When** boss HP reaches 0
**Then** the boss death produces a large explosion effect
**And** the boss drops significant loot (guaranteed Fragments, large XP reward)
**And** the wormhole reactivates for system transition (per Story 17.4)
**And** remaining wave enemies are NOT cleared (player must survive to reach wormhole)

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: gameConfig.js — REVIVAL_INVINCIBILITY_DURATION, RARITY_PROBABILITIES, BOSS_BASE_HP
- **Data Layer**: rarityDefs.js (new) — Rarity tiers with probability weights and bonus multipliers
- **Data Layer**: weaponDefs.js / boonDefs.js — Add rarity multipliers per item
- **Stores Layer**: useLevel.js — Track banish list, reroll/skip/banish charges, revival charges
- **UI Layer**: LevelUpSelection.jsx — Add reroll/skip buttons, banish per card, rarity display
- **UI Layer**: RevivePrompt.jsx (new) — Death screen with revive option
- **Rendering Layer**: BossRenderer.jsx — Load SpaceshipBoss.glb, scale, visual effects

**Rarity Math:**
- Base probabilities: [0.60, 0.25, 0.12, 0.03] for [Common, Rare, Epic, Legendary]
- Luck modifier shifts weight: each 1% luck moves ~0.5% from Common to higher tiers
- Roll: random() against cumulative probability thresholds

**Boss Model:**
- SpaceshipBoss.glb already exists in assets
- Load via useGLTF, scale appropriately (3-5x regular enemy size)
- Boss uses same collision system but with larger hitbox
- Boss HP is a separate track from regular enemies (boss HP bar UI)

## Dependencies

- Epic 20, Story 20.5 (Meta Stats) — Revival, Reroll, Skip, Banish charge sources
- Story 17.4 (Boss Arrival in Gameplay Scene) — Boss spawn in gameplay scene
- Story 6.2 (Boss Arena & Combat) — Existing boss HP bar and combat logic to adapt
- Story 3.2 (Level-Up System & Choice UI) — Selection screen to extend
- usePlayer store — Invincibility state for revival
- weaponDefs.js / boonDefs.js — Rarity multiplier data

## Success Metrics

- Revival feels like a meaningful second chance, not a free pass (playtest)
- Reroll/Banish/Skip add strategic depth to level-up selections (playtest: players actively curate builds)
- Rarity tiers create excitement — Legendary appearances feel special (playtest)
- Boss fights are intense endurance challenges with waves adding pressure (playtest)
- Boss HP feels challenging but not unfair with proper upgrades (balance testing)

## References

- adam-vision-notes-2026-02-15.md — Sections 2.5/, 2.7/, 2.8/
- brainstorming-session-2026-02-15.md — Epic 22 roadmap
- Vampire Survivors — Reroll/Skip/Banish mechanics reference
- Hades — Death Defiance (revival) mechanic reference
- Diablo / Path of Exile — Rarity tier system (Common/Rare/Epic/Legendary)
