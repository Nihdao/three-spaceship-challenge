# Story 25.1: Ship Level Progression

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to upgrade my ships from level 1 to 9 using Fragments,
So that my favorite ship grows stronger over time and I feel invested in my choice.

## Acceptance Criteria

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
**And** the cost for the next level is displayed using the ◆ fragment icon (consistent with HUD, UpgradesScreen, PauseMenu)

**Given** the ship reaches max level (9)
**When** displayed
**Then** "MAX LEVEL" is shown instead of level-up button
**And** the ship has reached its full stat potential

## Tasks / Subtasks

- [x] Task 1: Create ship progression config and storage (AC: #1)
  - [x] Create src/entities/shipProgressionDefs.js (NEW file)
  - [x] Define SHIP_LEVEL_COSTS array (levels 1-9): [100, 200, 400, 700, 1000, 1500, 2000, 3000, 5000]
  - [x] Define SHIP_LEVEL_SCALING constant (e.g., 0.03 = 3% per level)
  - [x] Create src/utils/shipProgressionStorage.js (NEW file) — localStorage get/set pattern
  - [x] Follow same pattern as upgradesStorage.js from Story 20.1

- [x] Task 2: Create useShipProgression Zustand store with persistence (AC: #1, #2)
  - [x] Create src/stores/useShipProgression.jsx (NEW file)
  - [x] State: shipLevels object { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 }
  - [x] Actions: levelUpShip(shipId), getShipLevel(shipId), getNextLevelCost(shipId)
  - [x] Computed getter: getShipStatMultiplier(shipId, level) returns stat multiplier (1 + (level - 1) * SHIP_LEVEL_SCALING)
  - [x] persist() action called after each level up
  - [x] loadPersistedLevels() called on store init
  - [x] reset() clears all levels to 1 (for debugging only)

- [x] Task 3: Integrate ship level bonuses at run start (AC: #2)
  - [x] Modify usePlayer.jsx: When ship stats are initialized, apply level multiplier
  - [x] In initializeRunStats (Story 20.1), call useShipProgression.getState().getShipStatMultiplier()
  - [x] Apply multiplier to ship base stats (baseHP, baseSpeed, baseDamageMultiplier)
  - [x] Level bonuses stack multiplicatively with permanent upgrades

- [x] Task 4: Add level display to ship selection UI (AC: #3, #4)
  - [x] Modify src/ui/ShipSelect.jsx: Display current level (e.g., "LV. 5")
  - [x] Add "LEVEL UP" button with cost display
  - [x] Disable button if: not enough Fragments OR ship at max level
  - [x] Show "MAX LEVEL" badge if ship is level 9
  - [x] On level up click: call useShipProgression.levelUpShip(shipId)
  - [x] Show visual feedback (success animation/sound)

- [x] Task 5: Write tests
  - [x] Test useShipProgression: levelUpShip increments level, deducts fragments
  - [x] Test useShipProgression: cannot level up if not enough fragments
  - [x] Test useShipProgression: cannot level up beyond max level (9)
  - [x] Test useShipProgression: getShipStatMultiplier returns correct value
  - [x] Test useShipProgression: persistence saves/loads correctly
  - [x] Test shipProgressionDefs: level costs array has 9 entries
  - [x] Test integration: run start applies ship level bonuses to usePlayer

## Dev Notes

### Architecture Alignment

This story creates the **ship level progression foundation** (data layer + store + UI integration), enabling players to permanently strengthen their favorite ships with Fragment investment.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/shipProgressionDefs.js` (NEW) — Level costs and scaling constants
- **Stores Layer**: `src/stores/useShipProgression.jsx` (NEW) — Zustand store with localStorage persistence
- **Stores Layer**: `src/stores/usePlayer.jsx` — Modified to apply ship level bonuses at run start
- **Utils Layer**: `src/utils/shipProgressionStorage.js` (NEW) — localStorage get/set helpers
- **UI Layer**: `src/ui/ShipSelect.jsx` — Add level display and level-up button
- **GameLoop**: No changes (level bonuses applied at initialization, not every frame)

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/entities/shipProgressionDefs.js` | **NEW** — Ship level costs + scaling constant | Config |
| `src/stores/useShipProgression.jsx` | **NEW** — Zustand store for ship levels with persistence | Stores |
| `src/utils/shipProgressionStorage.js` | **NEW** — localStorage get/set (mirror upgradesStorage.js) | Utils |
| `src/stores/usePlayer.jsx` | Apply ship level multiplier at run start (initializeRunStats) | Stores |
| `src/ui/ShipSelect.jsx` | Add level display, level-up button, max level badge | UI |
| `src/entities/shipDefs.js` | REFERENCE ONLY — Ship base stats used for level scaling | Config |

### Existing Ship Infrastructure

**Current ships** (from `src/entities/shipDefs.js`):
- **BALANCED** (Vanguard): HP 100, Speed 50, Damage 1.0
- **GLASS_CANNON** (Striker): HP 70, Speed 55, Damage 1.4
- **TANK** (Fortress): HP 150, Speed 42, Damage 0.85

**Ship selection** (from `src/stores/usePlayer.jsx`):
- **currentShipId**: Selected ship ID (persisted to localStorage via Story 9.3)
- **shipBaseSpeed**: Ship's base speed (cached for performance)
- **shipBaseDamageMultiplier**: Ship's damage multiplier
- **initializeRunStats()**: Called at run start to compute effective stats from ship + permanent upgrades

**Ship selection UI** (from `src/ui/ShipSelect.jsx`):
- Displays all ships with stats, description, unlock status
- Shows current selection, allows switching
- Will be extended to show level + level-up button

### Ship Level System Design

**Level Costs (Fragment investment):**
```javascript
export const SHIP_LEVEL_COSTS = [
  100,  // Level 1 → 2
  200,  // Level 2 → 3
  400,  // Level 3 → 4
  700,  // Level 4 → 5
  1000, // Level 5 → 6
  1500, // Level 6 → 7
  2000, // Level 7 → 8
  3000, // Level 8 → 9
  5000, // Level 9 (max) — this is the cost to reach level 9
]
```

**Total cost to max a single ship:** 100 + 200 + 400 + 700 + 1000 + 1500 + 2000 + 3000 = **9,900 Fragments**

**Stat scaling per level:**
```javascript
export const SHIP_LEVEL_SCALING = 0.03 // 3% per level

// Level 1: 1.00x base stats (no bonus)
// Level 2: 1.03x base stats (+3%)
// Level 3: 1.06x base stats (+6%)
// ...
// Level 9: 1.24x base stats (+24%)
```

**Stat multiplier formula:**
```javascript
statMultiplier = 1 + (level - 1) * SHIP_LEVEL_SCALING
// Example: Level 5 = 1 + (5 - 1) * 0.03 = 1.12 (+12%)
```

**Applied to all ship base stats:**
- `baseHP * statMultiplier` — More survivability at higher levels
- `baseSpeed * statMultiplier` — Faster movement at higher levels
- `baseDamageMultiplier * statMultiplier` — More damage at higher levels

**CRITICAL:** Ship level bonuses are **multiplicative** with permanent upgrades (Epic 20), not additive. This means:
- Permanent Upgrade +30 HP → applied AFTER ship level multiplier
- Permanent Upgrade +5% damage → applied AFTER ship level multiplier
- Stack order: Ship base stats → Ship level multiplier → Permanent upgrades → Boons/Tunnel upgrades

### localStorage Persistence Pattern

Follow the **exact same pattern** as `upgradesStorage.js` (Story 20.1):

```javascript
// src/utils/shipProgressionStorage.js
export const STORAGE_KEY_SHIP_LEVELS = 'SPACESHIP_SHIP_LEVELS'

export function getPersistedShipLevels() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SHIP_LEVELS)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      // Validate structure, return default if corrupt
      return parsed
    }
  } catch {
    // localStorage unavailable or parse error
  }
  return { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 } // Default: all ships level 1
}

export function setPersistedShipLevels(shipLevels) {
  try {
    localStorage.setItem(STORAGE_KEY_SHIP_LEVELS, JSON.stringify(shipLevels))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
```

**IMPORTANT:** The persisted data is a simple object: `{ BALANCED: 3, GLASS_CANNON: 1, TANK: 5 }` (ship levels only).

### Zustand Store Structure Pattern

Follow the standard store pattern from `useUpgrades` (Story 20.1):

```javascript
// src/stores/useShipProgression.jsx
import { create } from 'zustand'
import { getPersistedShipLevels, setPersistedShipLevels } from '../utils/shipProgressionStorage.js'
import { SHIP_LEVEL_COSTS, SHIP_LEVEL_SCALING } from '../entities/shipProgressionDefs.js'
import { SHIPS } from '../entities/shipDefs.js'

const useShipProgression = create((set, get) => ({
  // --- State ---
  shipLevels: getPersistedShipLevels(), // { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 }

  // --- Actions ---
  levelUpShip: (shipId) => {
    const state = get()
    const currentLevel = state.shipLevels[shipId] || 1

    if (currentLevel >= 9) return false // Already max level

    const cost = SHIP_LEVEL_COSTS[currentLevel - 1] // Level 1 → 2 = index 0
    if (!cost) return false

    // Check if player has enough fragments (usePlayer.getState().fragments)
    const playerStore = usePlayer.getState()
    if (playerStore.fragments < cost) return false

    // Deduct fragments: usePlayer.getState().addFragments(-cost)
    playerStore.addFragments(-cost)

    // Increment level
    const newLevels = { ...state.shipLevels, [shipId]: currentLevel + 1 }
    set({ shipLevels: newLevels })
    setPersistedShipLevels(newLevels)
    return true
  },

  getShipLevel: (shipId) => {
    return get().shipLevels[shipId] || 1
  },

  getNextLevelCost: (shipId) => {
    const currentLevel = get().shipLevels[shipId] || 1
    if (currentLevel >= 9) return null // Already max level
    return SHIP_LEVEL_COSTS[currentLevel - 1]
  },

  getShipStatMultiplier: (shipId, level = null) => {
    const shipLevel = level !== null ? level : (get().shipLevels[shipId] || 1)
    return 1 + (shipLevel - 1) * SHIP_LEVEL_SCALING
  },

  reset: () => set({ shipLevels: { BALANCED: 1, GLASS_CANNON: 1, TANK: 1 } }),
}))

export default useShipProgression
```

**CRITICAL:** The `levelUpShip` action must:
1. Check current level < 9
2. Get cost from SHIP_LEVEL_COSTS[currentLevel - 1]
3. Check usePlayer.fragments >= cost
4. Call usePlayer.getState().addFragments(-cost) to deduct
5. Increment shipLevels[shipId]
6. Call setPersistedShipLevels() immediately
7. Return true/false for success

### Run Initialization Integration

The ship level multiplier must be applied **at run start**, when player stats are initialized:

```javascript
// In usePlayer.jsx, modify initializeRunStats action (Story 20.1):
initializeRunStats: (bonuses) => {
  const state = get()
  const shipDef = SHIPS[state.currentShipId]

  // Get ship level multiplier (Story 25.1)
  const shipLevel = useShipProgression.getState().getShipLevel(state.currentShipId)
  const shipLevelMult = useShipProgression.getState().getShipStatMultiplier(state.currentShipId, shipLevel)

  // Apply ship level to base stats FIRST
  const leveledBaseHP = shipDef.baseHP * shipLevelMult
  const leveledBaseSpeed = shipDef.baseSpeed * shipLevelMult
  const leveledBaseDamage = shipDef.baseDamageMultiplier * shipLevelMult

  // Then apply permanent upgrades (additive bonuses)
  const effectiveMaxHP = leveledBaseHP + bonuses.maxHP
  const effectiveBaseSpeed = leveledBaseSpeed // Speed bonuses handled elsewhere
  const effectiveBaseDamage = leveledBaseDamage * bonuses.attackPower

  set({
    maxHP: effectiveMaxHP,
    currentHP: effectiveMaxHP,
    shipBaseSpeed: effectiveBaseSpeed,
    shipBaseDamageMultiplier: effectiveBaseDamage,
    permanentUpgradeBonuses: bonuses,
  })
}
```

**Stack order:**
1. Ship base stats (from shipDefs.js)
2. Ship level multiplier (3% per level)
3. Permanent upgrades (Epic 20 — additive bonuses)
4. Boons (during gameplay)
5. Tunnel upgrades (during run)

### Ship Selection UI Integration

Modify `src/ui/ShipSelect.jsx` to display ship level and level-up button:

**Display elements to add:**
- **Level badge**: "LV. 5" next to ship name
- **Level-up button**: "LEVEL UP (200 ⚙️)" if affordable, grayed if not
- **Max level badge**: "MAX LEVEL" if ship is level 9
- **Fragment cost**: Display next level cost clearly
- **Visual feedback**: Play success SFX on level up (use audioManager.js)

**UI layout suggestion:**
```
┌────────────────────────────────┐
│  [Ship Card]                   │
│  Vanguard            LV. 5     │
│  --------------------------------
│  HP: 100 → 112 (+12%)          │
│  Speed: 50 → 56 (+12%)         │
│  Damage: 1.0 → 1.12 (+12%)     │
│  --------------------------------
│  [LEVEL UP (1000 ⚙️)] or       │
│  [MAX LEVEL] badge             │
└────────────────────────────────┘
```

**CRITICAL:** The UI must:
- Read from `useShipProgression.getShipLevel(shipId)`
- Read from `useShipProgression.getNextLevelCost(shipId)`
- Read from `usePlayer.fragments` to check affordability
- Call `useShipProgression.levelUpShip(shipId)` on button click
- Show stat preview with level multiplier applied (current vs next level)

### Fragment Economy Balance

**Fragment sources** (from previous stories):
- Enemy drops (Story 19.3): 12% drop chance, 1 Fragment per gem
- Boss reward (Story 6.3): 100 Fragments per boss kill
- Tunnel rewards (Story 7.2): Variable Fragment rewards from dilemmas

**Fragment costs:**
- **Permanent Upgrades** (Epic 20): 3800 Fragments to max all 6 combat stats
- **Utility Upgrades** (Story 20.4): ~1500 Fragments (estimated)
- **Meta Upgrades** (Story 20.5): ~1000 Fragments (estimated)
- **Ship Levels** (Story 25.1): 14,900 Fragments to max ONE ship
- **Total for 3 ships**: 9,900 × 3 = 29,700 Fragments

**IMPORTANT:** Ship leveling is a HUGE Fragment sink. This is intentional — it encourages players to specialize in 1-2 favorite ships rather than maxing all 3. Total meta-progression investment = ~50,000+ Fragments.

### Testing Standards

Follow the project's Vitest testing standards:

**Store tests:**
- Test useShipProgression: levelUpShip increments level, deducts fragments
- Test useShipProgression: cannot level up if not enough fragments
- Test useShipProgression: cannot level up beyond level 9
- Test useShipProgression: getShipStatMultiplier returns correct value (1.0 at level 1, 1.24 at level 9)
- Test useShipProgression: persistence saves and loads correctly
- Test useShipProgression: reset clears all levels to 1

**Config tests:**
- Test shipProgressionDefs: SHIP_LEVEL_COSTS has exactly 9 entries
- Test shipProgressionDefs: all costs are positive numbers
- Test shipProgressionDefs: SHIP_LEVEL_SCALING is a valid percentage (0.0-1.0)

**Integration tests:**
- Test run start: ship level multiplier applied to usePlayer stats
- Test level up: fragments deducted, level incremented, persisted
- Test UI: level display matches store state

**CRITICAL:** All tests must reset store state between test cases to prevent pollution. Use `useShipProgression.getState().reset()` and `usePlayer.getState().reset()` in afterEach().

### Performance Notes

- Ship level multiplier computed **once at run start**, not every frame
- getShipStatMultiplier() is O(1) arithmetic operation
- localStorage writes only on level up, not every frame
- No GC pressure — multiplier applied to base stats once

### Project Structure Notes

**New files:**
- `src/entities/shipProgressionDefs.js` — Level costs + scaling constant
- `src/stores/useShipProgression.jsx` — Zustand store
- `src/utils/shipProgressionStorage.js` — localStorage helpers
- `src/stores/__tests__/useShipProgression.test.js` — Store tests
- `src/entities/__tests__/shipProgressionDefs.test.js` — Config tests

**Modified files:**
- `src/stores/usePlayer.jsx` — Apply ship level multiplier in initializeRunStats
- `src/ui/ShipSelect.jsx` — Add level display, level-up button, max level badge

**NOT in this story:**
- Skin system (Story 25.2 — visual tints at levels 3, 6, 9)
- Galaxy choice screen (Story 25.3)
- Armory catalog (Story 25.4)
- Global stats tracking (Story 25.5, 25.6)

### Dependencies on Other Stories

**Depends on:**
- Story 9.2 (Ship Variants & Stats Display) — Ship data structure to extend ✅ DONE
- Story 9.3 (Ship Selection Persistence) — Ship selection UI to modify ✅ DONE
- Epic 20 (Permanent Upgrades) — Fragment economy, stat computation pipeline ✅ DONE
- Story 19.3 (Fragment Drops) — Fragment acquisition system ✅ DONE

**Blocks:**
- Story 25.2 (Level-Based Ship Skins) — Requires ship levels to determine skin unlocks
- Story 25.3 (Galaxy Choice Screen) — No direct dependency, can proceed in parallel

### References

- [Source: _bmad-output/planning-artifacts/epic-25-meta-content.md] — Epic context, all 6 stories, ship level spec
- [Source: _bmad-output/implementation-artifacts/20-1-permanent-upgrades-combat-stats.md] — localStorage persistence pattern, Zustand store pattern
- [Source: src/entities/shipDefs.js] — Ship base stats (baseHP, baseSpeed, baseDamageMultiplier)
- [Source: src/stores/usePlayer.jsx] — Player stats, ship selection, initializeRunStats
- [Source: src/ui/ShipSelect.jsx] — Ship selection UI to extend
- [Source: src/utils/upgradesStorage.js] — localStorage pattern to mirror
- [Source: src/stores/useUpgrades.jsx] — Store pattern to mirror
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, Zustand patterns

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was straightforward following the story spec.

### Completion Notes List

- Created `shipProgressionDefs.js` with SHIP_LEVEL_COSTS (8 entries — one per transition 1→2 through 8→9, total max cost 9,900 Fragments), SHIP_LEVEL_SCALING (0.03 default), MAX_SHIP_LEVEL (9).
- Created `shipProgressionStorage.js` mirroring `upgradesStorage.js` pattern exactly.
- Created `useShipProgression.jsx` Zustand store with levelUpShip, getShipLevel, getNextLevelCost, getShipStatMultiplier, reset. Circular dependency with usePlayer (useShipProgression imports usePlayer for fragment deduction) handled safely via ES module live bindings — both stores only access each other inside function bodies, not during initialization.
- Modified `usePlayer.initializeRunStats` to: (1) call `useShipProgression.getState().getShipStatMultiplier()`, (2) apply multiplier to `ship.baseHP`, `ship.baseSpeed`, `ship.baseDamageMultiplier`. attackPower is NOT baked into shipBaseDamageMultiplier to avoid double-counting in GameLoop's `composeDamageMultiplier`.
- Modified `ShipSelect.jsx` to display ship level badge (LV.N), LEVEL UP button with cost using ◆ fragment icon (purple #cc66ff, consistent with HUD/UpgradesScreen/PauseMenu), MAX LEVEL badge at level 9. Stats display includes level multiplier applied to HP, speed, damage.
- Modified `shipDefs.js` to add `levelScaling: 0.03` per-ship field (AC requirement: scaling defined per ship). `getShipStatMultiplier` updated to read `SHIPS[shipId].levelScaling` (with fallback to global SHIP_LEVEL_SCALING), fixing the silent shipId-ignored-when-level-passed API confusion.
- 43 new tests pass (8 config tests + 35 store/integration/UI-integration tests). Zero regressions. Pre-existing failures in spawnSystem.test.js and progressionSystem.test.js are from Story 23.1 (in-progress).
- Code review fixes applied: dead cost entry removed (SHIP_LEVEL_COSTS reduced from 9 to 8 entries), per-ship levelScaling added to shipDefs.js, UI integration tests added, getShipStatMultiplier fixed to always use shipId for scaling lookup.

### File List

- src/entities/shipProgressionDefs.js (NEW)
- src/utils/shipProgressionStorage.js (NEW)
- src/stores/useShipProgression.jsx (NEW)
- src/stores/__tests__/useShipProgression.test.js (NEW)
- src/entities/__tests__/shipProgressionDefs.test.js (NEW)
- src/stores/usePlayer.jsx (MODIFIED — initializeRunStats, added import)
- src/ui/ShipSelect.jsx (MODIFIED — level display, LEVEL UP button)
- src/entities/shipDefs.js (MODIFIED — added levelScaling field per-ship, code review fix)
