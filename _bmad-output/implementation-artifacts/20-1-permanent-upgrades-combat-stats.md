# Story 20.1: Permanent Upgrades — Combat Stats

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to spend Fragments on permanent combat stat upgrades between runs,
So that my character grows stronger over time and each run starts from a better baseline.

## Acceptance Criteria

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

## Tasks / Subtasks

- [x] Task 1: Create permanent upgrades config (AC: #2)
  - [x] Create src/entities/permanentUpgradesDefs.js (NEW file)
  - [x] Define 6 PERMANENT_UPGRADES entries: ATTACK_POWER, ARMOR, MAX_HP, REGEN, ATTACK_SPEED, ZONE
  - [x] Each upgrade: id, name, description, maxLevel, levels array with { level, cost, bonus }
  - [x] Follow Epic 20 spec for level counts and cost escalation

- [x] Task 2: Create useUpgrades Zustand store with persistence (AC: #1, #3)
  - [x] Create src/stores/useUpgrades.jsx (NEW file)
  - [x] Create src/utils/upgradesStorage.js (NEW file) — localStorage get/set pattern
  - [x] State: upgradeLevels object { ATTACK_POWER: 0, ARMOR: 0, ... }
  - [x] Actions: purchaseUpgrade(upgradeId), getUpgradeLevel(upgradeId), getTotalFragmentsSpent()
  - [x] Computed getters: getComputedBonuses() returns { attackPower, armor, maxHP, regen, attackSpeed, zone }
  - [x] persist() action called after each purchase
  - [x] loadPersistedUpgrades() called on store init
  - [x] reset() clears all upgrades to level 0 (for debugging/testing only)

- [x] Task 3: Integrate permanent upgrades at run start (AC: #4)
  - [x] Modify usePlayer.jsx: Add permanentUpgradeBonuses field
  - [x] In usePlayer startRun (or similar init), call useUpgrades.getState().getComputedBonuses()
  - [x] Apply bonuses to player stats: maxHP += bonus.maxHP, etc.
  - [x] Store bonuses in state for reference during gameplay

- [x] Task 4: Apply upgrade bonuses in gameplay (AC: #5)
  - [x] Modify GameLoop.jsx damage calculation: apply attackPower multiplier
  - [x] Modify GameLoop.jsx incoming damage: subtract armor flat value (min 1 damage)
  - [x] Modify usePlayer tick(): add regen bonus to passive HP regen
  - [x] Modify useWeapons tick(): apply attackSpeed multiplier to cooldowns
  - [x] Modify projectile rendering: apply zone bonus to projectile scale

- [x] Task 5: Write tests
  - [x] Test useUpgrades: purchaseUpgrade increases level, decrements fragments
  - [x] Test useUpgrades: getComputedBonuses returns correct sums
  - [x] Test useUpgrades: persistence saves/loads correctly
  - [x] Test permanentUpgradesDefs: all upgrades have valid structure
  - [x] Test integration: run start applies bonuses to usePlayer

## Dev Notes

### Architecture Alignment

This story creates the **foundation** of the permanent upgrade system (data layer + store), but does **NOT** include the UI (Story 20.2) or the main menu Fragment display (Story 20.3). The focus is purely on the upgrade state management and gameplay integration.

**6-Layer Architecture:**
- **Config Layer**: `src/entities/permanentUpgradesDefs.js` (NEW) — Define all 6 combat stat upgrades
- **Stores Layer**: `src/stores/useUpgrades.jsx` (NEW) — Zustand store with localStorage persistence
- **Stores Layer**: `src/stores/usePlayer.jsx` — Modified to incorporate permanent upgrade bonuses at run start
- **Utils Layer**: `src/utils/upgradesStorage.js` (NEW) — localStorage get/set helpers (mirror highScoreStorage.js)
- **GameLoop**: `src/GameLoop.jsx` — Apply attack/armor bonuses in damage calculations
- **Rendering Layer**: Projectile renderers — Apply zone bonus to projectile scale

**UI Layer (NOT in this story):**
- Story 20.2 will create UpgradesScreen.jsx (menu overlay for browsing/purchasing)
- Story 20.3 will add Fragment display to MainMenu.jsx
- Story 20.7 will enhance ShipSelect.jsx to show combined stats

### Key Source Files

| File | Change | Layer |
|------|--------|-------|
| `src/entities/permanentUpgradesDefs.js` | **NEW** — 6 combat stat upgrade definitions | Config |
| `src/stores/useUpgrades.jsx` | **NEW** — Zustand store for permanent upgrades with persistence | Stores |
| `src/utils/upgradesStorage.js` | **NEW** — localStorage get/set (mirror highScoreStorage.js) | Utils |
| `src/stores/usePlayer.jsx` | Add permanentUpgradeBonuses field, apply at run start | Stores |
| `src/GameLoop.jsx` | Apply attack/armor bonuses in damage calculation | GameLoop |
| `src/renderers/ProjectileRenderer.jsx` | Apply zone bonus to projectile scale (if applicable) | Rendering |

### Existing Fragment Infrastructure

The Fragment economy is already implemented:
- **usePlayer.fragments** (line 46): Fragment counter
- **usePlayer.addFragments(amount)** (lines 232-234): Increments fragments
- **resetForNewSystem()**: Preserves fragments across system transitions
- **reset()**: Clears fragments to 0 for new game
- **Fragment drops**: Story 19.3 implemented enemy drops (12% chance, purple gems)
- **Boss Fragment reward**: Story 6.3 implemented boss rewards (100 Fragments)

### Permanent Upgrades vs Tunnel Upgrades (Important Distinction!)

**Tunnel Upgrades** (Story 7.2 — already implemented):
- File: `src/entities/upgradeDefs.js`
- Purchase location: Tunnel hub UI (between systems)
- Effect scope: **Current run only** (lost on death)
- Cost: Fragments (consumed per run)
- Store: `usePlayer.permanentUpgrades` (confusing name — actually run-scoped)
- Stats: `usePlayer.upgradeStats` (damageMult, speedMult, hpMaxBonus, cooldownMult, fragmentMult)

**Permanent Upgrades** (Story 20.1 — this story):
- File: `src/entities/permanentUpgradesDefs.js` (NEW)
- Purchase location: Upgrades menu from main menu (Story 20.2)
- Effect scope: **All runs forever** (persists across deaths)
- Cost: Fragments (permanent investment)
- Store: `useUpgrades` (NEW store)
- Stats: Attack Power, Armor, Max HP, Regen, Attack Speed, Zone

**CRITICAL: Do NOT confuse these two systems!** They are completely separate. Permanent upgrades provide meta-progression (like Hades Mirror of Night). Tunnel upgrades provide run-specific customization.

### localStorage Persistence Pattern

Follow the **exact same pattern** as highScoreStorage.js:

```javascript
// src/utils/upgradesStorage.js
export const STORAGE_KEY_UPGRADES = 'SPACESHIP_PERMANENT_UPGRADES'

export function getPersistedUpgrades() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_UPGRADES)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      // Validate structure, return default if corrupt
      return parsed
    }
  } catch {
    // localStorage unavailable or parse error
  }
  return {} // Default: no upgrades purchased
}

export function setPersistedUpgrades(upgrades) {
  try {
    localStorage.setItem(STORAGE_KEY_UPGRADES, JSON.stringify(upgrades))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}
```

**IMPORTANT:** The persisted data is a simple object: `{ ATTACK_POWER: 2, ARMOR: 1, MAX_HP: 0, ... }` (upgrade levels only). The store will recompute bonuses from levels on load.

### Zustand Store Structure Pattern

Follow the standard store pattern from existing stores:

```javascript
// src/stores/useUpgrades.jsx
import { create } from 'zustand'
import { getPersistedUpgrades, setPersistedUpgrades } from '../utils/upgradesStorage.js'
import { PERMANENT_UPGRADES } from '../entities/permanentUpgradesDefs.js'

const useUpgrades = create((set, get) => ({
  // --- State ---
  upgradeLevels: getPersistedUpgrades(), // { ATTACK_POWER: 0, ARMOR: 0, ... }

  // --- Actions ---
  purchaseUpgrade: (upgradeId) => {
    const state = get()
    const upgradeDef = PERMANENT_UPGRADES[upgradeId]
    const currentLevel = state.upgradeLevels[upgradeId] || 0

    if (currentLevel >= upgradeDef.maxLevel) return false // Already maxed

    const nextLevelDef = upgradeDef.levels[currentLevel] // levels[0] = level 1
    if (!nextLevelDef) return false

    // Check if player has enough fragments (usePlayer.getState().fragments)
    // Deduct fragments: usePlayer.getState().addFragments(-nextLevelDef.cost)
    // Increment level
    const newLevels = { ...state.upgradeLevels, [upgradeId]: currentLevel + 1 }
    set({ upgradeLevels: newLevels })
    setPersistedUpgrades(newLevels)
    return true
  },

  getUpgradeLevel: (upgradeId) => {
    return get().upgradeLevels[upgradeId] || 0
  },

  getTotalFragmentsSpent: () => {
    const state = get()
    let total = 0
    for (const [upgradeId, level] of Object.entries(state.upgradeLevels)) {
      const upgradeDef = PERMANENT_UPGRADES[upgradeId]
      for (let i = 0; i < level; i++) {
        total += upgradeDef.levels[i].cost
      }
    }
    return total
  },

  getComputedBonuses: () => {
    const state = get()
    const bonuses = { attackPower: 1.0, armor: 0, maxHP: 0, regen: 0, attackSpeed: 1.0, zone: 1.0 }

    for (const [upgradeId, level] of Object.entries(state.upgradeLevels)) {
      const upgradeDef = PERMANENT_UPGRADES[upgradeId]
      for (let i = 0; i < level; i++) {
        const levelDef = upgradeDef.levels[i]
        // Apply bonuses based on upgrade type
        // e.g., if upgradeId === 'ATTACK_POWER', bonuses.attackPower *= levelDef.bonus
      }
    }

    return bonuses
  },

  reset: () => set({ upgradeLevels: {} }),
}))

export default useUpgrades
```

**CRITICAL:** The `purchaseUpgrade` action must:
1. Check current level < maxLevel
2. Get cost from upgradeDef.levels[currentLevel]
3. Check usePlayer.fragments >= cost
4. Call usePlayer.getState().addFragments(-cost) to deduct
5. Increment upgradeLevels[upgradeId]
6. Call setPersistedUpgrades() immediately
7. Return true/false for success

### Upgrade Definitions Structure

Follow the Epic 20 spec exactly for level counts and costs:

```javascript
// src/entities/permanentUpgradesDefs.js
export const PERMANENT_UPGRADES = {
  ATTACK_POWER: {
    id: 'ATTACK_POWER',
    name: 'Attack Power',
    description: 'Increases weapon damage',
    icon: '⚔️',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 50, bonus: 0.05 }, // +5% damage
      { level: 2, cost: 100, bonus: 0.05 }, // +10% total
      { level: 3, cost: 200, bonus: 0.05 }, // +15% total
      { level: 4, cost: 350, bonus: 0.05 }, // +20% total
      { level: 5, cost: 500, bonus: 0.05 }, // +25% total
    ],
  },
  ARMOR: {
    id: 'ARMOR',
    name: 'Armor',
    description: 'Reduces incoming damage (flat reduction)',
    icon: '🛡️',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 50, bonus: 1 }, // +1 armor (flat damage reduction)
      { level: 2, cost: 100, bonus: 1 }, // +2 total
      { level: 3, cost: 200, bonus: 1 }, // +3 total
      { level: 4, cost: 350, bonus: 1 }, // +4 total
      { level: 5, cost: 500, bonus: 1 }, // +5 total
    ],
  },
  MAX_HP: {
    id: 'MAX_HP',
    name: 'Max HP',
    description: 'Increases maximum health',
    icon: '❤️',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 50, bonus: 10 },
      { level: 2, cost: 100, bonus: 10 }, // +20 total
      { level: 3, cost: 200, bonus: 10 }, // +30 total
    ],
  },
  REGEN: {
    id: 'REGEN',
    name: 'Regeneration',
    description: 'Passive HP regeneration per second',
    icon: '💚',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 50, bonus: 0.2 },
      { level: 2, cost: 100, bonus: 0.2 }, // +0.4/s total
      { level: 3, cost: 200, bonus: 0.2 }, // +0.6/s total
    ],
  },
  ATTACK_SPEED: {
    id: 'ATTACK_SPEED',
    name: 'Attack Speed',
    description: 'Reduces weapon cooldowns',
    icon: '⚡',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 60, bonus: 0.05 }, // -5% cooldown (0.95 multiplier)
      { level: 2, cost: 120, bonus: 0.05 }, // -10% total
      { level: 3, cost: 240, bonus: 0.05 }, // -15% total
    ],
  },
  ZONE: {
    id: 'ZONE',
    name: 'Zone',
    description: 'Increases projectile size',
    icon: '🎯',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 40, bonus: 0.10 }, // +10% size
      { level: 2, cost: 80, bonus: 0.10 }, // +20% total
      { level: 3, cost: 160, bonus: 0.10 }, // +30% total
    ],
  },
}

// Helper to get upgrade cost for next level
export function getNextLevelCost(upgradeId, currentLevel) {
  const upgradeDef = PERMANENT_UPGRADES[upgradeId]
  if (!upgradeDef || currentLevel >= upgradeDef.maxLevel) return null
  return upgradeDef.levels[currentLevel].cost
}

// Helper to get total bonus at a given level
export function getTotalBonus(upgradeId, level) {
  const upgradeDef = PERMANENT_UPGRADES[upgradeId]
  if (!upgradeDef) return 0
  let total = 0
  for (let i = 0; i < Math.min(level, upgradeDef.maxLevel); i++) {
    total += upgradeDef.levels[i].bonus
  }
  return total
}
```

**IMPORTANT:** The bonus values in levels[] are **incremental** (what you gain at that level), NOT cumulative. The store's `getComputedBonuses()` will sum them up.

**IMPORTANT:** For Attack Speed, the bonus is a **reduction** (e.g., -5% = 0.95 multiplier). Store as positive value (0.05) and apply as `cooldownMultiplier = 1.0 - totalBonus`.

### Run Initialization Pattern

The player's effective stats at run start are computed from:
1. Ship base stats (from shipDefs.js)
2. Permanent upgrade bonuses (from useUpgrades)
3. Boon modifiers (applied during gameplay)
4. Tunnel upgrade modifiers (applied during gameplay)

**Integration point:** When useGame.startGameplay() is called, before the run actually begins:

```javascript
// In usePlayer, add a new action or modify existing startRun logic:
initializeRunStats: () => {
  const shipDef = SHIPS[get().currentShipId]
  const permanentBonuses = useUpgrades.getState().getComputedBonuses()

  // Compute effective max HP
  const effectiveMaxHP = shipDef.baseHP + permanentBonuses.maxHP

  // Store bonuses for gameplay use
  set({
    maxHP: effectiveMaxHP,
    currentHP: effectiveMaxHP,
    permanentUpgradeBonuses: permanentBonuses,
  })
}
```

**CRITICAL:** Call this initialization **before** the gameplay phase starts, not during GameLoop tick.

### Gameplay Integration

**Attack Power:** Applied as a multiplier on weapon damage in GameLoop damage calculation:
```javascript
// GameLoop.jsx — weapon damage calculation
const baseDamage = weaponDef.damage
const shipDamageMult = usePlayer.getState().shipBaseDamageMultiplier
const permanentAttackMult = usePlayer.getState().permanentUpgradeBonuses.attackPower
const boonDamageMult = useBoons.getState().modifiers.damageMultiplier || 1.0
const finalDamage = baseDamage * shipDamageMult * permanentAttackMult * boonDamageMult
```

**Armor:** Applied as flat damage reduction in GameLoop incoming damage:
```javascript
// GameLoop.jsx — player takes damage
const incomingDamage = enemyDef.damage
const armor = usePlayer.getState().permanentUpgradeBonuses.armor
const finalDamage = Math.max(1, incomingDamage - armor) // Minimum 1 damage
usePlayer.getState().takeDamage(finalDamage)
```

**Regen:** Applied in usePlayer tick() as passive HP regeneration:
```javascript
// usePlayer.jsx tick()
const regenBonus = state.permanentUpgradeBonuses.regen || 0
const totalRegen = hpRegenRate + regenBonus // hpRegenRate passed from GameLoop
if (totalRegen > 0 && state.currentHP < state.maxHP) {
  const newHP = Math.min(state.maxHP, state.currentHP + totalRegen * delta)
  set({ currentHP: newHP })
}
```

**Attack Speed:** Applied as cooldown multiplier in useWeapons tick():
```javascript
// useWeapons.jsx tick()
const permanentCooldownMult = usePlayer.getState().permanentUpgradeBonuses.attackSpeed
const cooldownTime = weaponDef.cooldown * permanentCooldownMult
```

**Zone:** Applied as scale multiplier in projectile renderers:
```javascript
// ProjectileRenderer.jsx (or wherever projectile scale is set)
const zoneBonus = usePlayer.getState().permanentUpgradeBonuses.zone
const projectileScale = baseScale * zoneBonus
```

### Fragment Economy Balance

**Current Fragment sources:**
- Enemy drops (Story 19.3): 12% drop chance, 1 Fragment per gem
- Boss reward (Story 6.3): 100 Fragments per boss kill
- Tunnel rewards (Story 7.2): Variable Fragment rewards from dilemmas

**Fragment costs (Epic 20.1 total for all 6 combat stats to max):**
- Attack Power (5 levels): 50 + 100 + 200 + 350 + 500 = 1200
- Armor (5 levels): 50 + 100 + 200 + 350 + 500 = 1200
- Max HP (3 levels): 50 + 100 + 200 = 350
- Regen (3 levels): 50 + 100 + 200 = 350
- Attack Speed (3 levels): 60 + 120 + 240 = 420
- Zone (3 levels): 40 + 80 + 160 = 280

**Total to max all combat stats: 3800 Fragments**

**IMPORTANT:** This is the foundation. Epic 20.4 (utility stats) and Epic 20.5 (meta stats) will add more upgrades. Total system cost will be much higher.

### Testing Standards

Follow the project's Vitest testing standards:

**Store tests:**
- Test useUpgrades: purchaseUpgrade increments level, deducts fragments
- Test useUpgrades: cannot purchase if not enough fragments
- Test useUpgrades: cannot purchase beyond maxLevel
- Test useUpgrades: getComputedBonuses returns correct summed values
- Test useUpgrades: persistence saves and loads correctly
- Test useUpgrades: getTotalFragmentsSpent calculates correctly
- Test useUpgrades: reset clears all levels

**Config tests:**
- Test permanentUpgradesDefs: all upgrades have valid structure
- Test permanentUpgradesDefs: all levels have cost and bonus
- Test permanentUpgradesDefs: no duplicate upgrade IDs

**Integration tests:**
- Test run start: permanent bonuses applied to usePlayer maxHP
- Test damage calculation: attack power multiplier applied
- Test incoming damage: armor reduction applied

**CRITICAL:** All tests must reset store state between test cases to prevent pollution. Use `useUpgrades.getState().reset()` in afterEach().

### Performance Notes

- Permanent upgrades are computed once at run start, not every frame
- getComputedBonuses() is O(n) where n = total upgrade levels purchased (small constant)
- localStorage writes only on purchase, not every frame
- No GC pressure — bonuses stored in player state, not recomputed

### Project Structure Notes

**New files:**
- `src/entities/permanentUpgradesDefs.js` — 6 combat stat definitions
- `src/stores/useUpgrades.jsx` — Zustand store
- `src/utils/upgradesStorage.js` — localStorage helpers
- `src/stores/__tests__/useUpgrades.test.js` — Store tests
- `src/entities/__tests__/permanentUpgradesDefs.test.js` — Config tests

**Modified files:**
- `src/stores/usePlayer.jsx` — Add permanentUpgradeBonuses field, initializeRunStats action
- `src/GameLoop.jsx` — Apply attack/armor bonuses in damage calculations
- `src/renderers/ProjectileRenderer.jsx` — Apply zone bonus to scale (if applicable)

**NOT in this story:**
- UI components (Story 20.2 — UpgradesScreen.jsx)
- Main menu Fragment display (Story 20.3)
- Ship selection stats display (Story 20.7)
- HP bar redesign (Story 20.8)

### References

- [Source: _bmad-output/planning-artifacts/epic-20-permanent-upgrades-system.md] — Epic context, all 8 stories
- [Source: src/stores/useGame.jsx] — High score persistence pattern
- [Source: src/utils/highScoreStorage.js] — localStorage get/set pattern to mirror
- [Source: src/stores/usePlayer.jsx] — Player stats, ship selection, fragment counter
- [Source: src/entities/shipDefs.js] — Ship base stats (baseHP, baseSpeed, baseDamageMultiplier)
- [Source: src/entities/upgradeDefs.js] — Tunnel upgrades (SEPARATE from permanent upgrades!)
- [Source: src/GameLoop.jsx] — Damage calculation, armor application points
- [Source: _bmad-output/implementation-artifacts/19-3-fragment-drops.md] — Fragment gem drop implementation
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, Zustand patterns
- [Source: src/ui/ShipSelect.jsx] — Ship selection UI (for Story 20.7 context)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Task 1: Created `permanentUpgradesDefs.js` with 6 combat stat upgrades (ATTACK_POWER, ARMOR, MAX_HP, REGEN, ATTACK_SPEED, ZONE) plus helper functions `getNextLevelCost()` and `getTotalBonus()`. All level counts and cost escalation follow Epic 20 spec exactly.

- Task 2: Created `useUpgrades` Zustand store with localStorage persistence mirroring `highScoreStorage.js` pattern. Store exposes `purchaseUpgrade()`, `getUpgradeLevel()`, `getTotalFragmentsSpent()`, `getComputedBonuses()`, and `reset()`. Purchase checks fragment balance via `usePlayer`, deducts cost, persists immediately.

- Task 3: Added `permanentUpgradeBonuses` field to `usePlayer` state and `initializeRunStats(bonuses)` action. GameLoop calls `initializeRunStats()` after `reset()` when starting a new game, applying maxHP bonus from permanent upgrades. Bonuses preserved across system transitions (not in `resetForNewSystem`), cleared on full `reset()`.

- Task 4: Integrated all 6 bonus types into gameplay:
  - Attack Power: Added to `composeDamageMultiplier()` in GameLoop
  - Armor: Applied as flat reduction (min 1 damage) to all 5 incoming damage sources (enemy contact, shockwaves, enemy projectiles, boss projectiles, boss contact). **Damage order: armor flat reduction first, then boon damageReduction % — multiplicative stacking.**
  - Regen: Added permanent regen to boon regen rate passed to usePlayer tick
  - Attack Speed: Added to `cooldownMultiplier` in composedWeaponMods
  - Zone: Applied to projectile collision radius (useWeapons.tick) and visual scale (ProjectileRenderer)

- Task 5: 52 new tests across 3 test files:
  - `permanentUpgradesDefs.test.js` (28 tests): Structure validation, level counts, escalating costs, helpers
  - `useUpgrades.test.js` (19 tests): Purchase, getters, computed bonuses, persistence, reset
  - `usePlayer.permanentBonuses.test.js` (5 tests): Integration — initializeRunStats, reset, system transitions

### Change Log

- 2026-02-15: Implemented permanent upgrades system (Story 20.1) — config, store, persistence, gameplay integration, 52 tests
- 2026-02-15: Code review — 6 fixes applied: documented armor/damageReduction order (H1), documented permanentUpgradeBonuses in resetForNewSystem comment (H2), consolidated redundant getState() calls in GameLoop (H3), added icon fields to upgrade defs (M1), added exact-cost edge case test (M2), added icon structure validation to defs tests (M3)

### File List

**New files:**
- `src/entities/permanentUpgradesDefs.js`
- `src/stores/useUpgrades.jsx`
- `src/utils/upgradesStorage.js`
- `src/entities/__tests__/permanentUpgradesDefs.test.js`
- `src/stores/__tests__/useUpgrades.test.js`
- `src/stores/__tests__/usePlayer.permanentBonuses.test.js`

**Modified files:**
- `src/stores/usePlayer.jsx` — Added permanentUpgradeBonuses field, initializeRunStats action, included in reset()
- `src/GameLoop.jsx` — Import useUpgrades, call initializeRunStats on new game, apply attackPower/armor/regen/attackSpeed bonuses
- `src/stores/useWeapons.jsx` — Accept zoneMultiplier in boonModifiers, apply to projectile radius
- `src/renderers/ProjectileRenderer.jsx` — Import usePlayer, apply zone bonus to projectile visual scale
