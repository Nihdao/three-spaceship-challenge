# Epic 25: Meta & Content

The player experiences deeper long-term progression with ship leveling, galaxy selection, an armory catalog, and persistent global stats that track their journey across all runs.

## Epic Goals

- Implement ship level system (1-9) upgradeable with Fragments, with stat scaling per level
- Add level-based visual skins (tints at levels 3, 6, 9) that players can unlock and toggle
- Create galaxy choice screen before starting a run (single galaxy initially, expandable later)
- Build an Armory screen cataloging all weapons and boons with descriptions
- Implement persistent global stats tracking across all runs (kills, time survived, favorites)
- Create a Stats display screen accessible from the main menu

## Epic Context

After the core gameplay loop is solid (Epics 20-24), the game needs content depth and long-term engagement hooks. Ship leveling creates another Fragment sink and gives players attachment to their chosen ship. Galaxy selection lays the groundwork for multiple levels and future challenge modifiers. The Armory gives players a collection goal and helps them understand available weapons/boons. Global stats provide a sense of career progression and highlight the player's journey over many runs.

These features are lower priority than gameplay foundations but essential for a complete rogue-lite experience that players return to over weeks/months.

## Stories

### Story 25.1: Ship Level Progression

As a player,
I want to upgrade my ships from level 1 to 9 using Fragments,
So that my favorite ship grows stronger over time and I feel invested in my choice.

**Acceptance Criteria:**

**Given** the ship level system
**When** implemented
**Then** each ship has an independent level (1-9), persisted to localStorage
**And** each level costs Fragments (escalating: e.g., 100, 200, 400, 700, 1000, 1500, 2000, 3000, 5000)
**And** leveling up is PERMANENT (unlike regular upgrades which can be refunded)

**Given** a ship at level N
**When** stats are computed
**Then** all base stats receive a small percentage bonus per level (e.g., +3% per level to HP, damage, etc.)
**And** the stat scaling is defined per ship in shipDefs.js (different ships may scale differently)
**And** level bonuses stack with permanent upgrades (Epic 20)

**Given** the ship selection screen
**When** a ship is displayed
**Then** the current level is shown prominently (e.g., "LV. 5")
**And** a "LEVEL UP" button appears if the player has enough Fragments and the ship isn't max level
**And** the cost for the next level is displayed

**Given** the ship reaches max level (9)
**When** displayed
**Then** "MAX LEVEL" is shown instead of level-up button
**And** the ship has reached its full stat potential

### Story 25.2: Level-Based Ship Skins

As a player,
I want to unlock visual tints for my ships at levels 3, 6, and 9,
So that my ship's appearance reflects my progression investment.

**Acceptance Criteria:**

**Given** a ship reaches level 3, 6, or 9
**When** the level-up is completed
**Then** a new visual skin (tint/color variant) is permanently unlocked for that ship
**And** a notification or visual celebration indicates the new skin is available

**Given** unlocked skins
**When** the player is on the ship selection screen
**Then** the player can browse available skins for the selected ship
**And** unlocked skins show a preview, locked skins show the required level
**And** the player can choose which skin to use (including the default/no tint)
**And** the selected skin preference is persisted to localStorage

**Given** the skin visual design
**When** applied to the ship model
**Then** skins are color tints applied to the ship material (not separate models)
**And** level 3 skin: subtle tint (e.g., blue accent)
**And** level 6 skin: stronger tint (e.g., purple/energy accent)
**And** level 9 skin: dramatic tint (e.g., gold/legendary accent)
**And** the tint is applied via material color or emissive properties

**Given** the skin in gameplay
**When** the player uses a tinted skin
**Then** the tint is visible on the ship model during gameplay
**And** the tint is visible on the ship in the tunnel hub
**And** the tint does not affect readability or gameplay

### Story 25.3: Galaxy Choice Screen

As a player,
I want to choose a galaxy before starting a run,
So that I have a sense of destination and the game can support multiple levels in the future.

**Acceptance Criteria:**

**Given** the flow after clicking PLAY and selecting a ship
**When** the player is ready to start
**Then** a "CHOOSE GALAXY" screen appears before the run begins
**And** initially, only ONE galaxy is available (more can be added later)

**Given** the galaxy display
**When** shown
**Then** each galaxy has:
  - A cool name (e.g., "Andromeda Reach", "Cygnus Expanse", "Orion's Gate")
  - A short description (1-2 sentences about the galaxy's flavor)
  - A visual card or icon
  - Number of systems (e.g., "3 Systems")
**And** the single available galaxy is pre-selected and highlighted

**Given** the player clicks to start
**When** the galaxy is confirmed
**Then** the run begins with the selected galaxy's configuration
**And** the galaxy name appears in the system entry banner (Story 17.2)

**Given** future challenge modifiers (NOT for initial implementation)
**When** designed for later
**Then** the galaxy screen has space for challenge checkboxes (e.g., "Less Time: -3min per system, +30% Fragments")
**And** challenges could include: reduced time, enemy damage multiplier, increased spawns, no minimap, reduced vision
**And** each challenge adds a Fragment bonus multiplier
**And** these are NOT implemented now — just keep the UI structure flexible for future expansion

### Story 25.4: Armory Catalog Screen

As a player,
I want to browse all available weapons and boons in an Armory screen,
So that I understand what's available and have a collection goal.

**Acceptance Criteria:**

**Given** the main menu
**When** the player clicks "ARMORY"
**Then** a catalog screen opens (overlay style, like ship selection)
**And** the screen has two tabs: Weapons, Boons

**Given** the Weapons tab
**When** displayed
**Then** all weapons are listed with:
  - Icon/visual representation
  - Name
  - Short description of how it works (1-2 sentences)
  - Whether it's been "discovered" (used in at least one run)
**And** undiscovered weapons show as silhouettes with "???" name (optional: or just show all)

**Given** the Boons tab
**When** displayed
**Then** all boons are listed with the same format as weapons
**And** boons are organized by category (offensive, defensive, utility) if applicable

**Given** the data source
**When** populating the Armory
**Then** weapon data comes from weaponDefs.js
**And** boon data comes from boonDefs.js
**And** discovery state is tracked in a persistent store (localStorage)

### Story 25.5: Persistent Global Stats

As a player,
I want the game to track my career statistics across all runs,
So that I feel a sense of long-term progression and achievement.

**Acceptance Criteria:**

**Given** the global stats tracking system
**When** implemented
**Then** a new Zustand store (useGlobalStats) persists the following to localStorage:
  - Total enemies killed (all-time)
  - Total time survived (all-time, sum of all runs)
  - Total runs played
  - Total Fragments earned (all-time)
  - Most used weapons (by number of runs where weapon was acquired)
  - Most used boons (same as weapons)
  - Best run stats: highest system reached, longest single run time, most kills in a run, highest level reached in a run

**Given** a run ends (death or victory)
**When** stats are aggregated
**Then** the global stats store is updated with the run's data
**And** "best" records are compared and updated if beaten
**And** weapon/boon usage is incremented for items used in this run

**Given** the data structure
**When** designed
**Then** weapon/boon usage tracking uses a map: { weaponId: runCount }
**And** the store provides computed getters for "top 5 most used" etc.
**And** the store has a version field for future migration if the schema changes

### Story 25.6: Stats Display Screen

As a player,
I want to view my career statistics from the main menu,
So that I can appreciate my progress and see my playstyle trends.

**Acceptance Criteria:**

**Given** the main menu
**When** the player clicks "STATS"
**Then** a stats screen opens (overlay style)
**And** the screen displays career stats in clear categories:

**Given** the Career section
**When** displayed
**Then** shows: Total Runs, Total Enemies Killed, Total Time Survived, Total Fragments Earned

**Given** the Best Run section
**When** displayed
**Then** shows: Highest System Reached, Longest Run, Most Kills in a Run, Highest Level

**Given** the Favorites section
**When** displayed
**Then** shows: Top 3 Most Used Weapons (with run count), Top 3 Most Used Boons (with run count)

**Given** the display format
**When** designed
**Then** numbers are formatted for readability (e.g., "12,345" kills, "2h 34m" total time)
**And** the layout is clean and easy to scan
**And** a "BACK" button returns to the main menu

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: shipDefs.js — Add level scaling config, skin definitions per ship
- **Config Layer**: galaxyDefs.js (new) — Galaxy definitions with names, descriptions, system count
- **Stores Layer**: useShipProgression.js (new) — Ship levels, skin selections, persisted
- **Stores Layer**: useGlobalStats.js (new) — Career stats, persisted
- **Stores Layer**: useArmory.js (new) — Discovery tracking for weapons/boons
- **UI Layer**: GalaxyChoice.jsx (new) — Galaxy selection screen
- **UI Layer**: Armory.jsx (new) — Catalog screen with tabs
- **UI Layer**: StatsScreen.jsx (new) — Career stats display
- **UI Layer**: ShipSelection.jsx — Add level display and level-up button, skin selector

**Ship Level Math:**
- Level N stat bonus: baseStatMultiplier = 1 + (level - 1) * LEVEL_SCALING_PERCENT
- e.g., LEVEL_SCALING_PERCENT = 0.03 → Level 9 = 1.24x base stats (24% bonus)
- Different ships may have different scaling rates

**Skin Implementation:**
- Material tinting: mesh.material.color.set(tintColor) or emissive adjustment
- Can use lerp between base material and tint color
- Skin data: { level: 3, name: "Azure", tintColor: "#3366ff" }

**Galaxy Structure (future-proofed):**
```js
{
  id: 'andromeda_reach',
  name: 'Andromeda Reach',
  description: 'A spiral arm teeming with hostile fleets...',
  systems: 3,
  challengeSlots: [], // future: challenge modifiers
  fragmentMultiplier: 1.0 // future: modified by challenges
}
```

**Stats Persistence:**
- Same localStorage pattern as other persistent stores
- Version field: `{ version: 1, data: {...} }` for future migration
- Updated at run end: useGlobalStats.getState().recordRunEnd(runData)

## Dependencies

- Story 9.2 (Ship Variants & Stats Display) — Ship data structure to extend
- Epic 20 (Permanent Upgrades) — Fragment economy, stat computation pipeline
- Story 11.3 (Complete Weapon Roster) — weaponDefs.js for Armory data
- Story 11.4 (Complete Boon Roster) — boonDefs.js for Armory data
- Story 17.2 (System Name Banner) — Galaxy name integration

## Success Metrics

- Ship leveling provides satisfying long-term investment goal (playtest: players want to max a ship)
- Skins feel rewarding as milestone unlocks (playtest)
- Galaxy choice screen feels polished even with single option (visual testing)
- Armory helps players understand available options (playtest: new players reference it)
- Stats screen creates "one more run" motivation (playtest: players check records)

## References

- adam-vision-notes-2026-02-15.md — Sections 1B/, 1C/, 3.1/, 3.2/
- brainstorming-session-2026-02-15.md — Epic 25 roadmap
- Vampire Survivors — Character progression, collection screen
- Hades — Codex (Armory equivalent), career stats
- Brotato — Character levels, stat tracking
