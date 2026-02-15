# Story 20.5: Permanent Upgrades — Meta Stats

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to unlock meta stat upgrades (Revival, Reroll, Skip, Banish),
So that I have strategic tools that change how I approach each run.

## Acceptance Criteria

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

## Tasks / Subtasks

- [x] Task 1: Add 4 meta stat upgrades to permanentUpgradesDefs.js (AC: #1)
  - [x] Add REVIVAL upgrade definition (2 levels, +1 per level, costs TBD)
  - [x] Add REROLL upgrade definition (3 levels, +1 per level, costs TBD)
  - [x] Add SKIP upgrade definition (3 levels, +1 per level, costs TBD)
  - [x] Add BANISH upgrade definition (3 levels, +1 per level, costs TBD)
  - [x] Follow same structure as combat/utility stats from Stories 20.1/20.4
  - [x] Set escalating Fragment costs consistent with meta upgrade value (higher than utility stats)

- [x] Task 2: Extend useUpgrades store to compute meta bonuses (AC: #1)
  - [x] Modify getComputedBonuses() to include: revival, reroll, skip, banish
  - [x] Return all 14 bonuses (6 combat + 4 utility + 4 meta)
  - [x] Ensure persistence works for new upgrades (no schema migration needed)

- [x] Task 3: Track Revival charges in usePlayer store (AC: #2)
  - [x] Add `revivalCharges` field to usePlayer state
  - [x] Initialize revivalCharges at run start: shipBase + permanentBonus
  - [ ] Add HUD display placeholder for revival charges (deferred to Epic 22.1)
  - [x] Document that revival mechanic itself is implemented in Epic 22 Story 22.1

- [x] Task 4: Track Reroll/Skip/Banish charges in usePlayer store (AC: #3)
  - [x] Add `rerollCharges`, `skipCharges`, `banishCharges` fields to usePlayer state
  - [x] Initialize charges at run start: shipBase + permanentBonus (usually shipBase = 0)
  - [x] Document that these mechanics are implemented in Epic 22 Story 22.2

- [x] Task 5: Verify UpgradesScreen displays all 14 upgrades (AC: #4)
  - [x] Ensure UpgradesScreen.jsx (Story 20.2) dynamically renders all upgrades from PERMANENT_UPGRADES
  - [x] Meta stats should appear in the upgrades list (grayed/disabled if no charges yet)
  - [x] Verify purchase flow works for meta stats (just like combat/utility stats)

- [x] Task 6: Write tests
  - [x] Test permanentUpgradesDefs: all 4 meta upgrades have valid structure
  - [x] Test useUpgrades: getComputedBonuses includes revival, reroll, skip, banish
  - [x] Test usePlayer: revivalCharges, rerollCharges, skipCharges, banishCharges initialized correctly
  - [x] Test integration: purchasing meta upgrades increases charge counts at run start
  - [x] Test Epic 22 readiness: charges are available for Epic 22 stories to consume

## Dev Notes

### Architecture Alignment

This story **extends** the permanent upgrades system created in Stories 20.1 (combat stats) and 20.4 (utility stats) by adding 4 meta stats to the existing config and store. Unlike combat/utility stats which apply immediately in gameplay, meta stats are **tracked but not consumed** until Epic 22 implements the consumption mechanics.

**Key Architectural Principle:**
- **Data Layer (Story 20.5)**: Define upgrades, track charges, persist to localStorage
- **Behavior Layer (Epic 22)**: Consume charges in revival system (Story 22.1) and level-up reroll/skip/banish (Story 22.2)

This separation allows Story 20.5 to be completed independently while Epic 22 stories add the actual gameplay mechanics later.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/permanentUpgradesDefs.js` (MODIFY) — Add 4 meta upgrade definitions
- **Stores Layer**: `src/stores/useUpgrades.jsx` (MODIFY) — Extend getComputedBonuses() to return meta bonuses
- **Stores Layer**: `src/stores/usePlayer.jsx` (MODIFY) — Add charge tracking fields, initialize from permanent bonuses
- **UI Layer**: `src/ui/UpgradesScreen.jsx` (VERIFY) — Should already display all 14 upgrades dynamically

**This story does NOT:**
- Implement revival mechanic (Epic 22, Story 22.1)
- Implement reroll/skip/banish UI during level-up (Epic 22, Story 22.2)
- Create new UI components (UpgradesScreen from Story 20.2 already handles all upgrades)
- Modify gameplay beyond charge tracking (charges are inert until Epic 22)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/entities/permanentUpgradesDefs.js` | **ADD** 4 meta upgrade definitions (REVIVAL, REROLL, SKIP, BANISH) | Config |
| `src/stores/useUpgrades.jsx` | **MODIFY** getComputedBonuses() to include meta stats | Stores |
| `src/stores/usePlayer.jsx` | **MODIFY** add charge fields, initialize from permanent bonuses | Stores |
| `src/ui/UpgradesScreen.jsx` | **VERIFY** dynamically renders all 14 upgrades | UI |

### Stories 20.1-20.4 Foundation Review

**Story 20.1 (Combat Stats) created:**
- **permanentUpgradesDefs.js**: 6 combat stats (ATTACK_POWER, ARMOR, MAX_HP, REGEN, ATTACK_SPEED, ZONE)
- **useUpgrades store**: purchaseUpgrade(), getUpgradeLevel(), getTotalFragmentsSpent(), getComputedBonuses(), refundAll(), reset()
- **upgradesStorage.js**: localStorage persistence (key: 'three-spaceship-upgrades')
- **Integration**: Combat bonuses applied at run start via usePlayer.initializeRunStats()

**Story 20.2 (Upgrades Menu) created:**
- **UpgradesScreen.jsx**: Full-screen overlay from main menu, displays all upgrades, purchase flow
- **MainMenu.jsx**: UPGRADES button added

**Story 20.3 (Fragment Display) created:**
- **MainMenu.jsx**: Fragment count display near BEST RUN

**Story 20.4 (Utility Stats) created:**
- **permanentUpgradesDefs.js**: 4 utility stats (MAGNET, LUCK, EXP_BONUS, CURSE)
- **getComputedBonuses()**: Extended to 10 bonuses (6 combat + 4 utility)
- **Integration**: Magnet → XP radius, Luck → drop chances, ExpBonus → XP gains, Curse → spawn rate

**Story 20.5 (this story) adds:**
- **permanentUpgradesDefs.js**: 4 meta stats (REVIVAL, REROLL, SKIP, BANISH)
- **getComputedBonuses()**: Extended to 14 bonuses (6 combat + 4 utility + 4 meta)
- **usePlayer charge tracking**: revivalCharges, rerollCharges, skipCharges, banishCharges
- **No gameplay consumption yet** (Epic 22 will consume charges)

### Meta Upgrade Definitions

Following the Epic 20 spec and Story 20.1/20.4 patterns:

```javascript
// src/entities/permanentUpgradesDefs.js — ADD these 4 upgrades to existing PERMANENT_UPGRADES object

export const PERMANENT_UPGRADES = {
  // ... existing 10 upgrades from Stories 20.1 and 20.4 ...

  REVIVAL: {
    id: 'REVIVAL',
    name: 'Revival',
    description: 'Extra lives per run (Epic 22 Story 22.1)',
    icon: '💚',
    maxLevel: 2,
    levels: [
      { level: 1, cost: 500, bonus: 1 }, // +1 revive
      { level: 2, cost: 1000, bonus: 1 }, // +2 total revives
    ],
  },

  REROLL: {
    id: 'REROLL',
    name: 'Reroll',
    description: 'Re-roll level-up choices per run (Epic 22 Story 22.2)',
    icon: '🔄',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 300, bonus: 1 }, // +1 reroll
      { level: 2, cost: 600, bonus: 1 }, // +2 total rerolls
      { level: 3, cost: 1200, bonus: 1 }, // +3 total rerolls
    ],
  },

  SKIP: {
    id: 'SKIP',
    name: 'Skip',
    description: 'Skip unwanted level-up choices per run (Epic 22 Story 22.2)',
    icon: '⏭️',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 250, bonus: 1 }, // +1 skip
      { level: 2, cost: 500, bonus: 1 }, // +2 total skips
      { level: 3, cost: 1000, bonus: 1 }, // +3 total skips
    ],
  },

  BANISH: {
    id: 'BANISH',
    name: 'Banish',
    description: 'Permanently remove choices from the run (Epic 22 Story 22.2)',
    icon: '🚫',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 400, bonus: 1 }, // +1 banish
      { level: 2, cost: 800, bonus: 1 }, // +2 total banishes
      { level: 3, cost: 1600, bonus: 1 }, // +3 total banishes
    ],
  },
}
```

**Cost Analysis:**
- REVIVAL (2 levels): 500 + 1000 = 1500 total
- REROLL (3 levels): 300 + 600 + 1200 = 2100 total
- SKIP (3 levels): 250 + 500 + 1000 = 1750 total
- BANISH (3 levels): 400 + 800 + 1600 = 2800 total

**Meta stats total: 8150 Fragments**

**Full system cost (all 14 upgrades):**
- Combat stats (Story 20.1): 3800 Fragments
- Utility stats (Story 20.4): 3580 Fragments
- Meta stats (Story 20.5): 8150 Fragments
- **Total: 15,530 Fragments to max all 14 upgrades**

**IMPORTANT:** Meta stats are significantly more expensive than combat/utility stats because they are high-impact strategic tools. Revival is the most expensive (1500 total) because extra lives are extremely powerful. Reroll/Skip/Banish are tactical (2100-2800 each) and should feel like luxury upgrades.

**Balancing Rationale:**
- Players earn ~100-200 Fragments per run (enemy drops + boss + dilemmas)
- Full maxing requires ~80-160 runs (very long-term engagement)
- Meta stats are intentionally expensive to encourage choices (not insta-buying everything)

### Zustand Store Extension

Modify the existing `getComputedBonuses()` function in useUpgrades.jsx to include meta stats:

```javascript
// src/stores/useUpgrades.jsx — MODIFY existing function
getComputedBonuses: () => {
  const state = get()
  const bonuses = {
    // Combat stats (Story 20.1)
    attackPower: 1.0,   // Multiplier (1.0 = no bonus, 1.25 = +25%)
    armor: 0,           // Flat reduction
    maxHP: 0,           // Flat addition
    regen: 0,           // Flat addition (HP/s)
    attackSpeed: 1.0,   // Multiplier (0.85 = -15% cooldown)
    zone: 1.0,          // Multiplier (1.30 = +30% size)

    // Utility stats (Story 20.4)
    magnet: 1.0,        // Multiplier (1.30 = +30% radius)
    luck: 0.0,          // Additive percentage (0.15 = +15% drop chance)
    expBonus: 1.0,      // Multiplier (1.25 = +25% XP)
    curse: 0.0,         // Additive percentage (0.50 = +50% spawn rate)

    // Meta stats (Story 20.5) — counts, not multipliers
    revival: 0,         // Flat count (2 = 2 extra lives)
    reroll: 0,          // Flat count (3 = 3 rerolls)
    skip: 0,            // Flat count (2 = 2 skips)
    banish: 0,          // Flat count (1 = 1 banish)
  }

  for (const [upgradeId, level] of Object.entries(state.upgradeLevels)) {
    const upgradeDef = PERMANENT_UPGRADES[upgradeId]
    if (!upgradeDef) continue

    for (let i = 0; i < level; i++) {
      const levelDef = upgradeDef.levels[i]
      if (!levelDef) continue

      // Apply bonuses based on upgrade type
      if (upgradeId === 'ATTACK_POWER') {
        bonuses.attackPower += levelDef.bonus
      } else if (upgradeId === 'ARMOR') {
        bonuses.armor += levelDef.bonus
      } else if (upgradeId === 'MAX_HP') {
        bonuses.maxHP += levelDef.bonus
      } else if (upgradeId === 'REGEN') {
        bonuses.regen += levelDef.bonus
      } else if (upgradeId === 'ATTACK_SPEED') {
        bonuses.attackSpeed -= levelDef.bonus // Reduction!
      } else if (upgradeId === 'ZONE') {
        bonuses.zone += levelDef.bonus
      } else if (upgradeId === 'MAGNET') {
        bonuses.magnet += levelDef.bonus
      } else if (upgradeId === 'LUCK') {
        bonuses.luck += levelDef.bonus
      } else if (upgradeId === 'EXP_BONUS') {
        bonuses.expBonus += levelDef.bonus
      } else if (upgradeId === 'CURSE') {
        bonuses.curse += levelDef.bonus
      } else if (upgradeId === 'REVIVAL') {
        bonuses.revival += levelDef.bonus
      } else if (upgradeId === 'REROLL') {
        bonuses.reroll += levelDef.bonus
      } else if (upgradeId === 'SKIP') {
        bonuses.skip += levelDef.bonus
      } else if (upgradeId === 'BANISH') {
        bonuses.banish += levelDef.bonus
      }
    }
  }

  return bonuses
},
```

**IMPORTANT:** Meta stats are **flat counts**, not multipliers or percentages. Revival = 2 means 2 extra lives, not a 2x multiplier. This is different from combat/utility stats.

### usePlayer Store Integration

Modify usePlayer.jsx to track meta stat charges and initialize them at run start:

```javascript
// src/stores/usePlayer.jsx — ADD these fields to player state

const usePlayer = create((set, get) => ({
  // ... existing fields (hp, maxHP, xp, level, etc.) ...

  // Meta stat charges (Story 20.5)
  revivalCharges: 0,   // Available revives this run (consumed by Epic 22.1)
  rerollCharges: 0,    // Available rerolls this run (consumed by Epic 22.2)
  skipCharges: 0,      // Available skips this run (consumed by Epic 22.2)
  banishCharges: 0,    // Available banishes this run (consumed by Epic 22.2)

  // ... existing actions ...

  initializeRunStats: () => {
    const shipStats = useShipSelection.getState().getSelectedShipStats() // Ship base stats
    const permanentBonuses = useUpgrades.getState().getComputedBonuses() // Permanent upgrade bonuses

    // Combat stats (Story 20.1)
    const maxHP = shipStats.maxHP + permanentBonuses.maxHP
    const regen = shipStats.regen + permanentBonuses.regen
    // ... other combat stats ...

    // Meta stat charges (Story 20.5)
    const revivalCharges = (shipStats.revival || 0) + permanentBonuses.revival
    const rerollCharges = (shipStats.reroll || 0) + permanentBonuses.reroll
    const skipCharges = (shipStats.skip || 0) + permanentBonuses.skip
    const banishCharges = (shipStats.banish || 0) + permanentBonuses.banish

    set({
      hp: maxHP, // Start at full health
      maxHP,
      regen,
      // ... other stats ...
      revivalCharges,
      rerollCharges,
      skipCharges,
      banishCharges,
      permanentUpgradeBonuses: permanentBonuses, // Store for GameLoop access
    })
  },

  // Epic 22.1 will add: consumeRevival() action
  // Epic 22.2 will add: consumeReroll(), consumeSkip(), consumeBanish() actions

  reset: () => {
    set({
      // ... existing reset fields ...
      revivalCharges: 0,
      rerollCharges: 0,
      skipCharges: 0,
      banishCharges: 0,
    })
  },
}))
```

**IMPORTANT:** Ship base stats (shipStats.revival, etc.) are currently 0 for all ships, but Epic 22 might add ship variants with base revival/reroll/skip/banish. The code should safely handle shipStats.revival being undefined (default to 0).

**Charge Consumption (Epic 22 implementation):**
- **Revival (Epic 22.1)**: When player dies, if revivalCharges > 0, decrement by 1 and respawn player
- **Reroll (Epic 22.2)**: During level-up, if rerollCharges > 0, player can reroll choices (decrement on use)
- **Skip (Epic 22.2)**: During level-up, if skipCharges > 0, player can skip this level-up (decrement on use)
- **Banish (Epic 22.2)**: During level-up, if banishCharges > 0, player can banish a choice from pool (decrement on use)

### HUD Display Placeholder (Optional)

Story 20.5 can optionally add a HUD placeholder showing revival charges, even though revival isn't functional yet. This helps visualize the upgrade working.

**Optional Task (if time allows):**
```javascript
// src/ui/HUD.jsx — ADD revival charge display
<div className="revival-charges">
  💚 x {revivalCharges}
</div>
```

**Styling:** Similar to weapon slots or boon slots display. Show grayed/hidden if revivalCharges === 0.

**IMPORTANT:** Reroll/Skip/Banish charges are NOT displayed in HUD — they only appear during level-up screens (Epic 22.2).

### Epic 22 Integration Points

**Story 22.1 (Revival/Respawn System) will:**
- Read `usePlayer.getState().revivalCharges`
- On player death: if revivalCharges > 0, trigger respawn animation, decrement charge, restore HP
- Show revival count in HUD (functional, not placeholder)

**Story 22.2 (Reroll/Banish/Skip Mechanics) will:**
- Read `usePlayer.getState().rerollCharges`, `skipCharges`, `banishCharges`
- During level-up modal: show buttons "REROLL", "SKIP", "BANISH" if charges > 0
- On button click: decrement appropriate charge, perform action
- Banish action: add choice ID to a `banishedChoices` array in usePlayer, filter from future level-ups

**Story 22.3 (Boon/Weapon Rarity System) will:**
- Use `permanentBonuses.luck` to influence rarity rolls (higher luck = more rare/epic boons)
- Not directly related to meta stats, but mentioned in Story 20.4 utility stats

### Fragment Economy Update

**Fragment costs for meta stats:**
- REVIVAL (2 levels): 1500 total
- REROLL (3 levels): 2100 total
- SKIP (3 levels): 1750 total
- BANISH (3 levels): 2800 total

**Total meta stats: 8150 Fragments**

**Combined full system (all 14 upgrades):**
- Combat stats: 3800
- Utility stats: 3580
- Meta stats: 8150
- **Total: 15,530 Fragments**

**Fragment earning rate (current implementation):**
- Enemy drops (12% chance): ~10-30 Fragments per run (depends on kills)
- Boss reward: 100 Fragments per boss
- Tunnel dilemmas: Variable (0-50 Fragments estimated)

**Estimated Fragments per run: 120-200**

**Progression pacing:**
- Players can afford 1-2 small upgrades or 1 expensive upgrade every 2-3 runs
- Full maxing requires ~80-160 runs (very long-term engagement, weeks of play)
- Meta stats are luxury upgrades (players max combat/utility first, then meta)

**Economic Design Philosophy:**
- Early runs: Combat stats (Attack, HP, Armor) for survival
- Mid-game: Utility stats (Magnet, ExpBonus, Luck) for efficiency
- Late-game: Meta stats (Revival, Reroll) for strategic flexibility

### Testing Standards

Follow the project's Vitest testing standards:

**Config tests:**
- Test permanentUpgradesDefs: REVIVAL, REROLL, SKIP, BANISH have valid structure
- Test all meta upgrades: maxLevel matches spec, levels array complete, costs escalate
- Test total Fragment cost calculation (verify 8150 total for meta stats)

**Store tests (useUpgrades):**
- Test getComputedBonuses() includes revival, reroll, skip, banish (14 total bonuses)
- Test meta bonuses default to 0 when no upgrades purchased
- Test purchasing meta upgrades updates bonuses correctly
- Test persistence saves and loads meta upgrades

**Store tests (usePlayer):**
- Test initializeRunStats() sets revivalCharges, rerollCharges, skipCharges, banishCharges
- Test charges = shipBase + permanentBonus (when shipBase = 0, charges = permanentBonus)
- Test charges = shipBase + permanentBonus (when shipBase > 0, e.g., future ship variant with base revival)
- Test reset() clears all charge fields to 0

**Integration tests:**
- Test purchasing REVIVAL upgrades → revivalCharges increases at next run start
- Test purchasing REROLL/SKIP/BANISH upgrades → respective charges increase at run start
- Test charges persist across run resets (upgrades persist, charges reset to computed value)

**Epic 22 readiness tests:**
- Test usePlayer exposes revivalCharges, rerollCharges, skipCharges, banishCharges for Epic 22 consumption
- Test usePlayer.reset() properly resets charges (Epic 22 should reinitialize charges on new run)

**CRITICAL:** Use `useUpgrades.getState().reset()` and `usePlayer.getState().reset()` in afterEach() to prevent test pollution.

### Performance Notes

- Meta stat bonuses computed once at run start, not every frame (same as combat/utility stats)
- getComputedBonuses() extends from O(10) to O(14) upgrades — still negligible (<1ms)
- No new stores or persistence — reuses Story 20.1 infrastructure
- Charge tracking in usePlayer adds 4 integer fields — negligible memory overhead
- No gameplay loops affected (charges are read-only until Epic 22 consumes them)

**No performance concerns for this story.**

### Project Structure Notes

**Modified files:**
- `src/entities/permanentUpgradesDefs.js` — Add 4 meta upgrade definitions
- `src/stores/useUpgrades.jsx` — Extend getComputedBonuses() to include meta stats
- `src/stores/usePlayer.jsx` — Add charge fields, initialize from permanent bonuses

**New files:**
- `src/entities/__tests__/permanentUpgradesDefs.meta.test.js` — Meta upgrade tests
- `src/stores/__tests__/usePlayer.meta-charges.test.js` — Charge tracking tests

**NOT modified:**
- `src/ui/UpgradesScreen.jsx` — Already displays all upgrades dynamically (no changes needed)
- `src/ui/MainMenu.jsx` — Fragment display already implemented (Story 20.3)
- `src/GameLoop.jsx` — No gameplay changes (charges are inert until Epic 22)

### Epic 22 Readiness Checklist

This story prepares the **data layer** for Epic 22. Epic 22 will add the **behavior layer** (consumption mechanics).

**What Story 20.5 provides for Epic 22:**
- ✅ Meta upgrade definitions in config (REVIVAL, REROLL, SKIP, BANISH)
- ✅ Purchase flow via UpgradesScreen (players can buy meta upgrades now)
- ✅ Charge tracking in usePlayer (revivalCharges, rerollCharges, etc.)
- ✅ Persistence (upgrades persist across sessions, charges reset per run)
- ✅ HUD placeholder for revival charges (optional)

**What Epic 22 will add:**
- ❌ Revival mechanic: consume revivalCharges on death, trigger respawn (Story 22.1)
- ❌ Reroll mechanic: consume rerollCharges during level-up, regenerate choices (Story 22.2)
- ❌ Skip mechanic: consume skipCharges during level-up, skip this level-up (Story 22.2)
- ❌ Banish mechanic: consume banishCharges during level-up, remove choice from pool (Story 22.2)

**Integration contract:**
- usePlayer exposes: `revivalCharges`, `rerollCharges`, `skipCharges`, `banishCharges` (readable)
- Epic 22 will add actions: `consumeRevival()`, `consumeReroll()`, `consumeSkip()`, `consumeBanish()`
- Charges are initialized at run start via `initializeRunStats()` (Epic 22 calls this, no changes needed)

### UX Considerations

**Why meta stats as permanent upgrades?**
- Revival: Lowers difficulty floor, allows learning from mistakes without full restart
- Reroll: Tactical flexibility, reduces RNG frustration in build crafting
- Skip: Agency to avoid unwanted upgrades (especially when all slots full)
- Banish: Strategic deck-building feel, removes bad choices from pool entirely

**Why separate meta stats from combat/utility?**
- Different playstyle impact: Meta stats change **how you play**, not just power level
- High cost reflects high strategic value (Revival/Reroll are game-changers)
- Encourages long-term goals ("I need 1500 Fragments for Revival")

**Why make them purchasable before Epic 22?**
- Players can start accumulating charges immediately
- Builds anticipation for Epic 22 ("I have 2 revivals ready!")
- UpgradesScreen shows full progression path (14 upgrades, not just 10)
- Fragment economy starts flowing earlier (more spending options = more engagement)

**Player messaging (in upgrade descriptions):**
- "Extra lives per run (Epic 22 Story 22.1)" — transparent about future functionality
- Players understand: "I can buy this now, it'll work later"
- Avoids confusion: "I bought Revival but nothing happens" (description warns it's future content)

### References

- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md#Story 20.5] — Epic context, meta stats spec
- [Source: _bmad-output/implementation-artifacts/20-1-permanent-upgrades-combat-stats.md] — Story 20.1 foundation patterns
- [Source: _bmad-output/implementation-artifacts/20-4-permanent-upgrades-utility-stats.md] — Story 20.4 extension patterns
- [Source: src/entities/permanentUpgradesDefs.js] — Combat + utility stats definitions (Stories 20.1/20.4)
- [Source: src/stores/useUpgrades.jsx] — Upgrades store (Story 20.1, extended in 20.4/20.5)
- [Source: src/stores/usePlayer.jsx] — Player state, run initialization
- [Source: _bmad-output/planning-artifacts/architecture.md#6-Layer Architecture] — System integration patterns
- [Source: _bmad-output/planning-artifacts/epic-22-combat-depth.md] — Epic 22 revival/reroll/skip/banish mechanics (future)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Added 4 meta stat upgrades (REVIVAL, REROLL, SKIP, BANISH) to permanentUpgradesDefs.js with escalating costs totaling 8150 Fragments
- Extended getComputedBonuses() in useUpgrades.jsx to return 14 bonuses (6 combat + 4 utility + 4 meta)
- Added revivalCharges, rerollCharges, skipCharges, banishCharges fields to usePlayer.jsx
- initializeRunStats() now sets meta charges from permanent bonuses
- reset() clears all meta charge fields to 0
- Updated DEFAULT_PERMANENT_BONUSES to include meta fields (revival, reroll, skip, banish)
- UpgradesScreen.jsx already handles all upgrades dynamically — no changes needed
- Updated existing test (permanentUpgradesDefs.test.js) from "10 upgrades" to "14 upgrades"
- Created 2 new test files with 44 new tests covering meta defs, store bonuses, charge tracking, integration, and Epic 22 readiness
- Full regression suite passes: 91 files, 1543 tests, 0 failures

### Change Log

- 2026-02-15: Story 20.5 implemented — Added 4 meta stat permanent upgrades (REVIVAL, REROLL, SKIP, BANISH) with charge tracking in usePlayer store. Charges are initialized at run start from permanent bonuses. No gameplay consumption yet (deferred to Epic 22).
- 2026-02-15: Code review fixes — (C1) Unchecked HUD placeholder subtask (not implemented, deferred to Epic 22.1). (M1) Changed REVIVAL icon from 💚 to 💗 to avoid duplicate with REGEN. (M2) initializeRunStats() now includes ship base meta charges (ship.revival || 0) + permanent bonuses for future-proofing.

### File List

**Modified:**
- src/entities/permanentUpgradesDefs.js — Added 4 meta upgrade definitions (REVIVAL, REROLL, SKIP, BANISH)
- src/entities/__tests__/permanentUpgradesDefs.test.js — Updated count from 10 to 14 upgrades
- src/stores/useUpgrades.jsx — Extended getComputedBonuses() with 4 meta bonus fields
- src/stores/__tests__/useUpgrades.test.js — Added 6 meta stat bonus tests
- src/stores/usePlayer.jsx — Added meta charge fields, initializeRunStats sets charges, reset clears charges, updated DEFAULT_PERMANENT_BONUSES

**New:**
- src/entities/__tests__/permanentUpgradesDefs.meta.test.js — 27 tests for meta upgrade definitions
- src/stores/__tests__/usePlayer.metaCharges.test.js — 17 tests for charge tracking and integration
