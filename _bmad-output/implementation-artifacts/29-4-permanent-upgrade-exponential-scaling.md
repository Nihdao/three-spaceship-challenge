# Story 29.4: Permanent Upgrade Exponential Scaling

Status: done

## Story

As a player,
I want each upgrade level to feel more impactful than the previous,
so that spending fragments on high levels feels rewarding, not negligible.

## Acceptance Criteria

1. Early levels (1-2) provide small bonuses, late levels (4-5) provide significantly larger bonuses across all combat/utility upgrades
2. The progression curve is exponential, not flat — each upgrade's bonus array uses heterogeneous values
3. New bonus arrays per upgrade ID (combat + utility only — meta stats REVIVAL/REROLL/SKIP/BANISH unchanged):
   - `ATTACK_POWER` (max 5): `[0.05, 0.07, 0.10, 0.15, 0.25]` — total 62%
   - `ARMOR` (max 5): `[1, 2, 3, 5, 8]` — total 19 flat reduction
   - `MAX_HP` (max 3): `[10, 20, 40]` — total 70 HP
   - `REGEN` (max 3): `[0.2, 0.4, 1.0]` — total 1.6 HP/s
   - `ATTACK_SPEED` (max 3): `[0.05, 0.10, 0.20]` — total 35% reduction
   - `ZONE` (max 3): `[0.10, 0.15, 0.25]` — total 50%
   - `MAGNET` (max 2): `[0.15, 0.30]` — total 45%
   - `LUCK` (max 3): `[0.05, 0.10, 0.20]` — total 35%
   - `EXP_BONUS` (max 5): `[0.05, 0.07, 0.10, 0.15, 0.25]` — total 62%
   - `CURSE` (max 5): `[0.10, 0.15, 0.20, 0.25, 0.30]` — total 100%
4. The `getTotalBonus()` function works correctly with the new heterogeneous bonus arrays (no code change needed — it already sums `levels[i].bonus` correctly)
5. Costs remain unchanged (they already scale: 50, 100, 200, 350, 500 for 5-level upgrades)
6. All test files that assert specific bonus totals are updated to match the new values
7. The display in `UpgradeCard` shows correct accumulated totals (existing `getTotalBonus` logic handles it transparently)
8. The ship stats panel in `ShipSelect` displays HP and Speed without floating-point noise (e.g. `109` not `109.0000000000000001`, `54.5` not `54.5000000000000001`) — HP rounded to integer, Speed to 1 decimal max

## Tasks / Subtasks

- [x] Task 1: Update `permanentUpgradesDefs.js` bonus values (AC: 1, 2, 3, 4, 5)
  - [x] Change `ATTACK_POWER` levels bonus values to `[0.05, 0.07, 0.10, 0.15, 0.25]`
  - [x] Change `ARMOR` levels bonus values to `[1, 2, 3, 5, 8]`
  - [x] Change `MAX_HP` levels bonus values to `[10, 20, 40]`
  - [x] Change `REGEN` levels bonus values to `[0.2, 0.4, 1.0]`
  - [x] Change `ATTACK_SPEED` levels bonus values to `[0.05, 0.10, 0.20]`
  - [x] Change `ZONE` levels bonus values to `[0.10, 0.15, 0.25]`
  - [x] Change `MAGNET` levels bonus values to `[0.15, 0.30]`
  - [x] Change `LUCK` levels bonus values to `[0.05, 0.10, 0.20]`
  - [x] Change `EXP_BONUS` levels bonus values to `[0.05, 0.07, 0.10, 0.15, 0.25]`
  - [x] Change `CURSE` levels bonus values to `[0.10, 0.15, 0.20, 0.25, 0.30]`
  - [x] Leave `REVIVAL`, `REROLL`, `SKIP`, `BANISH` untouched (meta stats, bonus=1 per level)

- [x] Task 2: Update `permanentUpgradesDefs.test.js` (AC: 6)
  - [x] Update `getTotalBonus('ATTACK_POWER', 3)` assertion: `0.15` → `0.22`
  - [x] Update `getTotalBonus('ATTACK_POWER', 10)` (clamped to max 5) assertion: `0.25` → `0.62`

- [x] Task 3: Update `useUpgrades.test.js` (AC: 6)
  - [x] Update `bonuses.attackPower` at level 2 assertion: `1.10` → `1.12` (0.05+0.07=0.12)
  - [x] Update `bonuses.armor` at level 3 assertion: `3` → `6` (1+2+3=6)
  - [x] Update `bonuses.attackSpeed` at level 2 assertion: `0.90` → `0.85` (1-(0.05+0.10)=0.85)
  - [x] Update `bonuses.maxHP` at level 2 assertion: `20` → `30` (10+20=30)
  - [x] Update `bonuses.magnet` at level 2 assertion: `1.30` → `1.45` (1+0.15+0.30=1.45)
  - [x] Update `bonuses.luck` at level 3 assertion: `0.15` → `0.35` (0.05+0.10+0.20=0.35)
  - [x] Update `bonuses.expBonus` at level 3 assertion: `1.15` → `1.22` (1+0.05+0.07+0.10=1.22)
  - [x] Update `bonuses.curse` at level 2 assertion: `0.20` → `0.25` (0.10+0.15=0.25)
  - [x] Verify `bonuses.zone` at level 1 (`1.10`) and `bonuses.regen` at level 1 (`0.2`) — no change needed (ZONE[0]=0.10, REGEN[0]=0.2 unchanged)

- [x] Task 4: Update `usePlayer.permanentBonuses.test.js` (AC: 6)
  - [x] Update `state.maxHP` after 2× MAX_HP purchases assertion: `120` → `130` (baseHP 100 + 10 + 20 = 130)
  - [x] Verify `attackPower` at level 1 (`1.05`) and `armor` at level 1 (`1`) — no change (ATTACK_POWER[0]=0.05, ARMOR[0]=1 unchanged)

- [x] Task 5: Run tests to confirm all pass (AC: 6)
  - [x] `npx vitest run src/entities/__tests__/permanentUpgradesDefs.test.js`
  - [x] `npx vitest run src/entities/__tests__/permanentUpgradesDefs.meta.test.js`
  - [x] `npx vitest run src/stores/__tests__/useUpgrades.test.js`
  - [x] `npx vitest run src/stores/__tests__/usePlayer.permanentBonuses.test.js`

- [x] Task 6: Fix floating-point display in `ShipSelect` stats panel (AC: 8)
  - [x] Wrap `effectiveStats.maxHP` with `Math.round()` — HP is always a whole number
  - [x] Wrap `effectiveStats.speed` with `parseFloat(toFixed(1))` — Speed displayed with at most 1 decimal

## Dev Notes

### Files to Touch — Complete List

| File | Change Type |
|------|------------|
| `src/entities/permanentUpgradesDefs.js` | Edit bonus values in levels arrays |
| `src/entities/__tests__/permanentUpgradesDefs.test.js` | Update 2 assertions |
| `src/stores/__tests__/useUpgrades.test.js` | Update 8 assertions |
| `src/stores/__tests__/usePlayer.permanentBonuses.test.js` | Update 1 assertion |

**Originally scoped to 4 files.** During implementation, 3 additional files required updates: `UpgradesScreen.test.jsx` and `utilityUpgradesIntegration.test.js` (both had assertions on old flat bonus totals, discovered during regression), and `ShipSelect.jsx` (UI fix for AC 8 floating-point display).

### The One File That Matters Most

**`src/entities/permanentUpgradesDefs.js`** is the single source of truth for all bonus values. Only the `bonus` field in each `levels[]` entry changes — everything else (id, name, description, icon, maxLevel, cost, level number) stays identical.

The `getTotalBonus(upgradeId, level)` function already handles heterogeneous arrays correctly:
```js
for (let i = 0; i < Math.min(level, upgradeDef.maxLevel); i++) {
  total += upgradeDef.levels[i].bonus  // sums whatever values are in the array
}
```
No function logic changes needed.

### New Bonus Values — Edit Reference

```js
// ATTACK_POWER — was: all 0.05 × 5
{ level: 1, cost: 50,  bonus: 0.05 },
{ level: 2, cost: 100, bonus: 0.07 },
{ level: 3, cost: 200, bonus: 0.10 },
{ level: 4, cost: 350, bonus: 0.15 },
{ level: 5, cost: 500, bonus: 0.25 },

// ARMOR — was: all 1 × 5
{ level: 1, cost: 50,  bonus: 1 },
{ level: 2, cost: 100, bonus: 2 },
{ level: 3, cost: 200, bonus: 3 },
{ level: 4, cost: 350, bonus: 5 },
{ level: 5, cost: 500, bonus: 8 },

// MAX_HP — was: all 10 × 3
{ level: 1, cost: 50,  bonus: 10 },
{ level: 2, cost: 100, bonus: 20 },
{ level: 3, cost: 200, bonus: 40 },

// REGEN — was: all 0.2 × 3
{ level: 1, cost: 50,  bonus: 0.2 },
{ level: 2, cost: 100, bonus: 0.4 },
{ level: 3, cost: 200, bonus: 1.0 },

// ATTACK_SPEED — was: all 0.05 × 3
{ level: 1, cost: 60,  bonus: 0.05 },
{ level: 2, cost: 120, bonus: 0.10 },
{ level: 3, cost: 240, bonus: 0.20 },

// ZONE — was: all 0.10 × 3
{ level: 1, cost: 40,  bonus: 0.10 },
{ level: 2, cost: 80,  bonus: 0.15 },
{ level: 3, cost: 160, bonus: 0.25 },

// MAGNET — was: all 0.15 × 2
{ level: 1, cost: 80,  bonus: 0.15 },
{ level: 2, cost: 160, bonus: 0.30 },

// LUCK — was: all 0.05 × 3
{ level: 1, cost: 100, bonus: 0.05 },
{ level: 2, cost: 200, bonus: 0.10 },
{ level: 3, cost: 400, bonus: 0.20 },

// EXP_BONUS — was: all 0.05 × 5
{ level: 1, cost: 60,  bonus: 0.05 },
{ level: 2, cost: 120, bonus: 0.07 },
{ level: 3, cost: 240, bonus: 0.10 },
{ level: 4, cost: 420, bonus: 0.15 },
{ level: 5, cost: 600, bonus: 0.25 },

// CURSE — was: all 0.10 × 5
{ level: 1, cost: 50,  bonus: 0.10 },
{ level: 2, cost: 100, bonus: 0.15 },
{ level: 3, cost: 200, bonus: 0.20 },
{ level: 4, cost: 350, bonus: 0.25 },
{ level: 5, cost: 500, bonus: 0.30 },
```

### Meta Upgrades — DO NOT TOUCH

REVIVAL, REROLL, SKIP, BANISH keep `bonus: 1` per level. These are count-based meta charges (lives, rerolls, skips, banishes per run), not percentage multipliers. Their scaling semantics are completely different.

### Test Breakages — Calculated Values

**`permanentUpgradesDefs.test.js`:**
```js
// Line 102 - was 0.15:
expect(getTotalBonus('ATTACK_POWER', 3)).toBeCloseTo(0.22)  // 0.05+0.07+0.10

// Line 110 - was 0.25:
expect(getTotalBonus('ATTACK_POWER', 10)).toBeCloseTo(0.62) // 0.05+0.07+0.10+0.15+0.25
```

**`useUpgrades.test.js`:**
```js
// Line 128 - was 1.10 (ATTACK_POWER×2):
expect(bonuses.attackPower).toBeCloseTo(1.12)  // 1 + 0.05+0.07

// Line 137 - was 3 (ARMOR×3):
expect(bonuses.armor).toBe(6)  // 1+2+3

// Line 145 - was 0.90 (ATTACK_SPEED×2):
expect(bonuses.attackSpeed).toBeCloseTo(0.85)  // 1 - (0.05+0.10)

// Line 160 - was 20 (MAX_HP×2):
expect(bonuses.maxHP).toBe(30)  // 10+20

// Line 184 - was 1.30 (MAGNET×2):
expect(bonuses.magnet).toBeCloseTo(1.45)  // 1 + 0.15+0.30

// Line 193 - was 0.15 (LUCK×3):
expect(bonuses.luck).toBeCloseTo(0.35)  // 0.05+0.10+0.20

// Line 202 - was 1.15 (EXP_BONUS×3):
expect(bonuses.expBonus).toBeCloseTo(1.22)  // 1 + 0.05+0.07+0.10

// Line 210 - was 0.20 (CURSE×2):
expect(bonuses.curse).toBeCloseTo(0.25)  // 0.10+0.15

// NO CHANGE: zone@1 = 1.10 (ZONE[0]=0.10), regen@1 = 0.2 (REGEN[0]=0.2)
```

**`usePlayer.permanentBonuses.test.js`:**
```js
// Line 46 - was 120 (baseHP 100 + MAX_HP level 1 + level 2):
expect(state.maxHP).toBe(130)  // 100 + 10 + 20

// NO CHANGE: attackPower@1 = 1.05, armor@1 = 1 (both first level unchanged)
```

### Tests NOT Affected

- `permanentUpgradesDefs.meta.test.js` — meta stats only, bonus=1, costs unchanged ✓
- `useUpgrades.refund.test.js` — tests refund logic (uses getNextLevelCost), not bonus values ✓
- `usePlayer.upgrades.test.js` — likely tests upgrade integration, not specific bonus totals ✓
- All other test files — no reference to these specific bonus values ✓

### How getComputedBonuses Applies Bonuses (from useUpgrades.jsx)

Based on test patterns, the store computes bonuses as:
- `attackPower = 1 + getTotalBonus('ATTACK_POWER', level)` (multiplier)
- `armor = getTotalBonus('ARMOR', level)` (flat reduction, not a multiplier)
- `attackSpeed = 1 - getTotalBonus('ATTACK_SPEED', level)` (reduction multiplier)
- `zone = 1 + getTotalBonus('ZONE', level)` (multiplier)
- `maxHP = getTotalBonus('MAX_HP', level)` (flat addition)
- `regen = getTotalBonus('REGEN', level)` (flat HP/s)
- `magnet = 1 + getTotalBonus('MAGNET', level)` (multiplier)
- `luck = getTotalBonus('LUCK', level)` (additive bonus)
- `expBonus = 1 + getTotalBonus('EXP_BONUS', level)` (multiplier)
- `curse = getTotalBonus('CURSE', level)` (additive spawn rate)

This logic is in `useUpgrades.jsx → getComputedBonuses()` and doesn't change.

### Regression Risk Assessment

**Very Low.** This story changes data values only. The `getTotalBonus` function is a pure mathematical sum — it doesn't distinguish between uniform and heterogeneous arrays. The store's `getComputedBonuses` applies the same formulas. The UI `UpgradeCard` reads `getTotalBonus` output and displays it without hardcoded values.

The only risk is test assertions expecting old flat values. All such tests are explicitly listed above with their new expected values.

### Previous Story Context (29.3)

Story 29.3 modified `UpgradesScreen.jsx` — the card display component. That story did NOT change `permanentUpgradesDefs.js`. The current story does NOT touch `UpgradesScreen.jsx`. There's zero overlap.

From story 29.3 dev notes: the `getUpgradeDisplayInfo` function and `UPGRADE_IDS` remain unchanged in this story too.

### Project Structure Notes

- **Primary file**: `src/entities/permanentUpgradesDefs.js` (data definitions)
- **Test files**: `src/entities/__tests__/permanentUpgradesDefs.test.js`, `src/entities/__tests__/permanentUpgradesDefs.meta.test.js`
- **Integration test files**: `src/stores/__tests__/useUpgrades.test.js`, `src/stores/__tests__/usePlayer.permanentBonuses.test.js`
- Architecture pattern: Defs files are pure data objects, no business logic — consistent with `weaponDefs.js`, `boonDefs.js`, `enemyDefs.js`
- No R3F, no Three.js, no store changes — pure data edit

### References

- Epic spec: `_bmad-output/planning-artifacts/epic-29-ui-polish.md` → Story 29.4 + Technical Notes
- Primary file: `src/entities/permanentUpgradesDefs.js` (lines 5–182)
- Test file 1: `src/entities/__tests__/permanentUpgradesDefs.test.js` (lines 99–116, getTotalBonus section)
- Test file 2: `src/stores/__tests__/useUpgrades.test.js` (lines 123–211, getComputedBonuses section)
- Test file 3: `src/stores/__tests__/usePlayer.permanentBonuses.test.js` (line 46)
- Meta test (untouched): `src/entities/__tests__/permanentUpgradesDefs.meta.test.js`
- Store (untouched): `src/stores/useUpgrades.jsx` → `getComputedBonuses()`
- UI (untouched): `src/ui/UpgradesScreen.jsx` → `UpgradeCard` (just modified in 29.3)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Updated `permanentUpgradesDefs.js`: changed bonus arrays for 10 combat/utility upgrades (ATTACK_POWER, ARMOR, MAX_HP, REGEN, ATTACK_SPEED, ZONE, MAGNET, LUCK, EXP_BONUS, CURSE) to heterogeneous exponential values. Meta stats (REVIVAL, REROLL, SKIP, BANISH) left untouched.
- Updated 4 spec test files + 2 additional files (UpgradesScreen.test.jsx, utilityUpgradesIntegration.test.js) that also asserted old flat bonus totals — not mentioned in original Dev Notes but discovered during regression.
- Updated `ShipSelect.jsx` (Task 6 / AC 8): fixed floating-point display noise for HP (Math.round) and Speed (parseFloat + toFixed(1)).
- All 126 tests across the 5 changed test suites pass. 4 pre-existing failing test files (audioManager, progressionSystem, StatsScreen, MainMenu) unrelated to this story remain unchanged.

### File List

- `src/entities/permanentUpgradesDefs.js`
- `src/entities/__tests__/permanentUpgradesDefs.test.js`
- `src/stores/__tests__/useUpgrades.test.js`
- `src/stores/__tests__/usePlayer.permanentBonuses.test.js`
- `src/systems/__tests__/utilityUpgradesIntegration.test.js`
- `src/ui/__tests__/UpgradesScreen.test.jsx`
- `src/ui/ShipSelect.jsx`

### Change Log

- 2026-02-20: Implemented exponential bonus scaling for all 10 combat/utility permanent upgrades. Updated 6 test files to match new expected values. 120 tests pass, no new regressions introduced.
- 2026-02-20: Fixed floating-point display noise in ShipSelect stats panel — HP uses Math.round(), Speed uses toFixed(1) to avoid values like `109.0000000000000001`.
- 2026-02-20: Code review (AI) — 3 Medium + 4 Low findings, all fixed: corrected false claims in Dev Notes & Completion Notes, fixed misleading "+10 HP" comment in test (was +20 HP at level 2), added 7 structural heterogeneity tests for AC 2 (permanentUpgradesDefs.test.js), added 4 floating-point display tests for AC 8 (ShipSelect.enrichedStats.test.js). Story marked done. Git contamination from story 30.1 (style.css, Interface.jsx) noted as workflow issue — unrelated to this story's changes.
