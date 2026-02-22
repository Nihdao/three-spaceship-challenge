# Story 31.3: Level-Up Formula Rework

Status: ready-for-dev

## Story

As a player,
I want the level-up pool to respect my luck investment and weapon rarity weights,
so that luck is a meaningful stat that tangibly improves my upgrade quality and variety.

## Acceptance Criteria

1. **[P4 — 4th choice probability]** When level-up choices are generated, a 4th choice is added with probability `P4 = Math.min(luckStat / (luckStat + 8), 0.85)`.
   - At luckStat=0: P4=0 (never a 4th choice without luck)
   - At luckStat=8: P4≈50%
   - At luckStat=20: P4≈71%
   - Cap: never exceeds 85%

2. **[P_upgrade — upgrade vs new-weapon probability]** When weapon slots are still available, each slot has probability `P_upgrade = Math.max(0.10, (0.5 + 0.1*x) - luckStat * 0.04)` of being an upgrade rather than a new weapon, where x=2 if currentLevel is even, x=1 if odd.

3. **[P_upgrade — slots full]** When all weapon slots are full (equippedWeapons.length >= MAX_WEAPON_SLOTS), P_upgrade=1.0 (only upgrades and boons offered, never new weapons).

4. **[Weighted pool sampling]** When new weapons are candidates in the pool, they are sampled proportionally to their `rarityWeight` field from weaponDefs (higher rarityWeight = more common). Uniform sampling is replaced by weighted-without-replacement.

5. **[No duplicates]** No weapon or boon can appear twice in the same set of choices. Enforced by removing picked items from the working candidate lists.

6. **[Level-9 exclusion]** Weapons already at level 9 are excluded from the upgrade pool — preserved from existing `buildFullPool()` guard (`if (weapon.level >= MAX_WEAPON_LEVEL) continue`).

7. **[implemented flag respected]** Weapons with `implemented: false` in weaponDefs are excluded from the pool — must be enforced in `buildFullPool()`'s new-weapons loop (verify added in 31.1, else add here).

8. **[Tests pass]** Updated test files cover all new behaviors. Run: `npx vitest run src/systems/__tests__/progressionSystem.test.js` — all pass.

## Tasks / Subtasks

- [ ] Task 1: Refactor `generateChoices()` for P4 + P_upgrade slot-by-slot selection (AC: #1–#5)
  - [ ] Replace `const count = Math.min(4, Math.max(3, pool.length))` with P4 roll:
    ```js
    const P4 = luckStat === 0 ? 0 : Math.min(luckStat / (luckStat + 8), 0.85)
    const desiredCount = (Math.random() < P4) ? 4 : 3
    const effectiveCount = Math.min(desiredCount, Math.max(3, pool.length))
    ```
  - [ ] Split pool into `upgradePool` (weapon_upgrade, boon_upgrade, new_boon) and `newWeaponPool` (new_weapon only)
  - [ ] Compute P_upgrade per call:
    ```js
    const slotsAvailable = equippedWeapons.length < MAX_WEAPON_SLOTS
    const x = (currentLevel % 2 === 0) ? 2 : 1
    const P_upgrade = !slotsAvailable ? 1.0 : Math.max(0.10, (0.5 + 0.1 * x) - luckStat * 0.04)
    ```
  - [ ] For each of `effectiveCount` slots, roll P_upgrade → pick from upgradePool (uniform) or newWeaponPool (weighted via `pickWeightedWeapon`); remove picked item from working copy
  - [ ] Fallback per slot: if desired pool empty, pick from other pool; if both empty, break
  - [ ] Pad with `stat_boost` only if total choices < min(3, effectiveCount) (extreme edge case)
  - [ ] Remove the old fallback loop (lines ~49–69 in current file) that references `def.upgrades` — dead after 31.2
  - [ ] Remove the old `shuffle(pool)` call — replaced by slot-by-slot selection

- [ ] Task 2: Add `pickWeightedWeapon()` helper (AC: #4, #5)
  - [ ] Implement as internal function (not exported):
    ```js
    function pickWeightedWeapon(candidates) {
      const totalWeight = candidates.reduce((sum, c) => sum + (WEAPONS[c.id]?.rarityWeight ?? 1), 0)
      let r = Math.random() * totalWeight
      for (const candidate of candidates) {
        r -= (WEAPONS[candidate.id]?.rarityWeight ?? 1)
        if (r <= 0) return candidate
      }
      return candidates[candidates.length - 1] // safety fallback
    }
    ```

- [ ] Task 3: Verify `implemented: false` guard in `buildFullPool()` (AC: #7)
  - [ ] In the new-weapons loop, confirm `if (def?.implemented === false) continue` is present
  - [ ] If not added in 31.1, add it here

- [ ] Task 4: Update `src/systems/__tests__/progressionSystem.test.js` (AC: #8)
  - [ ] Fix line ~63: replace `{ weaponId: 'MISSILE_HOMING', level: 1 }` with `{ weaponId: 'BEAM', level: 1 }`
  - [ ] Fix line ~64: replace `{ weaponId: 'PLASMA_BOLT', level: 1 }` with `{ weaponId: 'EXPLOSIVE_ROUND', level: 1 }`
  - [ ] Remove test "uses correct upgrade tier based on weapon level" (references `upgrade.level` and `statPreview` with old damage numbers from `upgrades[]` — invalid after 31.2)
  - [ ] Add test: `luckStat=0 → count always 3` (run 20 iterations, all `choices.length === 3`)
  - [ ] Add test: `luckStat=8 → 4th choice appears in 20–80% of 40 runs` (wide window — avoids flakiness)
  - [ ] Add test: no duplicate `type+id` combinations in a single choices array (run 20 iterations)
  - [ ] Add test: all weapon slots full → no `new_weapon` type in any choice (P_upgrade=1.0 enforced)

- [ ] Task 5: Update `src/systems/__tests__/progressionSystem.newWeapons.test.js` (AC: #8)
  - [ ] Remove any remaining refs to `RAILGUN`, `MISSILE_HOMING`, `PLASMA_BOLT`, `SHOTGUN`, `SATELLITE`, `DRONE`
  - [ ] Add test: weapons with `implemented: false` never appear in choices (run 30 iterations)
  - [ ] Add test: weighted sampling distributes proportionally — in 50 runs with 2 weapons (rarityWeight=4 and rarityWeight=12), the weight=12 weapon appears ≥2× more often than weight=4

- [ ] Task 6: Final validation (AC: #8)
  - [ ] `npx vitest run src/systems/__tests__/progressionSystem.test.js` — zero failures
  - [ ] `npx vitest run src/systems/__tests__/progressionSystem.newWeapons.test.js` — zero failures
  - [ ] `npx vitest run` — zero failures globally

## Dev Notes

### Prerequisites: Stories 31.1 and 31.2 Must Be Complete

**Do NOT implement on the current codebase.** Story 31.3 assumes:
- **31.1 done**: `upgrades[]` and `rarityDamageMultipliers` removed from weaponDefs; 7 weapons removed (`MISSILE_HOMING`, `PLASMA_BOLT`, `RAILGUN`, `TRI_SHOT`, `SHOTGUN`, `SATELLITE`, `DRONE`); `rarityWeight` field present on all weapon defs; stubs have `implemented: false`
- **31.2 done**: `buildFullPool()` no longer uses `def.upgrades?.[upgradeIndex]`; `applyRarityToChoices()` calls `rollUpgrade()` for weapon_upgrade; old upgrade fallback loop may be partially cleaned up

After 31.1+31.2, retained weapons are: `LASER_FRONT`, `SPREAD_SHOT`, `BEAM`, `EXPLOSIVE_ROUND`. Stubs (implemented: false, excluded from pool): `LASER_CROSS`, `MAGNETIC_FIELD`, `DIAGONALS`, `SHOCKWAVE`, `MINE_AROUND`, `TACTICAL_SHOT`.

### P4 Formula — Exact Implementation

```js
const P4 = luckStat === 0 ? 0 : Math.min(luckStat / (luckStat + 8), 0.85)
```

Values table:
| luckStat | P4     |
|----------|--------|
| 0        | 0%     |
| 4        | ~33%   |
| 8        | ~50%   |
| 12       | ~60%   |
| 20       | ~71%   |
| 40       | ~83%   |
| ∞        | 85%    |

The `luckStat === 0 ? 0` guard is mathematically correct (0/8=0) but explicit for readability.

### P_upgrade Formula — Exact Values

```js
const x = (currentLevel % 2 === 0) ? 2 : 1
P_upgrade = Math.max(0.10, (0.5 + 0.1 * x) - luckStat * 0.04)
```

| luckStat | even level | odd level |
|----------|-----------|-----------|
| 0        | 0.70      | 0.60      |
| 5        | 0.50      | 0.40      |
| 10       | 0.30      | 0.20      |
| 15       | 0.10      | 0.10      |
| 20       | 0.10      | 0.10      |

High luck → lower P_upgrade → more new weapons offered → variety. Floor=0.10 ensures upgrades always have a chance.

### Restructured `generateChoices()` — Full Algorithm

Replace the current `generateChoices()` body (lines 34–86) entirely:

```js
export function generateChoices(currentLevel, equippedWeapons, equippedBoonIds, equippedBoons = [], banishedItems = [], luckStat = 0) {
  const pool = buildFullPool(equippedWeapons, equippedBoonIds, equippedBoons, banishedItems)

  // P4: probability of 4th choice
  const P4 = luckStat === 0 ? 0 : Math.min(luckStat / (luckStat + 8), 0.85)
  const desiredCount = (Math.random() < P4) ? 4 : 3
  const effectiveCount = pool.length >= 3 ? desiredCount : Math.max(pool.length, 0)

  // Separate upgrade candidates vs new-weapon candidates
  const upgradePool = pool.filter(c => c.type !== 'new_weapon')
  const newWeaponPool = pool.filter(c => c.type === 'new_weapon')

  // P_upgrade per-slot probability
  const slotsAvailable = equippedWeapons.length < MAX_WEAPON_SLOTS
  const x = (currentLevel % 2 === 0) ? 2 : 1
  const P_upgrade = !slotsAvailable
    ? 1.0
    : Math.max(0.10, (0.5 + 0.1 * x) - luckStat * 0.04)

  // Build choices slot by slot — no duplicates (items removed after pick)
  const choices = []
  let availableUpgrades = [...upgradePool]
  let availableNewWeapons = [...newWeaponPool]

  for (let i = 0; i < effectiveCount; i++) {
    const wantUpgrade = Math.random() < P_upgrade

    if (wantUpgrade && availableUpgrades.length > 0) {
      const idx = Math.floor(Math.random() * availableUpgrades.length)
      choices.push(availableUpgrades.splice(idx, 1)[0])
    } else if (!wantUpgrade && availableNewWeapons.length > 0) {
      const picked = pickWeightedWeapon(availableNewWeapons)
      availableNewWeapons = availableNewWeapons.filter(c => c !== picked)
      choices.push(picked)
    } else if (availableUpgrades.length > 0) {
      // Fallback: wanted new weapon but pool empty
      const idx = Math.floor(Math.random() * availableUpgrades.length)
      choices.push(availableUpgrades.splice(idx, 1)[0])
    } else if (availableNewWeapons.length > 0) {
      // Fallback: wanted upgrade but pool empty
      const picked = pickWeightedWeapon(availableNewWeapons)
      availableNewWeapons = availableNewWeapons.filter(c => c !== picked)
      choices.push(picked)
    } else {
      break // Both pools exhausted
    }
  }

  // Pad with stat_boost only in extreme edge case (all maxed)
  while (choices.length < Math.min(3, effectiveCount)) {
    choices.push({
      type: 'stat_boost',
      id: `stat_boost_${choices.length}`,
      name: 'Stat Boost',
      description: 'Minor stat improvement',
      level: null,
      icon: null,
      statPreview: null,
    })
  }

  return applyRarityToChoices(choices, luckStat)
}
```

### `pickWeightedWeapon()` — Placement

Add above `generateChoices()` or in the private helpers section above `buildFullPool()`. It is NOT exported.

### What Changes vs What Stays

**Changes in 31.3:**
- `generateChoices()` body fully rewritten — P4, P_upgrade, slot-by-slot selection
- Old fallback loop (lines ~49–69, uses `def.upgrades`) removed
- `shuffle(pool)` call removed (was the old uniform approach)
- `pickWeightedWeapon()` added

**Does NOT change in 31.3:**
- `buildFullPool()` — only verify `implemented: false` guard (from 31.1)
- `applyRarityToChoices()` — modified in 31.2, not touched here
- `applyRarityToWeaponPreview()` — modified in 31.2, not touched here
- `generatePlanetReward()` — modified in Story 31.4, not here
- `shuffle()` utility — kept (still used by `generatePlanetReward`)

### Stale Tests in progressionSystem.test.js

Current test at line ~25 ("uses correct upgrade tier based on weapon level"):
```js
expect(upgrade.level).toBe(3)            // references upgrades[].level — gone after 31.2
expect(upgrade.statPreview).toContain('15') // old damage number — gone after 31.2
```
→ **Remove entirely.** After 31.2, `statPreview` is `"Damage +15.23% (Rare)"` from `rollUpgrade()`.

Current test at line ~58 ("excludes new weapons when 4 weapons already equipped"):
```js
{ weaponId: 'MISSILE_HOMING', level: 1 },  // removed in 31.1
{ weaponId: 'PLASMA_BOLT', level: 1 },      // removed in 31.1
```
→ **Replace** with `{ weaponId: 'BEAM', level: 1 }` and `{ weaponId: 'EXPLOSIVE_ROUND', level: 1 }`.

### Caller Compatibility

`LevelUpModal.jsx` already calls:
```js
const luckStat = (usePlayer.getState().getLuckStat?.() ?? 0) + (useBoons.getState().modifiers.luckBonus ?? 0)
return generateChoices(level, equippedWeapons, equippedBoonIds, equippedBoons, banishedItems, luckStat)
```
— No changes needed. `currentLevel` = `level` is already passed as first arg.

### Project Structure Notes

**Production files touched:**
- `src/systems/progressionSystem.js` — only file changed

**Test files touched:**
- `src/systems/__tests__/progressionSystem.test.js` — fix stale refs, add P4/P_upgrade tests
- `src/systems/__tests__/progressionSystem.newWeapons.test.js` — remove dead weapon refs, add weighted sampling test

### References

- [Source: _bmad-output/planning-artifacts/epic-31-weapon-roster-upgrade-system-overhaul.md#Story 31.3] — Full AC, P4/P_upgrade formulas
- [Source: _bmad-output/implementation-artifacts/31-2-procedural-upgrade-system.md#Dev Notes] — What 31.2 changed in progressionSystem.js; dead code list; pool logic post-31.2
- [Source: _bmad-output/implementation-artifacts/31-1-weapon-stat-schema-roster-cleanup.md] — rarityWeight schema, implemented: false stubs, removed weapon IDs
- [Source: src/systems/progressionSystem.js lines 33–86] — Current generateChoices() to rewrite
- [Source: src/systems/progressionSystem.js lines 91–173] — buildFullPool() — verify implemented: false guard in new-weapons loop (~line 121)
- [Source: src/ui/LevelUpModal.jsx lines 28–29] — Caller; no changes needed
- [Source: src/systems/__tests__/progressionSystem.test.js lines 25–38, 58–68] — Stale tests to fix
- [Story 31.4] — Will modify generatePlanetReward() — do NOT touch it in 31.3

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
