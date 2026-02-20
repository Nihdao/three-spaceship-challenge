# Epic 20: Permanent Upgrades System (Meta-Game Foundation)

The player spends accumulated Fragments on permanent upgrades between runs, creating a rogue-lite meta-progression loop that makes each run feel like progress toward a stronger build.

## Epic Goals

- Implement 14 permanent upgrades purchasable with Fragments, phased in 3 batches
- Create an UPGRADES menu screen accessible from the main menu (similar to ship selection overlay)
- Display accumulated Fragments count next to or below BEST RUN on the main menu
- Allow full refund of all spent Fragments to reallocate freely (upgrades are never permanent-locked)
- Enrich ship selection stats display to show base stats + permanent upgrade bonuses combined
- Redesign HP bar to be rectangular with "80/100" format inside the gauge

## Epic Context

Currently, Fragments are earned in-game (enemy drops, boss rewards) and spent in the tunnel hub on per-run dilemma upgrades. There is no persistent meta-progression between runs. Without permanent upgrades, the game feels like a standalone arcade run rather than a rogue-lite with long-term progression. This epic transforms the game into a true "one more run" experience where the player always feels like they're building toward something.

The 14 upgrades are intentionally phased in 3 batches to manage scope:
- Batch 1 (combat stats): Attack, Armor, MaxHP, Regen, AtkSpeed, Zone — the core stats that directly impact gameplay feel
- Batch 2 (utility stats): Magnet, Luck, ExpBonus, Curse — stats that affect loot and progression
- Batch 3 (meta stats): Revival, Reroll, Skip, Banish — strategic meta-stats that unlock new gameplay mechanics (these tie into Epic 22 combat depth systems)

## Stories

### Story 20.1: Permanent Upgrades — Combat Stats

As a player,
I want to spend Fragments on permanent combat stat upgrades between runs,
So that my character grows stronger over time and each run starts from a better baseline.

**Acceptance Criteria:**

**Given** the permanent upgrades system
**When** it is implemented
**Then** a new Zustand store (useUpgrades) manages all permanent upgrade state
**And** the store persists to localStorage (similar to high score persistence)
**And** the store exposes: upgrade levels, total fragments spent, computed bonus values

**Given** the 6 combat stat upgrades
**When** defined in upgrade config (upgradesDefs.js or gameConfig.js section)
**Then** each upgrade has:
  - Attack Power: 5 levels, each level adds +X% damage (e.g., +5%, +10%, +15%, +20%, +25%)
  - Armor (damage reduction): 5 levels, each level adds +X flat reduction (e.g., +1, +2, +3, +4, +5)
  - Max HP: 3 levels, each level adds +X HP (e.g., +10, +20, +30)
  - Regen: 3 levels, each level improves HP regen rate (e.g., +0.2/s, +0.4/s, +0.6/s)
  - Attack Speed (renamed from Cooldown): 3 levels, each level reduces weapon cooldown by -X% (e.g., -5%, -10%, -15%)
  - Zone (projectile size): 3 levels, each level increases projectile size by +X% (e.g., +10%, +20%, +30%)
**And** each level has a Fragment cost (escalating: e.g., 50, 100, 200, 350, 500)

**Given** the player purchases an upgrade
**When** they have enough Fragments
**Then** the Fragment count decreases by the upgrade cost
**And** the upgrade level increases by 1
**And** the store is persisted immediately to localStorage

**Given** the permanent upgrade bonuses
**When** a run starts
**Then** the player's base stats (from ship selection + permanent upgrades) are computed
**And** these bonuses stack additively with ship base stats
**And** the computed stats are passed to usePlayer store at run initialization

**Given** the upgrade bonuses in gameplay
**When** damage is calculated
**Then** Attack Power bonus is applied as a multiplier on weapon damage
**And** Armor bonus reduces incoming damage by flat value
**And** MaxHP bonus increases player max health
**And** Regen bonus adds passive HP regeneration per second
**And** Attack Speed bonus reduces all weapon cooldowns proportionally
**And** Zone bonus scales all projectile sizes

### Story 20.2: Upgrades Menu Screen

As a player,
I want to access an UPGRADES screen from the main menu,
So that I can browse, purchase, and manage my permanent upgrades before starting a run.

**Acceptance Criteria:**

**Given** the main menu
**When** the player sees the menu options
**Then** an "UPGRADES" button appears below "PLAY"
**And** the button uses the same styling as existing menu buttons

**Given** the player clicks UPGRADES
**When** the screen opens
**Then** the upgrade screen overlays the main menu (keeping the 3D background visible, similar to ship selection)
**And** all 14 upgrades are listed (available ones active, locked ones grayed if batch not yet implemented)
**And** each upgrade shows: name, current level / max level, next level cost in Fragments, bonus description
**And** the player's total available Fragments are prominently displayed

**Given** an upgrade that can be purchased
**When** the player has enough Fragments and hasn't maxed the upgrade
**Then** a "BUY" or "+" button is active/highlighted
**And** clicking it purchases one level

**Given** an upgrade at max level
**When** displayed
**Then** it shows "MAX" instead of a cost
**And** the buy button is disabled

**Given** the screen layout
**When** designed
**Then** upgrades are organized in a clean grid or list
**And** similar to the tunnel wormhole fragment upgrades in visual style
**And** a "BACK" button returns to the main menu

### Story 20.3: Fragment Display on Main Menu

As a player,
I want to see my accumulated Fragment count on the main menu,
So that I know how many resources I have available for upgrades.

**Acceptance Criteria:**

**Given** the main menu screen
**When** displayed
**Then** the player's total Fragment count appears near or below the BEST RUN display
**And** the Fragment icon uses the consistent purple color (#cc66ff)
**And** the count updates after each run when new Fragments are earned

### Story 20.4: Permanent Upgrades — Utility Stats

As a player,
I want to unlock utility stat upgrades (Magnet, Luck, ExpBonus, Curse),
So that I can customize my meta-build toward different playstyles between runs.

**Acceptance Criteria:**

**Given** the utility stat upgrades
**When** defined in upgrade config
**Then** each upgrade has:
  - Magnet (pickup radius increase): 2 levels (e.g., +15%, +30%)
  - Luck (better loot/gem drop chances): 3 levels (e.g., +5%, +10%, +15% — influences Fragment/HP/XP gem/chest drop rates)
  - Exp Bonus (XP gain multiplier): 5 levels (e.g., +5%, +10%, +15%, +20%, +25%)
  - Curse (enemy spawn rate increase for more combat/loot): 5 levels (e.g., +10%, +20%, +30%, +40%, +50% spawn rate)
**And** each level has escalating Fragment costs

**Given** the Magnet upgrade
**When** active in gameplay
**Then** the XP/loot magnetization radius (XP_MAGNET_RADIUS) is multiplied by the bonus

**Given** the Luck upgrade
**When** active in gameplay
**Then** all loot drop chance rolls (rare XP, heal gem, Fragment gem) are increased by the luck percentage
**And** future rarity rolls (Epic 22, Story 22.3) are influenced by luck

**Given** the Exp Bonus upgrade
**When** active in gameplay
**Then** all XP gains are multiplied by the bonus (applies to standard orbs, rare gems, etc.)

**Given** the Curse upgrade
**When** active in gameplay
**Then** enemy spawn rates are increased by the curse percentage
**And** this stacks with the dynamic wave system (Epic 23)

### Story 20.5: Permanent Upgrades — Meta Stats

As a player,
I want to unlock meta stat upgrades (Revival, Reroll, Skip, Banish),
So that I have strategic tools that change how I approach each run.

**Acceptance Criteria:**

**Given** the meta stat upgrades
**When** defined in upgrade config
**Then** each upgrade has:
  - Revival (extra lives): 2 levels (each level = +1 revive per run)
  - Reroll (re-roll level-up choices): 3 levels (each level = +1 reroll per run)
  - Skip (skip a level-up choice): 3 levels (each level = +1 skip per run)
  - Banish (permanently remove a choice from the run): 3 levels (each level = +1 banish per run)
**And** each level has escalating Fragment costs

**Given** Revival charges
**When** a run starts
**Then** the player's available revive count = ship base revival + permanent upgrade revival
**And** revival charges are tracked and displayed in the HUD (ties into Epic 22 Story 22.1)

**Given** Reroll/Skip/Banish charges
**When** a run starts
**Then** the player's available charges = ship base + permanent upgrade levels
**And** these charges are displayed during level-up selection screens (ties into Epic 22 Story 22.2)

**Given** these upgrades have no gameplay effect without Epic 22
**When** Epic 22 is not yet implemented
**Then** the upgrades can still be purchased and the charges tracked
**And** they will become functional when Epic 22 stories are implemented

### Story 20.6: Upgrade Refund System

As a player,
I want to refund all my spent Fragments to reallocate my upgrades,
So that I can experiment with different builds without permanent commitment.

**Acceptance Criteria:**

**Given** the Upgrades menu screen
**When** the player clicks a "REFUND ALL" button
**Then** all permanent upgrade levels are reset to 0
**And** all Fragments ever spent on upgrades are returned to the player's total
**And** a confirmation dialog appears before executing the refund

**Given** the refund is confirmed
**When** executed
**Then** the store is updated and persisted immediately
**And** the UI refreshes to show all upgrades at level 0 with full Fragment balance

### Story 20.7: Enriched Ship Stats Display

As a player,
I want to see all my combined stats (ship base + permanent upgrades) on the ship selection screen,
So that I understand my total power level before starting a run.

**Acceptance Criteria:**

**Given** the ship selection screen
**When** a ship is selected
**Then** the stats panel shows all relevant stats with computed totals:
  - Max HP (e.g., 100)
  - Regen (e.g., 0.5/s)
  - Armor (e.g., +1)
  - Move Speed (e.g., +10%)
  - Attack Power (e.g., +15%)
  - Attack Speed (e.g., -10%)
  - Zone (e.g., +20%)
  - Magnet (e.g., +15%)
  - Revival (e.g., +1)
  - Luck (e.g., +5%)
  - Exp Bonus (e.g., +10%)
  - Curse (e.g., +20%)
  - Reroll (e.g., 2)
  - Skip (e.g., 1)
  - Banish (e.g., 1)

**Given** the stats display
**When** permanent upgrades contribute to a stat
**Then** the bonus portion is visually indicated (e.g., base value + green bonus text, or combined total with different color)

### Story 20.8: HP Bar Redesign

As a player,
I want the HP bar to be more visually engaging with a rectangular design,
So that my health status is clear and the HUD feels polished.

**Acceptance Criteria:**

**Given** the HUD health display
**When** redesigned
**Then** the HP bar is rectangular (not rounded/pill-shaped)
**And** the current/max HP is displayed inside the bar as "80/100" format
**And** the HP text is positioned at the LEFT side of the bar
**And** there is no "HP" label — the format is self-explanatory
**And** the bar has more visual personality (gradient fill, subtle border glow, etc.)

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: upgradesDefs.js (new) — Define all 14 upgrades with levels, costs, bonus values
- **Stores Layer**: useUpgrades.js (new) — Zustand store with persistence, tracks levels and computed bonuses
- **Stores Layer**: usePlayer.js — Modified to incorporate permanent upgrade bonuses at run start
- **UI Layer**: UpgradesScreen.jsx (new) — Menu overlay for browsing/purchasing upgrades
- **UI Layer**: MainMenu.jsx — Add UPGRADES button and Fragment display
- **UI Layer**: ShipSelection.jsx — Enhanced stats display with combined totals
- **UI Layer**: HealthBar.jsx — Redesigned rectangular HP bar

**Persistence:**
- useUpgrades store persists to localStorage (same pattern as high scores)
- Fragment balance is the single source of truth for available currency
- Refund calculates total spent from upgrade levels × costs

**Stat Computation:**
- At run start: baseStats (ship) + permanentBonuses (upgrades) = effectiveStats
- effectiveStats passed to usePlayer.init() or similar initialization
- In-run upgrades (tunnel dilemmas, level-up boons) stack on top of effectiveStats

## Dependencies

- Story 10.2 (Top Stats Display) — Fragment count display pattern
- Story 9.2 (Ship Variants & Stats Display) — Ship base stats to extend
- Story 7.2 (Fragment Upgrades & Dilemmas) — Existing Fragment spending pattern reference
- usePlayer store — Stat initialization to modify
- Epic 22 — Revival, Reroll, Skip, Banish become functional

## Success Metrics

- Players feel meaningful progression between runs (playtest: "one more run" motivation)
- Fragment spending feels balanced (playtest: can afford 1-2 upgrades per 2-3 runs)
- Refund system encourages experimentation without anxiety
- Stats display is clear and informative on ship selection
- HP bar redesign feels polished and readable

## References

- adam-vision-notes-2026-02-15.md — Sections 1/, 1B/, 3/
- brainstorming-session-2026-02-15.md — Epic 20 roadmap
- Vampire Survivors meta-progression — Gold upgrades between runs
- Hades Mirror of Night — Persistent upgrades with refund option
